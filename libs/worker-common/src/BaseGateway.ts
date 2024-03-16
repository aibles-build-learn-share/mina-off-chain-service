import _ from 'lodash';
import LRU from 'lru-cache';
import BigNumber from 'bignumber.js';
import RPCClient from './RPCClient';
import { getLogger } from '../src/Logger';
import { implement, PromiseAll } from '../src/Utils';
import { Block, Transaction, Transactions, IEndpointsStatus } from './types';
import { TransactionStatus, BlockchainPlatform } from './enums';
import { ICurrencyConfig, ICurrency } from './interfaces';
import CurrencyRegistry from './registries/CurrencyRegistry';
import GatewayRegistry from './registries/GatewayRegistry';
import pLimit from 'p-limit';

// CurrencyRegistry.onCurrencyConfigSet((currency: ICurrency, config: ICurrencyConfig) => {
//   const gateway = GatewayRegistry.getGatewayInstance(currency);
//   if (gateway) {
//     process.nextTick(() => {
//       gateway.loadCurrencyConfig();
//     });
//   }
// });

export interface IParamsHDWallet {
  seed: string;
  accountIndex: string;
  path: string;
}

const logger = getLogger('BaseGateway');
/**
 * The gateway provides methods/interfaces for our service
 * to connect to blockchain network
 * The method will be implemented in derived classes
 * They can be done via RPC calls, RESTful APIs, ...
 */
export abstract class BaseGateway {
  protected _cacheLogs: LRU<string | number, any>;
  protected _cacheTxByHash: LRU<string, Transaction>;
  // protected _rpcClient: RPCClient;
  protected readonly _currency: ICurrency;

  // Gateways are singletons
  // So we hide the constructor from outsiders
  protected constructor(currency: ICurrency) {
    // Initiate the caches
    this._cacheLogs = new LRU(this._getCacheOptions());
    this._cacheTxByHash = new LRU(this._getCacheOptions());
    this._currency = currency;
  }

  public getCurrency(): ICurrency {
    return this._currency;
  }

  public getCurrencyConfig(): ICurrencyConfig {
    let config = CurrencyRegistry.getCurrencyConfig(this._currency);
    if (!config) {
      const platformCurrency = CurrencyRegistry.getOneCurrency(this._currency.platform);
      config = CurrencyRegistry.getCurrencyConfig(platformCurrency);
    }

    return config;
  }

  public abstract getBlockHeight(): Promise<number>;

  /**
   * Check a given address is valid
   * Default just accept all value, need to be implemented on all derived classes
   *
   * @param address
   */
  public async isValidAddressAsync(address: string): Promise<boolean> {
    return true;
  }

  /**
   * Check a given address is need tag
   * Default just accept all value, need to be implemented on all derived classes
   *
   * @param address
   */
  public async isNeedTagAsync(address: string): Promise<boolean> {
    return false;
  }

  /**
   * Get network status
   */
  public async getNetworkStatus(): Promise<IEndpointsStatus> {
    return [{ isOK: true }];
  }

  /**
   * Handle more at extended classes
   * @param address
   */
  @implement
  public normalizeAddress(address: string): string {
    return address;
  }

  /**
   * Get one transaction object by tixd
   * Firstly looking for it from cache
   * If cache doesn't exist, then get it from blockchain network
   *
   * @param {String} txid: the transaction hash
   * @return {any}: the transaction details
   */
  @implement
  public async getOneLog(log: any): Promise<any> {
    let detailLog: any = this._cacheTxByHash.get(log.transactionHash);
    if (!detailLog) {
      detailLog = await this._getOneLog(log);
    }

    if (!detailLog) {
      return null;
    }
    this._cacheTxByHash.set(log.transactionHash, detailLog);
    return log.transactionHash;
  }

  public getParallelNetworkRequestLimit() {
    return 5;
  }

  /**
   * Returns transactions with given txids
   *
   * @param {Array} txids: the array of transaction hashes/ids
   * @return {Array}: the array of detailed transactions
   */
  @implement
  public async processLogs(logs: any): Promise<any> {
    logger.info(`${this.constructor.name}::processLogs logs=${logs?.length}`);
    const result = [];
    if (!logs || !logs?.length) {
      return result;
    }

    const processOneLog = async (log: any) => {
      const tx = await this.getOneLog(log);
      if (tx) {
        result.push(tx);
      }
    };
    const limit = pLimit(this.getParallelNetworkRequestLimit());
    await PromiseAll(
      logs?.map(async (log) => {
        return limit(() => processOneLog(log));
      }),
    );

    return result;
  }

  /**
   * Get block by the number or hash
   * Firstly looking for it from cache
   * If cache doesn't exist, then get it from blockchain network
   *
   * @param {string|number} fromBlock: header hash or height of the from block
   * @param {string|number} toBlock: header hash or height of the to block
   * @return {Block} block: the block detail
   */
  @implement
  public async getLogTransaction(fromBlock: string | number, toBlock: string | number): Promise<any> {
    // const cachedLogs = this._cacheLogs.get(fromBlock);
    // if (cachedLogs) {
    //   return cachedLogs;
    // }

    const logs = await this._getLogTransaction(fromBlock, toBlock);
    this._cacheLogs.set(fromBlock, logs);
    return logs;
  }

  /**
   * ReturnblockblockHash: string | numberdition.
   *
   * @param {Number} fromBlockNumber: number of begin block in search range
   * @param {Number} toBlockNumber: number of end block in search range
   * @return {any}: an array of transactions
   */
  @implement
  public async getMultiBlocksTransactions(
    fromBlockNumber: number,
    toBlockNumber: number,
  ): Promise<any> {
    toBlockNumber = Math.max(toBlockNumber, fromBlockNumber);
    if (fromBlockNumber > toBlockNumber) {
      throw new Error(`fromBlockNumber must be less than toBlockNumber`);
    }
    logger.info(`${this.constructor.name}::getMultiBlocksTransactions from=${fromBlockNumber} to=${toBlockNumber}`);
    const logs = await this.getLogTransaction(fromBlockNumber, toBlockNumber);
    if (!logs) {
      throw new Error(`Could not get information of block: ${toBlockNumber}`);
      return [];
    }
    await this.processLogs(logs);
    return logs;
  }

  /**
   * No param
   * Returns the number of blocks in the local best block chain.
   * @returns {number}: the height of latest block on the block chain
   */
  public abstract getBlockCount(): Promise<number>;

  /**
   * Check whether a transaction is finalized on blockchain network
   *
   * @param {string} txid: the hash/id of transaction need to be checked
   * @returns {string}: the tx status
   */
  public abstract getTransactionStatus(txid: string): Promise<TransactionStatus>;

  /**
   * Get block detailstxidstxids: string[]*
   * @param {string|number} fromBlock: header hash or height of the from block
   * @param {string|number} toBlock: header hash or height of the to block
   * @returns {Block} block: the block detail
   */
  protected abstract _getLogTransaction(fromBlock: string | number, toBlock: string | number): Promise<any>;

  /**
   * Get one transaction object from blockchain network
   *
   * @param {any} log: the event log
   * @returns {any}: the transaction details
   */
  protected abstract _getOneLog(log: any): Promise<any>;

  /**
   * Get cache options. Override this in derived class if needed
   *
   * @return {LRU.Options} options for cache storage
   */
  @implement
  protected _getCacheOptions() {
    return {
      max: 1024,
      maxAge: 1000 * 60 * 5, // 5 minutes
    };
  }
}

export default BaseGateway;
