# 🚀 Monad Testnet Deployment Instructions

## Quick Start

### Step 1: Create `.env` file

Create a file named `.env` in the `apps/monad/` directory:

```bash
cd apps/monad
touch .env
```

Add the following content to `.env`:

```env
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
DEPLOYER_PRIVATE_KEY=your_private_key_here_without_0x

# Optional: Initial funding (in MONAD tokens)
REWARD_POOL_FUNDING=100.0
PLATFORM_POOL_FUNDING=10.0
```

**⚠️ Important**: 
- Replace `your_private_key_here_without_0x` with your actual private key
- Remove the `0x` prefix if your key has it
- Never commit this file to git
- Use a testnet account with MONAD tokens for gas

### Step 2: Deploy Contracts

You have two options:

#### Option A: Use the deployment script (Recommended)

```bash
cd apps/monad
./deploy.sh
```

#### Option B: Deploy individually

```bash
# Deploy GameRewards
bun run deploy:rewards

# Deploy StakeGame  
bun run deploy:stake-game
```

## Expected Output

After deployment, you'll see output like:

```
✅ GameRewards deployed to: 0x...
🔐 Environment Variables (add to .env):
NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS="0x..."
REWARDS_ADMIN_ADDRESS="0x..."

✅ StakeGame deployed to: 0x...
🔐 Environment Variables (add to .env):
NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS="0x..."
```

## Contract Addresses

After deployment, save the contract addresses. You'll need to add them to `apps/web/.env`:

```env
# Monad Contracts
NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS=0x...
REWARDS_ADMIN_ADDRESS=0x...
REWARDS_OWNER_ADDRESS=0x...
STAKE_GAME_OWNER_ADDRESS=0x...
```

## Monad Testnet Details

- **Network**: Monad Testnet
- **Chain ID**: 10142
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet.monad.xyz
- **Native Token**: MONAD

## Contract Functions

### GameRewards Contract

- `fundPool()` - Fund the rewards pool (send native tokens)
- `claimReward(recipient, milestoneId, rewardAmount)` - Admin claims reward for user
- `isClaimed(user, milestoneId)` - Check if milestone claimed
- `getTotalPool()` - Get total pool balance
- `getAvailableBalance()` - Get available balance

### StakeGame Contract

- `fundPool()` - Fund the bot staking pool (send native tokens)
- `joinGame(stake, botCount)` - Join game by staking (send native tokens)
- `endGame(humanWon)` - End game (0=bots win, 1=human wins, 2=draw)
- `getTotalPool()` - Get pool balance
- `getGameStatus()` - Get game status (0=waiting, 1=active, 2=finished)
- `withdrawPlatformFees()` - Owner withdraws platform fees

## Troubleshooting

### Error: "Insufficient funds"
- Ensure your deployer account has MONAD testnet tokens
- Check balance: The script will show your balance before deploying

### Error: "Nonce too high"
- Wait a few seconds and retry
- The network might be processing previous transactions

### Error: "Invalid private key"
- Ensure no `0x` prefix
- Verify the key is 64 hex characters

### Error: "Cannot estimate gas"
- Check RPC URL is correct
- Ensure account has tokens for gas

## Next Steps

1. ✅ Deploy contracts (you are here)
2. 📝 Save contract addresses
3. 🔧 Update `apps/web/.env` with contract addresses
5. 🧪 Test the integration

## Security Notes

- **Never share your private key**
- **Use testnet accounts only for testing**
- **Verify contract addresses on explorer before using**
- **Keep `.env` file in `.gitignore`**

