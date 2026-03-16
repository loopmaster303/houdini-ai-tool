import { NextResponse } from "next/server";
import { generateResult } from "@/lib/generate";
import { resolvePollenKey } from "@/lib/resolve-pollen-key";
import type { TaskMode } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string; context?: string; mode?: TaskMode; preferredModel?: string };
    const prompt = body.prompt?.trim() || "";
    const context = body.context?.trim() || "";
    const mode = body.mode === "explain" || body.mode === "debug" ? body.mode : "build";
    const preferredModel = body.preferredModel?.trim() || undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const apiKey = resolvePollenKey(request);
    const result = await generateResult({ prompt, context, mode, preferredModel, apiKey });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
