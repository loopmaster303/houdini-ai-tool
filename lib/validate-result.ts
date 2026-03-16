import type { Readiness, VexResult } from "@/lib/types";
import { extractChannelRefs, findSuspiciousVexTokens } from "@/lib/vex";

export interface ValidationReport {
  notes: string[];
  hardFailures: string[];
  readiness: Readiness;
}

function isHardFailure(note: string) {
  return (
    note.includes("No VEX code was returned.") ||
    note.includes("Suspicious non-VEX tokens") ||
    note.includes("No chf/chi/chb controls") ||
    note.includes('is used in VEX but missing from the slider list') ||
    note.includes('is declared but not used in the VEX body') ||
    note.includes('but that token is not clearly written in the VEX body')
  );
}

export function getValidationReport(result: VexResult): ValidationReport {
  if (result.response_kind === "analysis") {
    return {
      notes: [],
      hardFailures: [],
      readiness: result.source === "heuristic" ? "fallback" : "ready",
    };
  }

  const notes: string[] = [];
  const code = result.vex_code.trim();

  if (!code) {
    return {
      notes: ["No VEX code was returned."],
      hardFailures: ["No VEX code was returned."],
      readiness: result.source === "heuristic" ? "fallback" : "needs_review",
    };
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

  const hardFailures = notes.filter(isHardFailure);
  const readiness: Readiness = result.source === "heuristic" ? "fallback" : notes.length === 0 ? "ready" : "needs_review";

  return { notes, hardFailures, readiness };
}

export function validateVexResult(result: VexResult) {
  return getValidationReport(result).notes;
}

export function applyValidationReport(result: VexResult): VexResult {
  const report = getValidationReport(result);
  return {
    ...result,
    validation_notes: report.notes,
    readiness: report.readiness,
  };
}
