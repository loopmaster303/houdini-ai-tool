"use client";

import { motion } from "framer-motion";
import type { VexResult } from "@/lib/types";
import { validateVexResult } from "@/lib/validate-result";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ExplanationPanel({ result }: { result: VexResult | null }) {
  const validationNotes = result ? (result.validation_notes ?? validateVexResult(result)) : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Explanation</CardTitle>
        <CardDescription>Quick read on what the setup is doing and where it should run.</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-96px)]">
        {!result ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 text-sm text-zinc-500">
            No generated result yet.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 p-5"
          >
            <div className="flex items-center gap-2">
              <Badge>{result.source === "model" ? "AI" : "Heuristic"}</Badge>
              <Badge variant="secondary">{result.output_attribute}</Badge>
              {result.model_used ? <Badge variant="outline">{result.model_used}</Badge> : null}
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-200">{result.explanation}</p>
            <Separator className="my-4" />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Static validation</p>
              {validationNotes.length === 0 ? (
                <p className="mt-2 text-sm leading-6 text-zinc-300">No obvious structural problems were found in the output.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {validationNotes.map((note) => (
                    <p key={note} className="text-sm leading-6 text-zinc-400">
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
            {result.assumptions ? (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Assumptions</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{result.assumptions}</p>
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
