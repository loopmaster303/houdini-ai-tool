export type Intent = "mask" | "growth" | "wobble" | "color" | "twist" | "organic";
export type WrangleClass = "points" | "primitives" | "detail" | "vertices";
export type ParameterType = "float" | "int" | "bool";
export type ParameterValue = number | boolean;
export type TaskMode = "build" | "explain" | "debug";
export type ResponseKind = "code" | "analysis";

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
}

export type ParamMap = Record<string, ParameterValue>;
