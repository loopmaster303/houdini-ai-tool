"use client";

import type { VexResult } from "@/lib/types";
import { formatParamValue } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ParamsPanelProps {
  result: VexResult | null;
}

export function ParamsPanel({ result }: ParamsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
        <CardDescription>Reference values for channel calls in your Wrangle.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result || result.parameters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-500">
            Generate something first.
          </div>
        ) : (
          result.parameters.map((parameter) => {
            return (
              <div key={parameter.name} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{parameter.label}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-400">{parameter.name}</p>
                    {parameter.help ? <p className="mt-1 text-xs text-zinc-500">{parameter.help}</p> : null}
                  </div>
                  <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300">
                    {parameter.type}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-zinc-400">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <p className="uppercase tracking-[0.12em] text-zinc-500">Default</p>
                    <p className="mt-1 font-mono text-zinc-200">{formatParamValue(parameter, parameter.default)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <p className="uppercase tracking-[0.12em] text-zinc-500">Min</p>
                    <p className="mt-1 font-mono text-zinc-200">{parameter.min}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <p className="uppercase tracking-[0.12em] text-zinc-500">Max</p>
                    <p className="mt-1 font-mono text-zinc-200">{parameter.max}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
