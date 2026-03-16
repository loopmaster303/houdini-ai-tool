Task mode: `explain`

Required JSON schema:
{
  "task_mode": "explain",
  "response_kind": "analysis",
  "intent": "mask | growth | wobble | color | twist | organic",
  "output_attribute": "-",
  "vex_code": "",
  "analysis_text": "main analysis body",
  "parameters": [],
  "class": "points | primitives | detail | vertices",
  "explanation": "2-3 sentences explaining the network or logic.",
  "assumptions": "one short sentence"
}

Rules:
- Focus on intent, data flow, important nodes, key attributes, and what should be inspected next.
- Ground the answer in supplied Houdini context.
- Keep it specific, short, and Houdini-native.
