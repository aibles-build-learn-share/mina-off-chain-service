require('dotenv').config();

import { BaseWebServer } from '../src/BaseWebServer';
import { CurrencyRegistry } from '../src/registries';
import { BlockchainPlatform } from '../src/enums/BlockchainPlatform';

CurrencyRegistry.setCurrencyConfig(CurrencyRegistry.Ethereum, {
  chain: CurrencyRegistry.Ethereum.platform,
  network: 'mainnet',
  chainId: '1',
  chainName: 'mainnet',
  averageBlockTime: 15000,
  requiredConfirmations: 1,
  internalEndpoint: 'http://localhost:47001',
  rpcEndpoint: null,
  blockTime: null,
  rpcEndpointBackups: null,
});

class TestWebServer extends BaseWebServer {
  //
}

setTimeout(() => {
  const webServer = new TestWebServer(BlockchainPlatform.Ethereum);
  webServer.start();
}, 1000);
