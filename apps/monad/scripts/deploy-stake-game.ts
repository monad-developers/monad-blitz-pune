import { ethers } from "hardhat";

async function main() {
  console.log("=== Deploying StakeGame Contract to Monad Testnet ===\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MONAD\n");

  // Deploy StakeGame contract (constructor sets deployer as owner)
  console.log("📦 Deploying StakeGame contract...");
  const StakeGame = await ethers.getContractFactory("StakeGame");
  const stakeGame = await StakeGame.deploy();
  await stakeGame.waitForDeployment();

  const contractAddress = await stakeGame.getAddress();
  const owner = await stakeGame.owner();

  console.log(`✅ StakeGame deployed to: ${contractAddress}`);
  console.log(`   Owner: ${owner}\n`);

  // Fund the platform pool if funding amount is specified
  const fundingAmount = process.env.PLATFORM_POOL_FUNDING;
  if (fundingAmount) {
    console.log(`💰 Funding platform pool with ${fundingAmount} MONAD...`);
    const fundingWei = ethers.parseEther(fundingAmount);
    
    // Send native tokens to contract
    const fundTx = await deployer.sendTransaction({
      to: contractAddress,
      value: fundingWei,
    });
    await fundTx.wait();

    // Call fundPool to add to pool
    const fundPoolTx = await stakeGame.fundPool({ value: fundingWei });
    await fundPoolTx.wait();

    console.log(`✅ Successfully funded platform pool with ${fundingAmount} MONAD`);
    console.log(`   Transaction hash: ${fundPoolTx.hash}\n`);
  }

  // Get contract stats
  const totalPool = await stakeGame.getTotalPool();
  const gameStatus = await stakeGame.getGameStatus();

  console.log("📊 Contract Statistics:");
  console.log(`   Game Status: ${gameStatus} (0=waiting, 1=active, 2=finished)`);
  console.log(`   Total Pool Balance: ${ethers.formatEther(totalPool)} MONAD\n`);

  // Print environment variables for frontend
  console.log("🔐 Environment Variables (add to .env):");
  console.log(`NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS="${contractAddress}"`);
  console.log(`STAKE_GAME_OWNER_ADDRESS="${owner}"\n`);

  console.log("✨ Deployment complete!");
  console.log(`\n📋 Contract Details:`);
  console.log(`   Network: Monad Testnet`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Owner: ${owner}`);
  console.log(`   Explorer: https://testnet.monad.xyz/address/${contractAddress}`);
  console.log(`\n⚠️  Platform pool is now ready to match player stakes. Monitor the balance regularly.`);

  return {
    name: "stake-game",
    contractAddress,
    owner,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

