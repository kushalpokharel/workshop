// The 'sample_program' program.
import token.aleo;
program handler.aleo {

    async transition init(public max_supply:u64, public mint_limit:u64) ->Future {
        let f:Future = token.aleo/initialize(max_supply, mint_limit);
        return finalize_init(f);
    }
    async function finalize_init(f:Future){
        f.await();
    }

    async transition buy_token(public amount: u64) -> Future {
        let f:Future = token.aleo/mint_public(self.caller, amount);
        return finalize_buy_token(f);
    }
    async function finalize_buy_token(f:Future){
        f.await();
    }
}