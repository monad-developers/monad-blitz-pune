"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useAccount, useWalletClient } from "wagmi";
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
    if (!(address && walletClient)) {
      return null;
    }

    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = new ethers.JsonRpcSigner(provider, address);

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
    if (!(address && walletClient)) {
      toast.error("Please connect your wallet first");
      return false;
    }

    setIsLoading(true);
    try {
      const appClient = getContractClient();
      if (!appClient) {
        throw new Error("Failed to get contract client");
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

      // Join game with stake
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

      if (errorMessage.includes("insufficient funds")) {
        toast.error("Insufficient balance", {
          description: "You don't have enough MONAD to stake.",
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
  }, [address, walletClient, getContractClient, STAKE_AMOUNT, stakeAmount, updateContractState]);

  // End game with result
  const endGameWithResult = useCallback(
    async (playerWon: boolean, isTie: boolean = false) => {
      if (!(address && walletClient)) {
        toast.error("Please connect your wallet first");
        return false;
      }

      setIsLoading(true);
      try {
        const appClient = getContractClient();
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
        toast.error("Failed to end game", {
          description: (error as Error).message,
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      address,
      walletClient,
      getContractClient,
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

  return {
    // State
    contractState,
    isLoading,
    stakeAmount,
    reward: REWARD,
    drawRefund: DRAW_REFUND,
    contractConfigured: !!env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS,
    walletConnected: isConnected && !!address,
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

