"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { env } from "@/env";
import { monadTestnet } from "@/lib/monad/chains";

// Configure RainbowKit with Monad testnet
// Note: WalletConnect projectId is required for WalletConnect wallets
// Get a free projectId from https://cloud.walletconnect.com
const config = getDefaultConfig({
  appName: "Monad Arcade",
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000", // Placeholder - replace with your WalletConnect projectId
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"),
  },
  ssr: true, // Enable SSR for Next.js
});

const queryClient = new QueryClient();

export default function MonadWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

