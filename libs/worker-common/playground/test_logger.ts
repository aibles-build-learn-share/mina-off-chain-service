require('dotenv').config();

import { getLogger } from '../src/Logger';

const logger = getLogger('TestLogger');

setInterval(() => {
  logger.info('Hello world 1');
  logger.info({ message: 'Hello world 2', extraInfo1: 'xxx', extraInfo2: 'yyy' });
  logger.info('Hello world 3', { extraInfo1: 'xxx' });
  logger.info('Hello world 4', { extraInfoArray: [{ extraInfo1: 123 }, { extraInfo2: 234 }] });
  const e = new Error('Test error');
  logger.error(e);
  logger.error('Error happens: ', e);
}, 10000);
