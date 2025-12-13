import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserManagement } from "@/components/admin/user-management";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export default async function AdminPage() {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage users and platform resources
            </p>
          </div>
          <Link href="/admin/fund">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Wallet className="mr-2 h-4 w-4" />
              Fund Management
            </Button>
          </Link>
        </div>
        <UserManagement />
      </div>
    </div>
  );
}
