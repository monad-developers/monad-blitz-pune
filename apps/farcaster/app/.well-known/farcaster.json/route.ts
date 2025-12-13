import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add your own account association
    frame: {
      version: "1",
      name: "Monad Arcade",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "games", "arcade", "rock-paper-scissors", "casual-games"],
      primaryCategory: "entertainment",
      buttonTitle: "Play Games",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#7c3aed",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
