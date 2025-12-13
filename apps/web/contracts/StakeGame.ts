import { ethers } from "ethers";
import { env } from "@/env";

// ABI extracted from compiled Hardhat artifact
// This matches the deployed contract exactly
export const STAKE_GAME_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "botCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentGamePool",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_humanWon", type: "uint256" }],
    name: "endGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "fundPool",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "gameStatus",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGameStatus",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPlatformFees",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalPool",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getWinner",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "humanStake",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_stake", type: "uint256" },
      { internalType: "uint256", name: "_botCount", type: "uint256" },
    ],
    name: "joinGame",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFees",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPool",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "winner",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawPlatformFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

export class StakeGameClient {
  public contract: ethers.Contract;
  private signer: ethers.Signer | null = null;

  constructor(
    provider: ethers.Provider,
    signer?: ethers.Signer,
    contractAddress?: string
  ) {
    const address =
      contractAddress || env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS;
    if (!address) {
      throw new Error("StakeGame contract address not configured");
    }
    this.contract = new ethers.Contract(address, STAKE_GAME_ABI, provider);
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

  async joinGame(stake: bigint, botCount: bigint) {
    if (!this.signer) {
      throw new Error("Signer required for joinGame");
    }
    return await this.contract.joinGame(stake, botCount, { value: stake });
  }

  async endGame(humanWon: bigint) {
    if (!this.signer) {
      throw new Error("Signer required for endGame");
    }
    return await this.contract.endGame(humanWon);
  }

  async emergencyWithdraw() {
    if (!this.signer) {
      throw new Error("Signer required for emergencyWithdraw");
    }
    return await this.contract.emergencyWithdraw();
  }

  async getTotalPool(): Promise<bigint> {
    return await this.contract.getTotalPool();
  }

  async getGameStatus(): Promise<bigint> {
    try {
      // Try getGameStatus() first (explicit function)
      return await this.contract.getGameStatus();
    } catch (error: any) {
      // Fallback to public variable getter if explicit function fails
      try {
        return await this.contract.gameStatus();
      } catch (fallbackError: any) {
        throw error; // Throw original error
      }
    }
  }

  async getWinner(): Promise<bigint> {
    return await this.contract.getWinner();
  }

  async getPlatformFees(): Promise<bigint> {
    return await this.contract.getPlatformFees();
  }

  async withdrawPlatformFees() {
    if (!this.signer) {
      throw new Error("Signer required for withdrawPlatformFees");
    }
    return await this.contract.withdrawPlatformFees();
  }

  async transferOwnership(newOwner: string) {
    if (!this.signer) {
      throw new Error("Signer required for transferOwnership");
    }
    return await this.contract.transferOwnership(newOwner);
  }

  async humanStake(): Promise<bigint> {
    return await this.contract.humanStake();
  }

  async botCount(): Promise<bigint> {
    return await this.contract.botCount();
  }

  async currentGamePool(): Promise<bigint> {
    return await this.contract.currentGamePool();
  }

  get address(): string {
    return this.contract.target as string;
  }
}
