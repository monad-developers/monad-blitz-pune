import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { FundRewards } from "@/components/admin/fund-rewards";

export default async function RewardsFundPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Rewards Pool Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage and fund the GameRewards contract pool for milestone rewards
        </p>
      </div>
      <FundRewards />
    </div>
  );
}
