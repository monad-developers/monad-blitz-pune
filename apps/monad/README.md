# Monad Smart Contracts

This directory contains Solidity smart contracts for the Monad Arcade platform, ported from Monad contracts.

## Contracts

### GameRewards
Manages milestone-based rewards for game achievements. Users can claim native token rewards when they complete game milestones.

**Key Features:**
- Owner and admin role management
- Pool funding and management
- Milestone reward claiming (admin-only)
- Claim tracking to prevent double-claims
- Emergency withdrawal (owner-only)

### StakeGame
Manages stake-based competitive gaming where players stake native tokens to play against AI bots.

**Key Features:**
- Pool funding for bot staking
- Game lifecycle management (join → play → end → reset)
- 10% platform fee on all stakes
- Automatic payout processing (win/loss/draw)
- Platform fee withdrawal (owner-only)

## Setup

1. Install dependencies:
```bash
bun install
```

2. Configure environment variables:
```bash
MONAD_RPC_URL=your_rpc_url
DEPLOYER_PRIVATE_KEY=your_private_key
```

3. Compile contracts:
```bash
bun run compile
```

4. Deploy contracts:
```bash
# Deploy GameRewards
bun run deploy:rewards

# Deploy StakeGame
bun run deploy:stake-game
```

## Contract Addresses

After deployment, add the contract addresses to your `.env` file:

```env
NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS=0x...
REWARDS_ADMIN_ADDRESS=0x...
```

## Differences from Monad Version

1. **Native Token**: Uses native blockchain token (ETH/MONAD) instead of ALGO
2. **Wei vs MicroAlgo**: Uses wei (10^18) instead of microAlgos (10^6)
3. **Transaction Model**: Uses Ethereum-style transactions instead of Monad's atomic groups
4. **Storage**: Uses Solidity mappings instead of Monad Box storage
5. **Events**: Emits Solidity events instead of Monad application logs

## Testing

Run tests with:
```bash
bun run test
```

## Type Checking

Check TypeScript types:
```bash
bun run check-types
```

