import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ParamMap, Parameter, ParameterValue, ProviderStatus, Readiness, TaskMode, VexResult, WrangleClass } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function prettyLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function prettyClass(value: WrangleClass) {
  switch (value) {
    case "detail":
      return "Detail";
    case "primitives":
      return "Primitives";
    case "vertices":
      return "Vertices";
    default:
      return "Points";
  }
}

export function prettyMode(value: TaskMode) {
  switch (value) {
    case "debug":
      return "Debug";
    case "explain":
      return "Explain";
    default:
      return "Build";
  }
}

export function prettyReadiness(value?: Readiness) {
  switch (value) {
    case "fallback":
      return "Heuristic fallback";
    case "needs_review":
      return "Needs review";
    case "ready":
    default:
      return "Ready";
  }
}

export function prettyProviderStatus(value?: ProviderStatus) {
  switch (value) {
    case "auth_error":
      return "Auth error";
    case "model_error":
      return "Model error";
    case "heuristic_only":
      return "Heuristic only";
    case "model_ok":
    default:
      return "Model OK";
  }
}

export function formatParamValue(parameter: Parameter, value: ParameterValue) {
  if (parameter.type === "bool") {
    return String(Boolean(value));
  }

  const step = parameter.step ?? (parameter.type === "int" ? 1 : 0.01);
  const decimals = String(step).includes(".") ? String(step).split(".")[1].length : 0;
  return Number(value).toFixed(decimals);
}

export function getDefaultParamMap(parameters: Parameter[]) {
  return parameters.reduce<ParamMap>((accumulator, parameter) => {
    accumulator[parameter.name] = parameter.default;
    return accumulator;
  }, {});
}

export function extractVexBody(code: string) {
  const normalized = code.trim();
  const headerBreak = normalized.indexOf("\n\n");

  if (normalized.startsWith("// Prompt:") && headerBreak !== -1) {
    return normalized.slice(headerBreak + 2).trim();
  }

  return normalized;
}

export function buildCodeHeader(prompt: string, parameters: Parameter[], params: ParamMap) {
  const trimmedPrompt = prompt.trim() || "Untitled prompt";
  const activeValues = parameters
    .map((parameter) => {
      const value = params[parameter.name] ?? parameter.default;
      return `${parameter.name}: ${formatParamValue(parameter, value)}`;
    })
    .join("   ");

  const lines = [`// Prompt: ${trimmedPrompt}`];

  if (activeValues) {
    lines.push(`// ${activeValues}`);
  }

  return `${lines.join("\n")}\n\n`;
}

export function buildDisplayCode(prompt: string, result: VexResult, params: ParamMap) {
  if (result.response_kind === "analysis") {
    return result.analysis_text.trim();
  }

  return `${buildCodeHeader(prompt, result.parameters, params)}${result.vex_code}`.trim();
}

export function detectOutputAttribute(code: string) {
  if (/@Cd\b/.test(code)) {
    return "@Cd";
  }

  if (/[@]P\b/.test(code)) {
    return "@P";
  }

  const typedMatch = code.match(/\b(?:f|i|v|s)@([A-Za-z_][A-Za-z0-9_]*)/);
  if (typedMatch) {
    return `${typedMatch[0]}`;
  }

  return "f@mask";
}
