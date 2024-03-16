import { JobStatus } from './../entities/JobStatus';
import { getConnection } from 'typeorm';
import Queue from 'bull';
import axios from 'axios';
import { BigNumber, getLogger } from 'worker-common';
import { Mina, PublicKey, UInt64, Field, PrivateKey } from 'o1js';
import { Bridge } from './Bridge';
const logger = getLogger('JobWorker');
export interface JobData {
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  contractAddress: string;
  input: string;
  type: string; // event name
  data: any;
}

export class QueueJob {
  private readonly _name: string;
  private readonly _portRedis: number;
  private readonly _hostRedis: string;
  private readonly _webhookApiUrl: string;
  public constructor(
    name: string,
    port: number,
    host: string,
    webhookApiUrl: string,
  ) {
    this._name = name;
    this._hostRedis = host;
    this._portRedis = port;
    this._webhookApiUrl = webhookApiUrl;
  }
  public getQueue() {
    const options = {
      redis: {
        port: this._portRedis,
        host: this._hostRedis,
      },
      limiter: {
        max: 1,
        duration: 1000,
      },
      attempts: 100,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    };
    const queue = new Queue(this._name, options);
    return queue;
  }

  public async run() {
    const queue = this.getQueue();
    logger.info('Starting job worker...');
    queue.process(async (job, done) => {
      const jobCounts = await queue.getJobCounts();
      const count =
        jobCounts.active +
        jobCounts.delayed +
        jobCounts.waiting +
        jobCounts.failed;
      if (count == 0) {
        logger.info('Queue Job is empty!');
        done();
      } else {
        logger.info(`Processing Job-${job.id} Attempt: ${job.attemptsMade}`);
        const res = await this.sendData2(job);
        if (res.status == 200) {
          console.log(`Job-${job.id} success.`);
          // set status success in db
          const isSuccess = await this.updateJobStatus(job.data.recordId);
          if (isSuccess) {
            logger.info(
              `Update status job ( record id )- ${job.data['recordId']} success!`,
            );
          } else {
            logger.error(
              `Update status job ( record id )- ${job.data['recordId']} fail!`,
            );
          }
        } else {
          // repeat job
          const repeatJob = await queue.add(job.data, {
            ...{ priority: count + 1 },
            ...job.opts,
          });
          logger.error(
            `Job-${job.id} failed. Creating new Job-${repeatJob.id} with highest priority for same data.`,
          );
        }
        done();
      }
    });
  }

  private async sendData(job: any) {
    const date = new Date(job.data.timeStamp);
    const data = {
      timeStamp: date.toISOString(),
      hash: job.data.hash,
      from: job.data.from,
      to: job.data.to,
      contractAddress: job.data.contractAddress,
      input: job.data.input,
      eventType: job.data.eventType, // event name
      data: job.data.data,
    };
    console.log(data);
    console.log(this._webhookApiUrl);

    try {
      const res = await axios({
        method: 'post',
        url: this._webhookApiUrl,
        data: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WEBHOOK_API_TOKEN}`,
        },
      });
      console.log(res.data);
      return { status: res.status };
    } catch (error) {
      console.log(`Send data error ${error}`);
    }
    return { status: 400 };
  }

  private async sendData2(job: any) {
    // const date = new Date(job.data.timeStamp);
    // const data = {
    //   timeStamp: date.toISOString(),
    //   hash: job.data.hash,
    //   from: job.data.from,
    //   to: job.data.to,
    //   contractAddrfeepayerAddress_webhookApiUrl);
    console.log('======== send Data 2 ===========');
    console.log('job.data :>> ', job.data);
    try {
      let zkAppKeysBase58 = {
        privateKey: 'EKEtoFKN3Q2RegkNkE7L8PsVaeyqQFpuiXEJroxakdkErg3PAhnL',
        publicKey: 'B62qkmWiUALBUa2jqTuYrrxTj3kGheiHvbQRfWw6Q2kZoHPi8i84nLD',
      };
      let feepayerKeysBase58 = {
        privateKey: 'EKEjvrg7rpjvLcKNtwojGumMSKHwEU4asuedThozWrxjZu24NEAg',
        publicKey: 'B62qrEa6oyyWtQDyeV4QTV5wEh5F572jLkA7EuKXLa3VhSKhjCsEGj7',
      };

      let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
      let zkAppKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);

      // set up Mina instance and contract we interact with
      const fee = 0.101 * 1e9; // in nanomina (1 billion = 1.0 mina)

      const MINAURL = 'https://api.minascan.io/node/berkeley/v1/graphql';
      const ARCHIVEURL = 'https://archive.berkeley.minaexplorer.com/';

      const network = Mina.Network({
        mina: MINAURL,
        archive: ARCHIVEURL,
      });
      Mina.setActiveInstance(network);

      let feepayerAddress = feepayerKey.toPublicKey();
      let zkAppAddress = zkAppKey.toPublicKey();
      let zkApp = new Bridge(zkAppAddress);

      const tx = await Mina.transaction(
        { sender: feepayerAddress, fee },
        () => {
          zkApp.releaseToken(
            new Field(0),
            PublicKey.fromBase58(
              'B62qn4BEvzo9TFd8LX9uTDJ84fJmkW6HieYzGR98KFXuNc418vTNMQa',
            ),
            UInt64.from((new BigNumber(job.data.data.amount)).div(new BigNumber(1e9)).toString(10))
          );
        },
      );
    } catch (error) {
      console.log(`Send data error ${error}`);
    }
    return { status: 400 };
  }

  private async updateJobStatus(id: number) {
    try {
      const repository = await getConnection().manager.getRepository(JobStatus);
      const job = await repository.findOne({ id: id });
      job.status = 'completed';
      await repository.save(job);
      const updateJob = await repository.findOne({ id: id });
      if (updateJob.status == 'completed') return true;
    } catch (error) {
      console.log(`Update job status fail - job id: ${id}`);
      console.log(error);
    }

    return false;
  }
}

export default QueueJob;

