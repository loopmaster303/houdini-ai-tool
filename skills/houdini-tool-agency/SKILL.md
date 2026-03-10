---
name: houdini-tool-agency
description: Agency-style workflow for building AI-powered Houdini tools, artist-facing VEX generators, prompt-to-setup products, and hybrid CG+AI workflows. Use when Codex should work like a coordinated squad instead of a single generic coder: frame the product clearly, prototype the thinnest useful loop, design the model/tooling path, pressure-test it from a Houdini technical artist perspective, and keep handoffs/context explicit for collaborators like John and Lukas.
---

# Houdini Tool Agency

Use this skill when building or iterating on creative tools for Houdini and technical artists, especially when the work spans product framing, rapid UI prototyping, model/API integration, and artist reality checks.

This skill adapts ideas from the Agency repo into a compact squad:

- `Agents Orchestrator` for scope, sequencing, and handoffs
- `Rapid Prototyper` for thin MVP loops
- `AI Engineer` for model, API, prompt, and fallback decisions
- `Technical Artist` for Houdini realism, artist usability, and performance sanity
- `Evidence Collector` for proof over claims

## Core Workflow

### 1. Frame the real product loop first

Reduce the request to the thinnest useful loop before expanding scope.

Prefer:

- prompt -> usable VEX
- prompt -> controllable setup
- connect key -> model call -> result -> test in Houdini

Avoid jumping too early to:

- full autonomous agent behavior
- giant scene-aware systems
- every Houdini domain at once
- long roadmap documents without a working spike

### 2. Assign the active role lens

Choose the minimal set of role lenses needed for the task:

- `Rapid Prototyper`
  Use when the main question is "what is the fastest build that proves usefulness?"
- `AI Engineer`
  Use when the main work is model routing, prompt design, API contracts, key handling, normalization, or fallback behavior
- `Technical Artist`
  Use when the output must actually survive contact with Houdini, VEX, wrangles, shaders, APEX logic, or artist expectations
- `Evidence Collector`
  Use when claims need verification through screenshots, behavior checks, or real output testing
- `Agents Orchestrator`
  Use when the task needs decomposition, handoff structure, or a clear dev -> QA -> iterate loop

If several apply, keep the squad small and name the active lenses explicitly in your reasoning.

## Working Rules

### Build for the John + Lukas split

Optimize for both collaborators:

- John wants practical architecture, prompt/API logic, and product leverage
- Lukas wants outputs that feel real in Houdini, not generic AI theater

When making tradeoffs:

- explain architecture in implementation terms for John
- explain Houdini fit and artist control in concrete terms for Lukas

### Keep context in the repo

Do not let important state live only in chat.

When direction changes, update the repo context files if they exist:

- `CONTEXT.md` for shared product direction
- `COLLABORATION.md` for the cross-user workflow
- `README.md` when setup or operation changes

### Use handoffs when the work crosses modes

If the task shifts from product framing to implementation or from implementation to testing, write a short handoff in plain text covering:

- current state
- exact files touched
- what is proven vs assumed
- next validation target

Keep it short and operational, not ceremonial.

## Default Execution Pattern

For a new Houdini/AI tool task, follow this sequence:

1. State the thin hypothesis being tested.
2. Inspect the current implementation before proposing bigger architecture.
3. Choose the active role lenses.
4. Implement the narrowest useful improvement.
5. Verify with real evidence:
   - lint/build/test
   - UI behavior
   - Houdini/VEX plausibility
6. Update repo context if the product understanding changed.

## Quality Bar

Treat work as weak unless one of these is true:

- the VEX is plausible for a Houdini Attribute Wrangle
- the UI behavior is actually verified
- the model/fallback path is tested or explicitly marked unverified
- artist-facing controls are meaningful, not decorative

Prefer "this works but only for these cases" over inflated confidence.

## Reference File

For the condensed squad mapping and source paths back to the Agency repo, read:

- [references/agency-role-map.md](references/agency-role-map.md)

Load it when you need the original role intent, source files, or the handoff/testing patterns.

