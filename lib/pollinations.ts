import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildModelChain } from "@/lib/model-options";
import type { TaskMode } from "@/lib/types";

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

  return {
    raw: extractJsonObject(content),
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
