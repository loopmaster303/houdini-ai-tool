"use client";

import { startTransition, useState } from "react";
import { motion } from "framer-motion";
import { CodePanel } from "@/components/CodePanel";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { ParamsPanel } from "@/components/ParamsPanel";
import { PromptPanel } from "@/components/PromptPanel";
import { getPollenHeaders } from "@/lib/pollen-key";
import type { ParamMap, ParameterValue, VexResult } from "@/lib/types";
import { getDefaultParamMap } from "@/lib/utils";

const EXAMPLES = [
  "Organic mask from curvature + height",
  "Wobble on tips with speed and amplitude",
  "Growth noise along curves",
  "Procedural color variation",
];

export default function HomePage() {
  const [prompt, setPrompt] = useState(
    "Build me a point wrangle that creates an organic mask over the surface using height and noise, with controls for frequency, contrast, and displacement strength."
  );
  const [result, setResult] = useState<VexResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<ParamMap>({});

  async function generate(nextPrompt?: string) {
    const activePrompt = (nextPrompt ?? prompt).trim();
    if (!activePrompt) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getPollenHeaders(),
        },
        body: JSON.stringify({ prompt: activePrompt }),
      });

      const payload = (await response.json()) as VexResult | { error: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Generation failed.");
      }

      startTransition(() => {
        setPrompt(activePrompt);
        setResult(payload);
        setParams(getDefaultParamMap(payload.parameters));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";

      startTransition(() => {
        setResult({
          intent: "organic",
          output_attribute: "f@mask",
          vex_code: "// Generation failed. Try again.",
          parameters: [],
          class: "points",
          explanation: "The request could not be generated.",
          assumptions: message,
          source: "heuristic",
        });
        setParams({});
      });
    } finally {
      setLoading(false);
    }
  }

  function handleParamChange(name: string, value: ParameterValue) {
    setParams((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Idea to VEX</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">Prompt in. VEX out. Sliders extracted.</h1>
          </div>
          <motion.div
            animate={loading ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
            transition={loading ? { repeat: Number.POSITIVE_INFINITY, duration: 1.2 } : { duration: 0.2 }}
            className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400"
          >
            {loading ? "Generating Houdini-ready VEX..." : "Claude via Pollinations or heuristic fallback"}
          </motion.div>
        </div>

        <div className="grid min-h-[calc(100vh-7.5rem)] grid-cols-1 gap-4 xl:grid-cols-[1fr_1.5fr_1fr]">
          <PromptPanel
            prompt={prompt}
            loading={loading}
            result={result}
            examples={EXAMPLES}
            onPromptChange={setPrompt}
            onSubmit={() => void generate()}
            onExampleClick={(value) => {
              setPrompt(value);
              void generate(value);
            }}
          />

          <div className="grid min-h-[640px] grid-rows-[minmax(260px,0.9fr)_minmax(320px,1.1fr)] gap-4">
            <ParamsPanel result={result} params={params} onParamChange={handleParamChange} />
            <CodePanel prompt={prompt} result={result} params={params} />
          </div>

          <ExplanationPanel result={result} />
        </div>
      </div>
    </main>
  );
}
