export type Intent = "mask" | "growth" | "wobble" | "color" | "twist" | "organic";
export type WrangleClass = "points" | "primitives" | "detail" | "vertices";
export type ParameterType = "float" | "int" | "bool";
export type ParameterValue = number | boolean;
export type TaskMode = "build" | "explain" | "debug";
export type ResponseKind = "code" | "analysis";
export type Readiness = "ready" | "needs_review" | "fallback";
export type ProviderStatus = "model_ok" | "auth_error" | "model_error" | "heuristic_only";

export interface Parameter {
  name: string;
  type: ParameterType;
  default: ParameterValue;
  min: number;
  max: number;
  step?: number;
  label: string;
  help?: string;
}

export interface VexResult {
  task_mode: TaskMode;
  response_kind: ResponseKind;
  intent: Intent;
  output_attribute: string;
  vex_code: string;
  analysis_text: string;
  parameters: Parameter[];
  class: WrangleClass;
  explanation: string;
  assumptions: string;
  source: "model" | "heuristic";
  model_used?: string;
  validation_notes?: string[];
  readiness?: Readiness;
  repair_attempted?: boolean;
  provider_status?: ProviderStatus;
}

export type ParamMap = Record<string, ParameterValue>;
