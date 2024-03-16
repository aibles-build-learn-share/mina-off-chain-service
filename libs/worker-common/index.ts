try {
  require('dotenv').config();
} catch (e) {
  console.error(e.toString());
  process.exit(1);
}

// Make sure the common lib is the only in whole process
if (process.env.isEnvSet_KnV5Ha0UlAAEME69I6KA === '2') {
  throw new Error(`Something went wrong. The [worker-common] lib declared multiple times.`);
}
process.env.isEnvSet_KnV5Ha0UlAAEME69I6KA = '2';

export * from './src/types';
export * from './src/enums';
export * from './src/interfaces';
export * from './src/BaseIntervalWorker';
export * from './src/BaseCrawler';
export * from './src/BasePlatformCrawler';
export * from './src/BaseGateway';
export * from './src/AccountBasedGateway';
export * from './src/MaticBasedGateway';
export * from './src/BscBasedGateway';
export * from './src/BaseWebServer';
export * from './src/RPCClient';
export * from './src/registries';
export * from './src/Logger';
export * from './src/RedisChannel';
export * from './src/registries';
export * from './src/Mailer';
export * from './src/Utils';
import * as Utils from './src/Utils';
export { Utils };

// External dependencies
import BigNumber from 'bignumber.js';
export { BigNumber };
