import {
    Mina,
    PrivateKey,
    PublicKey,
    AccountUpdate,
    UInt32,
    UInt64,
    MerkleTree,
    Poseidon,
    CircuitString,
    UInt8,
    Encoding,
  } from 'o1js';
  import {
    TransferInfo,
    Bridge,
    MerkleWitnessForMerkleTreeHeight32,
    EVMAddressInput,
  } from './Bridge';
  
  const proofsEnabled = false;
  
  describe('Bridge', () => {
    let relayerAccount: PublicKey,
      relayerKey: PrivateKey,
      senderAccount: PublicKey,
      senderKey: PrivateKey,
      zkAppAddress: PublicKey,
      zkAppPrivateKey: PrivateKey,
      zkApp: Bridge,
      evmAddress: EVMAddressInput,
      MINA = 1e9,
      SERVICE_FEE = 2 * MINA,
      PLATFORM_FEE = 3 * MINA;
  
    beforeAll(async () => {
      if (proofsEnabled) await Bridge.compile();
      evmAddress = new EVMAddressInput({
        array: Encoding.stringToFields(
          '0x91Af5BF6F12A1c75BA9B89A3B995e14DdB9afe15'
        ),
      });
    });
  
    beforeEach(async () => {
      const Local = Mina.LocalBlockchain({ proofsEnabled });
      Local.setBlockchainLength(new UInt32(32));
      Mina.setActiveInstance(Local);
      ({ privateKey: relayerKey, publicKey: relayerAccount } =
        Local.testAccounts[0]);
      ({ privateKey: senderKey, publicKey: senderAccount } =
        Local.testAccounts[1]);
      zkAppPrivateKey = PrivateKey.random();
      zkAppAddress = zkAppPrivateKey.toPublicKey();
      zkApp = new Bridge(zkAppAddress);
    });
  
    async function localDeploy() {
      const txn = await Mina.transaction(relayerAccount, () => {
        AccountUpdate.fundNewAccount(relayerAccount);
        zkApp.deploy();
      });
      await txn.prove();
      // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
      await txn.sign([relayerKey, zkAppPrivateKey]).send();
  
      const txSetServiceFee = await Mina.transaction(relayerAccount, () => {
        zkApp.setServiceFee(new UInt64(SERVICE_FEE));
      });
  
      await txSetServiceFee.prove();
      await txSetServiceFee.sign([relayerKey]).send();
  
      const txSetPlatformFee = await Mina.transaction(relayerAccount, () => {
        zkApp.setPlatformFee(new UInt64(PLATFORM_FEE));
      });
  
      await txSetPlatformFee.prove();
      await txSetPlatformFee.sign([relayerKey]).send();
    }
  
    it('Set service fee', async () => {
      await localDeploy();
      const tx = await Mina.transaction(relayerAccount, () => {
        zkApp.setServiceFee(new UInt64(1));
      });
  
      await tx.prove();
      await tx.sign([relayerKey]).send();
  
      expect(zkApp.serviceFee.get()).toEqual(new UInt64(1));
    });
  
    it('Set relayer', async () => {
      await localDeploy();
      const tx = await Mina.transaction(relayerAccount, () => {
        zkApp.setRelayer(senderAccount);
      });
      await tx.prove();
      await tx.sign([relayerKey]).send();
  
      expect(zkApp.relayer.get()).toEqual(senderAccount);
    });
  
    it('Set platform fee', async () => {
      await localDeploy();
      const tx = await Mina.transaction(relayerAccount, () => {
        zkApp.setPlatformFee(new UInt64(1));
      });
      await tx.prove();
      await tx.sign([relayerKey]).send();
  
      expect(zkApp.platformFee.get()).toEqual(new UInt64(1));
    });
  
    it('Init transfer ', async () => {
      console.log('evmAddress:', Encoding.stringFromFields(evmAddress.array));
      console.log('evmAddress:', evmAddress.array.length);
      evmAddress.array.forEach((x) => console.log(x));
      const toStringType = CircuitString.fromString(
        '0x91Af5BF6F12A1c75BA9B89A3B995e14DdB9afe15'
      );
      await localDeploy();
      const nextOutboundTransferId = zkApp.nextOutboundTransferId.get();
      const transferIndoTree = new MerkleTree(32);
      const witness = new MerkleWitnessForMerkleTreeHeight32(
        transferIndoTree.getWitness(nextOutboundTransferId.toBigInt())
      );
      const txInitTransfer = await Mina.transaction(senderAccount, () => {
        zkApp.initTransfer(
          new UInt64(1e9),
          evmAddress,
          toStringType,
          UInt8.from(97),
          witness
        );
      });
      await txInitTransfer.prove();
      await txInitTransfer.sign([senderKey]).send();
  
      console.log(txInitTransfer.toPretty());
  
      transferIndoTree.setLeaf(
        nextOutboundTransferId.toBigInt(),
        Poseidon.hash(
          TransferInfo.toFields(
            new TransferInfo({
              amount: new UInt64(1e9),
              serviceFee: new UInt64(SERVICE_FEE),
              from: senderAccount,
              to: toStringType,
              targetChain: UInt8.from(97),
            })
          )
        )
      );
      console.log('Init transfer success!');
  
      const confirmTransfer = new TransferInfo({
        amount: new UInt64(1e9),
        serviceFee: new UInt64(SERVICE_FEE),
        from: senderAccount,
        to: toStringType,
        targetChain: UInt8.from(97),
      });
      const confirmWitness = new MerkleWitnessForMerkleTreeHeight32(
        transferIndoTree.getWitness(nextOutboundTransferId.toBigInt())
      );
      const txConfirmTransfer = await Mina.transaction(relayerAccount, () => {
        zkApp.confirmTransfer(confirmTransfer, confirmWitness);
      });
      await txConfirmTransfer.prove();
      await txConfirmTransfer.sign([relayerKey]).send();
  
      console.log(txConfirmTransfer.toPretty());
      console.log('Confirm transfer success!');
    });
  
    it('Release Token', async () => {
      await localDeploy();
      const txDeposit = await Mina.transaction(relayerAccount, () => {
        zkApp.deposit(new UInt64(1e9));
      });
      await txDeposit.prove();
      await txDeposit.sign([relayerKey]).send();
  
      console.log(txDeposit.toPretty());
      console.log('Deposit success!');
  
      const nextInboundTransferId = zkApp.nextInboundTransferId.get();
      const tx = await Mina.transaction(relayerAccount, () => {
        zkApp.releaseToken(nextInboundTransferId, senderAccount, new UInt64(1e9));
      });
      await tx.prove();
      await tx.sign([relayerKey]).send();
      console.log(tx.toPretty());
    });
  });