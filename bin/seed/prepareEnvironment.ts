import { createConnection, getConnection } from 'wallet-core/node_modules/typeorm';
import _ from 'lodash';
import {
  getLogger,
  CurrencyRegistry,
  EnvConfigRegistry,
  settleEnvironment,
} from 'worker-common';
import { entities } from 'wallet-core';

const { CurrencyConfig, EnvConfig, Bep20Token} = entities;

const logger = getLogger('prepareEnvironment');

export async function prepareEnvironment(): Promise<void> {
  logger.info(`Application has been started seed.`);
  logger.info(`Preparing DB connection seed...`);
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
    entities: [CurrencyConfig, EnvConfig, Bep20Token],
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


  await settleEnvironment();

  logger.info(`Environment has been setup successfully...`);
  return;
}

