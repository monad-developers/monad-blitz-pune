"use client";

import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Account() {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  if (!address) {
    return null;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Connected Account</span>
          <span className="font-mono text-sm font-medium">{shortenedAddress}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default Account;

