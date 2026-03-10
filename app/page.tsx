"use client";

import { startTransition, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CodePanel } from "@/components/CodePanel";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { ParamsPanel } from "@/components/ParamsPanel";
import { PromptPanel } from "@/components/PromptPanel";
import { DEFAULT_MODEL_ID, RECOMMENDED_MODEL_OPTIONS } from "@/lib/model-options";
import { getPollenHeaders } from "@/lib/pollen-key";
import type { ParamMap, ParameterValue, TaskMode, VexResult } from "@/lib/types";
import { prettyMode } from "@/lib/utils";
import { getDefaultParamMap } from "@/lib/utils";

const MODE_CONFIG = {
  build: {
    examples: [
      "Organic mask from curvature + height",
      "Wobble on tips with speed and amplitude",
      "Growth noise along curves",
      "Procedural color variation",
    ],
    promptPlaceholder:
      "Build me a point wrangle that creates an organic mask over the surface using height and noise, with controls for frequency, contrast, and displacement strength.",
    contextPlaceholder:
      "Paste selected node paths, wrangle snippets, parm values, expected attributes, or a quick network summary here...",
    sampleContext: "",
  },
  explain: {
    examples: [
      "Explain the intent and data flow of this growth setup",
      "What is this solver network doing from frame to frame?",
      "Summarize this wrangle-heavy SOP chain for a handoff",
      "Explain which attributes are probably driving the final deformation",
    ],
    promptPlaceholder:
      "Explain what this Houdini network is doing, how data flows through it, and which nodes are the key decision points.",
    contextPlaceholder:
      "Paste selected node names, network notes, wrangle snippets, or a quick SOP chain summary here...",
    sampleContext: `Selected nodes:
/obj/geo1/attribnoise1
/obj/geo1/attribwrangle2
/obj/geo1/color1

Quick notes:
- attribnoise1 creates pscale and mask variation
- attribwrangle2 writes f@mask and offsets @P along @N
- color1 remaps f@mask into Cd
- Output is copied to points later in the network`,
  },
  debug: {
    examples: [
      "Debug why this growth wrangle only affects some points",
      "Why is this displacement setup exploding on animated geo?",
      "Find the most likely issue in this Copy to Points orientation chain",
      "Why does this VDB-to-mesh setup look faceted and unstable?",
    ],
    promptPlaceholder:
      "Debug why this Houdini setup is failing, what the most likely causes are, and what I should check first.",
    contextPlaceholder:
      "Paste error messages, node paths, expected attributes, wrangle code, parm values, or a quick summary of what is broken...",
    sampleContext: `Node: /obj/geo1/attribwrangle3
Type: Attribute Wrangle (Points)
Goal: grow mask from root to tip on curves

Relevant code:
float u = f@curveu;
float growth = chf("growth");
f@mask = smooth(growth - 0.1, growth, u);
@P += @N * f@mask * chf("displace");

Problem:
- only some curves react
- others stay at zero
- displacement pops when topology changes
- spreadsheet shows curveu missing on several branches`,
  },
} satisfies Record<
  TaskMode,
  {
    examples: string[];
    promptPlaceholder: string;
    contextPlaceholder: string;
    sampleContext: string;
  }
>;

export default function HomePage() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [selectedMode, setSelectedMode] = useState<TaskMode>("build");
  const [prompt, setPrompt] = useState(
    "Build me a point wrangle that creates an organic mask over the surface using height and noise, with controls for frequency, contrast, and displacement strength."
  );
  const [contextText, setContextText] = useState("");
  const [result, setResult] = useState<VexResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<ParamMap>({});
  const modeConfig = MODE_CONFIG[selectedMode];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("preferredPollenModel");
      if (stored && RECOMMENDED_MODEL_OPTIONS.some((model) => model.id === stored)) {
        setSelectedModel(stored);
      }
    } catch {
      // Ignore storage access issues.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("preferredPollenModel", selectedModel);
    } catch {
      // Ignore storage access issues.
    }
  }, [selectedModel]);

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
        body: JSON.stringify({ prompt: activePrompt, context: contextText, mode: selectedMode, preferredModel: selectedModel }),
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
          task_mode: selectedMode,
          response_kind: selectedMode === "build" ? "code" : "analysis",
          intent: "organic",
          output_attribute: "f@mask",
          vex_code: selectedMode === "build" ? "// Generation failed. Try again." : "",
          analysis_text: selectedMode === "build" ? "" : "Generation failed. Try again.",
          parameters: [],
          class: "points",
          explanation: "The request could not be generated.",
          assumptions: message,
          source: "heuristic",
          validation_notes:
            selectedMode === "build"
              ? ["Generation failed before a VEX result could be validated."]
              : ["Generation failed before an analysis result could be reviewed."],
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
            {loading ? `Running ${prettyMode(selectedMode)}...` : `${selectedModel} in ${prettyMode(selectedMode)} mode with fallback chain`}
          </motion.div>
        </div>

        <div className="grid min-h-[calc(100vh-7.5rem)] grid-cols-1 gap-4 xl:grid-cols-[1fr_1.5fr_1fr]">
          <PromptPanel
            prompt={prompt}
            contextText={contextText}
            selectedMode={selectedMode}
            loading={loading}
            result={result}
            examples={modeConfig.examples}
            promptPlaceholder={modeConfig.promptPlaceholder}
            contextPlaceholder={modeConfig.contextPlaceholder}
            selectedModel={selectedModel}
            onContextChange={setContextText}
            onLoadSampleContext={() => setContextText(modeConfig.sampleContext)}
            onModeChange={setSelectedMode}
            onModelChange={setSelectedModel}
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
