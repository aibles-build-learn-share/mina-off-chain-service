# Quick Start

```js
const { CurrencyRegistry, GatewayRegistry } = require("worker-common");
require("worker-eth");
require("worker-btc");

async function prepareEnvironment() {
  CurrencyRegistry.setCurrencyConfig(CurrencyRegistry.Ethereum, {
    restEndpoint: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
  });

  const btcRPCConfig = {
    protocol: process.env.BTC_RPC_PROTOCOL,
    host: process.env.BTC_RPC_HOST,
    port: process.env.BTC_RPC_PORT,
    user: process.env.BTC_RPC_USER,
    pass: process.env.BTC_RPC_PASS
  };

  CurrencyRegistry.setCurrencyConfig(CurrencyRegistry.Bitcoin, {
    rpcEndpoint: JSON.stringify(btcRPCConfig),
    restEndpoint: process.env.BTC_REST_ENDPOINT
  });
}

async function main() {
  await prepareEnvironment();
  const ethGateway = GatewayRegistry.getGatewayInstance(CurrencyRegistry.Ethereum);
  const contractAddress = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa";
  const tokenInfo = await ethGateway.getErc20TokenInfo(contractAddress);
  console.log(tokenInfo);

  const btcGateway = GatewayRegistry.getGatewayInstance(CurrencyRegistry.Bitcoin);
  const blockCount = await btcGateway.getBlockCount();
  console.log(`Current block count: ${blockCount}`);

  const txid = "4570f2cf7dc65a0fb80920b19c727563b19e392fce3f11d399e72d326d82fe8d";
  const tx = await btcGateway.getOneLog(txid);
  console.log(tx);
}

main()
  .then(() => {
    console.log(`FINISHED.`);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
```

# Notes for logging

## Log level
Application log level can be configured by this environment variable:
```
LOG_LEVEL={debug/info/warn/error}
```
If the log level is not explicit defined, the `info` level will be used as default.

## Config for CloudWatch
To enable CloudWatch logger, these environment variables must be set:
```
CWL_ENABLED={true/false}
CWL_LOG_GROUP_NAME=<Custom log group name here>
CWL_LOG_STREAM_PREFIX=<Custom log stream prefix here>
```
Some optional configurations can be set to customized CW settings:
```
CWL_LOG_LEVEL={debug/info/warn/error}
CWL_UPLOAD_RATE=<time in milliseconds>
CWL_AWS_ACCESS_KEY_ID=
CWL_AWS_ACCESS_KEY_SECRET=
CWL_AWS_REGION_ID=
```