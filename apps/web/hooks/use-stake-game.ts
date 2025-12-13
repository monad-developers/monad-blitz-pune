"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useAccount, useWalletClient, useChainId, useSwitchChain } from "wagmi";
import { ethers } from "ethers";
import { StakeGameClient } from "@/contracts/StakeGame";
import { toast } from "sonner";
import { env } from "@/env";

type GameType = "rock-paper-scissor" | "showdown" | "head-soccer";

// Game configuration
const GAME_STAKES: Record<GameType, number> = {
  "rock-paper-scissor": 1, // 1 MONAD
  showdown: 1, // 1 MONAD
  "head-soccer": 3, // 3 MONAD
};

const BOT_COUNT = BigInt(1); // Always play against 1 bot
const MONAD_TO_WEI = BigInt(10 ** 18);

// Retry configuration for rate limiting
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Helper to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimited =
        error instanceof Error &&
        (error.message.includes("429") ||
          error.message.includes("rate") ||
          error.message.includes("too many"));

      if (isRateLimited && attempt < retries - 1) {
        await delay(RETRY_DELAY_MS * Math.pow(2, attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

type ContractState = {
  isConnected: boolean;
  isStaked: boolean;
  stakeAmount: bigint;
  gamePool: bigint;
  humanStake: bigint;
  botCount: bigint;
  gameStatus: bigint; // 0 = waiting, 1 = active, 2 = finished
};

/**
 * Hook for managing stake-based games using Monad contracts
 *
 * Game flow:
 * 1. Connect wallet
 * 2. Stake MONAD to join game (contract status: waiting → active)
 * 3. Play the game
 * 4. Submit result to contract (contract status: active → finished)
 * 5. Auto-resets to waiting
 */
export function useStakeGame(gameType: GameType) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isLoading, setIsLoading] = useState(false);
  const [contractState, setContractState] = useState<ContractState>({
    isConnected: isConnected && !!address,
    isStaked: false,
    stakeAmount: BigInt(0),
    gamePool: BigInt(0),
    humanStake: BigInt(0),
    botCount: BigInt(0),
    gameStatus: BigInt(0),
  });

  const stakeAmount = GAME_STAKES[gameType];
  const STAKE_AMOUNT = BigInt(Math.round(stakeAmount)) * MONAD_TO_WEI;
  // Calculate reward after 10% platform fee deduction from both stakes
  // Win reward = 90% of (player stake + bot stake) = 0.9 * 2 * stake = 1.8 * stake
  const REWARD = stakeAmount * 1.8;
  const DRAW_REFUND = stakeAmount * 0.9;

  // Debounce ref to prevent multiple simultaneous state updates
  const updateInProgress = useRef(false);
  const lastUpdateTime = useRef(0);
  const MIN_UPDATE_INTERVAL = 2000; // Minimum 2 seconds between updates

  // Get contract client
  const getContractClient = useCallback(() => {
    if (!address) {
      return null;
    }

    try {
      // Always use Monad testnet RPC for read operations (ensures correct network)
      const rpcUrl = env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // For signing transactions, use walletClient if available
      let signer: ethers.Signer | undefined;
      if (walletClient) {
        const browserProvider = new ethers.BrowserProvider(walletClient as any);
        signer = new ethers.JsonRpcSigner(browserProvider, address);
      }

      const contractAddress = env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS;
      if (!contractAddress) {
        return null;
      }

      const appClient = new StakeGameClient(provider, signer, contractAddress);
      return appClient;
    } catch (error) {
      console.error("Failed to initialize contract client:", error);
      return null;
    }
  }, [address, walletClient]);

  // Update contract state with debouncing and rate limit handling
  const updateContractState = useCallback(
    async (force = false) => {
      if (!address) {
        setContractState((prev) => ({ ...prev, isConnected: false }));
        return;
      }

      // Debounce: prevent multiple simultaneous calls (unless forced)
      const now = Date.now();
      if (
        updateInProgress.current ||
        (!force && now - lastUpdateTime.current < MIN_UPDATE_INTERVAL)
      ) {
        return;
      }

      updateInProgress.current = true;
      lastUpdateTime.current = now;

      try {
        const appClient = getContractClient();
        if (!appClient) {
          return;
        }

        // Fetch state sequentially to avoid rate limiting
        const gameStatus = await withRetry(() => appClient.getGameStatus());
        await delay(200);

        const totalPool = await withRetry(() => appClient.getTotalPool());
        await delay(200);

        const humanStake = await withRetry(() => appClient.humanStake());
        await delay(200);

        const botCount = await withRetry(() => appClient.botCount());

        setContractState({
          isConnected: true,
          isStaked: humanStake > BigInt(0),
          stakeAmount: STAKE_AMOUNT,
          gamePool: totalPool,
          humanStake: humanStake || BigInt(0),
          botCount: botCount || BigInt(0),
          gameStatus,
        });
      } catch (error) {
        console.error("Failed to update contract state:", error);
      } finally {
        updateInProgress.current = false;
      }
    },
    [address, getContractClient, STAKE_AMOUNT]
  );

  // Reset local contract state immediately (for UI responsiveness after game end)
  const resetLocalGameState = useCallback(() => {
    setContractState((prev) => ({
      ...prev,
      isStaked: false,
      humanStake: BigInt(0),
      botCount: BigInt(0),
      gameStatus: BigInt(0), // Reset to waiting
    }));
  }, []);

  // Join game by staking MONAD
  const stakeForGame = useCallback(async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return false;
    }

    // Check if wallet is on the correct network (Monad Testnet: 10143)
    const MONAD_TESTNET_CHAIN_ID = 10143;
    if (chainId !== MONAD_TESTNET_CHAIN_ID) {
      try {
        await switchChain({ chainId: MONAD_TESTNET_CHAIN_ID });
        toast.info("Switching to Monad Testnet...");
        // Wait a bit for the network switch
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        toast.error("Please switch your wallet to Monad Testnet (Chain ID: 10143)", {
          description: "The contract is only available on Monad Testnet.",
        });
        return false;
      }
    }

    setIsLoading(true);
    try {
      // Get or create a signer for transactions
      let signer: ethers.Signer | undefined;
      let provider: ethers.BrowserProvider | undefined;
      
      if (walletClient) {
        // Use walletClient from wagmi (ensures correct network)
        provider = new ethers.BrowserProvider(walletClient as any);
        signer = await provider.getSigner();
      } else if (typeof window !== "undefined" && (window as any).ethereum) {
        // Fallback to window.ethereum
        provider = new ethers.BrowserProvider((window as any).ethereum);
        signer = await provider.getSigner();
      } else {
        toast.error("Please connect your wallet to Monad Testnet");
        return false;
      }

      if (!signer || !provider) {
        throw new Error("Failed to get signer or provider");
      }

      // Verify signer address matches connected address
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`Signer address mismatch. Expected ${address}, got ${signerAddress}`);
      }

      // Verify we're on the correct network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 10143) {
        throw new Error(`Wrong network! Connected to chain ${network.chainId}, but need 10143 (Monad Testnet)`);
      }

      const contractAddress = env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }
      
      // Verify contract exists on the network
      const contractCode = await provider.getCode(contractAddress);
      if (contractCode === "0x" || contractCode === "0x0") {
        throw new Error("Contract not found at the specified address. Please verify the contract is deployed on Monad Testnet.");
      }

      // Create contract client using the same provider as the signer
      const appClient = new StakeGameClient(provider, signer, contractAddress);
      if (!appClient) {
        throw new Error("Failed to get contract client. Please ensure you're connected to Monad Testnet.");
      }

      // Check user balance before attempting transaction
      const balance = await provider.getBalance(address);
      if (balance < STAKE_AMOUNT) {
        toast.error("Insufficient balance", {
          description: `You need at least ${stakeAmount} MONAD to stake. Your balance: ${ethers.formatEther(balance)} MONAD`,
        });
        return false;
      }

      // Check current game status first
      const currentStatus = await withRetry(() => appClient.getGameStatus());
      if (currentStatus === BigInt(1)) {
        toast.error("A game is already in progress!");
        return false;
      }

      if (currentStatus !== BigInt(0) && currentStatus !== BigInt(2)) {
        toast.error("Game is in an unexpected state. Please refresh.");
        return false;
      }

      // Check if pool has enough funds for bot staking
      // Required: totalPool >= stake * botCount
      const requiredBotStake = STAKE_AMOUNT * BOT_COUNT;
      const totalPool = await withRetry(() => appClient.getTotalPool());
      
      if (totalPool < requiredBotStake) {
        toast.error("Insufficient pool funds", {
          description: `The game pool needs ${ethers.formatEther(requiredBotStake)} MONAD for bot staking, but only has ${ethers.formatEther(totalPool)} MONAD. Please contact the admin to fund the pool.`,
        });
        return false;
      }

      // Join game with stake
      // Try to estimate gas first to catch any revert reasons
      try {
        if (!signer) {
          throw new Error("Signer not available");
        }
        const connectedContract = appClient.contract.connect(signer) as ethers.Contract;
        await connectedContract.joinGame.estimateGas(STAKE_AMOUNT, BOT_COUNT, { value: STAKE_AMOUNT });
      } catch (estimateError: any) {
        // Parse the revert reason if available
        const errorMessage = estimateError?.message || estimateError?.reason || String(estimateError);
        
        if (errorMessage.includes("Not enough pool funds") || errorMessage.includes("totalPool") || errorMessage.includes("pool")) {
          toast.error("Insufficient pool funds", {
            description: "The game pool doesn't have enough funds for bot staking. Please contact the admin.",
          });
          return false;
        } else if (errorMessage.includes("Game already started") || errorMessage.includes("gameStatus") || errorMessage.includes("already started")) {
          toast.error("Game already started", {
            description: "A game is already in progress. Please wait for it to finish.",
          });
          return false;
        } else if (errorMessage.includes("Payment amount must match stake") || errorMessage.includes("Payment")) {
          toast.error("Payment mismatch", {
            description: "The payment amount doesn't match the stake. Please try again.",
          });
          return false;
        } else if (errorMessage.includes("Stake must be") || errorMessage.includes("stake")) {
          toast.error("Invalid stake amount", {
            description: "The stake amount must be greater than 0.",
          });
          return false;
        } else if (errorMessage.includes("Bot count") || errorMessage.includes("bot")) {
          toast.error("Invalid bot count", {
            description: "Bot count must be greater than 0.",
          });
          return false;
        }
        // If it's a different error, let it fall through to the main catch block
        throw estimateError;
      }

      const tx = await appClient.joinGame(STAKE_AMOUNT, BOT_COUNT);
      await tx.wait();

      toast.success(`Successfully staked ${stakeAmount} MONAD!`, {
        description: "Game is ready to play!",
      });

      // Wait a bit before updating state
      await delay(1000);
      await updateContractState();
      return true;
    } catch (error) {
      console.error("Stake failed:", error);
      const errorMessage = (error as Error).message;

      if (errorMessage.includes("insufficient funds") || errorMessage.includes("insufficient balance")) {
        toast.error("Insufficient balance", {
          description: "You don't have enough MONAD to stake.",
        });
      } else if (errorMessage.includes("Wrong network")) {
        toast.error("Wrong network", {
          description: errorMessage,
        });
      } else if (errorMessage.includes("missing revert data") || errorMessage.includes("CALL_EXCEPTION")) {
        toast.error("Transaction failed", {
          description: "The transaction could not be estimated. Please ensure you're connected to Monad Testnet (Chain ID: 10143) and have sufficient balance.",
        });
      } else if (errorMessage.includes("Contract not found")) {
        toast.error("Contract not found", {
          description: "The contract is not deployed at this address on the current network.",
        });
      } else if (errorMessage.includes("assert failed") || errorMessage.includes("revert")) {
        toast.error("Game contract error", {
          description:
            "The game might already be in progress. Please refresh and try again.",
        });
      } else {
        toast.error("Failed to stake", {
          description: errorMessage,
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
      }, [address, walletClient, chainId, switchChain, STAKE_AMOUNT, stakeAmount, updateContractState, BOT_COUNT]);

  // End game with result
  const endGameWithResult = useCallback(
    async (playerWon: boolean, isTie: boolean = false) => {
      if (!address) {
        toast.error("Please connect your wallet first");
        return false;
      }

      // Check if wallet is on the correct network (Monad Testnet: 10143)
      const MONAD_TESTNET_CHAIN_ID = 10143;
      if (chainId !== MONAD_TESTNET_CHAIN_ID) {
        try {
          await switchChain({ chainId: MONAD_TESTNET_CHAIN_ID });
          toast.info("Switching to Monad Testnet...");
          // Wait a bit for the network switch
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          toast.error("Please switch your wallet to Monad Testnet (Chain ID: 10143)", {
            description: "The contract is only available on Monad Testnet.",
          });
          return false;
        }
      }

      setIsLoading(true);
      try {
        // Get or create a signer for transactions
        let signer: ethers.Signer | undefined;
        let provider: ethers.BrowserProvider | undefined;
        
        if (walletClient) {
          // Use walletClient from wagmi (ensures correct network)
          provider = new ethers.BrowserProvider(walletClient as any);
          signer = await provider.getSigner();
        } else if (typeof window !== "undefined" && (window as any).ethereum) {
          // Fallback to window.ethereum
          provider = new ethers.BrowserProvider((window as any).ethereum);
          signer = await provider.getSigner();
        } else {
          toast.error("Please connect your wallet to Monad Testnet");
          return false;
        }

        if (!signer || !provider) {
          throw new Error("Failed to get signer or provider");
        }

        // Verify signer address matches connected address
        const signerAddress = await signer.getAddress();
        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error(`Signer address mismatch. Expected ${address}, got ${signerAddress}`);
        }

        // Verify we're on the correct network
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== 10143) {
          throw new Error(`Wrong network! Connected to chain ${network.chainId}, but need 10143 (Monad Testnet)`);
        }

        const contractAddress = env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error("Contract address not configured");
        }
        
        // Verify contract exists on the network
        const contractCode = await provider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode === "0x0") {
          throw new Error("Contract not found at the specified address. Please verify the contract is deployed on Monad Testnet.");
        }

        // Create contract client using the same provider as the signer
        const appClient = new StakeGameClient(provider, signer, contractAddress);
        if (!appClient) {
          throw new Error("Failed to get contract client");
        }

        // Determine result: 0=bots win, 1=human wins, 2=draw
        const humanWon = isTie ? BigInt(2) : playerWon ? BigInt(1) : BigInt(0);

        const tx = await appClient.endGame(humanWon);
        await tx.wait();

        if (playerWon) {
          toast.success("You won!", {
            description: `You earned ${REWARD.toFixed(4)} MONAD!`,
          });
        } else if (isTie) {
          toast("It's a draw!", {
            description: `You got a refund of ${DRAW_REFUND.toFixed(4)} MONAD.`,
          });
        } else {
          toast.error("You lost", {
            description: `You lost ${stakeAmount} MONAD.`,
          });
        }

        // Reset local state immediately for UI responsiveness
        resetLocalGameState();

        // Update contract state after a delay
        setTimeout(() => updateContractState(true), 2000);
        return true;
      } catch (error) {
        console.error("End game failed:", error);
        const errorMessage = (error as Error).message;

        if (errorMessage.includes("insufficient funds") || errorMessage.includes("insufficient balance")) {
          toast.error("Insufficient balance", {
            description: "You don't have enough MONAD for this transaction.",
          });
        } else if (errorMessage.includes("missing revert data") || errorMessage.includes("CALL_EXCEPTION")) {
          toast.error("Network error", {
            description: "Please ensure you're connected to Monad Testnet (Chain ID: 10143) and the contract is deployed.",
          });
        } else if (errorMessage.includes("assert failed") || errorMessage.includes("revert")) {
          toast.error("Game contract error", {
            description: "The game might not be in the correct state. Please refresh and try again.",
          });
        } else if (errorMessage.includes("Contract not found")) {
          toast.error("Contract not found", {
            description: "Please verify the contract is deployed on Monad Testnet.",
          });
        } else {
          toast.error("Failed to end game", {
            description: errorMessage,
          });
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
        [
          address,
          walletClient,
          chainId,
          switchChain,
          REWARD,
          DRAW_REFUND,
          stakeAmount,
          resetLocalGameState,
          updateContractState,
        ]
      );

  // Update state on mount and when address changes
  useEffect(() => {
    if (address) {
      updateContractState(true);
    }
  }, [address, updateContractState]);

  // Wallet is connected if we have an address (connectorClient is only needed for transactions)
  const walletConnectedValue = isConnected && !!address;
  return {
    // State
    contractState,
    isLoading,
    stakeAmount,
    reward: REWARD,
    drawRefund: DRAW_REFUND,
    contractConfigured: !!env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS,
    walletConnected: walletConnectedValue,
    isStaked: contractState.isStaked,
    gameActive: contractState.gameStatus === BigInt(1),

    // Actions
    stakeForGame,
    endGameWithResult,
    updateContractState,
    resetLocalGameState,

    // Constants
    STAKE_AMOUNT,
    MONAD_TO_WEI,
  };
}

