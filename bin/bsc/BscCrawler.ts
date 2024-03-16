import 'worker-bsc';
import { callbacks } from 'wallet-core';
import { ICrawlerOptions, BlockchainPlatform, BasePlatformCrawler } from 'worker-common';
import { prepareEnvironment } from './prepareEnvironment';

class BscCrawler extends BasePlatformCrawler {
  protected _processingTimeout = 120000;
  constructor(options: ICrawlerOptions) {
    super(BlockchainPlatform.BinanceSmartChain, options);
  }
}

prepareEnvironment()
  .then(start)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

function start() {
  const { getLatestCrawledBlockNumber, onBlockCrawled } = callbacks;
  const crawlerOpts: ICrawlerOptions = {
    getLatestCrawledBlockNumber,
    onBlockCrawled,
  };

  const crawler = new BscCrawler(crawlerOpts);
  crawler.start();
}
