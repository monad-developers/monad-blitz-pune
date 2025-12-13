"use client";

import Link from "next/link";
import { useState } from "react";
import { Gamepad2, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const funnyMessages = [
  "Looks like you found a secret level! Just kidding, this page doesn't exist.",
  "404: Game Over. But don't worry, you have infinite continues!",
  "This page went to touch grass. It never came back.",
  "Even our AI couldn't generate this page. And it can make entire games!",
  "You've discovered the legendary Page of Nothingness. Achievement unlocked: Lost.",
  "This page is in another castle. 🏰",
  "Error 404: Page not found. Try pressing Start to continue.",
  "Oops! This page got yeeted into the blockchain void.",
  "This page is more lost than a noob in their first battle royale.",
  "Congratulations! You found the one thing we don't have.",
];

const tips = [
  "Pro tip: Check the URL for typos",
  "Fun fact: 404 pages are a great way to practice your clicking skills",
  "Did you know? This error code was named after a room at CERN",
  "Remember: Not all who wander are lost... but this page definitely is",
  "Tip: When in doubt, go back to the homepage",
];

export default function NotFoundPage() {
  // useState with lazy initializer ensures Math.random() is only called once during initialization
  // This satisfies React 19's purity requirements
  const [message] = useState(
    () => funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
  );
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);
  const [score] = useState(() => Math.floor(Math.random() * 9999));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold tracking-tighter opacity-10">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Gamepad2 className="h-24 w-24 animate-pulse text-primary" />
          </div>
        </div>

        {/* Main heading */}
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Level Not Found
        </h2>

        {/* Funny message */}
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-lg text-muted-foreground">
            {message || "This page seems to have wandered off..."}
          </p>
        </div>

        {/* Game stats mockup */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Score: {score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            <span>Lives: ∞</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⭐</span>
            <span>Coins: 0</span>
          </div>
        </div>

        {/* Tip */}
        <div className="mb-8 rounded-md bg-muted/50 p-3">
          <p className="text-sm italic text-muted-foreground">
            💡 {tip || "Tip: Try navigating back to safety"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Return to Home Base
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/games">
              <Gamepad2 className="h-4 w-4" />
              Browse Games
            </Link>
          </Button>
        </div>

        {/* Easter egg */}
        <div className="mt-12 text-xs text-muted-foreground">
          <p>
            Press{" "}
            <kbd className="rounded border border-muted-foreground/20 bg-muted px-2 py-1 font-mono">
              ESC
            </kbd>{" "}
            to exit... oh wait, this isn&apos;t a game. Or is it? 🤔
          </p>
        </div>
      </div>
    </div>
  );
}
