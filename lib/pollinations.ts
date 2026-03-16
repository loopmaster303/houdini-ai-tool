import { buildModelChain } from "@/lib/model-options";
import type { TaskMode } from "@/lib/types";
import { normalizeModelResult } from "@/lib/normalize";
import { getPromptForMode, getRepairPrompt } from "@/lib/prompts";
import { getValidationReport } from "@/lib/validate-result";

export const POLLINATIONS_CHAT_URL = "https://gen.pollinations.ai/v1/chat/completions";

export function buildPollinationsChatRequestBody(systemPrompt: string, userContent: string, model: string) {
  return {
    model,
    messages: [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userContent },
    ],
    response_format: { type: "json_object" as const },
    max_tokens: 2000,
  };
}

function extractMessageText(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }

        return "";
      })
      .join("\n");
  }

  return "";
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const deFenced = trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    const start = deFenced.indexOf("{");
    const end = deFenced.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model response did not contain a JSON object.");
    }

    return JSON.parse(deFenced.slice(start, end + 1));
  }
}

async function requestModelText(systemPrompt: string, userContent: string, apiKey: string, model: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(POLLINATIONS_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildPollinationsChatRequestBody(systemPrompt, userContent, model)),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      const error = new Error(`Pollinations request failed for ${model}: ${response.status} ${detail}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    const content = extractMessageText(json.choices?.[0]?.message?.content);
    if (!content.trim()) {
      throw new Error(`Pollinations returned an empty message for ${model}.`);
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function buildUserContent(prompt: string, context: string, mode: TaskMode) {
  const normalizedContext =
    context.trim().length > 8000 ? `${context.trim().slice(0, 8000)}\n...[truncated]` : context.trim();

  return [
    `TASK MODE: ${mode}`,
    `USER PROMPT:\n${prompt}`,
    normalizedContext ? `HOUDINI CONTEXT:\n${normalizedContext}` : "HOUDINI CONTEXT:\n(none supplied)",
    mode === "build"
      ? [
          "BUILD CHECKLIST:",
          "- return Houdini Attribute Wrangle VEX only in vex_code",
          "- every exposed control must use chf, chi, or chb",
          "- do not use GLSL or JS tokens such as vec3, fract, rotateX, rotateY, rotateZ",
          "- prefer points unless the effect truly requires primitives, detail, or vertices",
          '- for curve progression prefer f@curveu when available, otherwise derive a stable 0-1 value such as relbbox(0, @P).y',
        ].join("\n")
      : "ANALYSIS CHECKLIST:\n- be Houdini-specific\n- rank likely causes or key nodes\n- keep the answer concrete and short",
  ].join("\n\n");
}

async function attemptRepair(
  prompt: string,
  context: string,
  apiKey: string,
  model: string,
  brokenContent: string,
  failures: string[]
) {
  const repairPrompt = await getRepairPrompt();
  const userContent = [
    "TASK MODE: build",
    `ORIGINAL USER PROMPT:\n${prompt}`,
    context.trim() ? `HOUDINI CONTEXT:\n${context.trim()}` : "HOUDINI CONTEXT:\n(none supplied)",
    `VALIDATION FAILURES:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
    `BROKEN RESPONSE TO FIX:\n${brokenContent}`,
  ].join("\n\n");

  return requestModelText(repairPrompt, userContent, apiKey, model);
}

async function requestBuildCandidate(prompt: string, context: string, apiKey: string, model: string) {
  const systemPrompt = await getPromptForMode("build");
  const userContent = buildUserContent(prompt, context, "build");
  const initialContent = await requestModelText(systemPrompt, userContent, apiKey, model);

  let initialRaw: unknown;
  try {
    initialRaw = extractJsonObject(initialContent);
  } catch (error) {
    const repairedContent = await attemptRepair(prompt, context, apiKey, model, initialContent, [
      error instanceof Error ? error.message : "Invalid JSON response.",
    ]);
    const repairedRaw = extractJsonObject(repairedContent);
    const repairedResult = normalizeModelResult(repairedRaw, prompt, "build", context, model);
    const repairedReport = getValidationReport(repairedResult);
    if (repairedReport.hardFailures.length > 0) {
      throw new Error(`Repair failed for ${model}: ${repairedReport.hardFailures.join(" | ")}`);
    }
    return { raw: repairedRaw, modelUsed: model, repairAttempted: true };
  }

  const initialResult = normalizeModelResult(initialRaw, prompt, "build", context, model);
  const initialReport = getValidationReport(initialResult);
  if (initialReport.hardFailures.length === 0) {
    return { raw: initialRaw, modelUsed: model, repairAttempted: false };
  }

  const repairedContent = await attemptRepair(prompt, context, apiKey, model, initialContent, initialReport.hardFailures);
  const repairedRaw = extractJsonObject(repairedContent);
  const repairedResult = normalizeModelResult(repairedRaw, prompt, "build", context, model);
  const repairedReport = getValidationReport(repairedResult);

  if (repairedReport.hardFailures.length > 0) {
    throw new Error(`Repair failed for ${model}: ${repairedReport.hardFailures.join(" | ")}`);
  }

  return { raw: repairedRaw, modelUsed: model, repairAttempted: true };
}

async function requestAnalysisCandidate(prompt: string, context: string, mode: Exclude<TaskMode, "build">, apiKey: string, model: string) {
  const systemPrompt = await getPromptForMode(mode);
  const content = await requestModelText(systemPrompt, buildUserContent(prompt, context, mode), apiKey, model);
  const raw = extractJsonObject(content);
  const result = normalizeModelResult(raw, prompt, mode, context, model);

  if (!result.analysis_text.trim()) {
    throw new Error(`Model ${model} returned no analysis text for ${mode} mode.`);
  }

  return { raw, modelUsed: model, repairAttempted: false };
}

export async function callPollinations(prompt: string, context: string, mode: TaskMode, apiKey: string, preferredModel?: string) {
  if (!apiKey.trim()) {
    throw new Error("Missing Pollinations API key.");
  }

  const models = buildModelChain(preferredModel);
  const failures: string[] = [];

  for (const model of models) {
    try {
      if (mode === "build") {
        return await requestBuildCandidate(prompt, context, apiKey, model);
      }

      return await requestAnalysisCandidate(prompt, context, mode, apiKey, model);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unknown failure for ${model}.`;
      const status = error instanceof Error && "status" in error ? Number((error as Error & { status?: number }).status) : undefined;

      // Auth errors will not improve by trying a different model.
      if (status === 401 || status === 403) {
        throw new Error(message);
      }

      failures.push(message);
    }
  }

  throw new Error(failures.join(" | "));
}
