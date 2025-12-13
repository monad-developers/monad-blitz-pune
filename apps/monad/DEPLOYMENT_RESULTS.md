# ✅ Monad Testnet Deployment Results

## Deployment Date
$(date)

## Deployed Contracts

### 1. GameRewards Contract
- **Contract Address**: `0x60Bfd040D252297ba352BBe50C69F84F1DD7618a`
- **Network**: Monad Testnet (Chain ID: 10143)
- **Owner**: `0xC6754E549C0D341612A53f16879c14e1CDA0269f`
- **Admin**: `0xC6754E549C0D341612A53f16879c14e1CDA0269f`
- **Explorer**: https://testnet.monad.xyz/address/0x60Bfd040D252297ba352BBe50C69F84F1DD7618a
- **Status**: ✅ Deployed Successfully

### 2. StakeGame Contract
- **Contract Address**: `0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C`
- **Network**: Monad Testnet (Chain ID: 10143)
- **Owner**: `0xC6754E549C0D341612A53f16879c14e1CDA0269f`
- **Explorer**: https://testnet.monad.xyz/address/0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C
- **Status**: ✅ Deployed Successfully

## Environment Variables

Add these to your `apps/web/.env` file:

```env
# Monad Testnet Configuration
NEXT_PUBLIC_MONAD_RPC_URL=https://monad-testnet.g.alchemy.com/v2/P-PQfrot7qNIOIJ47DYsB

# Contract Addresses
NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS=0x60Bfd040D252297ba352BBe50C69F84F1DD7618a
NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS=0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C

# Admin Configuration
REWARDS_ADMIN_ADDRESS=0xC6754E549C0D341612A53f16879c14e1CDA0269f
REWARDS_OWNER_ADDRESS=0xC6754E549C0D341612A53f16879c14e1CDA0269f
STAKE_GAME_OWNER_ADDRESS=0xC6754E549C0D341612A53f16879c14e1CDA0269f

# Admin Private Key (for server-side operations)
REWARDS_ADMIN_PRIVATE_KEY=your_private_key_here
```

## Next Steps

1. **Update Web App Environment**:
   - Copy the environment variables above to `apps/web/.env`
   - Make sure `REWARDS_ADMIN_PRIVATE_KEY` is set (same as deployer private key)

2. **Fund the Contracts** (Optional):
   - Fund GameRewards pool: Call `fundPool()` with MONAD tokens
   - Fund StakeGame pool: Call `fundPool()` with MONAD tokens for bot staking

3. **Test the Integration**:
   - Test wallet connection
   - Test staking games
   - Test reward claiming

## Contract Functions

### GameRewards
- `fundPool()` - Fund the rewards pool
- `claimReward(recipient, milestoneId, rewardAmount)` - Admin claims reward for user
- `isClaimed(user, milestoneId)` - Check if milestone claimed
- `getTotalPool()` - Get total pool balance
- `getAvailableBalance()` - Get available balance

### StakeGame
- `fundPool()` - Fund the bot staking pool
- `joinGame(stake, botCount)` - Join game by staking
- `endGame(humanWon)` - End game (0=bots win, 1=human wins, 2=draw)
- `getTotalPool()` - Get pool balance
- `getGameStatus()` - Get game status (0=waiting, 1=active, 2=finished)
- `withdrawPlatformFees()` - Owner withdraws platform fees

## Network Information

- **Network Name**: Monad Testnet
- **Chain ID**: 10143
- **RPC URL**: https://monad-testnet.g.alchemy.com/v2/P-PQfrot7qNIOIJ47DYsB
- **Explorer**: https://testnet.monad.xyz
- **Native Token**: MONAD

## Verification

You can verify the contracts on the explorer:
- GameRewards: https://testnet.monad.xyz/address/0x60Bfd040D252297ba352BBe50C69F84F1DD7618a
- StakeGame: https://testnet.monad.xyz/address/0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C

