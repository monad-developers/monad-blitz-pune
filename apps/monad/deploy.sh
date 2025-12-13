#!/bin/bash

# Deployment script for Monad Testnet contracts

echo "🚀 Monad Testnet Deployment Script"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with:"
    echo "  MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz"
    echo "  DEPLOYER_PRIVATE_KEY=your_private_key"
    exit 1
fi

# Load .env file
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "❌ DEPLOYER_PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$MONAD_TESTNET_RPC_URL" ]; then
    echo "⚠️  MONAD_TESTNET_RPC_URL not set, using default"
    export MONAD_TESTNET_RPC_URL="https://testnet-rpc.monad.xyz"
fi

echo "✅ Environment configured"
echo "   RPC URL: $MONAD_TESTNET_RPC_URL"
echo "   Deployer: $(echo $DEPLOYER_PRIVATE_KEY | cut -c1-10)..."
echo ""

# Compile contracts
echo "📦 Compiling contracts..."
bun run compile || exit 1
echo ""

# Deploy GameRewards
echo "📤 Deploying GameRewards contract..."
bun run deploy:rewards || exit 1
echo ""

# Deploy StakeGame
echo "📤 Deploying StakeGame contract..."
bun run deploy:stake-game || exit 1
echo ""

echo "✨ All contracts deployed successfully!"
