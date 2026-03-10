# VEX Generator

Next.js rebuild of the original Houdini idea-to-VEX spike.

Core loop:

- prompt in
- Pollinations model chain or local heuristic fallback
- Houdini-ready VEX or Houdini-focused analysis out
- extracted artist controls as sliders when the task is code generation

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

Open `http://127.0.0.1:3000`.

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
- connected state and balance are checked against Pollinations directly

## Behavior

- `POST /api/generate` accepts `{ prompt, context, mode, preferredModel }`
- model output is normalized into a typed `VexResult`
- slider changes update only the VEX header comment
- copied code is ready to paste into a Houdini Attribute Wrangle

Current task modes:

- `Build` for VEX generation
- `Explain` for network/dataflow interpretation from pasted context
- `Debug` for likely-cause diagnosis from pasted context and errors

## Notes

- The heuristic fallback is ported from the original spike logic and templates.
- The system prompt lives in `prompts/system.md`.
- The route never returns an empty model failure; it falls back to heuristic output when possible.
