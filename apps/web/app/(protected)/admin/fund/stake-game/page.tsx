import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FundPool } from "@/components/admin/fund-pool";

export default async function StakeGameFundPage() {
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
            Stake Game Pool Management
          </h1>
          <p className="text-muted-foreground">
            Manage the stake game pool and platform fees
          </p>
        </div>
        <FundPool />
      </div>
    </div>
  );
}
