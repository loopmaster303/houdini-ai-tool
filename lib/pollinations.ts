import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildModelChain } from "@/lib/model-options";
import type { TaskMode } from "@/lib/types";
import { extractChannelRefs, findSuspiciousVexTokens } from "@/lib/vex";

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

function validateModelPayload(raw: unknown, mode: TaskMode, model: string) {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  if (mode === "build") {
    const code = String(source.vex_code ?? source.code ?? "").trim();
    if (!code) {
      throw new Error(`Model ${model} returned no VEX code.`);
    }

    if (code.includes("```")) {
      throw new Error(`Model ${model} returned fenced code instead of raw VEX.`);
    }

    const suspiciousTokens = findSuspiciousVexTokens(code);
    if (suspiciousTokens.length > 0) {
      throw new Error(`Model ${model} returned suspicious non-VEX tokens: ${suspiciousTokens.join(", ")}.`);
    }

    const channelRefs = extractChannelRefs(code);
    if (channelRefs.length === 0) {
      throw new Error(`Model ${model} returned build output without chf/chi/chb controls.`);
    }

    const parameterList = Array.isArray(source.parameters ?? source.params)
      ? ((source.parameters ?? source.params) as Array<Record<string, unknown>>)
      : [];

    for (const parameter of parameterList) {
      const rawName = String(parameter.name ?? "").trim().toLowerCase();
      if (!rawName) {
        continue;
      }

      const matches = channelRefs.some((ref) => ref.name === rawName);
      if (!matches) {
        throw new Error(`Model ${model} declared parameter "${rawName}" but did not use it in VEX.`);
      }
    }

    return;
  }

  const analysisText = String(source.analysis_text ?? source.explanation ?? "").trim();
  if (!analysisText) {
    throw new Error(`Model ${model} returned no analysis text for ${mode} mode.`);
  }
}

let cachedSystemPrompt: string | null = null;

async function getSystemPrompt() {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  cachedSystemPrompt = await readFile(path.join(process.cwd(), "prompts/system.md"), "utf8");
  return cachedSystemPrompt;
}

async function requestModel(prompt: string, context: string, mode: TaskMode, apiKey: string, model: string) {
  const systemPrompt = await getSystemPrompt();
  const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            `TASK MODE: ${mode}`,
            `USER PROMPT:\n${prompt}`,
            context.trim() ? `HOUDINI CONTEXT:\n${context.trim()}` : "HOUDINI CONTEXT:\n(none supplied)",
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
          ].join("\n\n"),
        },
      ],
      max_tokens: 2000,
    }),
    cache: "no-store",
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

  const raw = extractJsonObject(content);
  validateModelPayload(raw, mode, model);

  return {
    raw,
    modelUsed: model,
  };
}

export async function callPollinations(prompt: string, context: string, mode: TaskMode, apiKey: string, preferredModel?: string) {
  if (!apiKey.trim()) {
    throw new Error("Missing Pollinations API key.");
  }

  const models = buildModelChain(preferredModel);
  const failures: string[] = [];

  for (const model of models) {
    try {
      return await requestModel(prompt, context, mode, apiKey, model);
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
