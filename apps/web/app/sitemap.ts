import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const currentDate = new Date();

  // Define game slugs
  const games = [
    "head-soccer",
    "rock-paper-scissor",
    "showdown",
    "slither",
    "endless-runner",
    "paaji",
  ];

  // Static routes with their configurations
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  // Dynamic game routes
  const gameRoutes = games.map((game) => ({
    url: `${baseUrl}/games/${game}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic leaderboard routes
  const leaderboardRoutes = games.map((game) => ({
    url: `${baseUrl}/leaderboard/${game}`,
    lastModified: currentDate,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...gameRoutes, ...leaderboardRoutes];
}
