import { ethers } from "ethers";
import { env } from "@/env";

// ABI for GameRewards contract
export const GAME_REWARDS_ABI = [
  "function fundPool() payable",
  "function claimReward(address recipient, bytes32 milestoneId, uint256 rewardAmount)",
  "function isClaimed(address user, bytes32 milestoneId) view returns (bool)",
  "function getClaimedAmount(address user, bytes32 milestoneId) view returns (uint256)",
  "function getTotalPool() view returns (uint256)",
  "function getTotalClaimed() view returns (uint256)",
  "function getAvailableBalance() view returns (uint256)",
  "function updateAdmin(address newAdmin)",
  "function emergencyWithdraw(uint256 amount)",
  "event RewardClaimed(address indexed recipient, bytes32 indexed milestoneId, uint256 amount)",
  "event PoolFunded(address indexed funder, uint256 amount)",
] as const;

export class GameRewardsClient {
  private contract: ethers.Contract;
  private signer: ethers.Signer | null = null;

  constructor(
    provider: ethers.Provider,
    signer?: ethers.Signer,
    contractAddress?: string
  ) {
    const address =
      contractAddress || env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS;
    if (!address) {
      throw new Error("GameRewards contract address not configured");
    }
    this.contract = new ethers.Contract(address, GAME_REWARDS_ABI, provider);
    if (signer) {
      this.signer = signer;
      this.contract = this.contract.connect(signer) as ethers.Contract;
    }
  }

  async fundPool(amount: bigint) {
    if (!this.signer) {
      throw new Error("Signer required for fundPool");
    }
    return await this.contract.fundPool({ value: amount });
  }

  async claimReward(
    recipient: string,
    milestoneId: string,
    rewardAmount: bigint
  ) {
    if (!this.signer) {
      throw new Error("Signer required for claimReward");
    }
    const milestoneIdBytes = ethers.id(milestoneId);
    return await this.contract.claimReward(recipient, milestoneIdBytes, rewardAmount);
  }

  async isClaimed(user: string, milestoneId: string): Promise<boolean> {
    const milestoneIdBytes = ethers.id(milestoneId);
    return await this.contract.isClaimed(user, milestoneIdBytes);
  }

  async getClaimedAmount(
    user: string,
    milestoneId: string
  ): Promise<bigint> {
    const milestoneIdBytes = ethers.id(milestoneId);
    return await this.contract.getClaimedAmount(user, milestoneIdBytes);
  }

  async getTotalPool(): Promise<bigint> {
    return await this.contract.getTotalPool();
  }

  async getTotalClaimed(): Promise<bigint> {
    return await this.contract.getTotalClaimed();
  }

  async getAvailableBalance(): Promise<bigint> {
    return await this.contract.getAvailableBalance();
  }

  async updateAdmin(newAdmin: string) {
    if (!this.signer) {
      throw new Error("Signer required for updateAdmin");
    }
    return await this.contract.updateAdmin(newAdmin);
  }

  async emergencyWithdraw(amount: bigint) {
    if (!this.signer) {
      throw new Error("Signer required for emergencyWithdraw");
    }
    return await this.contract.emergencyWithdraw(amount);
  }

  get address(): string {
    return this.contract.target as string;
  }
}
