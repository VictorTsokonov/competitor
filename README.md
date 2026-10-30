<div align="center">

# C∅mpetitor

### ~~Stop solving.~~ **Start reading.**

A maths tutor for Putnam / ICMC students that **never gives you the solution**.
Instead, it shows you — cue by cue — how an expert *reads* a problem versus how *you* read it.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![KaTeX](https://img.shields.io/badge/KaTeX-maths_rendering-329894)](https://katex.org)
[![zod](https://img.shields.io/badge/zod-validated_at_the_boundary-blue)](https://zod.dev)

*Built for the Meta Hackathon 2026.*

</div>

---

## The idea

Competition maths is lost or won **before the first line of the proof** — in how you read the statement. Which phrases you weight, which objects you recognise for what they really are, which methods those cues suggest.

Most tutoring tools hand you a solution and call it teaching. Competitor runs the **ProofReader protocol** instead:

1. An expert model reads the problem and produces a structured *reading* — weighted spans of the statement, cues, the real objects underneath, candidate methods and why one was kept.
2. You work the problem on paper and upload a photo of your attempt.
3. Your reading is extracted into the **same schema** — faithful to your own words, not charitable.
4. The dashboard lays the two readings side by side: cues you both caught, cues you missed (and what each one unlocks), where your weights diverged.

No verdict on who did better. No chat box. **Never a solution** — the product's one hard rule.

## The dashboard

A workflow document styled like a maths notebook — ruled paper, handwritten display type (Caveat + Kalam), one accent red that only ever carries meaning.

| Page | What it does |
|---|---|
| `/` | Landing — the wordmark, the pitch, how it works |
| `/dashboard` | The app: problem library (nestable folders, drag-and-drop), layered problem reading in 8 stages, side-by-side comparison panel |
| `/createProblem` | LaTeX statement editor with live KaTeX preview, attempt photo dropzone |
| `/guide` | The student protocol: *"Work the problem as if you won't solve it."* |

Every problem lives in one of two states, persisted locally:

- **Unsolved** — rendered statement, protocol reminders, photo dropzone, *Submit attempt*.
- **Analysed** — the layered expert reading (span heatmap over the statement, cues, abstraction, simplification, method candidates, prerequisites, second reading) plus the comparison.

Three real ICMC 2020 problems (1, 2 and 6) ship analysed out of the box, with hand-written analyses that double as the model's quality target.

## How the analysis is structured

Expert and student chains share **one schema** (`lib/schema.ts`, zod-validated at the boundary):

- **Spans** — exact substrings of the statement, each with a category, a 0–100 weight and a reason. Checked in code: a span must quote the source verbatim, so the dashboard can slice the KaTeX-rendered statement into a highlight heatmap.
- **Cues** — why each span matters and a plausible account of how an expert would spot it (the UI is honest that this is a narrative, not the model's cognition).
- **Abstraction** — what each object *really is* and what that implies.
- **Method candidates** — each anchored to the spans that decided it, with first-principles reasoning and why it was kept or dropped.
- **Second reading** — how the weights shift once a method is chosen.

The comparison itself is **plain TypeScript set difference** — no model call, no vibes. Missed cues come with `what_it_unlocks` and a `self_check`, never a grade.

## Model pipeline

| Call | Role | Effort |
|---|---|---|
| **A** | Expert first reading of the statement | high |
| **C** | Student reading extracted from attempt photos — faithful, in the student's own words | medium |
| **B** | Expert second reading, given A | — |
| `compare.ts` | Deterministic comparison of the two readings | no model |

Calls go through the OpenAI SDK to Meta's API (`muse-spark-1.3`); the browser never talks to the model directly. A provider seam in `lib/analysis.ts` switches between the real pipeline and mock mode.

## Getting started

```bash
git clone <this-repo>
cd competitor
npm install
```

Create `.env.local`:

```bash
USE_MOCK=true           # serve the bundled hand-written analyses
# MODEL_API_KEY=...     # for real calls (USE_MOCK=false)
```

Then:

```bash
npm run dev             # http://localhost:3000
```

With `USE_MOCK=true`, submitting an attempt on a bundled problem returns its hand-written analysis; unknown problems get an honest 501 rather than a fake result.

## Project layout

```
app/              Next.js 15 App Router — pages + API routes (no DB, no auth)
components/
  ui/             Pill, Tag, Card, Highlight, …  — the notebook primitives
  layout/         Header, AppShell, Panel, Drawer
  latex/          statement editor, live preview, LaTeX reference
  sets/           problem library tree
  reading/        the 8-stage layered reading
  comparison/     expert-vs-student panel
lib/
  schema.ts       the shared zod schema
  statement.ts    slicing the KaTeX statement at span boundaries
  marks.ts        highlight heatmap logic
  dummy/          hand-written ICMC 2020 analyses (the quality bar)
  providers/      the model provider seam
design/           HTML mockups — the source of truth for layout and style
```

## Principles

- **Never a chatbot.** The dashboard is a workflow document; there is no free-text input.
- **Never a verdict.** Divergence is reported with evidence, not judged.
- **Never a solution.** Reading is the product.
- **Validate at the boundary.** Every model response passes zod before it touches the UI.
- **Boring, readable code.** Each file does one thing; TypeScript strict, no `any`.

---

<div align="center">
<sub>Meta Hackathon 2026 · submission due Wed 4 Nov 2026</sub>
</div>
