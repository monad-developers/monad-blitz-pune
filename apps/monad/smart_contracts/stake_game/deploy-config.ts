import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy and initialize the StakeGame smart contract
 *
 * This script:
 * 1. Deploys the StakeGame contract
 * 2. Initializes it with owner
 * 3. Funds the contract with MBR (if needed)
 * 4. Funds the platform pool for bot staking
 */

interface DeployConfig {
  owner?: string; // Optional, defaults to deployer
  fundingAmount?: string; // In native token (e.g., "10.0" for 10 tokens)
  rpcUrl: string;
  privateKey: string;
  artifactsPath?: string; // Path to compiled artifacts
}

export async function deploy(config: DeployConfig) {
  console.log("=== Deploying StakeGame Contract ===");

  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const deployer = new ethers.Wallet(config.privateKey, provider);

  console.log(`Deployer address: ${deployer.address}`);

  // Load contract artifacts (compiled with Hardhat)
  const artifactsPath =
    config.artifactsPath ||
    path.join(__dirname, "../../artifacts/smart_contracts/stake_game/StakeGame.sol/StakeGame.json");
  
  const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf-8"));
  const contractFactory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployer
  );

  // Deploy the contract (constructor sets deployer as owner)
  console.log("\n📦 Deploying contract...");
  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const owner = config.owner || deployer.address;

  console.log(
    `✅ Deployed StakeGame Contract: address=${contractAddress}`
  );
  console.log(`Owner: ${owner}`);

  // Fund the platform pool for bot staking
  if (config.fundingAmount) {
    console.log("\n💰 Funding platform pool...");

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
      `✅ Successfully funded platform pool with ${config.fundingAmount} native tokens`
    );
    console.log(`   Transaction hash: ${fundPoolTx.hash}`);
  }

  // Get contract stats
  const totalPool = await contract.getTotalPool();
  const gameStatus = await contract.getGameStatus();

  console.log("\n📊 Contract Statistics:");
  console.log(
    `   Game Status: ${gameStatus} (0=waiting, 1=active, 2=finished)`
  );
  console.log(
    `   Total Pool Balance: ${ethers.formatEther(totalPool)} native tokens`
  );

  // Print environment variables for frontend
  console.log("\n🔐 Environment Variables (add to .env):");
  console.log(
    `NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS="${contractAddress}"`
  );

  console.log("\n✨ Deployment complete!");
  console.log(
    "⚠️  Platform pool is now ready to match player stakes. Monitor the balance regularly."
  );

  return {
    name: "stake-game",
    contractAddress,
    owner,
  };
}

// Example usage:
// const config: DeployConfig = {
//   fundingAmount: "10.0", // 10 native tokens
//   rpcUrl: process.env.MONAD_RPC_URL!,
//   privateKey: process.env.DEPLOYER_PRIVATE_KEY!,
// };
// await deploy(config);

