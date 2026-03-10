import { readFile } from "node:fs/promises";
import path from "node:path";

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

export async function callPollinations(prompt: string, apiKey: string) {
  if (!apiKey.trim()) {
    throw new Error("Missing Pollinations API key.");
  }

  const systemPrompt = await getSystemPrompt();
  const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "claude",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Pollinations request failed: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const content = extractMessageText(json.choices?.[0]?.message?.content);
  if (!content.trim()) {
    throw new Error("Pollinations returned an empty message.");
  }

  return extractJsonObject(content);
}
