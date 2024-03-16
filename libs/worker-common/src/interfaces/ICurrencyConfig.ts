export interface ICurrencyConfig {
  // Basic information...
  readonly chain: string;
  readonly network: string;
  readonly chainId: string;
  readonly chainName: string;
  readonly averageBlockTime: number;
  readonly blockTime: number;
  readonly requiredConfirmations: number;

  // Config to connect (most likely) JSON-RPC endpoint
  // Another method to fetch data from blockchain network, beside the rest API above
  readonly rpcEndpoint: string;
  readonly rpcEndpointBackups: string;

  // Webserver that provides APIs for each currency will be running on this endpoint
  readonly internalEndpoint: string;
}
