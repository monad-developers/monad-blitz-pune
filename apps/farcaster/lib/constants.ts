export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day

const APP_URL = process.env.NEXT_PUBLIC_URL;

if (!APP_URL) {
  throw new Error('NEXT_PUBLIC_URL or NEXT_PUBLIC_VERCEL_URL is not set');
}

// Environment variables for contracts
export const NEXT_PUBLIC_MONAD_RPC_URL = process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
export const NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS;
export const NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export { APP_URL };
