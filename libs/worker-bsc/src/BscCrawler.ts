import { BasePlatformCrawler, BlockchainPlatform, ICrawlerOptions } from 'worker-common';

export class BscCrawler extends BasePlatformCrawler {
  protected _processingTimeout = 300000;
  constructor(options: ICrawlerOptions) {
    super(BlockchainPlatform.BinanceSmartChain, options);
  }
}

export default BscCrawler;
