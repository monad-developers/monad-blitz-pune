"use client";

import { useAccount, useBalance } from "wagmi";
import { Wallet } from "lucide-react";

export function Balance() {
  const { address } = useAccount();
  const { data, isLoading } = useBalance({
    address,
  });

  if (!address) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium">
      <Wallet className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">Balance:</span>
      <span className="font-mono font-semibold">
        {isLoading
          ? "..."
          : data
          ? `${Number(data.formatted).toFixed(4)} ${data.symbol}`
          : "Error"}
      </span>
    </div>
  );
}

export default Balance;

