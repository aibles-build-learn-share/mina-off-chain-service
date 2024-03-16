import { SET_CREATOR_ADMIN, SET_SALE_ADMIN, PUT_UP_FOR_RENT_EVENT, CANCEL_PUT_UP_FOR_RENT, RENT_NFT_EVENT, POOL_UPDATED, STAKING_EVENT, TransferInitiated } from './../common/Consts';
import { getBlockNumber } from './../../wallet-core/src/utils/index';
import _ from 'lodash';
import * as web3_types from 'web3-eth';
import * as web3_types2 from 'web3-core/types';
import {
  Block,
  AccountBasedGateway,
  getLogger,
  TransactionStatus,
  override,
  Utils,
  BigNumber,
  CurrencyRegistry,
  GatewayRegistry,
  IErc20Token,
  TokenType,
  BlockchainPlatform,
  getRedisClient,
  EnvConfigRegistry,
} from 'worker-common';
import {
  BUY_NFT,
  OWNERSHIP_TRANSFERRED,
  CANCEL_ORDER_EVENT,
  MINT_NFT_EVENT,
  CONTRACT_TOKEN,
  CONTRACT_PROXY,
  ADMIN_MINT_EVENT,
  TRANSFER_SINGLE,
  TRANSFER_BATCH,
  TRANSFER,
  SET_SUPER_ADMIN,
} from '../common/Consts';

import LRU from 'lru-cache';
import { EthTransaction } from './EthTransaction';
import * as EthTypeConverter from './EthTypeConverter';
import { web3 /* , infuraWeb3*/, Web3Instance } from './web3';
import ERC20ABI from '../config/abi/erc20.json';
import Common from '@ethereumjs/common';
import { job, utils, consts } from 'wallet-core';
import { ABI } from '../config/index';
const { QueueJob } = job;
const {
  getBep20Contracts,
  addJobStatus,
  getConfigQueue,
  checkExistsJobStatus,
} = utils;
const { BSC } = consts;

const logger = getLogger('BscGateway');
const _cacheBlockNumber = {
  value: 0,
  updatedAt: 0,
  isRequesting: false,
};

const _cacheRawTxByHash: LRU<string, web3_types.Transaction> = new LRU({
  max: 1024,
  maxAge: 1000 * 60 * 5,
});
const _cacheRawTxReceipt: LRU<string, web3_types2.TransactionReceipt> = new LRU(
  {
    max: 1024,
    maxAge: 1000 * 60 * 5,
  },
);
const _isRequestingTx: Map<string, boolean> = new Map<string, boolean>();
const _isRequestingReceipt: Map<string, boolean> = new Map<string, boolean>();

GatewayRegistry.registerLazyCreateMethod(
  CurrencyRegistry.BinanceSmartChain,
  () => new BscGateway(),
);

export class BscGateway extends AccountBasedGateway {
  _common = Common.custom({ chainId: this.getChainId() });
  private web3Instance: any;
  public constructor() {
    super(CurrencyRegistry.BinanceSmartChain);
    this.web3Instance = new Web3Instance(this.getRpcEndpoints());
  }

  public getParallelNetworkRequestLimit() {
    return 100;
  }

  private getRpcEndpoints = () => {
    let currency = this.getCurrencyConfig();
    let rpcEndpointBackups = currency.rpcEndpointBackups
      .split(',')
      .filter((rpc) => rpc.length);
    const rpcEndpoints = [currency.rpcEndpoint].concat(rpcEndpointBackups);
    return rpcEndpoints;
  };

  /**
   * Handle more at extended classes
   * @param address
   */
  @override
  public normalizeAddress(address: string) {
    if (!this.web3Instance.utils.isAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    return this.web3Instance.utils.toChecksumAddress(address);
  }

  public async getBlockHeight(): Promise<any> {
    return await this.web3Instance.getBlockNumber();
  }

  /**
   * Check whether an address is valid
   * @param address
   */
  public async isValidAddressAsync(address: string): Promise<boolean> {
    return this.web3Instance.utils.isAddress(address);
  }

  /**
   * No param
   * Returns the number of blocks in the local best block chain.
   * @return {number}: the height of latest block on the block chain
   */
  public async getBlockCount(): Promise<number> {
    const now = Utils.nowInMillis();
    const CACHE_TIME = 10000;
    if (
      _cacheBlockNumber.value > 0 &&
      now - _cacheBlockNumber.updatedAt < CACHE_TIME
    ) {
      return _cacheBlockNumber.value;
    }

    if (_cacheBlockNumber.isRequesting) {
      await Utils.timeout(500);
      return this.getBlockCount();
    }

    _cacheBlockNumber.isRequesting = true;
    // Since there're some cases that newest block is not fully broadcasted to the network
    // We decrease latest block number by 1 for safety
    let blockNum = null;
    blockNum = (await this.web3Instance.getBlockNumber()) - 1;
    const newUpdatedAt = Utils.nowInMillis();
    _cacheBlockNumber.value = blockNum;
    _cacheBlockNumber.updatedAt = newUpdatedAt;
    _cacheBlockNumber.isRequesting = false;
    logger.debug(
      `BscGateway::getBlockCount value=${blockNum} updatedAt=${newUpdatedAt}`,
    );
    return blockNum;
  }

  /**
   * Check whether a transaction is finalized on blockchain network
   *
   * @param {string} txid: the hash/id of transaction need to be checked
   * @return {string}: the tx status
   */
  public async getTransactionStatus(txid: string): Promise<TransactionStatus> {
    if (!txid.startsWith('0x')) {
      txid = '0x' + txid;
    }

    const tx = (await this.getOneLog(txid)) as EthTransaction;
    if (!tx || !tx.confirmations) {
      return TransactionStatus.UNKNOWN;
    }

    if (
      tx.confirmations <
      CurrencyRegistry.getCurrencyConfig(this._currency).requiredConfirmations
    ) {
      return TransactionStatus.CONFIRMING;
    }

    if (!tx.receiptStatus) {
      return TransactionStatus.FAILED;
    }

    return TransactionStatus.COMPLETED;
  }

  public async getErc20TokenInfo(
    contractAddress: string,
  ): Promise<IErc20Token> {
    contractAddress = this.normalizeAddress(contractAddress);
    try {
      const contract = await this.web3Instance.getContract(
        ERC20ABI,
        contractAddress,
      );
      const [networkSymbol, name, decimals] = await Promise.all([
        contract.methods.symbol().call(),
        contract.methods.name().call(),
        contract.methods.decimals().call(),
      ]);

      const symbol = [TokenType.ERC20, contractAddress].join('.');

      return {
        symbol,
        networkSymbol: networkSymbol.toLowerCase(),
        tokenType: TokenType.ERC20,
        name,
        platform: BlockchainPlatform.BinanceSmartChain,
        isNative: false,
        isUTXOBased: false,
        contractAddress,
        decimals,
        humanReadableScale: decimals,
        nativeScale: 0,
        hasMemo: false,
      };
    } catch (e) {
      logger.error(
        `BscGateway::getErc20TokenInfo could not get info contract=${contractAddress} due to error:`,
      );
      logger.error(e);
      return null;
    }
  }

  public getChainId(): number {
    const config = CurrencyRegistry.getCurrencyConfig(this._currency);
    return Number(config.chainId);
  }

  public getChainName(): string {
    const config = CurrencyRegistry.getCurrencyConfig(this._currency);
    return config.chainName;
  }

  private async getQueue() {
    const currency = await getConfigQueue(BSC);
    const name: string = currency.queueName;
    const port: number = parseInt(process.env.REDIS_PORT);
    const host: string = process.env.REDIS_HOST;
    const webhookApiUrl = currency.webhookApi;
    const queue = new QueueJob(name, port, host, webhookApiUrl);
    return queue.getQueue();
  }

  /**
   * Get block details in application-specified format
   *
   * @param {string|number} fromBlock: header hash or height of the from block
   * @param {string|number} toBlock: header hash or height of the to block
   * @return {any} block: the block detail
   */
  protected async _getLogTransaction(
    fromBlock: string | number,
    toBlock: string | number,
  ): Promise<any> {
    const contracts = await getBep20Contracts();
    const addresses = contracts.map((con) => con.contractAddress);
    const topics = [];
    return await this.web3Instance.getPastLogs(
      fromBlock,
      toBlock,
      "0x892Ac64DDA98899115D59B616D5f1F7D128d3DD9",
      topics,
    );
  }

  /**
   * Get one log object
   *
   * @param {String} txid: the transaction hash
   * @return {any}: the transaction details
   */
  protected async _getOneLog(log: any): Promise<any> {
    if (!log) return null;
    console.log("========vao _getOneLog=========");
    const isCrawled = await checkExistsJobStatus(log.transactionHash);
    if (isCrawled) return null;

    const contracts = await getBep20Contracts();
    const contract = contracts.find(
      (con) =>
        con.contractAddress.toLocaleLowerCase() ===
        log.address.toLocaleLowerCase(),
    );
    if (contract) {
      logger.debug(
        `BscGateway::_getOneLog contract=${JSON.stringify(contract)}`,
      );
      await Promise.all(
        contracts.map(async (contract) => {
          await this.addJob(contract, log);
        }),
      );
    }

    return log;
  }

  private async addJob(contract: any, log: any) {
    const queue = await this.getQueue();

    const options = {
      removeOnComplete: true, // removes job from queue on success
      removeOnFail: true, // removes job from queue on failure
    };
    console.log("========vao addJob=========");
    const events = JSON.parse(contract.events);
    console.log('event :>> ', events);
    console.log('log :>> ', log);
    const listTopic = events.map((event) => event.topic);
    if (
      log.topics[0] &&
      listTopic.includes(log.topics[0].toLocaleLowerCase())
    ) {
      const abi = ABI[contract.abiKey];
      console.log('abi :>> ', abi);
      const event = events.find(
        (event) =>
          event.topic.toLocaleLowerCase() === log.topics[0].toLocaleLowerCase(),
      );
      const inputs = abi.find(
        (inp) => inp.type === 'event' && inp.name === event?.name.trim(),
      )?.inputs;

      if (!abi || !inputs || !contract.contractAddress) {
        return;
      }
      const parsedLog = this.web3Instance.parseDataLog(
        inputs,
        log.data,
        log.topics,
      );
      console.log('parsedLog :>> ', parsedLog);
      // save log in db
      const data = await this.getFormData(log, event, contract.contractAddress);
      if (
        event.name.trim() == TRANSFER ||
        event.name.trim() == TRANSFER_BATCH 
      ) {
        const tx = await this.web3Instance.getTransaction(log.transactionHash);
        if (
          tx.to.toLocaleLowerCase() ===
          process.env.CONTRACT_ADDRESS_PROXY.toLocaleLowerCase()
        ) {
          return;
        }
      }
      console.log('data :>> ', data);
      data['data'] = this.parseData(
        event.name.trim(),
        parsedLog,
        contract.contractAddress.toLocaleLowerCase(),
      );
      console.log(data['data']);
      if (!data['data']) return;
      const idJob = await addJobStatus(
        contract.contractAddress,
        data['data'],
        log.transactionHash,
        BSC,
      );
      data['recordId'] = idJob;
      logger.debug(`BscGateway::addJob newData=${JSON.stringify(data)}`);
      await queue.add(data, options);
    }
    await queue.close();
  }

  private async getFormData(log: any, event: any, contractAddress: string) {
    const block = await this.web3Instance.getBlock(log.blockNumber);
    const transaction = await this.web3Instance.getTransaction(
      log.transactionHash,
    );
    const chainId = this.getChainId();
    return {
      timeStamp: block.timestamp,
      hash: transaction.hash,
      from: transaction.from,
      to: transaction.to,
      contractAddress: contractAddress,
      eventType: event?.name.trim(),
      chainId: chainId,
    };
  }

  private parseData(eventName: string, data: any, contractAddress: string) {
    switch (contractAddress) {
      case process.env.CONTRACT_ADDRESS_PROXY.toLocaleLowerCase():
        if (eventName == BUY_NFT) return this.parseDataBuyNFT(data);
        else if (eventName == CANCEL_ORDER_EVENT)
          return this.parseDataCancelOrder(data);
        else if (eventName == ADMIN_MINT_EVENT)
          return this.parseDataAdminMint(data);
        else if (eventName == MINT_NFT_EVENT)
          return this.parseDataMintNFTEvent(data);
        else if(eventName == SET_SUPER_ADMIN)
          return this.parseDataSetSuperAdmin(data);
        else if(eventName == SET_CREATOR_ADMIN ) 
          return this.parseDataCreatorAdmin(data);
        else if(eventName == SET_SALE_ADMIN) 
          return this.parseDataSaleAdmin(data);
        else if(eventName === PUT_UP_FOR_RENT_EVENT) {
          return this.parseDataPutUpForRent(data);
        } else if(eventName === CANCEL_PUT_UP_FOR_RENT) {
          return this.parseCancelPutUpForRent(data);
        } else if(eventName === RENT_NFT_EVENT) {
          return this.parseRentNftEvent(data);
        } else if(eventName === POOL_UPDATED) {
          return this.parsePoolUpdated(data);
        } else if(eventName === STAKING_EVENT) {
          return this.praseStakingEvent(data);
        } else if(eventName === TransferInitiated) {
          return this.praseTransferInit(data);
        }
        else return null;
      case process.env.CONTRACT_ADDRESS_TOKEN_721.toLocaleLowerCase():
        if (eventName == TRANSFER) return this.parseDataTransfer(data);
        else return null;
    }
    return null;
  }

  private parseDataBuyNFT(data: any) {
    return {
      transactionId: data?.transactionId,
    };
  }

  private parseDataCancelOrder(data: any) {
    return {
      transactionId: data?.transactionId,
    };
  }

  private parseDataMintNFTEvent(data: any) {
    return {
      transactionId: data?.transactionId,
      totalSupply: data?.totalSupply,
      totalMinted: data?.totalMinted,
      tokenId: data?.tokenId,
      priceConvert: data?.priceConvert,
      quantity: data?.quantity,
    };
  }

  private parseDataAdminMint(data: any) {
    return {
      transactionId: data?.transactionId,
      totalSupply: data?.totalSupply,
      totalMinted: data?.totalMinted,
      tokenIds: data?.tokenIds,
    };
  }

  private parseDataTransfer(data: any) {
    return {
      from: data?.from,
      to: data?.to,
      tokenId: data?.tokenId,
    };
  }

  private parseDataTransferSingle(data: any) {
    return {
      operator: data?.operator,
      from: data?.from,
      to: data?.to,
      id: data?.id,
      value: data?.value,
    };
  }

  private parseDataTransferBatch(data: any) {
    return {
      operator: data?.operator,
      from: data?.from,
      to: data?.to,
      ids: data?.ids,
      values: data?.values,
    };
  }

  private parseDataSetSuperAdmin(data: any) {
    return {
      account: data?.account,
      value: true,
    }
  }

  private parseDataSaleAdmin(data: any) {
    return {
      account: data?.account,
      value: data?.value,
    }
  }

  private parseDataCreatorAdmin(data: any) {
    return {
      account: data?.account,
      value: data?.value,
    }
  }

  private parseDataPutUpForRent(data: any) {
    return {
      tokenId: data?.tokenId,
      endTime: data?.expDate,
      startTime: data?.startDate,
      fee: data?.fee,
      tokenAddress: data?.tokenAddress,
      owner: data?.owner,
      transactionId: data?.transactionId,
    }
  }

  private parseCancelPutUpForRent(data: any) {
    return {
      tokenId: data?.tokenId,
      endTime: data?.expDate,
      startTime: data?.startDate,
      fee: data?.fee,
      tokenAddress: data?.tokenAddress,
      owner: data?.owner,
      transactionId: data?.transactionId,
    }
  }

  private parseRentNftEvent(data: any) {
    return {
      tokenId: data?.tokenId,
      endTime: data?.expDate,
      startTime: data?.startDate,
      totalFee: data?.totalFee,
      renter: data?.renter,
      owner: data?.owner,
      transactionId: data?.transactionId,
    }
  }

  private parsePoolUpdated(data: any) {
    return {
      rewardFund: data?.rewardFund,
      creator: data?.creator,
      poolId: data?.poolId,
      internalTxID: data?.internalTxID,
      eventType: data?.eventType
    }
  }

  private praseStakingEvent(data: any) {
    return {
      amount: data?.amount,
      account: data?.account,
      poolId: data?.poolId,
      internalTxID: data?.internalTxID,
      eventType: data?.eventType,
    }
  }

  private praseTransferInit(data: any) {
    return {
      amount: data?.amount,
      targetChain: data?.targetChain,
    }
  }
}

export default BscGateway;
