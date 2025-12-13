import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { router } from "@/lib/router";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const generator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });

  const spec = await generator.generate(router, {
    info: {
      title: "Monadrand Game Aggregator API",
      version: "1.0.0",
      description:
        "API for Monadrand Game Aggregator - handle game data aggregation, user management, and transaction processing",
    },
    servers: [
      {
        url: "/rpc",
        description: "RPC endpoint",
      },
    ],
  });

  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
