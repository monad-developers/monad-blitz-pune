"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWalletClient, useChainId, useSwitchChain } from "wagmi";
import { ethers } from "ethers";
import { GameRewardsClient } from "@/contracts/GameRewards";
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
  Award,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const MONAD_TO_WEI = BigInt(10 ** 18);
const MONAD_TESTNET_CHAIN_ID = 10143;

export function FundRewards() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [totalPool, setTotalPool] = useState<bigint>(BigInt(0));
  const [totalClaimed, setTotalClaimed] = useState<bigint>(BigInt(0));
  const [availableBalance, setAvailableBalance] = useState<bigint>(BigInt(0));

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

      const contractAddress = env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS;
      if (!contractAddress) {
        return null;
      }

      const appClient = new GameRewardsClient(provider, signer, contractAddress);
      return appClient;
    } catch (error) {
      console.error("Failed to initialize contract client:", error);
      return null;
    }
  }, [address, walletClient]);

  // Fetch pool data
  const fetchPoolData = useCallback(async () => {
    if (!address) return;

    if (!env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS) {
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

      const [pool, claimed, available] = await Promise.all([
        appClient.getTotalPool(),
        appClient.getTotalClaimed(),
        appClient.getAvailableBalance(),
      ]);

      setTotalPool(pool);
      setTotalClaimed(claimed);
      setAvailableBalance(available);
    } catch (error) {
      console.error("Failed to fetch pool data:", error);
      const errorMessage = (error as Error).message;
      toast.error("Failed to fetch pool data", {
        description: errorMessage.substring(0, 100),
      });
    } finally {
      setIsFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

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

      toast.success(
        `Successfully funded rewards pool with ${fundAmount} MONAD!`
      );
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

  // Emergency withdraw
  const handleEmergencyWithdraw = useCallback(async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
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

      const amountInWei = ethers.parseEther(withdrawAmount);

      const tx = await appClient.emergencyWithdraw(amountInWei);
      await tx.wait();

      toast.success(
        `Successfully withdrew ${withdrawAmount} MONAD from rewards pool!`
      );
      setWithdrawAmount("");

      // Refresh data
      setTimeout(() => fetchPoolData(), 1500);
    } catch (error) {
      console.error("Emergency withdraw failed:", error);
      toast.error(`Failed to withdraw: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    withdrawAmount,
    address,
    chainId,
    switchChain,
    getContractClient,
    fetchPoolData,
  ]);

  // Fetch data on mount and wallet change
  useEffect(() => {
    if (address) {
      fetchPoolData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const totalPoolInMonad = Number(totalPool) / Number(MONAD_TO_WEI);
  const totalClaimedInMonad = Number(totalClaimed) / Number(MONAD_TO_WEI);
  const availableBalanceInMonad = Number(availableBalance) / Number(MONAD_TO_WEI);

  if (!env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-500">
            Contract Not Deployed
          </CardTitle>
          <CardDescription>
            The GameRewards contract has not been deployed yet.
          </CardDescription>
        </CardHeader>
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
            Please connect your wallet to manage the rewards pool
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
            <CardTitle className="text-sm font-medium">Total Pool</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPoolInMonad.toFixed(4)} MONAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total rewards funded
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claimed</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClaimedInMonad.toFixed(4)} MONAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rewards distributed
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableBalanceInMonad.toFixed(4)} MONAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to distribute
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
                Fund Rewards Pool
              </CardTitle>
              <CardDescription className="mt-1">
                Add MONAD to the rewards pool
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
            {isLoading ? "Processing..." : "Fund Rewards Pool"}
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Withdraw */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">Emergency Withdraw</CardTitle>
          <CardDescription>
            Withdraw MONAD from the rewards pool (owner only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawAmount">Amount (MONAD)</Label>
            <Input
              id="withdrawAmount"
              type="number"
              placeholder="Enter amount to withdraw"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              min="0"
              step="0.1"
              className="bg-zinc-950 border-zinc-700"
            />
          </div>
          <Button
            onClick={handleEmergencyWithdraw}
            disabled={isLoading || !withdrawAmount}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? "Processing..." : "Withdraw"}
          </Button>
        </CardContent>
      </Card>

      <Separator className="bg-zinc-800" />

      {/* Info Section */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • The rewards pool holds MONAD for distributing milestone rewards to
            players
          </p>
          <p>
            • Total Pool shows all MONAD that has been funded to the contract
          </p>
          <p>• Total Claimed shows how much has been distributed to players</p>
          <p>• Available Balance = Total Pool - Total Claimed</p>
          <p>• Only the contract owner can perform emergency withdrawals</p>
        </CardContent>
      </Card>
    </div>
  );
}
