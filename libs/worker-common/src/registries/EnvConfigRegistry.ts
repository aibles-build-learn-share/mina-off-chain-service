import { NetworkType } from '../enums';
import { IGlobalEnvConfig } from '../interfaces';
import { getLogger } from '../Logger';

const envConfig = new Map<string, string>();
let _appId = 'PP70ExC8Hr';
let _globalEnvConfig: IGlobalEnvConfig = {
  network: NetworkType.TestNet,
};
const onNetworkChangedCallbacks: Array<(network: NetworkType) => void> = [];

/**
 * List of configuration keys that are used in common lib
 * - NETWORK:
 *   + May impact to how addresses are generated in some platforms (like Bitcoin family)
 * - REDIS_ENABLED:
 *   + Indicates that redis is available for cache and pub/sub
 * - REDIS_HOST/REDIS_PORT/REDIS_USER/REDIS_PASSWORD:
 *   + Config redis credentials when they're not the default values
 */

export class EnvConfigRegistry {
  public static getCustomEnvConfig(key: string): string {
    return envConfig.get(key);
  }

  public static setCustomEnvConfig(key: string, value: string) {
    const logger = getLogger('EnvConfigRegistry');
    logger.info(`setCustomEnvConfig key=${key}, value=${value}`);
    switch (key) {
      case 'NETWORK':
        if (
          value !== NetworkType.MainNet &&
          value !== NetworkType.TestNet &&
          value !== NetworkType.PrivateNet
        ) {
          throw new Error(`Trying to set invalid value for network: ${value}`);
        }

        _globalEnvConfig = Object.assign(_globalEnvConfig, { network: value });
        onNetworkChangedCallbacks.forEach((func) => func(value as NetworkType));
        break;

      case 'APP_ID':
        this.setAppId(value);
        break;

      default:
        break;
    }

    return envConfig.set(key, value);
  }

  public static getGlobalEnvConfig(): IGlobalEnvConfig {
    return _globalEnvConfig;
  }

  public static getAppId(): string {
    return _appId;
  }

  public static setAppId(appId: string) {
    _appId = appId;
  }

  public static getNetwork(): NetworkType {
    return _globalEnvConfig.network;
  }

  // Check whether the environment is mainnet
  public static isMainnet(): boolean {
    return EnvConfigRegistry.getNetwork() === NetworkType.MainNet;
  }

  // Check whether the environment is public testnet
  public static isTestnet(): boolean {
    return EnvConfigRegistry.getNetwork() === NetworkType.TestNet;
  }

  // Check whether the environment is private net
  public static isPrivnet(): boolean {
    return EnvConfigRegistry.getNetwork() === NetworkType.PrivateNet;
  }

  public static onNetworkChanged(func: (network: NetworkType) => void) {
    onNetworkChangedCallbacks.push(func);
  }

  public static isUsingRedis(): boolean {
    const redisEnabled = EnvConfigRegistry.getCustomEnvConfig('REDIS_ENABLED');
    if (redisEnabled === 'true') {
      return true;
    }

    return false;
  }
}

export default EnvConfigRegistry;
