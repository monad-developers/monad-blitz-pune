import { os } from "@orpc/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { env } from "@/env";

// Fixed stake amounts per game (in Monad)
export const GAME_STAKES = {
  "rock-paper-scissor": 1,
  showdown: 1,
  "head-soccer": 3,
} as const;

type StakeGameType = keyof typeof GAME_STAKES;

// Game result types
const GameResultEnum = z.enum(["win", "loss", "draw"]);
type GameResult = z.infer<typeof GameResultEnum>;

/**
 * Submit a stake game result and process payment
 * This should only be called after the game is completed
 */
const submitStakeGameResult = os
  .input(
    z.object({
      gameType: z.enum([
        "rock-paper-scissor",
        "showdown",
        "head-soccer",
      ] as const),
      result: GameResultEnum,
      gameSessionId: z.string(), // Unique ID for this game session
      walletAddress: z.string().length(58),
      txId: z.string(), // Transaction ID from the blockchain
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      txId: z.string(),
      amountWon: z.number().optional(),
      amountLost: z.number().optional(),
      platformFee: z.number(),
      message: z.string(),
    })
  )
  .route({
    method: "POST",
    path: "/stake-games/submit-result",
  })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized: Must be logged in to play stake games");
    }

    const client = await clientPromise;
    const db = client.db(env.MONGODB_DB_NAME);
    const stakeGamesCollection = db.collection("stakeGames");

    const userId = session.user.id;
    const stakeAmount = GAME_STAKES[input.gameType];

    // Check if this game session has already been processed
    const existingGame = await stakeGamesCollection.findOne({
      userId,
      gameSessionId: input.gameSessionId,
    });

    if (existingGame) {
      throw new Error("Game session already processed");
    }

    // Verify the contract is configured
    if (!env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS) {
      throw new Error("Stake game contract not configured");
    }

    // Calculate outcomes based on game result
    let amountWon: number | undefined;
    let amountLost: number | undefined;
    let platformFee: number;

    if (input.result === "win") {
      const totalPot = stakeAmount * 2;
      platformFee = totalPot * 0.1;
      amountWon = totalPot - platformFee;
      amountLost = 0;
    } else if (input.result === "loss") {
      platformFee = 0;
      amountWon = 0;
      amountLost = stakeAmount;
    } else {
      // draw
      platformFee = stakeAmount * 0.05;
      amountWon = stakeAmount - platformFee;
      amountLost = platformFee;
    }

    // Record the game in database
    // The blockchain transaction was already processed by the frontend
    await stakeGamesCollection.insertOne({
      userId,
      gameType: input.gameType,
      gameSessionId: input.gameSessionId,
      result: input.result,
      stakeAmount,
      amountWon,
      amountLost,
      platformFee,
      walletAddress: input.walletAddress,
      processed: true,
      txId: input.txId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update user stats
    const gameStatsCollection = db.collection("gameStats");
    if (input.gameType === "rock-paper-scissor" || input.gameType === "showdown" || input.gameType === "head-soccer") {
      await gameStatsCollection.updateOne(
        { userId, gameType: input.gameType },
        {
          $inc: {
            ...(input.result === "win" && { playerWins: 1 }),
            ...(input.result === "loss" && { botWins: 1 }),
            ...(input.result === "draw" && { ties: 1 }),
            totalGames: 1,
          },
          $set: { updatedAt: new Date() },
          $setOnInsert: {
            userId,
            gameType: input.gameType,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return {
      success: true,
      txId: input.txId,
      amountWon,
      amountLost,
      platformFee,
      message:
        input.result === "win"
          ? `You won ${amountWon} Monad!`
          : input.result === "draw"
          ? `Draw! Refunded ${amountWon} Monad`
          : `You lost ${amountLost} Monad`,
    };
  });

/**
 * Get user's stake game history
 */
const getStakeGameHistory = os
  .input(
    z.object({
      gameType: z
        .enum(["rock-paper-scissor", "showdown", "head-soccer"])
        .optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .output(
    z.object({
      games: z.array(
        z.object({
          gameSessionId: z.string(),
          gameType: z.string(),
          result: z.string(),
          stakeAmount: z.number(),
          amountWon: z.number().optional(),
          amountLost: z.number().optional(),
          platformFee: z.number(),
          txId: z.string().nullable(),
          processed: z.boolean(),
          createdAt: z.coerce.date(),
        })
      ),
      total: z.number(),
      stats: z.object({
        totalWins: z.number(),
        totalLosses: z.number(),
        totalDraws: z.number(),
        totalStaked: z.number(),
        totalWon: z.number(),
        totalLost: z.number(),
        netProfit: z.number(),
      }),
    })
  )
  .route({
    method: "GET",
    path: "/stake-games/history",
  })
  .handler(async ({ input }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized: Must be logged in");
    }

    const client = await clientPromise;
    const db = client.db(env.MONGODB_DB_NAME);
    const stakeGamesCollection = db.collection("stakeGames");

    const userId = session.user.id;

    // Build query
    const query: any = { userId };
    if (input.gameType) {
      query.gameType = input.gameType;
    }

    // Get games with pagination
    const games = await stakeGamesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(input.offset)
      .limit(input.limit)
      .toArray();

    const total = await stakeGamesCollection.countDocuments(query);

    // Calculate stats
    const allGames = await stakeGamesCollection.find({ userId }).toArray();

    const stats = {
      totalWins: allGames.filter((g) => g.result === "win").length,
      totalLosses: allGames.filter((g) => g.result === "loss").length,
      totalDraws: allGames.filter((g) => g.result === "draw").length,
      totalStaked: allGames.reduce((sum, g) => sum + (g.stakeAmount || 0), 0),
      totalWon: allGames.reduce((sum, g) => sum + (g.amountWon || 0), 0),
      totalLost: allGames.reduce((sum, g) => sum + (g.amountLost || 0), 0),
      netProfit: 0,
    };

    stats.netProfit = stats.totalWon - stats.totalStaked;

    return {
      games: games.map((game) => ({
        gameSessionId: game.gameSessionId,
        gameType: game.gameType,
        result: game.result,
        stakeAmount: game.stakeAmount,
        amountWon: game.amountWon,
        amountLost: game.amountLost,
        platformFee: game.platformFee,
        txId: game.txId,
        processed: game.processed,
        createdAt: game.createdAt,
      })),
      total,
      stats,
    };
  });

/**
 * Get stake game configuration
 */
const getStakeGameConfig = os
  .input(z.object({}))
  .output(
    z.object({
      contractConfigured: z.boolean(),
      appId: z.string().optional(),
      appAddress: z.string().optional(),
      gameStakes: z.object({
        "rock-paper-scissor": z.number(),
        showdown: z.number(),
        "head-soccer": z.number(),
      }),
    })
  )
  .route({
    method: "GET",
    path: "/stake-games/config",
  })
  .handler(async () => {
    return {
      contractConfigured: !!env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS,
      appId: env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS,
      appAddress: env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS,
      gameStakes: GAME_STAKES,
    };
  });

export const stakeGamesRouter = os.router({
  submitStakeGameResult,
  getStakeGameHistory,
  getStakeGameConfig,
});
