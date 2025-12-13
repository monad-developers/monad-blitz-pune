import { os } from "@orpc/server";
import { adminRouter } from "./admin";
import { gameStatsRouter } from "./game-stats";
import { leaderboardRouter } from "./leaderboard";
import { aiRouter } from "./ai";
import { arenaRouter } from "./arena";
import { statsRouter } from "./stats";
import { rewardsRouter } from "./rewards";
import { stakeGamesRouter } from "./stake-games";

export const router = os.router({
  admin: adminRouter,
  gameStats: gameStatsRouter,
  leaderboard: leaderboardRouter,
  ai: aiRouter,
  arena: arenaRouter,
  stats: statsRouter,
  rewards: rewardsRouter,
  stakeGames: stakeGamesRouter,
});

export type Router = typeof router;
