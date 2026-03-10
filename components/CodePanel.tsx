"use client";

import { useEffect, useMemo, useState } from "react";
import { codeToHtml } from "shiki";
import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import type { ParamMap, VexResult } from "@/lib/types";
import { buildDisplayCode } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CodePanelProps {
  prompt: string;
  result: VexResult | null;
  params: ParamMap;
}

export function CodePanel({ prompt, result, params }: CodePanelProps) {
  const [highlighted, setHighlighted] = useState<{ code: string; html: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const displayCode = useMemo(() => {
    if (!result) {
      return "";
    }

    return buildDisplayCode(prompt, result, params);
  }, [params, prompt, result]);

  useEffect(() => {
    let cancelled = false;

    if (!displayCode) {
      return;
    }

    async function highlight() {
      try {
        const nextHtml = await codeToHtml(displayCode, {
          lang: "c",
          theme: "vitesse-dark",
        });

        if (!cancelled) {
          setHighlighted({ code: displayCode, html: nextHtml });
        }
      } catch {
        // Fall back to the plain preformatted block below.
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [displayCode]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{result?.response_kind === "analysis" ? "Generated Analysis" : "Generated VEX"}</CardTitle>
            <CardDescription>
              {result?.response_kind === "analysis"
                ? "Copy the analysis text directly into notes or a handoff."
                : "Slider changes only rewrite the header comment block."}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              if (!displayCode) {
                return;
              }

              await navigator.clipboard.writeText(displayCode);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
            disabled={!displayCode}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-96px)]">
        {!result ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 text-sm text-zinc-500">
            Generate something first.
          </div>
        ) : (
          <motion.div
            key={displayCode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
          >
            {highlighted?.code === displayCode ? (
              <div
                className="h-full overflow-auto [&_pre]:m-0 [&_pre]:h-full [&_pre]:overflow-auto [&_pre]:p-5 [&_code]:font-mono [&_code]:text-sm"
                dangerouslySetInnerHTML={{ __html: highlighted.html }}
              />
            ) : (
              <pre className="h-full overflow-auto p-5 font-mono text-sm text-zinc-200">{displayCode}</pre>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
