import { BaseCrawler, Block } from 'worker-common';
import { getConnection, In } from 'typeorm';
import { LatestBlock } from '../../entities/LatestBlock';
/**
 * This callback is invoked when a block is processed. We'll update latest_block table then
 * @param {BaseCrawler} crawler: the crawler that is processing
 * @param {number} block: the block data that has been crawled
 */
export default async function onBlockCrawled(crawler: BaseCrawler, blockNumber: number): Promise<void> {
  const currency = crawler.getNativeCurrency().symbol;
  const type = crawler.getCrawlType();

  await getConnection().getRepository(LatestBlock).update({ currency, type }, { blockNumber });
}

export { onBlockCrawled };
