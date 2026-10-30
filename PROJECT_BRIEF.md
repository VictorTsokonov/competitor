# Competitor — PROJECT_BRIEF.md (single source of truth, read at the start of every task)

## Product
Maths tutor for Putnam/ICMC students that never gives the solution first. It compares HOW the expert reads a problem versus HOW the student reads it, cue by cue, through one shared schema anchored to phrases of the problem text. Protocol name: ProofReader. Not a chatbot: the dashboard is a workflow document, never a message box. Never a verdict on who did better.

## Pages (3, nothing else)
- `/` Landing: dark hero, glyph-sphere canvas, "Stop solving. Start reading." (`reading` hollow), expert heatmap teaser, Read/Compare/Learn accordion, one-line protocol card, hackathon footer.
- `/dashboard` Main app: CSS grid (auto / 1fr / auto). Left: resizable Sets tree 220–420px (live item: ICMC 2020 / Problem 1). Centre: problem block (highlighted text, inline KaTeX, preserved lines) + 8 stage sections as a ruled document. Right: resizable reference/comparison 220–420px. Collapsed panels are width 0; fixed icon toggles; state persists in localStorage.
- `/guide` Student protocol: "Assume you will get this wrong.", worked handwritten example with transcript up front, five steps each with a crop of the example, photograph-and-upload card, "Why this works".

## Visual style
Meta-clean, mathematically minimal. Light/dark themes (class strategy, system default, toggle in localStorage with try/catch). Tokens: background, surface, text, text-muted, accent #0866FF (both), border. Dark: #0B0B0C / #161617 / white / #A1A1AA. Span categories: setting green, definition amber, rule red, goal violet, informal grey. 16px card radius where cards exist. KaTeX for all maths (no `$` support — use `\text{}` + bare math). No gradients, shadows, logos, or wordmarks.

## Data (mock for now)
`USE_MOCK=true` in .env.local -> `/api/analyse` returns `lib/dummy-data.json` (hand-written ICMC 2020 P1 analysis; also the model's quality target). Later `false` -> real calls via openai SDK to https://api.meta.ai/v1, model muse-spark-1.3, key MODEL_API_KEY. Browser never calls Meta directly.

## Pipeline (real calls, pending)
Call A: expert pass 1 (high effort). Call C: student extraction from photos (medium) — faithful, not charitable; every cue carries the student's own words. Call B: expert second reading, given A. `lib/compare.ts` computes the comparison (no model call). Call D behind Reveal: solution + used cue ids. Render progressively (expert heatmap, then student, then comparison); never one long spinner. Stretch: call E ablation, one deciding cue removed at a time.
Honest framing the UI keeps: "how spotted" is a plausible expert narrative, not the model's cognition; ablation is the measured counterpart.

## Schema (shared by expert and student chains)
problem{text,latex}, spans[{id,text,category,weight 0-100,reason}], reading{cues[{id,span_id,why_it_matters,how_spotted}],definitions[{term,meaning_latex}]}, goal{asked,answer_form,final_line_would_say}, informal_cues[{span_id,bearing}], abstraction{underneath[{object,really_is,implies}],deeper_properties[]}, simplification{instance,instance_latex,what_to_try,notice_prompt}, method{candidates[{name,deciding_span_ids,from_first_principles,kept,why}],chosen}, prerequisites[{name,needed_for,flag assumed|needed}], second_reading{new_spans,reweighted[{span_id,old,new,why}],what_changed}, domain "maths"|"not_maths".
Rules: every span is an exact substring of problem.text, checked in code; zod validates every model response; comparison is TypeScript set difference (currently hard-coded in dummy data — `lib/compare.ts` pending). Missed cues carry `span_id` + `what_it_unlocks` + `self_check`; student spans may be flagged `uncertain`. `/api/analyse` serves through the `lib/analysis.ts` provider seam (mock now, real `lib/providers/meta.ts` stubbed).

## Stack and rules
Next.js 15 App Router, TypeScript strict, Tailwind, zod, openai, katex. API routes only, no DB, no auth. Files under ~150 lines. Boring readable code; validate at the boundary; explicit loading/error states; no fetch-on-mount for user work. After every change: build, lint, verify, report. See WORKFLOW.md for the vocabulary, crew, and slice loop.

## Status
Mock UI for all 3 pages done: shared layered reading, structured missed cues, unused cues, student second reading, per-stage source citations, sticky side rails. Local problem library landed: `/createProblem` (LaTeX editor + live preview + cheatsheet, screenshot stub), nestable folder tree + problem/folder drag-and-drop in the left panel, dashboard opens on the creation form, per-problem Analyse/Submit backed by the provider seam (mock gates custom problems honestly), no auth/DB. Next, in order: (1) real call A vs dummy, (2) photo upload + call C, (3) compare.ts, (4) calls B + D, (5) deploy/README/video, (6) ablation if time. Submit by Wed 4 Nov 20:00 UK. Judging: impact 30 / Meta tooling 25 / demo+video 25 / depth 20 — demo-first, scope creep is the risk.
