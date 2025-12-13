# Deployment Guide for Monad Testnet

## Prerequisites

1. **Get Testnet MONAD tokens**: You need testnet MONAD tokens for gas fees
2. **Set up environment variables**: Create a `.env` file in `apps/monad/` directory

## Environment Setup

Create a `.env` file with the following:

```env
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
DEPLOYER_PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Optional: Funding amounts (in MONAD tokens)
REWARD_POOL_FUNDING=100.0
PLATFORM_POOL_FUNDING=10.0
```

**Important**: 
- Never commit your `.env` file to git
- The private key should be for a testnet account with MONAD tokens
- Remove the `0x` prefix from your private key if it has one

## Deployment Steps

### 1. Compile Contracts

```bash
cd apps/monad
bun run compile
```

### 2. Deploy GameRewards Contract

```bash
bun run deploy:rewards
```

This will:
- Deploy the GameRewards contract
- Set deployer as both owner and admin
- Optionally fund the pool if `REWARD_POOL_FUNDING` is set

### 3. Deploy StakeGame Contract

```bash
bun run deploy:stake-game
```

This will:
- Deploy the StakeGame contract
- Set deployer as owner
- Optionally fund the pool if `PLATFORM_POOL_FUNDING` is set

## After Deployment

The deployment scripts will output:
- Contract addresses
- Owner/Admin addresses
- Environment variables to add to your `.env` file

Add these to your `apps/web/.env`:

```env
NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS=0x...
REWARDS_ADMIN_ADDRESS=0x...
REWARDS_OWNER_ADDRESS=0x...
```

## Monad Testnet Information

- **Network Name**: Monad Testnet
- **Chain ID**: 10142
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet.monad.xyz

## Troubleshooting

### "Insufficient funds" error
- Make sure your deployer account has MONAD testnet tokens
- Get testnet tokens from the Monad faucet (if available)

### "Nonce too high" error
- Wait a few seconds and try again
- Check your account balance

### "Invalid private key" error
- Ensure your private key doesn't have `0x` prefix
- Verify the key is correct

