import { prepareEnvironment } from './prepareEnvironment';
import { utils } from 'wallet-core';
const { addCurrencyConfig, addEnvConfig, addBep20Contract } = utils;
const dataSeeds = require('./config/app_seed.json');

prepareEnvironment()
  .then(async() => {
    await start();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

async function start() {
  const currenciesConfig = dataSeeds.curreniesConfig;
  const envsConfig = dataSeeds.envsConfig;
  const bep20s = dataSeeds.contracts;
  for (const currency of currenciesConfig) {
    await addCurrencyConfig(currency);
  }
  for (const envConfig of envsConfig) {
    await addEnvConfig(envConfig);
  }
  for (const bep20 of bep20s) {
    await addBep20Contract(bep20);
  }
  return;
}
