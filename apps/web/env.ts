import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    MONGODB_URI: z.string().min(1).max(2000),
    NODE_ENV: z.enum(["development", "production"]).default("production"),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    MONGODB_DB_NAME: z.string().min(1).max(100).default("game-aggregator"),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    // SMTP Configuration for Nodemailer
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z.coerce.boolean().default(false),
    SMTP_USER: z.string().min(1),
    SMTP_PASSWORD: z.string().min(1),
    SMTP_FROM_EMAIL: z.email(),
    SMTP_FROM_NAME: z.string().default("Game Aggregator"),
    PINATA_JWT: z.string().min(1),
    // Rewards Contract Admin (private key without 0x prefix)
    REWARDS_ADMIN_PRIVATE_KEY: z.string().min(1),
  },
  client: {
    // NEXT_PUBLIC_ variables are exposed to the client
    NEXT_PUBLIC_MONAD_RPC_URL: z.string().default("https://testnet-rpc.monad.xyz"),
    NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    MONGODB_URI: process.env.MONGODB_URI,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
    PINATA_JWT: process.env.PINATA_JWT,
    REWARDS_ADMIN_PRIVATE_KEY: process.env.REWARDS_ADMIN_PRIVATE_KEY,
    NEXT_PUBLIC_MONAD_RPC_URL: process.env.NEXT_PUBLIC_MONAD_RPC_URL,
    NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS,
    NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // }
});
