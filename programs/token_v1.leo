import credits.aleo;
// The `program` scope defines the data types, functions, and state associated with the `token` program.
program token_v1.aleo {
    // On-chain storage of an `account` map, with `address` as the key,
    // and `u64` as the value.
    mapping account: address => u64;
    mapping supply: bool => u64;
    mapping limit : bool => u64;
    const MAX_SUPPLY:bool = true;
    const MINT_LIMIT:bool = false; 
    const CURRENT_SUPPLY:bool = false;
    const handler:address = handler_v1.aleo;

    record token {
        // The token owner.
        owner: address,
        // The token amount.
        amount: u64,
    }

    /* Mint */

    async transition initialize(public max_supply:u64, public mint_limit:u64 )-> Future{
        return finalize_initialize(max_supply, mint_limit, self.caller);
    }
    async function finalize_initialize(public max_supply:u64, public mint_limit:u64, caller: address){
        assert(caller == handler);
        limit.set(MAX_SUPPLY, max_supply);
        limit.set(MINT_LIMIT, mint_limit);
    }

    // The function `mint_public` issues the specified token amount for the token receiver publicly on the network.
    async transition mint_public(public receiver: address, public amount: u64) -> Future{
        let f:Future = credits.aleo/transfer_public_as_signer(handler, amount);
        // Mint the tokens publicly by invoking the computation on-chain.
        return (finalize_mint_public(receiver, amount, f));
    }

    async function finalize_mint_public(public receiver: address, public amount: u64, f: Future) {
        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `mint_public` is reverted.
        f.await();
        let max_supply:u64 = limit.get_or_use(MAX_SUPPLY, 0u64);
        let mint_limit:u64 = limit.get_or_use(MINT_LIMIT, 0u64);
        assert(amount <= mint_limit);
        let current_supply :u64 = supply.get_or_use(CURRENT_SUPPLY, 0u64);
        assert(amount+current_supply <= max_supply);
        supply.set(CURRENT_SUPPLY, amount+current_supply);
        let receiver_amount: u64 = account.get_or_use(receiver, 0u64);
        account.set(receiver, receiver_amount + amount);
    }

    // The function `mint_private` initializes a new record with the specified amount of tokens for the receiver.
    transition mint_private(receiver: address, amount: u64) -> token {
        let Token: token = token {
            owner: receiver,
            amount: amount,
        };

        return Token;
    }

    /* Transfer */
    async transition transfer_public(public receiver: address, public amount: u64) -> Future {
        // Transfer the tokens publicly, by invoking the computation on-chain.
        return(finalize_transfer_public(self.caller, receiver, amount));
    }

    async function finalize_transfer_public(public sender: address, public receiver: address, public amount: u64) {
        // Decrements `account[sender]` by `amount`.
        // If `account[sender]` does not exist, it will be created.
        // If `account[sender] - amount` underflows, `transfer_public` is reverted.
        let sender_amount: u64 = account.get_or_use( sender, 0u64);
        account.set(sender, sender_amount - amount);
        
        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_public` is reverted.
        let receiver_amount: u64 = account.get_or_use(receiver, 0u64);
        account.set(receiver, receiver_amount + amount);
    }

    // The function `transfer_private` sends the specified token amount to the token receiver from the specified token record.
    transition transfer_private(sender: token, receiver: address, amount: u64) -> (token, token) {
        // Checks the given token record has sufficient balance.
        // This `sub` operation is safe, and the proof will fail if an overflow occurs.
        // `difference` holds the change amount to be returned to sender.
        let difference: u64 = sender.amount - amount;

        // Produce a token record with the change amount for the sender.
        let remaining: token = token {
            owner: sender.owner,
            amount: difference,
        };

        // Produce a token record for the specified receiver.
        let transferred: token = token {
            owner: receiver,
            amount: amount,
        };

        // Output the sender's change record and the receiver's record.
        return (remaining, transferred);
    }

    // The function `transfer_private_to_public` turns a specified token amount from a token record into public tokens for the specified receiver.
    // This function preserves privacy for the sender's record, however it publicly reveals the token receiver and the token amount.
    async transition transfer_private_to_public(sender: token, public receiver: address, public amount: u64) -> (token, Future) {
        // Checks the given token record has a sufficient token amount.
        // This `sub` operation is safe, and the proof will fail if an underflow occurs.
        // `difference` holds the change amount for the caller.
        let difference: u64 = sender.amount - amount;

        // Produces a token record with the change amount for the caller.
        let remaining: token = token {
            owner: sender.owner,
            amount: difference,
        };

        // Output the sender's change record.
        // Increment the token amount publicly for the token receiver.
        return (remaining, finalize_transfer_private_to_public(receiver, amount));
    }

    async function finalize_transfer_private_to_public(public receiver: address, public amount: u64) {
        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_private_to_public` is reverted.
        let receiver_amount: u64 = account.get_or_use(receiver, 0u64);
        account.set(receiver, receiver_amount + amount);
    }

    // The function `transfer_public_to_private` turns a specified token amount from `account` into a token record for the specified receiver.
    // This function preserves privacy for the receiver's record, however it publicly reveals the caller and the specified token amount.
    async transition transfer_public_to_private(public receiver: address, public amount: u64) -> (token, Future) {
        // Produces a token record for the token receiver.
        let transferred: token = token {
            owner: receiver,
            amount: amount,
        };

        // Output the receiver's record.
        // Decrement the token amount of the caller publicly.
        return (transferred, finalize_transfer_public_to_private(self.caller, amount));
    }

    async function finalize_transfer_public_to_private(public sender: address, public amount: u64) {
        // Decrements `account[sender]` by `amount`.
        // If `account[sender]` does not exist, it will be created.
        // If `account[sender] - amount` underflows, `transfer_public_to_private` is reverted.
        let sender_amount: u64 = account.get_or_use(sender, 0u64);
        account.set(sender, sender_amount - amount);
    }
}