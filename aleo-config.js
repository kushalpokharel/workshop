import dotenv from 'dotenv';
dotenv.config();

export default {
  accounts: [process.env.ALEO_PRIVATE_KEY],
  mode: 'execute',
  networks: {
    testnet: {
      endpoint: 'https://api.explorer.provable.com/v1',
      accounts: [
        process.env.ALEO_DEVNET_PRIVATE_KEY1,
        process.env.ALEO_DEVNET_PRIVATE_KEY2,
        process.env.ALEO_DEVNET_PRIVATE_KEY3,
      ],
      priorityFee: 0.01
    },
    mainnet: {
      endpoint: 'https://api.explorer.aleo.org/v1',
      accounts: [process.env.ALEO_PRIVATE_KEY_MAINNET],
      priorityFee: 0.001
    }
  },
  defaultNetwork: 'testnet',
};
