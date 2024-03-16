import { createClient, RedisClient } from 'redis';
import util from 'util';
import { EnvConfigRegistry } from './registries';
import { getLogger } from './Logger';

const logger = getLogger('RedisChannel');
let sub: RedisClient = null;

export function getRedisSubscriber(customChannel?: string): RedisClient {
  if (sub) {
    return sub;
  }

  const host = EnvConfigRegistry.getCustomEnvConfig('REDIS_HOST');
  const port = EnvConfigRegistry.getCustomEnvConfig('REDIS_PORT');
  const url = EnvConfigRegistry.getCustomEnvConfig('REDIS_URL');
  if ((!host && !url) || (!port && !url)) {
    throw new Error(
      `Some redis configs are missing. REDIS_HOST=${host}, REDIS_PORT=${port}, REDIS_URL=${url}`,
    );
  }

  sub = createClient({
    host,
    port: parseInt(port, 10),
    url,
  });

  const appId = EnvConfigRegistry.getAppId();

  if (!customChannel) {
    sub.subscribe(`${appId}`);
  } else {
    sub.subscribe(`${appId}:${customChannel}`);
  }

  return sub;
}

interface IRedisPromiseClient {
  setex(key: string, seconds: number, value: string): Promise<string>;
  set(key: string, value: string): Promise<string>;
  get(key: string): Promise<string>;
  publish(channel: string, message: string): Promise<string>;
}

let client: RedisClient;
let promiseClient: IRedisPromiseClient;
export function getRedisClient() {
  if (!EnvConfigRegistry.isUsingRedis()) {
    throw new Error(`Redis is not enabled now.`);
  }

  if (!client) {
    const host = EnvConfigRegistry.getCustomEnvConfig('REDIS_HOST');
    const port = EnvConfigRegistry.getCustomEnvConfig('REDIS_PORT');
    const url = EnvConfigRegistry.getCustomEnvConfig('REDIS_URL');

    client = createClient({
      host,
      port: parseInt(port, 10),
      url,
    });

    promiseClient = {
      setex: util.promisify(client.setex).bind(client),
      set: util.promisify(client.set).bind(client),
      get: util.promisify(client.get).bind(client),
      publish: util.promisify(client.publish).bind(client),
    };
  }

  return promiseClient;
}
