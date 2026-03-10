import type { Intent, Parameter, TaskMode, VexResult, WrangleClass } from "@/lib/types";
import { extractVexBody } from "@/lib/utils";

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function detectIntent(prompt: string): Intent {
  const text = prompt.toLowerCase();

  if (hasAny(text, ["wobble", "jiggle", "sway", "secondary motion"])) {
    return "wobble";
  }

  if (hasAny(text, ["grow", "growth", "reveal", "tendril", "root to tip"])) {
    return "growth";
  }

  if (hasAny(text, ["color", "colour", "cd", "saturation", "hue"])) {
    return "color";
  }

  if (hasAny(text, ["twist", "spiral", "vortex"])) {
    return "twist";
  }

  if (hasAny(text, ["mask", "surface", "noise", "displacement"])) {
    return "mask";
  }

  return "organic";
}

function detectClass(prompt: string, intent: Intent): WrangleClass {
  const text = prompt.toLowerCase();

  if (text.includes("detail wrangle")) {
    return "detail";
  }

  if (text.includes("primitive")) {
    return "primitives";
  }

  if (text.includes("vertex")) {
    return "vertices";
  }

  if (intent === "growth" && hasAny(text, ["curve", "curves", "root", "tip"])) {
    return "points";
  }

  return "points";
}

function detectOutputAttribute(intent: Intent) {
  switch (intent) {
    case "color":
      return "@Cd";
    case "wobble":
      return "@P";
    default:
      return "f@mask";
  }
}

function extractParams(prompt: string, intent: Intent): Parameter[] {
  const text = prompt.toLowerCase();
  const params: Parameter[] = [];

  function pushFloat(name: string, label: string, value: number, min: number, max: number, step: number, help: string) {
    params.push({ type: "float", name, label, default: value, min, max, step, help });
  }

  function pushInt(name: string, label: string, value: number, min: number, max: number, help: string) {
    params.push({ type: "int", name, label, default: value, min, max, step: 1, help });
  }

  function pushBool(name: string, label: string, value: boolean, help: string) {
    params.push({ type: "bool", name, label, default: value, min: 0, max: 1, step: 1, help });
  }

  if (intent === "mask" || intent === "organic") {
    pushFloat("frequency", "Frequency", 3.5, 0.1, 12, 0.1, "How tight the noise breakup should feel.");
    pushFloat("contrast", "Contrast", 1.6, 0.2, 5, 0.1, "Pushes the mask from soft to punchy.");
    pushFloat("displace", "Displace", 0.12, 0, 1, 0.01, "Optional normal displacement amount.");
    pushFloat("height_bias", "Height Bias", 0.15, -1, 1, 0.01, "Biases the mask up or down the object.");
    pushFloat("noise_mix", "Noise Mix", 0.55, 0, 1, 0.01, "Blends clean height falloff with noise.");
    pushFloat("seed", "Seed", 0.0, 0, 25, 0.1, "Offsets the noise field.");
  }

  if (intent === "growth") {
    pushFloat("growth", "Growth", 0.45, 0, 1, 0.01, "Reveal position from root to tip.");
    pushFloat("edge_softness", "Edge Softness", 0.18, 0.01, 0.5, 0.01, "Softens the growth front.");
    pushFloat("noise_amount", "Noise Amount", 0.3, 0, 1, 0.01, "Adds breakup to the growth edge.");
    pushFloat("frequency", "Frequency", 5.0, 0.1, 15, 0.1, "Noise frequency along the curve.");
    pushFloat("speed", "Speed", 1.25, 0, 8, 0.05, "Animates the breakup over time.");
    pushFloat("displace", "Displace", 0.08, 0, 1, 0.01, "Pushes the revealed region along the normal.");
  }

  if (intent === "wobble") {
    pushFloat("amplitude", "Amplitude", 0.08, 0, 1, 0.01, "Overall wobble amount.");
    pushFloat("frequency", "Frequency", 6.0, 0.1, 20, 0.1, "How many waves run along the shape.");
    pushFloat("speed", "Speed", 2.2, 0, 10, 0.05, "Animation speed over time.");
    pushFloat("tip_falloff", "Tip Falloff", 2.0, 0.2, 6, 0.1, "How strongly the effect concentrates near the tip.");
    pushFloat("phase", "Phase", 0.0, 0, 6.28, 0.01, "Phase offset for variation.");
    pushInt("preserve_length", "Preserve Length", 1, 0, 1, "Reduces obvious stretching on curve-like setups.");
  }

  if (intent === "color") {
    pushFloat("frequency", "Frequency", 4.0, 0.1, 12, 0.1, "Noise scale for color breakup.");
    pushFloat("height_bias", "Height Bias", 0.2, -1, 1, 0.01, "Bias toward top or bottom of the asset.");
    pushFloat("saturation", "Saturation", 1.15, 0, 2, 0.01, "Multiplies color intensity.");
    pushFloat("variation", "Variation", 0.65, 0, 1, 0.01, "How much random drift gets mixed in.");
    pushFloat("seed", "Seed", 0.0, 0, 25, 0.1, "Offsets the palette pattern.");
  }

  if (intent === "twist") {
    pushFloat("twist", "Twist", 1.2, -8, 8, 0.05, "Overall twist amount.");
    pushFloat("falloff", "Falloff", 1.0, 0.1, 4, 0.05, "Controls how quickly twist ramps in.");
    pushFloat("noise_amount", "Noise Amount", 0.15, 0, 1, 0.01, "Adds subtle breakup to the twist.");
    pushFloat("frequency", "Frequency", 3.0, 0.1, 10, 0.1, "Noise frequency.");
  }

  if (text.includes("artist")) {
    pushBool("clamp_output", "Clamp Output", true, "Keeps the final mask or color in a clean range.");
  }

  return params;
}

function buildHeader(prompt: string, wrangleClass: WrangleClass, params: Parameter[]) {
  const classLabel =
    wrangleClass === "detail"
      ? "Detail (only once)"
      : wrangleClass === "primitives"
        ? "Primitives"
        : wrangleClass === "vertices"
          ? "Vertices"
          : "Points";

  const lines = [
    `// Prompt: ${prompt.trim()}`,
    `// Suggested Attribute Wrangle mode: ${classLabel}`,
    "// Suggested defaults:"
  ];

  params.forEach((param) => {
    lines.push(`//   ${param.name} = ${String(param.default)}`);
  });

  return `${lines.join("\n")}\n\n`;
}

function maskCode(params: Parameter[], wrangleClass: WrangleClass, prompt: string) {
  const header = buildHeader(prompt, wrangleClass, params);
  return `${header}float frequency = chf("frequency");
float contrast = chf("contrast");
float displace = chf("displace");
float height_bias = chf("height_bias");
float noise_mix = chf("noise_mix");
float seed = chf("seed");

vector uvw = relbbox(0, @P);
float height_mask = clamp(uvw.y + height_bias, 0.0, 1.0);

// Stable 3D noise field with a simple seed offset.
vector noise_pos = @P * frequency + set(seed, seed * 1.37, seed * 2.11);
float n = snoise(noise_pos);
n = fit(n, -1.0, 1.0, 0.0, 1.0);

float mask = lerp(height_mask, n, noise_mix);
mask = pow(clamp(mask, 0.0, 1.0), max(contrast, 1e-4));

f@mask = clamp(mask, 0.0, 1.0);

if (length(@N) > 0.0) {
    @P += normalize(@N) * f@mask * displace;
}
`;
}

function growthCode(params: Parameter[], wrangleClass: WrangleClass, prompt: string) {
  const header = buildHeader(prompt, wrangleClass, params);
  return `${header}float growth = chf("growth");
float edge_softness = chf("edge_softness");
float noise_amount = chf("noise_amount");
float frequency = chf("frequency");
float speed = chf("speed");
float displace = chf("displace");

float u = relbbox(0, @P).y;
if (haspointattrib(0, "curveu")) {
    u = f@curveu;
}

float front = smooth(growth - edge_softness, growth, u);
float breakup = snoise(set(u * frequency, @Time * speed, 0.0));
breakup = fit(breakup, -1.0, 1.0, 1.0 - noise_amount, 1.0);

f@mask = clamp(front * breakup, 0.0, 1.0);

if (length(@N) > 0.0) {
    @P += normalize(@N) * f@mask * displace;
}
`;
}

function wobbleCode(params: Parameter[], wrangleClass: WrangleClass, prompt: string) {
  const header = buildHeader(prompt, wrangleClass, params);
  return `${header}float amplitude = chf("amplitude");
float frequency = chf("frequency");
float speed = chf("speed");
float tip_falloff = chf("tip_falloff");
float phase = chf("phase");
int preserve_length = chi("preserve_length");

float u = relbbox(0, @P).y;
if (haspointattrib(0, "curveu")) {
    u = f@curveu;
}

float tip_mask = pow(clamp(u, 0.0, 1.0), max(tip_falloff, 1e-4));
float wave = sin((u * frequency) + (@Time * speed) + phase);
vector offset = set(wave, 0.0, cos((u * frequency * 1.17) + (@Time * speed) + phase));
offset *= amplitude * tip_mask;

if (preserve_length != 0) {
    offset *= smooth(0.0, 0.8, 1.0 - abs(wave) * 0.35);
}

@P += offset;
`;
}

function colorCode(params: Parameter[], wrangleClass: WrangleClass, prompt: string) {
  const header = buildHeader(prompt, wrangleClass, params);
  return `${header}float frequency = chf("frequency");
float height_bias = chf("height_bias");
float saturation = chf("saturation");
float variation = chf("variation");
float seed = chf("seed");

vector uvw = relbbox(0, @P);
float height_mask = clamp(uvw.y + height_bias, 0.0, 1.0);
float n = snoise(@P * frequency + set(seed, seed * 1.91, seed * 2.73));
n = fit(n, -1.0, 1.0, 0.0, 1.0);

vector warm = set(0.95, 0.44, 0.16);
vector cool = set(0.12, 0.24, 0.46);
vector base = lerp(cool, warm, height_mask);
vector varied = lerp(base, base * (0.65 + n), variation);

@Cd = clamp(varied * saturation, 0.0, 1.0);
`;
}

function twistCode(params: Parameter[], wrangleClass: WrangleClass, prompt: string) {
  const header = buildHeader(prompt, wrangleClass, params);
  return `${header}float twist = chf("twist");
float falloff = chf("falloff");
float noise_amount = chf("noise_amount");
float frequency = chf("frequency");

vector pivot = getbbox_center(0);
vector p = @P - pivot;
float u = relbbox(0, @P).y;
float ramp = pow(clamp(u, 0.0, 1.0), max(falloff, 1e-4));
float n = snoise(@P * frequency);
n = fit(n, -1.0, 1.0, 1.0 - noise_amount, 1.0 + noise_amount);

float angle = twist * ramp * n;
matrix3 rot = ident();
rotate(rot, angle, {0, 1, 0});
@P = (p * rot) + pivot;
`;
}

function organicCode(params: Parameter[], wrangleClass: WrangleClass, prompt: string) {
  return maskCode(params, wrangleClass, prompt);
}

function generateCode(intent: Intent, params: Parameter[], wrangleClass: WrangleClass, prompt: string) {
  switch (intent) {
    case "mask":
      return maskCode(params, wrangleClass, prompt);
    case "growth":
      return growthCode(params, wrangleClass, prompt);
    case "wobble":
      return wobbleCode(params, wrangleClass, prompt);
    case "color":
      return colorCode(params, wrangleClass, prompt);
    case "twist":
      return twistCode(params, wrangleClass, prompt);
    default:
      return organicCode(params, wrangleClass, prompt);
  }
}

function buildExplanation(intent: Intent, wrangleClass: WrangleClass, outputAttribute: string) {
  const classLabel =
    wrangleClass === "detail"
      ? "a detail wrangle"
      : wrangleClass === "primitives"
        ? "an Attribute Wrangle over primitives"
        : wrangleClass === "vertices"
          ? "an Attribute Wrangle over vertices"
          : "an Attribute Wrangle over points";

  const intro = `Drop this into ${classLabel}. It is set up to write or modify ${outputAttribute}.`;

  switch (intent) {
    case "growth":
      return `${intro} The reveal travels from root to tip with a soft front and animated noise breakup, so it reads as directed growth instead of a sterile wipe.`;
    case "wobble":
      return `${intro} This is a lightweight secondary-motion offset that pushes more action toward the tips while keeping the root calmer.`;
    case "color":
      return `${intro} The setup blends a height-driven palette with noise variation so scattered points do not feel copy-pasted.`;
    case "twist":
      return `${intro} It rotates the shape around a vertical axis with falloff and subtle noise, which keeps the twist from feeling mechanically even.`;
    default:
      return `${intro} The setup mixes a clean height-based mask with procedural noise and contrast shaping so the result stays art-directable.`;
  }
}

export function generateHeuristicResult(prompt: string, assumptions?: string): VexResult {
  return generateHeuristicModeResult("build", prompt, "", assumptions);
}

function buildExplainHeuristic(prompt: string, context: string) {
  const blocks: string[] = [];
  blocks.push("This is a heuristic explain pass, so it is inferring network intent from your prompt and any pasted Houdini context rather than reading the scene directly.");

  if (context.trim()) {
    const lower = context.toLowerCase();
    if (lower.includes("attribwrangle") || lower.includes("wrangle")) {
      blocks.push("The context suggests a wrangle-heavy setup, which usually means the key behavior lives in attribute creation, masking, deformation, or procedural control logic rather than pure node-level transforms.");
    }
    if (lower.includes("solver")) {
      blocks.push("A solver in the chain usually means state is being accumulated over time, so the important question is what gets fed back each frame and which attributes are treated as persistent state.");
    }
    if (lower.includes("vdb")) {
      blocks.push("VDB nodes in the context suggest the setup is moving between surface geometry and volumetric representations, so resolution and conversion order are likely central to the result.");
    }
    blocks.push("Use this as a first-pass read: trace the data from the first meaningful input, identify where attributes or topology change, and then verify the critical node by node behavior inside Houdini.");
  } else {
    blocks.push("No Houdini node dump or error context was supplied, so the explanation can only stay high-level. Paste selected node names, parameter snippets, or a network summary to make this mode much more useful.");
  }

  return blocks.join(" ");
}

function buildDebugHeuristic(prompt: string, context: string) {
  const blocks: string[] = [];
  blocks.push("This is a heuristic debug pass, so it is ranking common Houdini failure patterns from the prompt and pasted context rather than inspecting a live scene.");

  const lower = `${prompt}\n${context}`.toLowerCase();
  const likelyIssues: string[] = [];

  if (lower.includes("curveu") || lower.includes("curve")) {
    likelyIssues.push("missing or inconsistent curve parameterization such as f@curveu");
  }
  if (lower.includes("@n") || lower.includes("normal")) {
    likelyIssues.push("missing or unstable normals before a displacement or orientation step");
  }
  if (lower.includes("wrangle") || lower.includes("vex")) {
    likelyIssues.push("wrong wrangle class or writing the right attribute at the wrong element level");
  }
  if (lower.includes("vdb")) {
    likelyIssues.push("resolution or conversion order issues around VDB creation and meshing");
  }
  if (lower.includes("copytopoints") || lower.includes("orient") || lower.includes("copy to points")) {
    likelyIssues.push("orientation attributes not being present or not normalized correctly");
  }

  if (likelyIssues.length > 0) {
    blocks.push(`Most likely checks first: ${likelyIssues.slice(0, 3).join(", ")}.`);
  } else {
    blocks.push("Most likely checks first: upstream attributes actually exist, the node is cooking valid geometry, and the operation is running over the intended class.");
  }

  blocks.push("For the next pass, paste the exact node type, error message, relevant parameter values, and any attribute names you expect to exist. That usually collapses the search space much faster.");
  return blocks.join(" ");
}

export function generateHeuristicModeResult(mode: TaskMode, prompt: string, context: string, assumptions?: string): VexResult {
  if (mode === "explain") {
    return {
      task_mode: mode,
      response_kind: "analysis",
      intent: "organic",
      output_attribute: "-",
      vex_code: "",
      analysis_text: buildExplainHeuristic(prompt, context),
      parameters: [],
      class: "points",
      explanation: "A heuristic read of likely network intent and data flow based on the supplied prompt and context.",
      assumptions:
        assumptions ||
        "No live Houdini scene was inspected. This explanation is inferred from your prompt and any pasted node/context notes.",
      source: "heuristic",
    };
  }

  if (mode === "debug") {
    return {
      task_mode: mode,
      response_kind: "analysis",
      intent: "organic",
      output_attribute: "-",
      vex_code: "",
      analysis_text: buildDebugHeuristic(prompt, context),
      parameters: [],
      class: "points",
      explanation: "A heuristic debug read that prioritizes likely Houdini failure points from the supplied prompt and context.",
      assumptions:
        assumptions ||
        "No live Houdini scene was inspected. This diagnosis is inferred from your prompt and any pasted node/context notes.",
      source: "heuristic",
    };
  }

  const intent = detectIntent(prompt);
  const wrangleClass = detectClass(prompt, intent);
  const outputAttribute = detectOutputAttribute(intent);
  const parameters = extractParams(prompt, intent);
  const vexCodeWithHeader = generateCode(intent, parameters, wrangleClass, prompt);

  return {
    task_mode: mode,
    response_kind: "code",
    intent,
    output_attribute: outputAttribute,
    vex_code: extractVexBody(vexCodeWithHeader),
    analysis_text: "",
    parameters,
    class: wrangleClass,
    explanation: buildExplanation(intent, wrangleClass, outputAttribute),
    assumptions:
      assumptions ||
      "Using the local heuristic generator. The prompt is mapped onto the existing intent presets and Houdini-ready VEX templates from the original spike.",
    source: "heuristic",
  };
}
