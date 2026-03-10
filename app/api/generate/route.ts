import { NextResponse } from "next/server";
import { generateHeuristicModeResult } from "@/lib/heuristic";
import { normalizeModelResult } from "@/lib/normalize";
import { callPollinations } from "@/lib/pollinations";
import { resolvePollenKey } from "@/lib/resolve-pollen-key";
import { validateVexResult } from "@/lib/validate-result";
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
      const result = generateHeuristicModeResult(
        mode,
        prompt,
        context,
        "No Pollinations key is connected, so the app is using the local heuristic generator."
      );
      result.validation_notes = validateVexResult(result);
      return NextResponse.json(result);
    }

    try {
      const response = await callPollinations(prompt, context, mode, apiKey, preferredModel);
      const result = normalizeModelResult(response.raw, prompt, mode, context, response.modelUsed);
      result.validation_notes = validateVexResult(result);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown model error.";
      const result = generateHeuristicModeResult(
        mode,
        prompt,
        context,
        `Pollinations failed, so the app fell back to the local heuristic generator. ${message}`
      );
      result.validation_notes = validateVexResult(result);
      return NextResponse.json(result);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
