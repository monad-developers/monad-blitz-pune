# Fund StakeGame Contract Pool

This guide explains how to fund the StakeGame contract pool for bot staking.

## Prerequisites

1. **Contract Owner Wallet**: You need the private key of the contract owner
   - Contract Owner: `0xC6754E549C0D341612A53f16879c14e1CDA0269f`
   - Contract Address: `0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C`

2. **Environment Variables**: Create a `.env` file in `apps/monad/` directory:
   ```bash
   cd apps/monad
   touch .env
   ```
   
   Then add these variables to `apps/monad/.env`:
   ```env
   DEPLOYER_PRIVATE_KEY=your_private_key_here_without_0x_prefix
   MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
   STAKE_GAME_CONTRACT_ADDRESS=0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C
   ```
   
   ⚠️ **Important**: 
   - The private key should NOT have the `0x` prefix
   - Never commit the `.env` file to git (it should be in `.gitignore`)
   - Make sure this is the private key for the contract owner address

3. **Sufficient Balance**: Your wallet must have enough MONAD tokens to fund the pool

## How to Fund the Pool

### Option 1: Using npm script (Recommended)

```bash
cd apps/monad

# Fund with default amount (10 MONAD)
FUNDING_AMOUNT=10.0 bun run fund:stake-game

# Fund with custom amount (e.g., 50 MONAD)
FUNDING_AMOUNT=50.0 bun run fund:stake-game
```

### Option 2: Using hardhat directly

```bash
cd apps/monad

# Fund with 10 MONAD
FUNDING_AMOUNT=10.0 hardhat run scripts/fund-stake-game-pool.ts --network monadTestnet

# Fund with custom amount
FUNDING_AMOUNT=25.0 hardhat run scripts/fund-stake-game-pool.ts --network monadTestnet
```

## How Much to Fund?

The pool needs enough funds to cover bot staking for games:

- **Minimum**: At least `stake * botCount` for each game
  - Example: If players stake 1 MONAD with 1 bot, pool needs at least 1 MONAD
  - Example: If players stake 3 MONAD with 1 bot, pool needs at least 3 MONAD

- **Recommended**: Fund with 10-50 MONAD to support multiple games
  - This allows multiple players to stake without running out of pool funds
  - Monitor the pool balance and refill as needed

## What the Script Does

1. ✅ Checks your account balance
2. ✅ Verifies you're the contract owner
3. ✅ Checks current pool balance
4. ✅ Verifies game status is "waiting" (required to fund)
5. ✅ Calls `fundPool()` with the specified amount
6. ✅ Shows transaction details and updated pool balance

## Example Output

```
=== Funding StakeGame Contract Pool ===

Funding with account: 0xC6754E549C0D341612A53f16879c14e1CDA0269f
Account balance: 100.0 MONAD

📋 Contract Details:
   Contract Address: 0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C
   Funding Amount: 10.0 MONAD
   Funding Amount (wei): 10000000000000000000

📦 Connecting to StakeGame contract...
   Current Pool Balance: 0.0 MONAD

💰 Funding platform pool...
   Transaction hash: 0x...
   Waiting for confirmation...
   ✅ Transaction confirmed in block 12345

📊 Updated Pool Balance: 10.0 MONAD
   Added: 10.0 MONAD
   Previous: 0.0 MONAD

✨ Funding complete!

📋 Transaction Details:
   Network: Monad Testnet
   Contract Address: 0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C
   Transaction Hash: 0x...
   Explorer: https://testnet.monad.xyz/tx/0x...

💡 The pool now has enough funds to support bot staking for games.
```

## Troubleshooting

### Error: "Only the contract owner can fund the pool!"
- **Solution**: Make sure you're using the private key of the contract owner
- Check: `STAKE_GAME_OWNER_ADDRESS` in deployment results

### Error: "Cannot fund pool: Game is not in waiting state"
- **Solution**: Wait for the current game to finish, or end it if needed
- Game status must be `0` (waiting) to fund the pool

### Error: "Insufficient balance!"
- **Solution**: Add more MONAD tokens to your wallet
- You need at least the funding amount + gas fees

### Error: "Contract not found"
- **Solution**: Verify the contract address is correct
- Check: `NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS` in deployment results

## Monitoring Pool Balance

You can check the pool balance using:

1. **Block Explorer**: https://testnet.monad.xyz/address/0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C
2. **Contract Function**: Call `getTotalPool()` on the contract
3. **Frontend**: The app shows pool balance when checking game status

## Refilling the Pool

The pool balance decreases as games are played (bot stakes are deducted). Monitor and refill as needed:

```bash
# Check current balance first, then fund if needed
FUNDING_AMOUNT=20.0 bun run fund:stake-game
```

## Security Notes

- ⚠️ **Never commit private keys to git**
- ⚠️ **Use environment variables for sensitive data**
- ⚠️ **Only the contract owner can fund the pool**
- ⚠️ **Verify contract address before funding**

