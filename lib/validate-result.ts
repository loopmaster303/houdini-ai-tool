import type { VexResult } from "@/lib/types";
import { extractChannelRefs, findSuspiciousVexTokens } from "@/lib/vex";

export function validateVexResult(result: VexResult): string[] {
  if (result.response_kind === "analysis") {
    return ["Analysis mode can be judged for relevance, but not runtime-validated as VEX."];
  }

  const notes: string[] = [];
  const code = result.vex_code.trim();

  if (!code) {
    return ["No VEX code was returned."];
  }

  const suspiciousTokens = findSuspiciousVexTokens(code);
  if (suspiciousTokens.length > 0) {
    notes.push(`Suspicious non-VEX tokens found: ${suspiciousTokens.join(", ")}.`);
  }

  const channelRefs = extractChannelRefs(code);
  const declaredParams = new Map(result.parameters.map((parameter) => [parameter.name, parameter]));

  if (channelRefs.length === 0) {
    notes.push("No chf/chi/chb controls were found in the generated VEX.");
  }

  for (const ref of channelRefs) {
    const declared = declaredParams.get(ref.name);
    if (!declared) {
      notes.push(`Control "${ref.name}" is used in VEX but missing from the slider list.`);
      continue;
    }

    if (declared.type !== ref.type) {
      notes.push(`Control "${ref.name}" is typed as ${declared.type} in the UI but used as ${ref.type} in VEX.`);
    }
  }

  for (const parameter of result.parameters) {
    const used = channelRefs.some((ref) => ref.name === parameter.name);
    if (!used) {
      notes.push(`Slider "${parameter.name}" is declared but not used in the VEX body.`);
    }
  }

  if (/@vtxnum\b|@numvtx\b/.test(code) && result.class !== "vertices") {
    notes.push('The code uses "@vtxnum" or "@numvtx", which usually implies a vertices wrangle.');
  }

  if (/f@curveu\b/.test(code) && !/haspointattrib\(0,\s*"curveu"\)/.test(code)) {
    notes.push('The code reads "f@curveu" without checking whether that attribute exists.');
  }

  if (/@N\b/.test(code) && !/length\(@N\)|normalize\(@N\)/.test(code)) {
    notes.push('The code uses "@N" directly. Make sure normals exist upstream or add a Normal SOP.');
  }

  if (result.output_attribute === "@P" && !/@P\s*[+\-*/]?=/.test(code)) {
    notes.push('Output says "@P" but the VEX body does not obviously write to @P.');
  }

  if (result.output_attribute !== "@P" && result.output_attribute !== "-" && !code.includes(result.output_attribute)) {
    notes.push(`Output says "${result.output_attribute}" but that token is not clearly written in the VEX body.`);
  }

  return notes;
}
