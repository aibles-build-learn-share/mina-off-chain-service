import { getConnection } from 'typeorm';
import {
  Erc20Token,
  Bep20Token,
  JobStatus,
  CurrencyConfig,
  EnvConfig,
} from '../entities/index';
import { BSC, ETH, MATIC } from '../Consts/index';
const Web3 = require('web3');

export const getErc20Contracts = async () => {
  const repository = await getConnection().manager.getRepository(Erc20Token);
  const contracts = await repository.find({});
  return contracts;
};

export const addJobStatus = async (
  contractAddress: string,
  data: string,
  transaction: string,
  chainName: string,
) => {
  const job = new JobStatus();
  job.contractAddress = contractAddress;
  job.data = JSON.stringify(data);
  job.transaction = transaction;
  job.status = 'waiting';
  job.chainName = chainName;
  const repository = (await getConnection()).manager.getRepository(JobStatus);
  const newJob = await repository.save(job);
  return newJob.id;
};

export const checkExistsJobStatus = async (txHash: string) => {
  try {
    const repository = (await getConnection()).manager.getRepository(JobStatus);
    const job = await repository.findOne({ transaction: txHash });
    if (!job) return false;
    return true;
  } catch (error) {}
  return false;
};

export const getBep20Contracts = async () => {
  const repository = await getConnection().manager.getRepository(Bep20Token);
  const contracts = await repository.find({});
  return contracts;
};

export const getConfigQueue = async (chainName: string) => {
  const repository = await getConnection().manager.getRepository(
    CurrencyConfig,
  );
  switch (chainName) {
    case ETH:
      const currencyEth = await repository.findOne({ chainName: ETH });
      return currencyEth;

    case BSC:
      const currencyBsc = await repository.findOne({ chainName: BSC });
      return currencyBsc;

    case MATIC:
      const currencyMatic = await repository.findOne({ chainName: MATIC });
      return currencyMatic;

    default:
      return null;
  }
};

export const addCurrencyConfig = async (data: any) => {
  const repository = await getConnection().manager.getRepository(
    CurrencyConfig,
  );
  const currencyConfig = new CurrencyConfig();
  currencyConfig.chain = data.chain;
  currencyConfig.network = data.network;
  currencyConfig.chainId = data.chain_id;
  currencyConfig.chainName = data.chain_name;
  currencyConfig.averageBlockTime = data.average_block_time;
  currencyConfig.blockTime = data.block_time;
  currencyConfig.requiredConfirmations = data.required_confirmations;
  currencyConfig.internalEndpoint = data.internal_endpoint;
  currencyConfig.rpcEndpoint = data.rpc_endpoint;
  currencyConfig.rpcEndpointBackups = data.rpc_endpoint_backups;
  currencyConfig.queueName = data.queue_name;
  currencyConfig.webhookApi = data.webhook_api;
  await repository.save(currencyConfig);
};

export const addEnvConfig = async (data: any) => {
  const repository = await getConnection().manager.getRepository(EnvConfig);
  const envConfig = new EnvConfig();
  envConfig.key = data.key;
  envConfig.value = data.value;
  await repository.save(envConfig);
};

export const addBep20Contract = async (data: any) => {
  const contract = new Bep20Token();
  contract.abiKey = data.abi_key;
  contract.contractAddress = data.contract_address;
  contract.events = JSON.stringify(data.events);
  contract.name = data.name;
  contract.network = data.network;
  contract.contractType = data.contract_type;
  contract.symbol = data.symbol;
  contract.decimal = data.decimal;
  const repository = await getConnection().manager.getRepository(Bep20Token);
  await repository.save(contract);
};

export const checkConnectedWeb3 = async (rpcEndpoint: string) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcEndpoint));
  const isConnected = await web3.isConnected();
  return isConnected;
};

export const getBlockNumber = async (rpcEndpoint: string) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcEndpoint));
  return await web3.eth.getBlockNumber();
};
