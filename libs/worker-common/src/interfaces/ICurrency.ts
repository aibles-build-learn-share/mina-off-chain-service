import { Address } from '../types';
import BlockchainPlatform from '../enums/BlockchainPlatform';
import { TokenType, TransactionBaseType } from '../enums';

export interface ICurrency {
  // Currency symbol. It can be primary assets of a platform like btc, eth
  // Or a kind of utility token/asset on that platform
  readonly symbol: string;

  // Symbol on its own network. This property maybe not unique
  readonly networkSymbol: string;

  // Full name of the currency
  readonly name: string;

  // The blockchain platform that currency is based on
  // Maybe there're various currencies on a same platform
  readonly platform: BlockchainPlatform;

  // Account-based or UTXO-based
  readonly isUTXOBased: boolean;

  // TODO in future/ type is required, replace for isUTXOBased
  readonly type?: TransactionBaseType;

  // Currency is native asset
  readonly isNative: boolean;

  // The factor between ordinary unit that humans are usually working with
  // and the smallest unit that is handle in core platform and APIs
  // For example:
  // - In Bitcoin it's 8: 1 bitcoin = 10^8 satoshi
  // - In Ethereum it's 18: 1 ether = 10^18 wei
  // - In Ripple it's 0: xrp is just used by both humans and APIs
  readonly humanReadableScale: number;

  // Maxium number of digit that is handle natively
  // Notice it's different from humanReadableScale:
  // - In Bitcoion it's 0: native runtime consume satoshi, and satoshi is indivisible
  // - In Ripple it's 6: native runtime consume xrp, and xrp can be divided to 0.000001 (10^-6)
  readonly nativeScale: number;
  readonly hdPath?: string;

  // There're no memo/tag for transactions in old platforms
  // This option is availble on only some modern platform like EOS/Ripple/Stellar
  readonly hasMemo: boolean;
}

export default ICurrency;

export interface IToken extends ICurrency {
  readonly tokenType: TokenType;
}

export interface IErc20Token extends IToken {
  readonly contractAddress: Address;
  readonly decimals: number;
}

export interface IErc20TokenTomo extends IToken {
  readonly contractAddress: Address;
  readonly decimals: number;
}

export interface INep5Token extends IToken {
  readonly contractAddress: Address;
  readonly decimals: number;
}

export interface IOmniAsset extends IToken {
  readonly propertyId: number;
}

export interface IEosToken extends IToken {
  readonly code: string;
  readonly networkSymbol: string;
}

export interface IBepToken extends IToken {
  readonly originSymbol: string;
}

export interface IBep20Token extends IToken {
  readonly contractAddress: Address;
  readonly decimals: number;
}

export interface ITerraToken extends IToken {
  readonly code: string;
}

export interface ICosmosToken extends IToken {
  readonly code: string;
}

export interface ITrc20Token extends IToken {
  readonly contractAddress: Address;
  readonly decimals: number;
}
