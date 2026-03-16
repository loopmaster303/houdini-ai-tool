import suite from "@/data/regression-prompts.json";
import { generateResult } from "@/lib/generate";
import type { TaskMode } from "@/lib/types";

interface PromptCase {
  id: string;
  mode: TaskMode;
  prompt: string;
  context?: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options: { model?: string; mode?: TaskMode } = {};

  for (const arg of args) {
    if (arg.startsWith("--model=")) {
      options.model = arg.slice("--model=".length);
    } else if (arg.startsWith("--mode=")) {
      const mode = arg.slice("--mode=".length);
      if (mode === "build" || mode === "explain" || mode === "debug") {
        options.mode = mode;
      }
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const cases = (suite as PromptCase[]).filter((entry) => (options.mode ? entry.mode === options.mode : true));
  const apiKey = process.env.POLLEN_API_KEY?.trim() || "";

  console.log(`Smoke suite: ${cases.length} prompts`);
  console.log(`POLLEN_API_KEY: ${apiKey ? "present" : "missing -> heuristic only"}`);
  if (options.model) {
    console.log(`Preferred model: ${options.model}`);
  }
  console.log("");

  let readyCount = 0;
  let reviewCount = 0;
  let fallbackCount = 0;

  for (const entry of cases) {
    const result = await generateResult({
      prompt: entry.prompt,
      context: entry.context || "",
      mode: entry.mode,
      preferredModel: options.model,
      apiKey,
    });

    if (result.readiness === "ready") {
      readyCount += 1;
    } else if (result.readiness === "fallback") {
      fallbackCount += 1;
    } else {
      reviewCount += 1;
    }

    console.log(`=== ${entry.id} ===`);
    console.log(`mode: ${entry.mode}`);
    console.log(`source: ${result.source}`);
    console.log(`provider: ${result.provider_status ?? "-"}`);
    console.log(`model: ${result.model_used ?? "-"}`);
    console.log(`readiness: ${result.readiness}`);
    console.log(`repair: ${result.repair_attempted ? "yes" : "no"}`);
    console.log(`class: ${result.class}`);
    console.log(`output: ${result.output_attribute}`);
    console.log(`notes: ${result.validation_notes && result.validation_notes.length > 0 ? result.validation_notes.join(" | ") : "none"}`);
    console.log("");
  }

  console.log("Summary");
  console.log(`ready: ${readyCount}`);
  console.log(`needs_review: ${reviewCount}`);
  console.log(`fallback: ${fallbackCount}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
