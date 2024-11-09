import { ExecutionMode, tx } from '@doko-js/core';
import { HandlerContract } from '../artifacts/js/handler';

const TIMEOUT = 200_000;
const amount = BigInt(2);

// Available modes are evaluate | execute (Check README.md for further description)
const mode: ExecutionMode = ExecutionMode.LeoRun;
// Contract class initialization
const contract = new HandlerContract({ mode });

beforeAll(async () => {
    try {
        const isContractDeployed = await contract.isDeployed();
        if (mode !== ExecutionMode.LeoRun && isContractDeployed) {
            const tx = await contract.deploy();
            tx.wait();
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})

describe("Handler contract", () => {
    test("Initialize", async () => {
        const MAX_SUPPLY = BigInt(10000);
        const MINT_LIMIT = BigInt(100);
        const tx = await contract.init(MAX_SUPPLY, MINT_LIMIT);
        await tx.wait()
    }, TIMEOUT);

    test("Buy Token", async () => {
        const amount = BigInt(10);
        const txn = await contract.buy_token(amount);
        const [] = await txn.wait();
    }, TIMEOUT);

    test.failing("Buy Token:: Reject", async () => {
        const amount = BigInt(1000);
        const txn = await contract.buy_token(amount);
        const [] = await txn.wait();
    }, TIMEOUT)
})