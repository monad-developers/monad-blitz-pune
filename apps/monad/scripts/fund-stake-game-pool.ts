import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Fund the StakeGame contract pool for bot staking
 * 
 * Usage:
 *   FUNDING_AMOUNT=10.0 hardhat run scripts/fund-stake-game-pool.ts --network monadTestnet
 * 
 * Or set in .env:
 *   DEPLOYER_PRIVATE_KEY=your_private_key_here
 *   MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
 *   STAKE_GAME_CONTRACT_ADDRESS=0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C
 *   FUNDING_AMOUNT=10.0
 */

async function main() {
  console.log("=== Funding StakeGame Contract Pool ===\n");

  // Check if private key is configured
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error(
      "❌ DEPLOYER_PRIVATE_KEY environment variable is not set!\n\n" +
      "Please set it in your .env file or export it:\n" +
      "  export DEPLOYER_PRIVATE_KEY=your_private_key_here\n\n" +
      "Or create a .env file in apps/monad/ with:\n" +
      "  DEPLOYER_PRIVATE_KEY=your_private_key_here\n" +
      "  MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz"
    );
  }

  // Get deployer account (must be the contract owner)
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      "❌ No signers available!\n\n" +
      "Make sure DEPLOYER_PRIVATE_KEY is set correctly in your .env file.\n" +
      "The private key should be the contract owner's private key."
    );
  }

  const [deployer] = signers;
  console.log("Funding with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MONAD\n");

  // Get contract address from env or use deployed address
  const contractAddress = 
    process.env.STAKE_GAME_CONTRACT_ADDRESS || 
    "0x4b9800ee31dF2639ee0FB948cd7f2508086Af06C";

  // Get funding amount from env (default: 10 MONAD)
  const fundingAmount = process.env.FUNDING_AMOUNT || "5.0";
  const fundingWei = ethers.parseEther(fundingAmount);

  console.log(`📋 Contract Details:`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Funding Amount: ${fundingAmount} MONAD`);
  console.log(`   Funding Amount (wei): ${fundingWei.toString()}\n`);

  // Check if deployer has enough balance
  if (balance < fundingWei) {
    throw new Error(
      `Insufficient balance! Need ${fundingAmount} MONAD, but have ${ethers.formatEther(balance)} MONAD`
    );
  }

  // Get contract instance
  console.log("📦 Connecting to StakeGame contract...");
  const StakeGame = await ethers.getContractFactory("StakeGame");
  const stakeGame = StakeGame.attach(contractAddress) as any; // Type assertion for contract methods

  // Verify contract owner
  const owner = await stakeGame.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(
      `Only the contract owner can fund the pool!\n` +
      `   Contract Owner: ${owner}\n` +
      `   Your Address: ${deployer.address}`
    );
  }

  // Check current pool balance
  const currentPool = await stakeGame.getTotalPool();
  console.log(`   Current Pool Balance: ${ethers.formatEther(currentPool)} MONAD`);

  // Check game status (must be waiting/0 to fund)
  const gameStatus = await stakeGame.getGameStatus();
  if (gameStatus !== 0n) {
    console.log(`   ⚠️  Warning: Game status is ${gameStatus} (0=waiting, 1=active, 2=finished)`);
    console.log(`   Pool can only be funded when game status is 0 (waiting)`);
    throw new Error("Cannot fund pool: Game is not in waiting state");
  }

  console.log("\n💰 Funding platform pool...");

  // Call fundPool() - this is a payable function
  const fundPoolTx = await stakeGame.fundPool({ value: fundingWei });
  console.log(`   Transaction hash: ${fundPoolTx.hash}`);
  console.log("   Waiting for confirmation...");

  const receipt = await fundPoolTx.wait();
  console.log(`   ✅ Transaction confirmed in block ${receipt?.blockNumber}`);

  // Get updated pool balance
  const newPool = await stakeGame.getTotalPool();
  console.log(`\n📊 Updated Pool Balance: ${ethers.formatEther(newPool)} MONAD`);
  console.log(`   Added: ${fundingAmount} MONAD`);
  console.log(`   Previous: ${ethers.formatEther(currentPool)} MONAD`);

  console.log("\n✨ Funding complete!");
  console.log(`\n📋 Transaction Details:`);
  console.log(`   Network: Monad Testnet`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Transaction Hash: ${fundPoolTx.hash}`);
  console.log(`   Explorer: https://testnet.monad.xyz/tx/${fundPoolTx.hash}`);
  console.log(`\n💡 The pool now has enough funds to support bot staking for games.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error funding pool:");
    console.error(error);
    process.exit(1);
  });

