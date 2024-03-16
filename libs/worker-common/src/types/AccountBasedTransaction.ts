import BigNumber from 'bignumber.js';
import { ICurrency } from '../interfaces';
import { Transaction, BlockHeader, TransferEntry, Address } from './index';

interface IAccountBasedTransactionProps {
  readonly txid: string;
  readonly height: number;
  readonly timestamp: number;
  confirmations: any;
  readonly fromAddress: Address;
  readonly toAddress: Address;
  readonly amount: BigNumber;
}

export abstract class AccountBasedTransaction extends Transaction {
  public readonly fromAddress: Address;
  public readonly toAddress: Address;
  public readonly amount: BigNumber;
  public readonly currency: ICurrency;

  constructor(currency: ICurrency, tx: IAccountBasedTransactionProps, block: BlockHeader) {
    // Construct tx props
    const txProps = {
      confirmations: tx.confirmations,
      height: block.number,
      timestamp: new Date(block.timestamp).getTime() || block.timestamp,
      txid: tx.txid,
    };

    // Construct base transaction
    super(txProps, block);

    this.currency = currency;
    this.fromAddress = tx.fromAddress;
    this.toAddress = tx.toAddress;
    this.amount = tx.amount;
  }

  public _extractEntries(): TransferEntry[] {
    if (this.amount.isZero()) {
      return [];
    }

    const senderEntry = new TransferEntry({
      currency: this.currency,
      amount: this.amount.times(-1),
      address: this.fromAddress,
      tx: this,
      txid: this.txid,
    });

    const receiverEntry = new TransferEntry({
      currency: this.currency,
      amount: this.amount,
      address: this.toAddress,
      tx: this,
      txid: this.txid,
    });

    return [senderEntry, receiverEntry];
  }
}
