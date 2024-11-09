import { ExecutionMode, parseJSONLikeString } from '@doko-js/core';
import { TokenContract } from '../artifacts/js/token';
import { decrypttoken, gettoken } from '../artifacts/js/leo2js/token';
import { PrivateKey } from '@provablehq/sdk';

const TIMEOUT = 200_000;
const amount = BigInt(2);

// Available modes are evaluate | execute (Check README.md for further description)
const mode: ExecutionMode = ExecutionMode.LeoRun;
// Contract class initialization
const contract = new TokenContract({ mode });

// This maps the accounts defined inside networks in aleo-config.js and return array of address of respective private keys
const [admin] = contract.getAccounts();
const recipient = process.env.ALEO_DEVNET_PRIVATE_KEY3;

const parseTokenData = (record, account) => {
  if (mode == ExecutionMode.LeoRun) {
    return gettoken(parseJSONLikeString(record));
  }

  return decrypttoken(record, account);
}

beforeAll(async () => {
  try {
    const isContractDeployed = await contract.isDeployed();
    if (mode !== ExecutionMode.LeoRun && isContractDeployed) {
      const tx = await contract.deploy();
      await tx.wait();
    }
  } catch (e) {
    console.error(e);
  }
})

describe('deploy test', () => {
  test('mint public', async () => {
    const actualAmount = BigInt(10);
    const tx = await contract.mint_public(admin, actualAmount);
    await tx.wait();

    const expected = await contract.account(admin, actualAmount);
    expect(expected).toBe(actualAmount);
  }, TIMEOUT);

  test('mint private', async () => {
    const actualAmount = BigInt(100000);
    const tx = await contract.mint_private(
      'aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px',
      actualAmount
    );
    const [record1] = await tx.wait();

    // @NOTE Only decrypt in SnarkExecute use JSON.parse in LeoRun
    const decryptedRecord = parseTokenData(
      record1,
      process.env.ALEO_PRIVATE_KEY_TESTNET3
    );

    expect(decryptedRecord.amount).toBe(actualAmount);
  }, TIMEOUT);

  test(
    'private transfer to user',
    async () => {
      const account = contract.config.privateKey;
      const amount1 = BigInt(1000000000);
      const amount2 = BigInt(100000000);

      const mintTx = await contract.mint_private(admin, amount1);
      const [result] = await mintTx.wait();
      const decryptedRecord = parseTokenData(result, account);

      const receiptAddress = PrivateKey.from_string(recipient)
        .to_address()
        .to_string();

      const tx = await contract.transfer_private(
        decryptedRecord,
        receiptAddress,
        amount2
      );
      const [record1, record2] = await tx.wait();
      const decryptedRecord2 = parseTokenData(record1, account);

      expect(decryptedRecord2.amount).toBe(amount1 - amount2);
    },
    TIMEOUT
  );
});
