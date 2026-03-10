import type { Parameter, ParameterType } from "@/lib/types";
import { prettyLabel } from "@/lib/utils";

export interface ChannelRef {
  name: string;
  type: ParameterType;
}

const CHANNEL_PATTERNS: Array<{ pattern: RegExp; type: ParameterType }> = [
  { pattern: /chf\("([a-zA-Z_][a-zA-Z0-9_]*)"\)/g, type: "float" },
  { pattern: /chi\("([a-zA-Z_][a-zA-Z0-9_]*)"\)/g, type: "int" },
  { pattern: /chb\("([a-zA-Z_][a-zA-Z0-9_]*)"\)/g, type: "bool" },
];

const SUSPICIOUS_VEX_TOKENS = ["rotateX(", "rotateY(", "rotateZ(", "vec2(", "vec3(", "vec4(", "fract("];

function inferFloatRange(name: string) {
  if (/(frequency|freq|scale)/.test(name)) {
    return { defaultValue: 3.0, min: 0.1, max: 12, step: 0.1 };
  }

  if (/(speed|rate)/.test(name)) {
    return { defaultValue: 1.0, min: 0, max: 8, step: 0.05 };
  }

  if (/(contrast|falloff|power)/.test(name)) {
    return { defaultValue: 1.5, min: 0.1, max: 5, step: 0.1 };
  }

  if (/(bias|offset|phase)/.test(name)) {
    return { defaultValue: 0.0, min: -1, max: 1, step: 0.01 };
  }

  if (/(seed)/.test(name)) {
    return { defaultValue: 0.0, min: 0, max: 25, step: 0.1 };
  }

  if (/(growth|mix|mask|variation|amount|blend|softness)/.test(name)) {
    return { defaultValue: 0.5, min: 0, max: 1, step: 0.01 };
  }

  if (/(displace|amplitude|amp|strength|twist)/.test(name)) {
    return { defaultValue: 0.15, min: 0, max: 2, step: 0.01 };
  }

  return { defaultValue: 0.5, min: 0, max: 1, step: 0.01 };
}

export function extractChannelRefs(code: string): ChannelRef[] {
  const refs = new Map<string, ChannelRef>();

  for (const { pattern, type } of CHANNEL_PATTERNS) {
    for (const match of code.matchAll(pattern)) {
      const name = match[1];
      if (!name) {
        continue;
      }

      refs.set(name, { name, type });
    }
  }

  return [...refs.values()];
}

export function buildSuggestedParameter(name: string, type: ParameterType): Parameter {
  if (type === "bool") {
    return {
      name,
      type,
      default: false,
      min: 0,
      max: 1,
      step: 1,
      label: prettyLabel(name),
      help: "",
    };
  }

  if (type === "int") {
    const defaultValue = /(count|steps|iterations|segments|octaves)/.test(name) ? 3 : 1;
    const min = /(count|steps|iterations|segments|octaves)/.test(name) ? 1 : 0;
    const max = /(count|steps|iterations|segments|octaves)/.test(name) ? 12 : 10;

    return {
      name,
      type,
      default: defaultValue,
      min,
      max,
      step: 1,
      label: prettyLabel(name),
      help: "",
    };
  }

  const range = inferFloatRange(name);
  return {
    name,
    type,
    default: range.defaultValue,
    min: range.min,
    max: range.max,
    step: range.step,
    label: prettyLabel(name),
    help: "",
  };
}

export function findSuspiciousVexTokens(code: string) {
  return SUSPICIOUS_VEX_TOKENS.filter((token) => code.includes(token));
}
