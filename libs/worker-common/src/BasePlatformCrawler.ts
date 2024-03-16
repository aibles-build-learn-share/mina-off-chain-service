import BaseCrawler from './BaseCrawler';
import { CurrencyRegistry, GatewayRegistry } from './registries';
import { getLogger } from '../src/Logger';

const logger = getLogger('BasePlatformCrawler');

export class BasePlatformCrawler extends BaseCrawler {
  /**
   * Process several blocks in one go. Just use single database transaction
   * @param {number} fromBlock - begin of crawling blocks range
   * @param {number} toBlock - end of crawling blocks range
   * @param {number} latestNetworkBlock - recent height of blockchain in the network
   */
  protected async processBlocks(fromBlock: number, toBlock: number, latestNetworkBlock: number) {
    const allCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(this._nativeCurrency.platform);
    if(allCurrencies.length){
      const currency = allCurrencies[0];
      const gateway = GatewayRegistry.getGatewayInstance(currency);
      // Get all transactions in the block
      const allTxs = await gateway.getMultiBlocksTransactions(fromBlock, toBlock);
      const extraInfo = {
        networkSymbol: currency.networkSymbol,
        fullSymbol: currency.symbol,
        fromBlock,
        toBlock,
        latestNetworkBlock,
        txs: allTxs.length,
      };
      logger.info(`${this.constructor.name}::processBlocks finished`, extraInfo);
    }

  }
}
