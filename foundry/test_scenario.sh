#!/bin/bash

# Addresses
CRACKPAY=0x5FbDB2315678afecb367f032d93F642f64180aa3
GROUPMANAGER=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
PAYMENTPROCESSOR=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

# Private Keys (Anvil test accounts)
ALICE_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BOB_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
CAROL_PK=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

# Addresses
ALICE=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
BOB=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
CAROL=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

RPC=http://127.0.0.1:8545

echo "🚀 Testing Crack Pay Complete Flow"
echo "==================================="

# 1. Alice creates group
echo "1 Alice creating group..."
cast send $GROUPMANAGER \
  "createGroup(string,address[])" \
  "Friday Dinner" "[$BOB,$CAROL]" \
  --rpc-url $RPC \
  --private-key $ALICE_PK

# 2. Alice creates expense: 3000 split 3 ways
echo "2 Alice creating expense (3000 total)..."
cast send $GROUPMANAGER \
  "createExpenseEqualSplit(uint256,uint256,string,string)" \
  1 3000 "Restaurant Bill" "Food" \
  --rpc-url $RPC \
  --private-key $ALICE_PK

# 3. Check Bob's share
echo "3 Checking Bob's share..."
cast call $GROUPMANAGER \
  "getExpenseMember(uint256,address)(uint256,uint256,bool,bool)" \
  1 $BOB \
  --rpc-url $RPC

# 4. Bob settles his share (1000)
echo "4 Bob settling his 1000..."
cast send $PAYMENTPROCESSOR \
  "settleExpense(uint256)" \
  1 \
  --value 1000 \
  --rpc-url $RPC \
  --private-key $BOB_PK

# 5. Check payment stats
echo "5 Checking Bob's payment stats..."
cast call $PAYMENTPROCESSOR \
  "getUserStats(address)(uint256,uint256,int256)" \
  $BOB \
  --rpc-url $RPC

echo " Test complete!"