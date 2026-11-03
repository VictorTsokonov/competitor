<div align="center">

# C∅mpetitor

### ~~Stop solving.~~ **Start reading.**

**Competitor is a platform that makes problem-solving in competition maths measurable.**

It records how an expert reads a problem and how you read it, phrase by phrase, in one shared
schema, and shows exactly where the two readings part: with evidence from your own handwritten
pages, and never the solution.

<!-- TODO: replace both links before submission -->
**[Live demo →](#)** · **[Demo video →](#)**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![zod](https://img.shields.io/badge/zod-validated_at_the_boundary-blue)](https://zod.dev)
[![KaTeX](https://img.shields.io/badge/KaTeX-maths_rendering-329894)](https://katex.org)

*Built for the Meta Hackathon 2026 on Muse Spark 1.3.*

</div>

---

## What it measures

Competition maths is decided before the first line of a proof: which phrases you weight, which
objects you recognise for what they really are, which method those cues trigger. A finished
solution hides all of that, so it never gets measured. Competitor turns it into data:

- **One schema for both readings.** Spans of the statement (exact substrings, checked in code)
  with a category, a 0–100 weight and a reason; cues and how to spot them; the goal; what the
  objects really are; a smaller instance to try; method candidates tied to the spans that decided
  them; prerequisites; a second reading. The expert and the student are read into the same shape.
- **Set difference, not vibes.** Which heavy expert cues your pages never touch, and which of
  your marks fed no method, is computed in TypeScript (`lib/compare.ts`). The model treats those
  facts as authoritative and cannot contradict them.
- **Feedback with evidence.** At most three ranked cards, each quoting and locating your own
  working, saying why that route stalls, pointing at the next move, and ending with a question you
  can reuse on the next problem.
- **Never the solution.** The expert solves privately so its reading is grounded in a route that
  was actually checked. The solution is never rendered.

The dashboard is a workflow document, not a message box: there is no free-text input, and no
verdict on who did better.

## Two modes, one deploy

| | Demo (`USE_MOCK=true`) | Live (`USE_MOCK=false` + `MODEL_API_KEY`) |
|---|---|---|
| Library | One read-only folder, **Examples**: recorded real runs of the full pipeline on the author's own handwritten attempts at ICMC problems | Your own, empty at first: create problems, folders, drag and drop |
| Model calls | None. Every API route refuses at the provider seam, and the Meta client refuses again, even if a key is set | The full pipeline below |
| Browser storage | `competitor.demo.*` | `competitor.live.*` |

The mode is decided on the server from env and passed down to the UI; nothing in the browser can
switch a demo deploy to live. Anything other than `USE_MOCK=false` means demo, so a deploy with a
missing variable fails closed.

Each example shows its source (for instance ICMC 2019 Problem 2), when it was recorded, and the
handwritten pages the model read (click a page to open it). Examples are written by
`scripts/record-example.ts`, which drives the same server code the app uses. Call S's solution is
stripped before anything is written, and the script refuses to write a file if any of it survives.

## The pipeline

```
statement ──► S  solve + verify ──┬──► A  expert reading ──► B  second reading ──► R  audit ──┬──► compare.ts ──► explain ──► feedback
              (kept private)      └──► C  student reading of the attempt pages ───────────────┘
```

| Step | What it does | Effort |
|---|---|---|
| **S** | Solves privately, then a sceptical verifier walks the steps and recomputes a small case from scratch; one corrected re-solve on a fail. The verdict is recorded; an unverified solution is dropped. | high, then medium |
| **A** | The expert reading, grounded in S's verified route: the kept method is that route, weights follow what it uses, the simplification is its small case, nothing echoes the answer. Binding plain-language rules (`lib/providers/meta/plainStyle.ts`, shared with B, R, C and explain): written for a student who is stuck, words before symbols, no notation the statement does not already use, small worked numbers before general formulas, every technique explained in plain words, a performable "how to spot it". | high |
| **B** | Second reading with the finished chain in hand: weights move, up to two spans join. If it fails, A stands. | medium |
| **R** | Audit: a sceptical-student role-play checks every claim is true (patterns stated in words are recomputed on small cases), cues are faithful to the route (conditions such as signs carried in the same card), fields are plain and followable (unexplained notation or notation standing in for a sentence fails) and nothing leaks the answer. One targeted revision on a fail. | medium |
| **C** | Reads the attempt pages into the same schema: faithful, not charitable. Stages with no evidence stay empty, spans quote the statement verbatim, and a structure report says what was inferred or missing. | medium |
| **compare.ts** | Set difference over located spans: missed heavy cues, unused marks, the route on each side. | no model |
| **explain** | Writes the feedback from the solution, both chains and the computed facts, under the rules below, in the same plain language (the student's own working is quoted as written). If it fails, the compare.ts comparison is shown. | high |
| **title** | Names a new problem in 2–6 plain words (never its answer or method). Until it lands, and if it fails, the name comes from the statement's opening words. | low |

A, B and R run as three separate requests (`/api/expert`), so each shows as its own stage and is
kept as it lands. In the browser every problem's analysis is a job of its own: several run side by
side, they keep going while you open other problems or pages, and if the tab is reloaded the
finished stages are kept, so resubmitting runs only what is left.

Every call goes through the OpenAI SDK to Meta's API (`muse-spark-1.3`) in JSON mode; every response
is validated with zod and retried once with the errors appended. The browser never talks to the
model: uploads (photos, HEIC, multi-page PDFs) become downscaled JPEG pages in the browser first.
In live mode the solution is cached with the analysis in your own browser, so a resubmission skips
the solve; it is never displayed.

## Research basis of the feedback rules

The explain call's writing rules are the feedback literature made binding:

| Rule | Source |
|---|---|
| Feedback is about the process and self-regulation, never the person | Hattie & Timperley 2007; Kluger & DeNisi 1996 |
| Elaborate rather than verify: few, specific, ranked cards (at most three) | Shute 2008 |
| Make the gap visible in the student's own work: evidence quoted and page-located | Sadler 1989 |
| Hint at the next move and stop short of the bottom-out answer | VanLehn 2011 |
| A correct idea that was dropped is a control decision to revisit, not a lack of ability | Schoenfeld 1985; Mueller & Dweck 1998 |
| Every card ends with a self-check question the student can carry to the next problem | Nicol & Macfarlane-Dick 2006 |

<details>
<summary>References</summary>

- Hattie, J. & Timperley, H. (2007). *Review of Educational Research*, 77(1), 81–112.
- Kluger, A. N. & DeNisi, A. (1996). *Psychological Bulletin*, 119(2), 254–284.
- Shute, V. J. (2008). *Review of Educational Research*, 78(1), 153–189.
- Sadler, D. R. (1989). *Instructional Science*, 18(2), 119–144.
- VanLehn, K. (2011). *Educational Psychologist*, 46(4), 197–221.
- Schoenfeld, A. H. (1985). *Mathematical Problem Solving*. Academic Press.
- Mueller, C. M. & Dweck, C. S. (1998). *Journal of Personality and Social Psychology*, 75(1), 33–52.
- Nicol, D. J. & Macfarlane-Dick, D. (2006). *Studies in Higher Education*, 31(2), 199–218.

</details>

## Run it with your own key

1. Get a Meta Model API key.
2. Clone and install:
   ```bash
   git clone https://github.com/VictorTsokonov/competitor.git
   cd competitor
   npm install
   cp .env.example .env.local
   ```
3. In `.env.local`, set `USE_MOCK=false` and `MODEL_API_KEY=<your key>`.
4. `npm run dev`, then open http://localhost:3000/dashboard. Your library starts empty.
5. Create a problem: type the statement (LaTeX with `$…$`), or paste a screenshot and it is
   transcribed for you. Leave the name empty and it is named for you.
6. Work the problem on paper following the [guide](http://localhost:3000/guide), photograph the
   pages or export a PDF (or paste screenshots of them), and submit the attempt. Each stage shows
   as it runs, with a retry; a full run takes several minutes, and you can create or open other
   problems meanwhile.

## Recording a demo example

```bash
npx tsx scripts/record-example.ts <fixture-id> [--n <number>]
```

Runs the full pipeline in live mode on `fixtures/statements/<id>.txt` and
`fixtures/attempts/<id>/page-*.jpg` (`fixtures/` is private and git-ignored), then writes
`lib/examples/example-<n>.json` and `public/examples/<n>/`. Add the line it prints to
`lib/examples/index.ts` and the example appears in the demo.

Tuning scripts: `solve-pass.ts` (call S), `expert-pass.ts [--grounded]` (S → A → B → R with a
pass/fail rubric against the hand-written targets in `lib/dummy/`), `attempt-pass.ts` (call C),
`feedback-pass.ts` (the whole chain), all run with `npx tsx scripts/<name> <fixture-id>`.

## Project layout

```
app/                Next.js 15 App Router: pages and API routes (no DB, no auth)
  dashboard/        page.tsx decides the mode on the server; Dashboard.tsx is the app
components/
  ui/ layout/       notebook primitives, header, panels, drawers
  sets/             the problem library tree
  reading/          the layered reading in eight stages
  comparison/       feedback cards and the student's side
  create/ latex/    problem creation, attempt upload, LaTeX editor and reference
lib/
  schema.ts         the shared zod schema
  mode.ts           demo or live, from server env
  analysis.ts       the provider seam every API route goes through
  providers/        meta/ (the live calls and prompts), demo.ts (recorded examples)
  compare.ts        the model-free comparison
  examples/         recorded real runs served in demo mode
  dummy/            hand-written analyses: the model's quality target
scripts/            recording and tuning from the terminal
design/             HTML mockups: the source of truth for layout and style
```

## Principles

- **Never the solution.** Reading is the product; the solution only grounds it.
- **Never a verdict.** Divergence is reported with evidence, not graded.
- **Validate at the boundary.** Every model response passes zod before it reaches the UI.
- **Boring, readable code.** TypeScript strict, each file does one thing.

## Built by

Solo build by Victor Tsokonov during the event (from 28 Oct 2026), using Muse Code and Claude
Code as coding agents, with Muse Spark 1.3 in the product.
