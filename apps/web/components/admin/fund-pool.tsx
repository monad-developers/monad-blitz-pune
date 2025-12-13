"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWalletClient, useChainId, useSwitchChain } from "wagmi";
import { ethers } from "ethers";
import { StakeGameClient } from "@/contracts/StakeGame";
import { toast } from "sonner";
import { env } from "@/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  ArrowUpCircle,
  RefreshCw,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const MONAD_TO_WEI = BigInt(10 ** 18);
const MONAD_TESTNET_CHAIN_ID = 10143;

export function FundPool() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [fundAmount, setFundAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [poolBalance, setPoolBalance] = useState<bigint>(BigInt(0));
  const [platformFees, setPlatformFees] = useState<bigint>(BigInt(0));
  const [gameStatus, setGameStatus] = useState<bigint>(BigInt(0));

  // Get contract client
  const getContractClient = useCallback(async () => {
    if (!address) {
      return null;
    }

    try {
      const rpcUrl = env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      let signer: ethers.Signer | undefined;
      if (walletClient) {
        const browserProvider = new ethers.BrowserProvider(walletClient as any);
        signer = await browserProvider.getSigner();
      } else if (typeof window !== "undefined" && (window as any).ethereum) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        signer = await browserProvider.getSigner();
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

  // Fetch pool data
  const fetchPoolData = useCallback(async () => {
    if (!address) return;

    // Check if contract is configured
    if (!env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS) {
      console.error("Contract address not configured");
      return;
    }

    setIsFetching(true);
    try {
      const appClient = await getContractClient();
      if (!appClient) {
        toast.error("Failed to initialize contract client");
        return;
      }

      const [totalPool, fees, status] = await Promise.all([
        appClient.getTotalPool(),
        appClient.getPlatformFees(),
        appClient.getGameStatus(),
      ]);

      setPoolBalance(totalPool);
      setPlatformFees(fees);
      setGameStatus(status);
    } catch (error) {
      console.error("Failed to fetch pool data:", error);
      const errorMessage = (error as Error).message;
      toast.error("Failed to fetch pool data", {
        description: errorMessage.substring(0, 100),
      });
    } finally {
      setIsFetching(false);
    }
  }, [address, getContractClient]);

  // Fund pool
  const handleFundPool = useCallback(async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check network
    if (chainId !== MONAD_TESTNET_CHAIN_ID) {
      try {
        await switchChain({ chainId: MONAD_TESTNET_CHAIN_ID });
        toast.info("Switching to Monad Testnet...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        toast.error("Please switch your wallet to Monad Testnet (Chain ID: 10143)");
        return;
      }
    }

    setIsLoading(true);
    try {
      const appClient = await getContractClient();
      if (!appClient) {
        throw new Error("Failed to get contract client");
      }

      const amountInWei = ethers.parseEther(fundAmount);

      // Call fundPool() - payable function
      const tx = await appClient.fundPool(amountInWei);
      await tx.wait();

      toast.success(`Successfully funded pool with ${fundAmount} MONAD!`);
      setFundAmount("");

      // Refresh data
      setTimeout(() => fetchPoolData(), 1500);
    } catch (error) {
      console.error("Fund pool failed:", error);
      toast.error(`Failed to fund pool: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    fundAmount,
    address,
    chainId,
    switchChain,
    getContractClient,
    fetchPoolData,
  ]);

  // Withdraw platform fees
  const handleWithdrawFees = useCallback(async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (platformFees === BigInt(0)) {
      toast.error("No fees to withdraw");
      return;
    }

    // Check network
    if (chainId !== MONAD_TESTNET_CHAIN_ID) {
      try {
        await switchChain({ chainId: MONAD_TESTNET_CHAIN_ID });
        toast.info("Switching to Monad Testnet...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        toast.error("Please switch your wallet to Monad Testnet (Chain ID: 10143)");
        return;
      }
    }

    setIsLoading(true);
    try {
      const appClient = await getContractClient();
      if (!appClient) {
        throw new Error("Failed to get contract client");
      }

      const tx = await appClient.withdrawPlatformFees();
      await tx.wait();

      const feesInMonad = Number(platformFees) / Number(MONAD_TO_WEI);
      toast.success(
        `Successfully withdrew ${feesInMonad.toFixed(4)} MONAD in platform fees!`
      );

      // Refresh data
      setTimeout(() => fetchPoolData(), 1500);
    } catch (error) {
      console.error("Withdraw fees failed:", error);
      toast.error(`Failed to withdraw fees: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    address,
    chainId,
    switchChain,
    getContractClient,
    platformFees,
    fetchPoolData,
  ]);

  // Emergency withdraw
  const handleEmergencyWithdraw = useCallback(async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (poolBalance === BigInt(0)) {
      toast.error("No funds in pool to withdraw");
      return;
    }

    // Check network
    if (chainId !== MONAD_TESTNET_CHAIN_ID) {
      try {
        await switchChain({ chainId: MONAD_TESTNET_CHAIN_ID });
        toast.info("Switching to Monad Testnet...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        toast.error("Please switch your wallet to Monad Testnet (Chain ID: 10143)");
        return;
      }
    }

    setIsLoading(true);
    try {
      const appClient = await getContractClient();
      if (!appClient) {
        throw new Error("Failed to get contract client");
      }

      const tx = await appClient.emergencyWithdraw();
      await tx.wait();

      const poolInMonad = Number(poolBalance) / Number(MONAD_TO_WEI);
      toast.success(
        `Successfully withdrew ${poolInMonad.toFixed(4)} MONAD from pool!`
      );

      // Refresh data
      setTimeout(() => fetchPoolData(), 1500);
    } catch (error) {
      console.error("Emergency withdraw failed:", error);
      toast.error(`Failed to withdraw: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    address,
    chainId,
    switchChain,
    getContractClient,
    poolBalance,
    fetchPoolData,
  ]);

  // Fetch data on mount and wallet change
  useEffect(() => {
    if (address) {
      fetchPoolData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // Only re-run when address changes

  const poolBalanceInMonad = Number(poolBalance) / Number(MONAD_TO_WEI);
  const platformFeesInMonad = Number(platformFees) / Number(MONAD_TO_WEI);
  const gameStatusText =
    gameStatus === BigInt(0)
      ? "Waiting"
      : gameStatus === BigInt(1)
      ? "Active"
      : "Finished";
  const gameStatusColor =
    gameStatus === BigInt(0)
      ? "secondary"
      : gameStatus === BigInt(1)
      ? "default"
      : "destructive";

  if (!env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-500">
            Contract Not Deployed
          </CardTitle>
          <CardDescription>
            The StakeGame contract has not been deployed yet. Please deploy the
            contract first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>To deploy the contract:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>
              Navigate to{" "}
              <code className="bg-zinc-800 px-1 py-0.5 rounded">
                apps/monad
              </code>
            </li>
            <li>
              Run{" "}
              <code className="bg-zinc-800 px-1 py-0.5 rounded">
                bun run deploy:stake-game
              </code>
            </li>
            <li>
              Update the environment variables with the new contract address
            </li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected || !address) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Please connect your wallet to manage the stake pool
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pool Balance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {poolBalanceInMonad.toFixed(4)} MONAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for bot stakes
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {platformFeesInMonad.toFixed(4)} MONAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              10% of all stakes
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Game Status</CardTitle>
            <Badge
              variant={
                gameStatusColor as "default" | "secondary" | "destructive"
              }
            >
              {gameStatusText}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS
                ? `${env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS.slice(0, 6)}...${env.NEXT_PUBLIC_STAKE_GAME_CONTRACT_ADDRESS.slice(-4)}`
                : "Not Configured"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contract Address
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fund Pool Card */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                Fund Pool
              </CardTitle>
              <CardDescription className="mt-1">
                Add MONAD to the pool for bot stakes
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchPoolData}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fundAmount">Amount (MONAD)</Label>
            <Input
              id="fundAmount"
              type="number"
              placeholder="Enter amount in MONAD"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              min="0"
              step="0.1"
              className="bg-zinc-950 border-zinc-700"
            />
          </div>
          <Button
            onClick={handleFundPool}
            disabled={isLoading || !fundAmount}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "Processing..." : "Fund Pool"}
          </Button>
        </CardContent>
      </Card>

      {/* Withdraw Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">Withdraw Platform Fees</CardTitle>
            <CardDescription>
              Withdraw accumulated 10% platform fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleWithdrawFees}
              disabled={isLoading || platformFees === BigInt(0)}
              variant="outline"
              className="w-full border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
            >
              {isLoading
                ? "Processing..."
                : `Withdraw ${platformFeesInMonad.toFixed(4)} MONAD`}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">Emergency Withdraw</CardTitle>
            <CardDescription>
              Withdraw all pool funds (only when game is not active)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleEmergencyWithdraw}
              disabled={
                isLoading ||
                poolBalance === BigInt(0) ||
                gameStatus === BigInt(1)
              }
              variant="destructive"
              className="w-full"
            >
              {isLoading
                ? "Processing..."
                : `Withdraw ${poolBalanceInMonad.toFixed(4)} MONAD`}
            </Button>
            {gameStatus === BigInt(1) && (
              <p className="text-xs text-red-400 mt-2">
                Cannot withdraw while game is active
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Info Section */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • The pool holds MONAD used to match player stakes with bot stakes
          </p>
          <p>
            • 10% platform fee is collected from both human and bot stakes on
            every game
          </p>
          <p>
            • Platform fees accumulate separately and can be withdrawn anytime
          </p>
          <p>• Emergency withdraw is only available when no game is active</p>
          <p>
            • When players win, they receive 90% of (player stake + bot stake)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
