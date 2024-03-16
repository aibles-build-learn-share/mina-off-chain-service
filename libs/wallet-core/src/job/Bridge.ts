import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  MerkleWitness,
  MerkleTree,
  Struct,
  UInt64,
  CircuitString,
  AccountUpdate,
  Poseidon,
  UInt8,
  Provable,
} from 'o1js';

export class TransferInfo extends Struct({
  from: PublicKey,
  to: CircuitString,
  targetChain: UInt8,
  amount: UInt64,
  serviceFee: UInt64,
}) {}

export class TransferInitiatedEvent extends Struct({
  transferId: Field,
  from: PublicKey,
  to: Provable.Array(Field, 2),
  targetChain: UInt8,
  amount: UInt64,
}) {}

export class TokensReleasedEvent extends Struct({
  transferId: Field,
}) {}

export class EVMAddressInput extends Struct({
  array: Provable.Array(Field, 2),
}) {}

export class MerkleWitnessForMerkleTreeHeight32 extends MerkleWitness(32) {}
const defaultRootForMerkleTreeHeight32 = new MerkleTree(32).getRoot();

export class Bridge extends SmartContract {
  @state(PublicKey) relayer = State<PublicKey>();
  @state(Field) nextOutboundTransferId = State<Field>();
  @state(Field) nextConfirmOutboundTransferId = State<Field>();
  @state(Field) nextInboundTransferId = State<Field>();
  @state(Field) transferRoot = State<Field>();
  @state(UInt64) serviceFee = State<UInt64>();
  @state(UInt64) platformFee = State<UInt64>();

  events = {
    'transfer-initiated-event': TransferInitiatedEvent,
    'transfer-initiated-to-event': Provable.Array(Field, 22),
    'transfer-released-event': TokensReleasedEvent,
  };

  onlyRelayer() {
    this.relayer.getAndAssertEquals().assertEquals(this.sender);
  }

  init() {
    super.init();
    this.relayer.set(this.sender);
    this.nextOutboundTransferId.set(Field(0));
    this.nextConfirmOutboundTransferId.set(Field(0));
    this.nextInboundTransferId.set(Field(0));
    this.transferRoot.set(defaultRootForMerkleTreeHeight32);
    this.serviceFee.set(new UInt64(0));
    this.platformFee.set(new UInt64(0));
  }

  @method setRelayer(relayer: PublicKey) {
    this.onlyRelayer();
    this.relayer.set(relayer);
  }

  @method setServiceFee(serviceFee: UInt64) {
    this.onlyRelayer();
    this.serviceFee.set(serviceFee);
  }

  @method setPlatformFee(platformFee: UInt64) {
    this.onlyRelayer();
    this.platformFee.set(platformFee);
  }

  @method deposit(amount: UInt64) {
    this.onlyRelayer();
    const senderUpdate = AccountUpdate.createSigned(this.sender);
    senderUpdate.send({ to: this, amount });
  }

  @method withdrawFees(amount: UInt64) {
    this.onlyRelayer();
    this.send({ to: this.sender, amount });
  }

  @method initTransfer(
    amount: UInt64,
    to: EVMAddressInput,
    toStringType: CircuitString,
    targetChain: UInt8,
    transferWitness: MerkleWitnessForMerkleTreeHeight32
  ) {
    const serviceFee = this.serviceFee.get();
    this.serviceFee.getAndRequireEquals().assertEquals(serviceFee);

    const platformFee = this.platformFee.get();
    this.platformFee.getAndRequireEquals().assertEquals(platformFee);

    const senderUpdate = AccountUpdate.createSigned(this.sender);

    senderUpdate.send({
      to: this,
      amount: amount.add(serviceFee).add(platformFee),
    });

    const nextOutboundTransferId =
      this.nextOutboundTransferId.getAndRequireEquals();
    transferWitness.calculateIndex().assertEquals(nextOutboundTransferId);

    const transfer = new TransferInfo({
      amount,
      serviceFee,
      from: this.sender,
      to: toStringType,
      targetChain: targetChain,
    });

    const newTransferRoot = transferWitness.calculateRoot(
      Poseidon.hash(TransferInfo.toFields(transfer))
    );

    const transferId = nextOutboundTransferId;
    this.nextOutboundTransferId.set(nextOutboundTransferId.add(1));
    this.transferRoot.set(newTransferRoot);

    this.emitEvent('transfer-initiated-event', {
      from: this.sender,
      to: to.array,
      transferId,
      targetChain,
      amount,
    });
  }

  @method confirmTransfer(
    transfer: TransferInfo,
    transferPath: MerkleWitnessForMerkleTreeHeight32
  ) {
    this.onlyRelayer();
    const transferRoot = this.transferRoot.get();
    this.transferRoot.getAndRequireEquals().assertEquals(transferRoot);
    transferPath
      .calculateRoot(Poseidon.hash(TransferInfo.toFields(transfer)))
      .assertEquals(transferRoot);

    this.send({ to: this.sender, amount: transfer.serviceFee });
  }

  @method releaseToken(transferId: Field, to: PublicKey, amount: UInt64) {
    this.onlyRelayer();
    const nextInboundTransferId = this.nextInboundTransferId.get();
    this.nextInboundTransferId.getAndRequireEquals().assertEquals(transferId);
    nextInboundTransferId.assertEquals(transferId);

    this.nextInboundTransferId.set(nextInboundTransferId.add(1));
    this.send({ to, amount });
    this.emitEvent('transfer-released-event', {
      transferId: transferId,
    });
  }
}