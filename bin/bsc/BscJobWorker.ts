import 'worker-bsc';
import { prepareEnvironment } from './prepareEnvironment';
import { job, utils, consts } from 'wallet-core';

const { QueueJob } = job;
const { getConfigQueue } = utils;
const { BSC } = consts;

prepareEnvironment()
  .then(start)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

async function start() {
  const currency = await getConfigQueue(BSC)
  const name: string = currency.queueName;
  const port: number = parseInt(process.env.REDIS_PORT);
  const host: string = process.env.REDIS_HOST;
  const webhookApiUrl = currency.webhookApi;
  const queue = new QueueJob(name, port, host, webhookApiUrl);
  queue.run();
}
