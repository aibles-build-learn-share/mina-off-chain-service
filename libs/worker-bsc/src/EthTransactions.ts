import { GenericTransactions } from 'worker-common';
import EthTransaction from './EthTransaction';

export class EthTransactions extends GenericTransactions<EthTransaction> {}

export default EthTransactions;
