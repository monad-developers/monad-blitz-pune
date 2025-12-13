"use client";

import { useAccount } from "wagmi";
import { type ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type AuthProps = {
  children: ReactNode;
};

const Auth = ({ children }: AuthProps) => {
  const { address, isConnected } = useAccount();

  if (isConnected && address) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h2 className="font-semibold text-2xl">Wallet not connected</h2>
        <p className="text-muted-foreground">
          Please connect your wallet to continue.
        </p>
      </div>
      <ConnectButton />
    </div>
  );
};

export default Auth;

