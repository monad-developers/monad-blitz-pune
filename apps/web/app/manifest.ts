import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Monad Arcade - Blockchain Gaming Platform",
    short_name: "Monad Arcade",
    description:
      "Play and create blockchain games on Monadrand. Features AI-powered game generation, competitive multiplayer, and score-based arcade games with leaderboards and rewards.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    categories: ["games", "entertainment", "blockchain"],
    screenshots: [
      {
        src: "/banner.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
      },
    ],
    shortcuts: [
      {
        name: "Games",
        short_name: "Games",
        description: "Browse all available games",
        url: "/games",
        icons: [{ src: "/games/slither.png", sizes: "96x96" }],
      },
      {
        name: "AI Game Generator",
        short_name: "AI Generator",
        description: "Create games with AI",
        url: "/ai",
        icons: [{ src: "/Gems.svg", sizes: "96x96" }],
      },
      {
        name: "Leaderboard",
        short_name: "Leaderboard",
        description: "View game leaderboards",
        url: "/leaderboard",
        icons: [{ src: "/happypaaji.png", sizes: "96x96" }],
      },
      {
        name: "Profile",
        short_name: "Profile",
        description: "View your profile and stats",
        url: "/profile",
        icons: [{ src: "/paaji.png", sizes: "96x96" }],
      },
    ],
    orientation: "any",
    scope: "/",
    lang: "en-US",
    dir: "ltr",
  };
}
