# VEX Generator

Next.js rebuild of the original Houdini idea-to-VEX spike.

Core loop:

- prompt in
- Pollinations Claude or local heuristic fallback
- Houdini-ready VEX out
- extracted artist controls as sliders

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
```

Without `POLLEN_API_KEY`, the app falls back to the local heuristic generator.

You can also connect a Pollinations key directly in the browser:

- `Connect with Pollinations` uses the OAuth redirect flow
- manual key paste stores the key in local browser storage
- connected state and balance are checked against Pollinations directly

## Behavior

- `POST /api/generate` accepts `{ prompt }`
- model output is normalized into a typed `VexResult`
- slider changes update only the VEX header comment
- copied code is ready to paste into a Houdini Attribute Wrangle

## Notes

- The heuristic fallback is ported from the original spike logic and templates.
- The system prompt lives in `prompts/system.md`.
- The route never returns an empty model failure; it falls back to heuristic output when possible.
