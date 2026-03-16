Task mode: `build`

Goal:
- return copy-pasteable Houdini Attribute Wrangle VEX first
- return parameters only as a convenience layer derived from the code
- optimize for simple, reliable VEX over clever or novel syntax

Required JSON schema:
{
  "task_mode": "build",
  "response_kind": "code",
  "intent": "mask | growth | wobble | color | twist | organic",
  "output_attribute": "string such as f@mask or @Cd",
  "vex_code": "raw VEX code only",
  "analysis_text": "",
  "parameters": [
    {
      "name": "frequency",
      "type": "float | int | bool",
      "default": 3.5,
      "min": 0.1,
      "max": 12,
      "step": 0.1,
      "label": "Frequency",
      "help": "short artist-facing description"
    }
  ],
  "class": "points | primitives | detail | vertices",
  "explanation": "2-3 sentences explaining what the setup does and where it should run.",
  "assumptions": "one short sentence"
}

Rules:
- Use Houdini 20.5 Attribute Wrangle VEX conventions.
- Return raw VEX body only in `vex_code`. No header comment block.
- Use lowercase snake_case parameter names.
- Every exposed control must use `chf("name")`, `chi("name")`, or `chb("name")`.
- Every parameter declared in `parameters` must be used in the VEX body.
- Use only standard VEX functions and attributes.
- Prefer `points` unless the request clearly needs `primitives`, `detail`, or `vertices`.
- Keep comments brief and useful.
- Make one smart assumption when needed and mention it in `assumptions`.

Allowed VEX idioms:
- noise shaping: `noise`, `snoise`, `curlnoise`, `fit`, `fit01`, `smooth`, `clamp`, `lerp`
- curve progression: `f@curveu` when present, otherwise a stable fallback such as `relbbox(0, @P).y`
- rotation: `quaternion(angle, axis)` with `qrotate`
- safe normal usage: guard or normalize when needed

Forbidden patterns:
- `vec2`, `vec3`, `vec4`
- `fract`
- `rotateX`, `rotateY`, `rotateZ`
- invented helper functions
- parameters declared in JSON but not used in code
- code that looks like GLSL, JavaScript, or pseudocode

Few-shot examples:

Example 1: point mask writing f@mask
Prompt: "Create a point wrangle that makes a soft organic mask from height and noise."
Expected shape:
- `class` is `points`
- writes `f@mask`
- uses controls like `frequency`, `contrast`, `height_bias`, `noise_mix`
- uses `relbbox(0, @P).y` for height

Example 2: curve wobble with curveu fallback
Prompt: "Add wobble on curve tips with speed and amplitude."
Expected shape:
- `class` is `points`
- writes to `@P`
- tries `f@curveu` only if `haspointattrib(0, "curveu")`
- otherwise falls back to `relbbox(0, @P).y`
- uses `amplitude`, `frequency`, `speed`, `tip_falloff`

Example 3: procedural color variation
Prompt: "Make a point wrangle for procedural color variation."
Expected shape:
- `class` is `points`
- writes `@Cd`
- uses a stable palette blend or noise-driven variation
- uses `frequency`, `variation`, `saturation`, `seed`

Example 4: twist with valid rotation idiom
Prompt: "Twist the geometry with falloff around Y."
Expected shape:
- uses `quaternion` plus `qrotate`
- does not use `rotateX`, `rotateY`, or `rotateZ`
- writes `@P`
- uses `twist`, `falloff`, and optionally `noise_amount`
