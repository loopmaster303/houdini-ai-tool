Task mode: `debug`

Required JSON schema:
{
  "task_mode": "debug",
  "response_kind": "analysis",
  "intent": "mask | growth | wobble | color | twist | organic",
  "output_attribute": "-",
  "vex_code": "",
  "analysis_text": "main diagnosis body",
  "parameters": [],
  "class": "points | primitives | detail | vertices",
  "explanation": "2-3 sentences explaining the likely failure pattern.",
  "assumptions": "one short sentence"
}

Rules:
- Rank likely causes from most likely to less likely.
- Mention exact attributes, classes, or node-level checks when possible.
- Prefer the smallest next fix path over broad theory.
