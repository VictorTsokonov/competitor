# Competitor — Working Agreement

Read with `PROJECT_BRIEF.md` at the start of every task. This file is how we work; the brief is what we build.

## Vocabulary — type one of these words (a leading `/` is optional: `/plan` ≡ `PLAN`, so the same words work in IDE sessions with built-in slash commands)

- `PLAN <task>` — research, then one inline plan; no code written. Reply `go` to execute it.
- `GOAL <objective>` — set a tracked session goal; progress is reported in % as work lands.
- `DRILL <problem>` — deep-dive one hard problem: evidence, options, recommendation; no implementation.
- `BUILD <slice>` — implement one slice: code, build, lint, verify, report.
- `REVIEW [scope]` — adversarial review of the working tree (default) or named paths, against the brief.

## Slice loop (every BUILD)

1. Read `PROJECT_BRIEF.md` and the memory status pointer.
2. `PLAN` first when the slice is big; show the plan before coding.
3. Implement: boring readable code, files ≤ ~150 lines, TypeScript strict, no `any`.
4. Verify: `npm run build`, `npm run lint`, plus render/behavior checks of what changed.
5. Report exactly what was verified — honest, no theater (this sandbox cannot start servers: `listen()` returns EPERM).
6. Record: update the memory status pointer, keep `PROJECT_BRIEF.md` true, commit only when asked.

## Crew (role scripts in `.agents/workflows/`, launched inline)

- `planner` — maps the relevant code, returns a sliced plan. Used by `PLAN` on non-trivial tasks.
- `builder` — implements one slice with build+lint, reports files and verification. Used when work parallelizes; small slices stay inline.
- `reviewer` — checks a diff against the brief, conventions, and verification honesty. Used by `REVIEW` and after risky slices.
- `researcher` — answers a question with inspected evidence (code, docs, URLs). Used by `DRILL` and for unknowns.

## Starting a new session

Memory and repo files persist across sessions; chat history does not. `AGENTS.md` at the repo root carries the boot contract — harnesses that auto-read it need no opener. Otherwise open with: "Read PROJECT_BRIEF.md, WORKFLOW.md, and my project memory, then confirm you are ready." The agent must confirm what it loaded before doing anything else.

## Standing rules

- `main` stays deployable. Mock-first (`USE_MOCK=true`); the hand-written dummy is the model's quality target.
- Never a chatbot: no free-text input on the dashboard. Never grade the student; report divergence with evidence.
- Small verified steps; explain unfamiliar concepts briefly on first appearance.
