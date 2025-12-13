import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/games",
          "/games/*",
          "/leaderboard",
          "/leaderboard/*",
          "/pricing",
        ],
        disallow: [
          "/api/*",
          "/sign-in",
          "/sign-in-otp",
          "/profile",
          "/admin",
          "/ai",
          "/ai/*",
          "/arcade",
          "/arcade/*",
          "/history",
          "/rewards",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        disallow: ["/"],
      },
      {
        userAgent: "Google-Extended",
        disallow: ["/"],
      },
      {
        userAgent: "PerplexityBot",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
      {
        userAgent: "Claude-Web",
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
