import { readFile } from "node:fs/promises";
import path from "node:path";
import type { TaskMode } from "@/lib/types";

const promptCache = new Map<string, string>();

async function loadPromptFile(filename: string) {
  if (promptCache.has(filename)) {
    return promptCache.get(filename) as string;
  }

  const contents = await readFile(path.join(process.cwd(), "prompts", filename), "utf8");
  promptCache.set(filename, contents);
  return contents;
}

export async function getPromptForMode(mode: TaskMode) {
  const base = await loadPromptFile("base.md");

  if (mode === "build") {
    const build = await loadPromptFile("build.md");
    return `${base.trim()}\n\n${build.trim()}`;
  }

  if (mode === "debug") {
    const debug = await loadPromptFile("debug.md");
    return `${base.trim()}\n\n${debug.trim()}`;
  }

  const explain = await loadPromptFile("explain.md");
  return `${base.trim()}\n\n${explain.trim()}`;
}

export async function getRepairPrompt() {
  const base = await loadPromptFile("base.md");
  const build = await loadPromptFile("build.md");
  const repair = await loadPromptFile("repair.md");
  return `${base.trim()}\n\n${build.trim()}\n\n${repair.trim()}`;
}
