# CrackPay Smart Contracts - Local Deployment Guide

## Prerequisites

Make sure you have:
- Foundry installed (`forge`, `anvil`)
- Node.js/npm (optional, for helper scripts)
- `.env` file configured with `DEPLOYER_PRIVATE_KEY`

## Quick Start - Deploy on Anvil (Local)

### Step 1: Start Anvil (Local Blockchain)
```bash
anvil
```

This will start a local blockchain on `http://localhost:8545` with 10 test accounts.

**Default Test Account (Account #0):**
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9e7b4aff9e45b56d1c9`

### Step 2: Deploy Contracts
In a new terminal, navigate to the foundry directory:

```bash
cd foundry
```

Deploy using the script:
```bash
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

Or with explicit private key:
```bash
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9e7b4aff9e45b56d1c9 --broadcast
```

### Step 3: Verify Deployment
You should see output like:
```
CrackPayCore deployed at: 0x...
ContactBook deployed at: 0x...
GroupManager deployed at: 0x...
PaymentProcessor deployed at: 0x...
RequestManager deployed at: 0x...
```

## Running Tests

Before deployment, run all tests to ensure everything works:

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-contract CrackPayCoreTest

# Run with verbose output
forge test -vvv
```

## Contract Addresses (After Deployment)

After successful deployment, save these addresses somewhere:

```
CrackPayCore: 0x...
ContactBook: 0x...
GroupManager: 0x...
PaymentProcessor: 0x...
RequestManager: 0x...
```

## Interact with Contracts

### Using Cast (Foundry CLI)

**1. Register a user:**
```bash
cast send 0x<CRACKPAY_CORE_ADDRESS> "registerUser(string)" "username" \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9e7b4aff9e45b56d1c9
```

**2. Add a contact:**
```bash
cast send 0x<CONTACTBOOK_ADDRESS> "addContact(address,string,string)" \
  0x70997970C51812e339D9B73b0245f1A15B89ED13 \
  "Alice" \
  "ipfs://Qm..." \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9e7b4aff9e45b56d1c9
```

**3. Create a group:**
```bash
cast send 0x<GROUPMANAGER_ADDRESS> "createGroup(string,address[])" \
  "Friends" \
  "[0x70997970C51812e339D9B73b0245f1A15B89ED13,0x3C44CdDdB6a900c7d4B3512c5e3F3feB822e8532]" \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9e7b4aff9e45b56d1c9
```

## Environment Variables

The `.env` file contains:

```env
# Local Development (Anvil)
ANVIL_RPC_URL=http://localhost:8545
ANVIL_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9e7b4aff9e45b56d1c9

# Network Configuration
CHAIN_ID=31337

# Contract Deployment
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9e7b4aff9e45b56d1c9
```

## Anvil Test Accounts

When you run `anvil`, you get 10 pre-funded test accounts:

| Account | Address | Private Key |
|---------|---------|-------------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d9e7b4aff9e45b56d1c9` |
| 1 | `0x70997970C51812e339D9B73b0245f1A15B89ED13` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 2 | `0x3C44CdDdB6a900c7d4B3512c5e3F3feB822e8532` | `0x5de4111afa1a4b94908f83103db1abb6755eeea34491b2a5d7e33e5d8d32dc94` |
| ... | ... | ... |

Each account has 10,000 ETH for testing.

## Troubleshooting

### "Connection refused" error
- Ensure Anvil is running on `http://localhost:8545`
- Check firewall settings

### "Insufficient funds" error
- Use one of the pre-funded test accounts from Anvil
- Each account has 10,000 ETH

### Contract deployment fails
- Run `forge build` first to check for compilation errors
- Ensure all dependencies are installed: `forge install`

## Build & Compile

```bash
# Build all contracts
forge build

# Build with optimizations
forge build --optimize

# Check for issues
forge build --via-ir
```

## Gas Optimization

The contracts use `via_ir = true` for better gas optimization. This is configured in `foundry.toml`.

## Next Steps

1. ✅ Deploy contracts on Anvil
2. ✅ Run tests to verify functionality
3. ✅ Interact with contracts using Cast
4. Use a frontend (React/Vue) to build a UI
5. Deploy to testnet (when ready)
