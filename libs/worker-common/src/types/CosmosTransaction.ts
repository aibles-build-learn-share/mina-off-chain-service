import { BlockHeader } from './BlockHeader';
import {
  IMultiEntriesTransactionProps,
  MultiEntriesTransaction,
  IMultiEntriesTxEntry,
  IMultiEntriesTxProps,
} from './MultiEntriesTransaction';
import BigNumber from 'bignumber.js';

export const TypeTx = {
  StdTx: 'core/StdTx',
};

export const TypeMsg = {
  MsgSend: 'bank/MsgSend',
  MsgMultiSend: 'bank/MsgMultiSend',
};

export const TypeMsgSDK = {
  MsgSend: 'cosmos-sdk/MsgSend',
  MsgMultiSend: 'cosmos-sdk/MsgMultiSend',
};

export interface ICosmosRawTransaction {
  readonly height: number;
  readonly txHash: string;
  readonly memo: string;
  readonly logs: string;
  readonly txType: string;
  readonly fee: BigNumber;
  readonly outEntries: IMultiEntriesTxEntry[];
  readonly inEntries: IMultiEntriesTxEntry[];
  readonly gas: number;
}

export interface ICosmosTransactionProps extends IMultiEntriesTransactionProps {
  readonly memo: string;
  readonly gas: number;
  readonly txType: string;
}

export class CosmosTransaction extends MultiEntriesTransaction {
  public readonly memo: string;
  public readonly gas: number;
  public readonly txType: string;
  public readonly fee: BigNumber;
  constructor(
    tx: ICosmosTransactionProps,
    outputs: IMultiEntriesTxEntry[],
    inputs: IMultiEntriesTxEntry[],
    block: BlockHeader,
    lastNetworkBlockNumber: number,
  ) {
    const props: IMultiEntriesTxProps = {
      outputs,
      inputs,
      block,
      lastNetworkBlockNumber,
      txid: tx.txid,
    };

    super(props);
    this.memo = tx.memo;
    this.gas = tx.gas;
    this.txType = tx.txType;
    this.fee = tx.fee;
  }

  public extractAdditionalField(): any {
    return {
      memo: this.memo,
    };
  }

  public getNetworkFee(): BigNumber {
    return this.fee;
  }
}

export default CosmosTransaction;
