import { createConnection, getConnection } from 'wallet-core/node_modules/typeorm';
import _ from 'lodash';
import {
  getLogger,
  CurrencyRegistry,
  EnvConfigRegistry,
  ICurrency,
  settleEnvironment,
  getRedisSubscriber,
} from 'worker-common';
import { entities } from 'wallet-core';

const { CurrencyConfig, EnvConfig, Bep20Token, Erc20Token, JobStatus, Currency, LatestBlock } =
  entities;

const logger = getLogger('prepareEnvironment');

export async function prepareEnvironment(): Promise<void> {
  logger.info(`Application has been started bsc.`);
  logger.info(`Preparing DB connection bsc...`);
  await createConnection({
    name: 'default',
    type: 'mysql',
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT ? parseInt(process.env.TYPEORM_PORT, 10) : 3306,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING ? process.env.TYPEORM_LOGGING === 'true' : true,
    cache: process.env.TYPEORM_CACHE ? process.env.TYPEORM_CACHE === 'true' : true,
    entities: [JobStatus, CurrencyConfig, EnvConfig, Erc20Token, Currency, LatestBlock, Bep20Token],
  });

  logger.info(`DB connected successfully bsc...`);
  const connection = getConnection();
  logger.info(`Loading environment configurations from database bsc...`);

  const [currencyConfigs, envConfigs] = await Promise.all([
    connection.getRepository(CurrencyConfig).find({}),
    connection.getRepository(EnvConfig).find({}),
  ]);

  envConfigs.forEach((config) => {
    EnvConfigRegistry.setCustomEnvConfig(config.key, config.value);
  });

  currencyConfigs.forEach((config) => {
    if (!CurrencyRegistry.hasOneNativeCurrencyByPlatform(config.chain)) {
      throw new Error(`There's config for unknown chain: ${config.chain}`);
    }

    const currency = CurrencyRegistry.getOneNativeCurrency(config.chain);
    CurrencyRegistry.setCurrencyConfig(currency, config);
  });

  if (EnvConfigRegistry.isUsingRedis()) {
    const redisHost = EnvConfigRegistry.getCustomEnvConfig('REDIS_HOST') || process.env.REDIS_HOST;
    const redisPort = EnvConfigRegistry.getCustomEnvConfig('REDIS_PORT') || process.env.REDIS_PORT;
    const redisUrl = EnvConfigRegistry.getCustomEnvConfig('REDIS_URL') || process.env.REDIS_URL;
    if ((!redisHost && !redisUrl) || (!redisPort && !redisUrl)) {
      throw new Error(
        `Some redis configs are missing. REDIS_HOST=${redisHost}, REDIS_PORT=${redisPort}, REDIS_URL=${redisUrl}`,
      );
    }
  }

  const redisSubscriber = getRedisSubscriber();
  redisSubscriber.on('message', onRedisMessage);

  await settleEnvironment();

  logger.info(`Environment has been setup successfully...`);
  return;
}

function onRedisMessage(channel: any, message: any) {
  const appId = EnvConfigRegistry.getAppId();
  if (appId !== channel) {
    return;
  }

  // To reload data, just exit and let supervisor starts process again
  // This is deprecated now. Will be removed shortly, when all the publishers are updated
  if (message === 'EVENT_NEW_ERC20_TOKEN_ADDED' || message === 'EVENT_NEW_ERC20_TOKEN_REMOVED') {
    logger.warn(
      `RedisChannel::subscribeRedisChannel on message=${message}. Will exit to respawn...`,
    );
    process.exit(0);
  }

  let messageObj: any = null;
  try {
    messageObj = JSON.parse(message);
  } catch (e) {
    logger.warn(`Unexpected message from redis: ${message}`);
  }

  if (!messageObj) {
    return;
  }

  if (messageObj) {
    const contractAddress = messageObj.data.toString();
    switch (messageObj.event) {
      case 'EVENT_NEW_ERC20_TOKEN_ADDED':
        findAndRegisterNewBep20Token(contractAddress).catch((e) => {
          logger.error(
            `Could not find and load new added ERC20 token [${contractAddress}] due to error:`,
          );
          logger.error(e);
        });
        break;

      case 'EVENT_NEW_ERC20_TOKEN_REMOVED':
        findAndUnregisterBep20Token(contractAddress).catch((e) => {
          logger.error(
            `Could not find and delete added ERC20 token [${contractAddress}] due to error:`,
          );
          logger.error(e);
        });
        break;

      default:
        break;
    }
  }
}

async function findAndRegisterNewBep20Token(contractAddress: string) {
  const connection = getConnection();
  const token = await connection.getRepository(Bep20Token).findOne({ contractAddress });
  if (!token) {
    throw new Error(`Could not find BEP20 token in database: ${contractAddress}`);
  }

  CurrencyRegistry.registerBep20Token(
    token.contractAddress,
    token.symbol,
    token.name,
    token.decimal,
  );
  logger.info(
    `Register new added BEP20 token: contract=${token.contractAddress} symbol=${token.symbol}`,
  );
}

async function findAndUnregisterBep20Token(contractAddress: string) {
  CurrencyRegistry.unregisterBep20Token(contractAddress);
  logger.info(`Unregister new added BEP20 token: contract=${contractAddress}`);
}
