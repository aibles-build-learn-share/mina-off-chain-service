import mainnetConfig from './network/mainnet.json';
import testnetConfig from './network/testnet.json';
import erc20 from './abi/erc20.json';
import erc721 from './abi/erc721.json';
import erc1155 from './abi/erc1155.json';
import whitelabel from './abi/whitelabel.json';
import gohara_proxy from './abi/gohara_proxy.json';
export interface IEthConfig {
  averageBlockTime: number;
  requiredConfirmations: number;
  explorerEndpoint: string;
  chainId: number;
}

export const EthConfig: IEthConfig = Object.assign({}, mainnetConfig);

// Beside fallback values, we also can update the configurations at the runtime
export function updateEthConfig(network: string) {
  switch (network) {
    case 'mainnet':
      Object.assign(EthConfig, mainnetConfig);
      break;
    case 'testnet':
      Object.assign(EthConfig, testnetConfig);
      break;

    default:
      throw new Error(`Invalid environment variable value: NETWORK=${process.env.NETWORK}`);
  }
}

export const ABI = { erc20, whitelabel, erc1155, erc721, gohara_proxy };
