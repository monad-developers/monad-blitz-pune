# Monad Arcade - Staking Implementation Guide 🎮💰

## Overview

The Farcaster app now includes full staking support for games, matching the implementation in the main web app. Players can stake MONAD tokens to play games and win rewards.

## ✅ What's Been Implemented

### 1. **Contract Integration**
- ✅ `StakeGame.ts` contract client at `/lib/contracts/StakeGame.ts`
- ✅ Full ABI for all contract functions
- ✅ Type-safe contract interactions using ethers.js v6

### 2. **Staking Hook**
- ✅ `use-stake-game.ts` hook at `/lib/hooks/use-stake-game.ts`
- ✅ Manages game state, staking, and reward claiming
- ✅ Network switching to Monad Testnet (Chain ID: 10143)
- ✅ Balance checking and error handling
- ✅ Rate limiting and retry logic

### 3. **Rock Paper Scissors with Staking**
- ✅ Full staking integration
- ✅ Stake dialog before playing
- ✅ Result dialog with reward claiming
- ✅ Contract state management
- ✅ Win/loss/tie reward distribution

### 4. **Dependencies**
- ✅ Added `ethers` v6.13.0 to package.json
- ✅ Uses wagmi for wallet connection
- ✅ Farcaster wagmi connector for seamless integration

## 🎯 How Staking Works

### Game Flow

```
1. Player connects wallet (Farcaster wallet or external)
   ↓
2. Player stakes MONAD (e.g., 1 MONAD for RPS)
   ↓
3. Contract matches with AI bot stake (1 MONAD)
   ↓
4. Player plays the game
   ↓
5. Result submitted to contract
   ↓
6. Rewards distributed:
   - Win: 1.8 MONAD (90% of 2 MONAD pot)
   - Tie: 0.9 MONAD (90% refund, 10% platform fee)
   - Loss: 0 MONAD
```

### Stake Amounts by Game

| Game | Stake Amount | Win Reward | Tie Refund |
|------|--------------|------------|------------|
| Rock Paper Scissors | 1 MONAD | 1.8 MONAD | 0.9 MONAD |
| Showdown | 1 MONAD | 1.8 MONAD | 0.9 MONAD |
| Head Soccer | 3 MONAD | 5.4 MONAD | 2.7 MONAD |

## 📁 File Structure

```
apps/farcaster/
├── lib/
│   ├── constants.ts              # Environment variables
│   ├── contracts/
│   │   └── StakeGame.ts         # Contract client ✅
│   └── hooks/
│       └── use-stake-game.ts    # Staking hook ✅
├── components/
│   └── games/
│       └── rock-paper-scissor.tsx  # RPS with staking ✅
└── package.json                  # Added ethers ✅
```

## 🔧 Environment Variables

Add these to your `.env` file:

```bash
# Monad Network
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# Contract Address (deployed on Monad Testnet)
NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS=0x...

# WalletConnect (optional, for better wallet support)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 💻 Usage Example

### In Your Game Component

```typescript
'use client'

import { useStakeGame } from '@/lib/hooks/use-stake-game'
import { useAccount } from 'wagmi'

export default function YourGame() {
  const { address } = useAccount()
  
  // Initialize staking for your game
  const {
    stakeAmount,           // Stake amount in MONAD
    reward,                // Win reward amount
    drawRefund,            // Tie refund amount
    walletConnected,       // Is wallet connected?
    isStaked,              // Has player staked?
    gameActive,            // Is game active?
    isLoading,             // Is transaction in progress?
    contractState,         // Full contract state
    stakeForGame,          // Function to stake
    endGameWithResult,     // Function to claim rewards
    updateContractState,   // Function to refresh state
    resetLocalGameState,   // Function to reset local state
  } = useStakeGame('your-game-type') // 'rock-paper-scissor' | 'showdown' | 'head-soccer'

  // Stake before playing
  const handleStake = async () => {
    const success = await stakeForGame()
    if (success) {
      // Game is ready to play!
    }
  }

  // After game ends, submit result
  const handleGameEnd = async (playerWon: boolean, isTie: boolean = false) => {
    const success = await endGameWithResult(playerWon, isTie)
    if (success) {
      // Rewards claimed!
    }
  }

  return (
    <div>
      {/* Your game UI */}
      {!isStaked && (
        <button onClick={handleStake} disabled={isLoading || !walletConnected}>
          Stake {stakeAmount} MONAD
        </button>
      )}
      
      {/* Game interface when staked */}
      {isStaked && (
        <div>
          {/* Your game logic here */}
        </div>
      )}
    </div>
  )
}
```

## 🎮 Implementing Staking in Other Games

### Steps to Add Staking to a Game

1. **Import the hook**:
```typescript
import { useStakeGame } from '@/lib/hooks/use-stake-game'
```

2. **Initialize with game type**:
```typescript
const {
  stakeAmount,
  reward,
  isStaked,
  stakeForGame,
  endGameWithResult,
  // ... other properties
} = useStakeGame('your-game-type')
```

3. **Add staking UI**:
   - Show stake dialog before game
   - Display stake amount and potential rewards
   - Handle stake transaction

4. **Integrate with game logic**:
   - Check `isStaked` before allowing gameplay
   - Call `endGameWithResult(won, tie)` after game ends
   - Handle loading states during transactions

5. **Add result UI**:
   - Show win/loss/tie dialog
   - Display reward amounts
   - Allow claiming rewards

### Example: Adding to Showdown

```typescript
// In components/games/showdown.tsx
'use client'

import { useStakeGame } from '@/lib/hooks/use-stake-game'
// ... other imports

export default function ShowdownGame() {
  const {
    isStaked,
    stakeForGame,
    endGameWithResult,
    stakeAmount,
    reward,
  } = useStakeGame('showdown')

  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null)

  const handleStake = async () => {
    await stakeForGame()
    // Game is ready!
  }

  const handleGameEnd = async (won: boolean) => {
    setGameResult(won ? 'win' : 'lose')
    await endGameWithResult(won, false) // false = not a tie
  }

  // ... rest of game logic
}
```

## 🔒 Security & Best Practices

### Network Verification
The hook automatically:
- Verifies Monad Testnet connection (Chain ID: 10143)
- Switches networks if needed
- Checks contract deployment
- Validates signer addresses

### Balance Checks
Before staking:
- Checks user has sufficient MONAD
- Checks pool has sufficient funds for bot
- Estimates gas before transaction

### Error Handling
Comprehensive error handling for:
- Insufficient balance
- Network errors
- Contract errors
- Transaction failures
- Rate limiting

### State Management
- Debounced contract state updates (2s min interval)
- Retry logic with exponential backoff
- Local state reset for UI responsiveness
- Automatic state refresh after transactions

## 🧪 Testing

### Local Testing

1. **Connect to Monad Testnet**:
   ```bash
   # Use Farcaster's built-in wallet or connect external wallet
   # Network: Monad Testnet
   # Chain ID: 10143
   # RPC: https://testnet-rpc.monad.xyz
   ```

2. **Get Test MONAD**:
   - Use Monad Testnet faucet
   - Or contact admin to fund your address

3. **Test the Flow**:
   - Connect wallet
   - Stake MONAD
   - Play game
   - Claim rewards

### Testing Checklist

- [ ] Wallet connection works
- [ ] Network switching prompts correctly
- [ ] Stake transaction succeeds
- [ ] Game state updates after staking
- [ ] Game plays correctly
- [ ] Result submission works
- [ ] Rewards distributed correctly
- [ ] UI updates after claiming
- [ ] Error states display properly
- [ ] Loading states work

## 📊 Contract State

The `contractState` object includes:

```typescript
{
  isConnected: boolean,     // Is wallet connected to contract?
  isStaked: boolean,        // Has player staked?
  stakeAmount: bigint,      // Current stake amount in wei
  gamePool: bigint,         // Total pool balance
  humanStake: bigint,       // Player's stake amount
  botCount: bigint,         // Number of bots in game
  gameStatus: bigint,       // 0=waiting, 1=active, 2=finished
}
```

## 🚀 Next Steps

### For Remaining Games

1. **Showdown** - Already configured for staking (1 MONAD)
2. **Head Soccer** - Already configured for staking (3 MONAD)
3. **Slither** - Add non-stake or score-based rewards
4. **Paaji** - Add non-stake or score-based rewards
5. **Endless Runner** - Add non-stake or score-based rewards

### Future Enhancements

- [ ] Leaderboards with staking stats
- [ ] Tournament mode with pooled stakes
- [ ] Dynamic stake amounts
- [ ] Multi-player staking
- [ ] NFT rewards for high stakes
- [ ] Social features (share wins on Farcaster)

## 🔗 Resources

- **Original Implementation**: `/apps/web/hooks/use-stake-game.ts`
- **Contract**: `/apps/web/contracts/StakeGame.ts`
- **Monad Docs**: https://docs.monad.xyz
- **Farcaster Mini Apps**: https://miniapps.farcaster.xyz

## 💡 Tips

1. **Always test with small amounts first**
2. **Check contract pool balance before staking**
3. **Handle all error states in UI**
4. **Show clear feedback during transactions**
5. **Test on actual mobile devices**
6. **Use Farcaster's haptic feedback for better UX**
7. **Consider rate limiting for contract calls**
8. **Cache contract state to reduce RPC calls**

---

**Ready to add staking to your game?** Follow the example in `rock-paper-scissor.tsx` and use the `use-stake-game` hook! 🎮💰
