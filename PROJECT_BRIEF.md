# Competitor — PROJECT_BRIEF.md (single source of truth, read at the start of every task)

## Product
Competitor is a maths tutor for Putnam/ICMC students that never gives the solution first. It shows how an expert read the problem versus how the student read it, cue by cue. Not a chatbot: the dashboard is a workflow, not a message box. Protocol name inside the product: ProofReader.

## The workflow
Student: assume you will get this wrong. On paper: (1) mark phrases in the problem and write what each suggests, (2) say what the problem is about before any maths, (3) define objects, given and wanted, (4) list 2-3 methods with the phrase that triggered each and why kept/dropped, (5) attempt. Photograph the pages, upload.
AI (Muse Spark 1.3): forced through the same stages before solving: weighted problem spans, typed cues, relations, formal model, method selection with deciding cue and rejected alternatives, second reading. Every thought anchored to an exact substring of the problem text.
Comparison: plain TypeScript set difference on cues, method comparison, first point of divergence. Never a verdict on who did better.

## Pages (3, nothing else)
- `/` Landing: dramatic hero. "COMPETITOR". Tagline "Stop solving. Start reading." Sub: for Putnam/ICMC competitors who get the maths but miss the cues. CTAs: Try the demo (-> /dashboard), How it works (-> /guide). One heatmap teaser.
- `/dashboard` Main app, 3 columns. Left: "Analyses" list (past problems, static for now) + "New analysis". Centre: problem text, photo upload area, then the expert chain revealed stage by stage. Right: two heatmaps (Expert / You) over the problem text, first-divergence sentence, missed cues, "Reveal solution" button.
- `/guide` The student protocol: the mindset line and the five headings, as a clean static page.

## Visual style
Meta-clean and mathematically minimal. White background, near-black text, Meta blue #0866FF for accents and CTAs only, light grey #F0F2F5 for panels, 16px card radius, generous whitespace, Inter or the Next default font. All maths rendered with KaTeX. No gradients, no illustrations, no dark mode for now.

## Data (mock for now)
`USE_MOCK=true` in .env.local -> `/api/analyse` returns `lib/dummy-data.json`. Later `false` -> real call via openai SDK to https://api.meta.ai/v1, model muse-spark-1.3, key MODEL_API_KEY. Browser never calls Meta directly.

## Schema (shared by expert and student chains)
problem_spans[{text, weight 0-3, reason}], cues[{id, span, type, why_it_matters, how_spotted}], relations[{cue_ids, statement, maths}], model{objects, definitions, formal_statement}, selection{method, deciding_cue_ids, rejected[{method, why}], unlocking_observation}, pass_2{new_cues, reweighted, what_changed}, domain "maths"|"not_maths".
Cue types: quantifier | constraint | symmetry | extremal | parity_divisibility | boundary | definition.
Rules: every span is an exact substring of the problem text, checked in code. zod validates every model response. Maths fields are LaTeX strings.

## Stack and rules
Next.js 15 App Router, TypeScript strict, Tailwind, zod, openai, katex. API routes only, no DB, no auth. Files under ~150 lines. Prefer boring, readable code. Run `npm run build` after every change and fix errors. Commit after each working slice.

## Status
Scaffold done. Next: mock UI for all 3 pages.