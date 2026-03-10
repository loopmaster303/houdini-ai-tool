import { NextResponse } from "next/server";
import { generateHeuristicResult } from "@/lib/heuristic";
import { normalizeModelResult } from "@/lib/normalize";
import { callPollinations } from "@/lib/pollinations";
import { resolvePollenKey } from "@/lib/resolve-pollen-key";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim() || "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const apiKey = resolvePollenKey(request);

    if (!apiKey) {
      return NextResponse.json(
        generateHeuristicResult(
          prompt,
          "No Pollinations key is connected, so the app is using the local heuristic generator."
        )
      );
    }

    try {
      const raw = await callPollinations(prompt, apiKey);
      return NextResponse.json(normalizeModelResult(raw, prompt));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown model error.";
      return NextResponse.json(
        generateHeuristicResult(
          prompt,
          `Pollinations failed, so the app fell back to the local heuristic generator. ${message}`
        )
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
