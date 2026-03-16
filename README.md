# VEX Generator

Next.js rebuild of the original Houdini idea-to-VEX spike.

Core loop:

- prompt in
- Pollinations model chain or local heuristic fallback
- Houdini-ready VEX or Houdini-focused analysis out
- reference parameters when the task is code generation

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn-style UI components
- Framer Motion
- Shiki

## Run

```bash
npm run dev
```

Open `http://127.0.0.1:3001`.

## Environment

Optional `.env.local`:

```bash
POLLEN_API_KEY=
POLLEN_MODEL=qwen-coder
POLLEN_FALLBACK_MODELS=gemini-fast,openai-fast,mistral
```

Without `POLLEN_API_KEY`, the app falls back to the local heuristic generator.

Default model strategy for VEX generation:

- primary: `qwen-coder`
- fallbacks: `gemini-fast`, `openai-fast`, `mistral`

The UI now exposes the recommended models in a dropdown so you can switch and compare behavior.
The selected model is remembered in the browser and sent to `/api/generate` as the preferred model, while the server still keeps a fallback chain behind it.

You can also connect a Pollinations key directly in the browser:

- `Connect with Pollinations` uses the OAuth redirect flow
- manual key paste stores the key in local browser storage
- account/balance status is advisory only; generation truth comes from the actual model request

## Behavior

- `POST /api/generate` accepts `{ prompt, context, mode, preferredModel }`
- model output is normalized into a typed `VexResult`
- build mode uses mode-specific prompts, static validation, one repair retry, then heuristic fallback
- results expose both `provider_status` and `readiness`
- the parameter panel is a reference view, not an interactive control surface
- copied code is ready to paste into a Houdini Attribute Wrangle

Current task modes:

- `Build` for VEX generation
- `Explain` for network/dataflow interpretation from pasted context
- `Debug` for likely-cause diagnosis from pasted context and errors

Testing without Houdini:

- the app runs static plausibility checks on each result
- it flags obvious issues such as suspicious non-VEX tokens, missing `ch()` controls, slider/code mismatches, likely wrong wrangle class, or unsafe `curveu` assumptions
- this is not a real Houdini cook, but it is a useful first filter before artist review
- `npm run smoke`
- optional: `npm run smoke -- --model=qwen-coder`
- optional: `npm run smoke -- --mode=build`

## Notes

- The heuristic fallback is ported from the original spike logic and templates.
- Prompt templates now live in `prompts/base.md`, `prompts/build.md`, `prompts/explain.md`, `prompts/debug.md`, and `prompts/repair.md`.
- The route never returns an empty model failure; it falls back to heuristic output when possible.
