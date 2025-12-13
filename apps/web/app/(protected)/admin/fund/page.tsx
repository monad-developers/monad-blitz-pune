import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gamepad2, Award, ArrowRight } from "lucide-react";

export default async function FundIndexPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const isAdmin =
    session.user.role === "admin" || session.user.role === "super-admin";

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Contract Fund Management
          </h1>
          <p className="text-muted-foreground">
            Manage and fund the Monad smart contract pools
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Stake Game Pool */}
          <Link href="/admin/fund/stake-game" className="group">
            <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Gamepad2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Stake Game Pool</CardTitle>
                      <CardDescription className="mt-1">
                        StakeGame Contract
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage the pool for bot stakes in competitive games. Fund the
                  pool, withdraw platform fees, and monitor game status.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-500">
                    Pool Management
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-500">
                    Platform Fees
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">
                    Bot Stakes
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Rewards Pool */}
          <Link href="/admin/fund/rewards" className="group">
            <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Award className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Rewards Pool</CardTitle>
                      <CardDescription className="mt-1">
                        GameRewards Contract
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage milestone rewards pool for player achievements. Fund
                  rewards, track distributions, and emergency withdrawals.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500">
                    Milestone Rewards
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-pink-500/10 text-pink-500">
                    Player Achievements
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-500">
                    Distribution
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">About Contract Pools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Each smart contract has its own dedicated pool for specific
              purposes
            </p>
            <p>
              • Stake Game Pool holds Monad for matching player stakes with bot
              stakes
            </p>
            <p>
              • Rewards Pool holds Monad for distributing milestone achievement
              rewards
            </p>
            <p>
              • All pools support funding, monitoring, and emergency withdrawal
              operations
            </p>
            <p>• Only admin and super-admin roles can access pool management</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
