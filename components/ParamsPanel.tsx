"use client";

import type { ParamMap, ParameterValue, VexResult } from "@/lib/types";
import { formatParamValue } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface ParamsPanelProps {
  result: VexResult | null;
  params: ParamMap;
  onParamChange: (name: string, value: ParameterValue) => void;
}

export function ParamsPanel({ result, params, onParamChange }: ParamsPanelProps) {
  const showFullControls =
    result?.response_kind === "code" &&
    result.readiness === "ready" &&
    result.parameters.length > 0 &&
    (result.validation_notes?.length ?? 0) === 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Detected Controls</CardTitle>
        <CardDescription>Derived from the generated VEX. Helpful when clean, secondary when not.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result || result.parameters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-500">
            Generate something first.
          </div>
        ) : !showFullControls ? (
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <p className="text-sm text-zinc-300">
              The output is not fully ready yet, so controls stay compact instead of taking over the workflow.
            </p>
            <div className="flex flex-wrap gap-2">
              {result.parameters.map((parameter) => (
                <span
                  key={parameter.name}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300"
                >
                  {parameter.label}
                </span>
              ))}
            </div>
            <p className="text-xs leading-5 text-zinc-500">
              Focus on copy-paste readiness first. Full sliders appear only when the code passes clean static checks.
            </p>
          </div>
        ) : (
          result.parameters.map((parameter) => {
            const value = params[parameter.name] ?? parameter.default;

            if (parameter.type === "bool") {
              return (
                <div key={parameter.name} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{parameter.label}</p>
                      {parameter.help ? <p className="mt-1 text-xs text-zinc-500">{parameter.help}</p> : null}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => onParamChange(parameter.name, event.target.checked)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-accent accent-[#ff8a3d]"
                      />
                      {Boolean(value) ? "On" : "Off"}
                    </label>
                  </div>
                </div>
              );
            }

            return (
              <div key={parameter.name} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{parameter.label}</p>
                    {parameter.help ? <p className="mt-1 text-xs text-zinc-500">{parameter.help}</p> : null}
                  </div>
                  <span className="font-mono text-sm text-zinc-300">{formatParamValue(parameter, value)}</span>
                </div>
                <Slider
                  value={[Number(value)]}
                  min={parameter.min}
                  max={parameter.max}
                  step={parameter.step ?? (parameter.type === "int" ? 1 : 0.01)}
                  onValueChange={(nextValue) => onParamChange(parameter.name, nextValue[0] ?? parameter.default)}
                />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
