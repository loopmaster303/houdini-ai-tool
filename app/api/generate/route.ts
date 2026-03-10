import { NextResponse } from "next/server";
import { generateHeuristicModeResult } from "@/lib/heuristic";
import { normalizeModelResult } from "@/lib/normalize";
import { callPollinations } from "@/lib/pollinations";
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

    if (!apiKey) {
      return NextResponse.json(
        generateHeuristicModeResult(
          mode,
          prompt,
          context,
          "No Pollinations key is connected, so the app is using the local heuristic generator."
        )
      );
    }

    try {
      const response = await callPollinations(prompt, context, mode, apiKey, preferredModel);
      return NextResponse.json(normalizeModelResult(response.raw, prompt, mode, context, response.modelUsed));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown model error.";
      return NextResponse.json(
        generateHeuristicModeResult(
          mode,
          prompt,
          context,
          `Pollinations failed, so the app fell back to the local heuristic generator. ${message}`
        )
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
