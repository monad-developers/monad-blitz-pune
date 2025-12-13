"use client";

import { AnimatedThemeToggler } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Copy, LogIn, LogOut, Shield, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { useState } from "react";
import { ellipseAddress } from "@/utils/ellipseAddress";
import Image from "next/image";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { address: activeAddress } = useAccount();
  const { data: balanceData, isLoading: loadingBalance } = useBalance({
    address: activeAddress,
  });
  const [isCopying, setIsCopying] = useState(false);

  const balance = balanceData ? Number(balanceData.formatted) : null;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "super-admin";

  const handleCopyAddress = async () => {
    if (!activeAddress) {
      return;
    }
    try {
      await navigator.clipboard.writeText(activeAddress);
      setIsCopying(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setIsCopying(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {session && <SidebarTrigger />}
          {!session && (
            <Link href="/">
              <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Image height={24} width={24} src="/android-chrome-192x192.png" alt="Monad Arcade Logo" className="h-8 w-8" />
                Monad Arcade
              </h1>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <AnimatedThemeToggler />

          {/* RainbowKit ConnectButton */}
          <ConnectButton
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
            chainStatus="icon"
          />

          {/* User Authentication Dropdown */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user?.image || undefined}
                      alt={session.user?.name || "User"}
                    />
                    <AvatarFallback>
                      {getInitials(session.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                    {session.user?.role && (
                      <p className="text-xs leading-none text-muted-foreground">
                        Role: {session.user.role}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/admin")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/sign-in")}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
