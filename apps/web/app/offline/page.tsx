"use client";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <WifiOff className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="mt-6 text-4xl font-bold">You&apos;re Offline</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          It looks like you&apos;ve lost your internet connection.
        </p>
        <p className="mt-2 text-muted-foreground">
          Some cached content may still be available.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
