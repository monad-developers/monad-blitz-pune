import { ethers } from "hardhat";

async function main() {
  console.log("=== Deploying GameRewards Contract to Monad Testnet ===\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MONAD\n");

  // Use deployer as both owner and admin initially
  const owner = deployer.address;
  const admin = deployer.address;

  console.log(`Owner: ${owner}`);
  console.log(`Admin: ${admin}\n`);

  // Deploy GameRewards contract
  console.log("📦 Deploying GameRewards contract...");
  const GameRewards = await ethers.getContractFactory("GameRewards");
  const gameRewards = await GameRewards.deploy(owner, admin);
  await gameRewards.waitForDeployment();

  const contractAddress = await gameRewards.getAddress();
  console.log(`✅ GameRewards deployed to: ${contractAddress}\n`);

  // Fund the rewards pool if funding amount is specified
  const fundingAmount = process.env.REWARD_POOL_FUNDING;
  if (fundingAmount) {
    console.log(`💰 Funding rewards pool with ${fundingAmount} MONAD...`);
    const fundingWei = ethers.parseEther(fundingAmount);
    
    // Send native tokens to contract
    const fundTx = await deployer.sendTransaction({
      to: contractAddress,
      value: fundingWei,
    });
    await fundTx.wait();

    // Call fundPool to add to pool
    const fundPoolTx = await gameRewards.fundPool({ value: fundingWei });
    await fundPoolTx.wait();

    console.log(`✅ Successfully funded contract with ${fundingAmount} MONAD`);
    console.log(`   Transaction hash: ${fundPoolTx.hash}\n`);
  }

  // Get contract stats
  const totalPool = await gameRewards.getTotalPool();
  const totalClaimed = await gameRewards.getTotalClaimed();
  const available = await gameRewards.getAvailableBalance();

  console.log("📊 Contract Statistics:");
  console.log(`   Total Pool: ${ethers.formatEther(totalPool)} MONAD`);
  console.log(`   Total Claimed: ${ethers.formatEther(totalClaimed)} MONAD`);
  console.log(`   Available: ${ethers.formatEther(available)} MONAD\n`);

  // Print environment variables for frontend
  console.log("🔐 Environment Variables (add to .env):");
  console.log(`NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS="${contractAddress}"`);
  console.log(`REWARDS_ADMIN_ADDRESS="${admin}"`);
  console.log(`REWARDS_OWNER_ADDRESS="${owner}"\n`);

  console.log("✨ Deployment complete!");
  console.log(`\n📋 Contract Details:`);
  console.log(`   Network: Monad Testnet`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Owner: ${owner}`);
  console.log(`   Admin: ${admin}`);
  console.log(`   Explorer: https://testnet.monad.xyz/address/${contractAddress}`);

  return {
    name: "game-rewards",
    contractAddress,
    owner,
    admin,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

