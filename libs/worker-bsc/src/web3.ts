import Web3Type from 'web3';

const XHR = require('xhr2-cookies').XMLHttpRequest;
XHR.prototype._onHttpRequestError = function (request, error) {
  if (this._request !== request) {
    return;
  }
  // A new line
  console.log(error, 'request');
  this._setError();
  request.abort();
  this._setReadyState(XHR.DONE);
  this._dispatchProgress('error');
  this._dispatchProgress('loadend');
};

const Web3 = require('web3');
import {
  EnvConfigRegistry,
  NetworkType,
  CurrencyRegistry,
  BlockchainPlatform,
  getLogger,
} from 'worker-common';

import {
  utils
} from 'wallet-core';

const {checkConnectedWeb3} = utils;

const logger = getLogger('web3');

const web3 = new Web3();
// const infuraWeb3 = new Web3();

EnvConfigRegistry.onNetworkChanged((network) => {
  logger.info(`web3::onNetworkChanged network=${network}`);
  const infuraEnpoint = process.env.INFURA_ENDPOINT;
  if (infuraEnpoint) {
    const provider = new Web3.providers.HttpProvider(infuraEnpoint);
    web3.setProvider(provider);
    // infuraWeb3.setProvider(provider);

    return;
  }

  // This implement is for backward compability
  const infuraProjectId = process.env.INFURA_PROJECT_ID;
  if (network === NetworkType.MainNet) {
    const provider = new Web3.providers.HttpProvider(
      `https://mainnet.infura.io/v3/${infuraProjectId}`,
    );
    web3.setProvider(provider);
    // infuraWeb3.setProvider(provider);
    return;
  }

  if (network === NetworkType.TestNet) {
    const provider = new Web3.providers.HttpProvider(
      `https://rinkeby.infura.io/v3/${infuraProjectId}`,
    );
    web3.setProvider(provider);
    // infuraWeb3.setProvider(provider);
    return;
  }
});

CurrencyRegistry.onCurrencyConfigSet((currency, config) => {
  if (currency.platform !== BlockchainPlatform.BinanceSmartChain) {
    return;
  }

  logger.info(
    `web3::onCurrencyConfigSet currency=${currency.symbol} config=${JSON.stringify(config)}`,
  );
  if (!config.rpcEndpoint) {
    return;
  }

  web3.setProvider(new Web3.providers.HttpProvider(config.rpcEndpoint));
});

export class Web3Instance{
  static indexRpc = 0;
  private web3Instance: Web3Type;
  private rpcEndpoints: string[];

  constructor(rpcEndpoints: string[]) {
    if (!this.web3Instance) {
      this.web3Instance = new Web3();
    }
    this.rpcEndpoints = rpcEndpoints;
    this.setProvider();
    return this;
  }

  private setProvider() {
    const rpcEndpoint = this.getRpcEndpoint();
    console.log('rpcEndpoint :>> ', rpcEndpoint);
    const provider = new Web3.providers.HttpProvider("https://bsc-testnet.blockpi.network/v1/rpc/public".trim());
    this.web3Instance.setProvider(provider);
    Web3Instance.indexRpc ++ ;
  }

  private getRpcEndpoint(){
    if(Web3Instance.indexRpc >= this.rpcEndpoints.length){
      return null;
    }
    return this.rpcEndpoints[Web3Instance.indexRpc];
  }

  public getContract = (abi: any, contractAddress: string) => {
    try {
      const contract = new this.web3Instance.eth.Contract(abi, contractAddress);
      return contract;
    } catch (error) {
      if(Web3Instance.indexRpc >= this.rpcEndpoints.length){
        console.log(error);
        return null;
      }
      this.setProvider();
    }
    return new this.web3Instance.eth.Contract(abi, contractAddress);
  }

  public parseDataLog = (inputs: any, data: any, topics: any) => {
    try {
      const dataLog = (this.web3Instance.eth.abi.decodeLog(inputs, data, topics.slice(1))) as any;
      return dataLog;
    } catch (error) {
      if(Web3Instance.indexRpc >= this.rpcEndpoints.length){
        console.log(error);
        return null;
      }
      this.setProvider();
    }
    return (this.web3Instance.eth.abi.decodeLog(inputs, data, topics.slice(1))) as any;
  }

  public getBlockNumber = async() => {
    try {
      const blockNumber = await this.web3Instance.eth.getBlockNumber();
      return blockNumber;
    } catch (error) {
      if(Web3Instance.indexRpc >= this.rpcEndpoints.length){
        console.log(error);
        return null;
      }
    }
    this.setProvider();
    return await this.web3Instance.eth.getBlockNumber();
  }

  public getTransaction = async(txid: string) => {
    try {
      const transaction = await this.web3Instance.eth.getTransaction(txid);
      return transaction;
    } catch (error) {
      if(Web3Instance.indexRpc >= this.rpcEndpoints.length){
        console.log(error);
        return null;
      }
      this.setProvider();
    }
    return await this.web3Instance.eth.getTransaction(txid);
  }

  public getTransactionReceipt = async(txid: string) => {
    try {
      const transactionReceipt = await this.web3Instance.eth.getTransactionReceipt(txid);
      return transactionReceipt
    } catch (error) {
      if(Web3Instance.indexRpc >= this.rpcEndpoints.length){
        console.log(error);
        return null;
      }
      this.setProvider();
    }
    return await this.web3Instance.eth.getTransactionReceipt(txid);
  }

  public getBlock = async(blockNumber: number) => {
    try {
      const block = await this.web3Instance.eth.getBlock(blockNumber);
      return block;
    } catch (error) {
      if(Web3Instance.indexRpc >= this.rpcEndpoints.length){
        console.log(error);
        return null;
      }
      this.setProvider();
    }
    return await this.web3Instance.eth.getBlock(blockNumber);
  }

  public getPastLogs = async(fromBlock: number, toBlock: number, address: any, topics: any) => {
    console.log('object :>> ');
    fromBlock = 38630303;
    toBlock = 38630303
    try {
      const logs = (await this.web3Instance.eth.getPastLogs({fromBlock: fromBlock, toBlock: toBlock, address, topics})) as any;
      console.log('logs :>> ', logs);
      return logs;
    } catch (error) {
      if(Web3Instance.indexRpc >= this.rpcEndpoints.length){
        console.log(error);
        return null;
      }
      this.setProvider();
    }
    return (await this.web3Instance.eth.getPastLogs({fromBlock: fromBlock, toBlock: toBlock, address, topics})) as any;
  }
}


export { web3 /* , infuraWeb3*/};