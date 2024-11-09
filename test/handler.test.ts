import { ExecutionMode, parseJSONLikeString, TransactionResponse, tx } from '@doko-js/core';
import { Handler_v1Contract } from '../artifacts/js/handler_v1';
import { Token_v1Contract } from '../artifacts/js/token_v1';
import { decrypttoken, gettoken } from '../artifacts/js/leo2js/token_v1';

const TIMEOUT = 200_000;
const amount = BigInt(2);

// Available modes are evaluate | execute (Check README.md for further description)
const mode: ExecutionMode = ExecutionMode.SnarkExecute;
// handler_contract class initialization
const handler_contract = new Handler_v1Contract({ mode });
const token_contract = new Token_v1Contract({mode});

const parseTokenData = (record, account) => {
    // @ts-ignore
    if (mode == ExecutionMode.LeoRun) {
        return gettoken(parseJSONLikeString(record));
    }

    return decrypttoken(record, account);
}

beforeAll(async () => {
    try {
        const isContractDeployed = await handler_contract.isDeployed();
        // @ts-ignore
        if (mode == ExecutionMode.SnarkExecute && !isContractDeployed) {
            const deploy_tx = await token_contract.deploy();
            await deploy_tx.wait()
            const tx = await handler_contract.deploy();
            await tx.wait();
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}, TIMEOUT)

describe("Handler handler_contract", () => {
    test("Initialize", async () => {
        const MAX_SUPPLY = BigInt(10000);
        const MINT_LIMIT = BigInt(100);
        const tx = await handler_contract.init(MAX_SUPPLY, MINT_LIMIT);
        await tx.wait()
    }, TIMEOUT);

    test("[Rejected] Initialize: can't be called by address other than handler", ()=>{
        // Add test here
    });

    test("Mint Token to your address", async () => {

        // query the token amount before you buy okens
        const aleoUser1 = handler_contract.getAccounts()[0];
        const previous_balance = await token_contract.account(aleoUser1, BigInt(0));

        const amount = BigInt(10);
        const txn = await handler_contract.buy_token(amount);
        const result = await txn.wait();

        // query the amout of token after you buy.
        const balance = await token_contract.account(aleoUser1, BigInt(0));
        expect(balance).toBe(previous_balance+BigInt(10));

    }, TIMEOUT);

    test.failing("[Rejected] Buy Token: Can't buy more tokens in one transaction than what it was initialized with", async () => {
        const amount = BigInt(1000);
        const txn:TransactionResponse = await handler_contract.buy_token(amount);
        const result = await txn.wait();
    }, TIMEOUT);

    test("Mint Private", async ()=>{
        const amount_to_mint = BigInt(1000);
        const aleoUser2 = handler_contract.getAccounts()[2];
        const txn = await token_contract.mint_private(aleoUser2, BigInt(1000));
        const [myRecord] = await txn.wait();
        const decryptedRecord = parseTokenData(
            myRecord,
            process.env.ALEO_DEVNET_PRIVATE_KEY3
        );
        expect(decryptedRecord.amount).toBe(amount_to_mint);
    }, TIMEOUT);

    test("Transfer Private", async ()=>{
        // Add test here

    });
})