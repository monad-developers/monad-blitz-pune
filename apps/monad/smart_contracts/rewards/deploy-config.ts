import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy and initialize the GameRewards smart contract
 *
 * This script:
 * 1. Deploys the GameRewards contract
 * 2. Initializes it with owner and admin
 * 3. Funds the contract with initial native token pool
 */

interface DeployConfig {
  owner: string;
  admin: string;
  fundingAmount?: string; // In native token (e.g., "1.0" for 1 token)
  rpcUrl: string;
  privateKey: string;
  artifactsPath?: string; // Path to compiled artifacts
}

export async function deploy(config: DeployConfig) {
  console.log("=== Deploying GameRewards Contract ===");

  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const deployer = new ethers.Wallet(config.privateKey, provider);

  console.log(`Deployer address: ${deployer.address}`);

  // Load contract artifacts (compiled with Hardhat)
  const artifactsPath =
    config.artifactsPath ||
    path.join(__dirname, "../../artifacts/smart_contracts/rewards/GameRewards.sol/GameRewards.json");
  
  const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf-8"));
  const contractFactory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployer
  );

  // Use deployer as both owner and admin initially (or use config)
  const owner = config.owner || deployer.address;
  const admin = config.admin || deployer.address;

  console.log(`Owner: ${owner}`);
  console.log(`Admin: ${admin}`);

  // Deploy the contract with initialization
  console.log("\n📦 Deploying contract...");
  const contract = await contractFactory.deploy(owner, admin);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(
    `✅ Deployed GameRewards Contract: address=${contractAddress}`
  );

  // Fund the rewards pool
  if (config.fundingAmount) {
    console.log("\n💰 Funding rewards pool...");

    const fundingWei = ethers.parseEther(config.fundingAmount);

    // Send native tokens to contract
    const fundTx = await deployer.sendTransaction({
      to: contractAddress,
      value: fundingWei,
    });
    await fundTx.wait();

    // Call fundPool to add to pool
    const fundPoolTx = await contract.fundPool({ value: fundingWei });
    await fundPoolTx.wait();

    console.log(
      `✅ Successfully funded contract with ${config.fundingAmount} native tokens`
    );
    console.log(`   Transaction hash: ${fundPoolTx.hash}`);
  }

  // Get contract stats
  const totalPool = await contract.getTotalPool();
  const totalClaimed = await contract.getTotalClaimed();
  const available = await contract.getAvailableBalance();

  console.log("\n📊 Contract Statistics:");
  console.log(
    `   Total Pool: ${ethers.formatEther(totalPool)} native tokens`
  );
  console.log(
    `   Total Claimed: ${ethers.formatEther(totalClaimed)} native tokens`
  );
  console.log(
    `   Available: ${ethers.formatEther(available)} native tokens`
  );

  // Print environment variables for frontend
  console.log("\n🔐 Environment Variables (add to .env):");
  console.log(`NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS="${contractAddress}"`);
  console.log(`REWARDS_ADMIN_ADDRESS="${admin}"`);

  console.log("\n✨ Deployment complete!");

  return {
    name: "game-rewards",
    contractAddress,
    owner,
    admin,
  };
}

// Example usage:
// const config: DeployConfig = {
//   owner: "0x...",
//   admin: "0x...",
//   fundingAmount: "100.0", // 100 native tokens
//   rpcUrl: process.env.MONAD_RPC_URL!,
//   privateKey: process.env.DEPLOYER_PRIVATE_KEY!,
// };
// await deploy(config);

