# Context

This repo is a focused Houdini AI tool experiment built as a Next.js App Router app.

## Team

- John: product, AI/tooling, prompt and API architecture
- Lukas: Houdini artist/TD, procedural FX, rendering, raymarching/fractals, moving into APEX
- Codex: builder, planner, drafter, creative technical partner

## Product truth

Do not build a generic Houdini assistant first.

Build the thinnest useful hook:

`prompt -> copy-pasteable Houdini Wrangle output`

The current priority is not broad scene awareness.
The current priority is code that is believable enough to paste into an Attribute Wrangle, plus a clear explanation of how trustworthy it is.

## Current app

The working app lives in the Next.js codebase:

- `app/`
- `components/`
- `lib/`
- `prompts/`

Main modes:

- `Build`
- `Explain`
- `Debug`

## Current generation flow

- user submits prompt, optional context, and preferred model
- app calls Pollinations when a key is available
- build mode uses mode-specific prompt templates
- model output is normalized and statically validated
- one repair pass is attempted for broken build output
- if model generation fails, app falls back to the local heuristic generator

## Important result concepts

- `provider_status`
  model transport/auth health
  examples: `model_ok`, `auth_error`, `model_error`, `heuristic_only`

- `readiness`
  output trust level
  examples: `ready`, `needs_review`, `fallback`

- `validation_notes`
  human-readable structural warnings about the generated VEX

## UI reality

- code panel is the main surface
- parameter panel is reference-only, not a promise of production-ready controls
- Pollinations account/balance state is advisory only
- real generation truth comes from the actual model request result

## Known limits

- not a Houdini plugin yet
- no live scene inspection
- no guaranteed Houdini runtime compile validation from inside this app
- static validation helps, but cannot fully replace testing in Houdini

## Near-term direction

- improve trust and clarity around generated VEX
- make fallback/auth/model states obvious in the UI
- keep tightening copy-paste quality before expanding scope
