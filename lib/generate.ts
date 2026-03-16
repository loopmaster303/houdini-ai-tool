import { generateHeuristicModeResult } from "@/lib/heuristic";
import { normalizeModelResult } from "@/lib/normalize";
import { callPollinations } from "@/lib/pollinations";
import { applyValidationReport } from "@/lib/validate-result";
import type { TaskMode, VexResult } from "@/lib/types";

export interface GenerateInput {
  prompt: string;
  context?: string;
  mode?: TaskMode;
  preferredModel?: string;
  apiKey?: string;
}

function finalize(result: VexResult, repairAttempted = false) {
  return applyValidationReport({
    ...result,
    repair_attempted: repairAttempted,
  });
}

export async function generateResult(input: GenerateInput): Promise<VexResult> {
  const prompt = input.prompt.trim();
  const context = input.context?.trim() || "";
  const mode = input.mode === "explain" || input.mode === "debug" ? input.mode : "build";
  const preferredModel = input.preferredModel?.trim() || undefined;
  const apiKey = input.apiKey?.trim() || "";

  if (!apiKey) {
    return finalize(
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
    return finalize(normalizeModelResult(response.raw, prompt, mode, context, response.modelUsed), response.repairAttempted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown model error.";
    return finalize(
      generateHeuristicModeResult(
        mode,
        prompt,
        context,
        `Pollinations failed, so the app fell back to the local heuristic generator. ${message}`
      )
    );
  }
}
