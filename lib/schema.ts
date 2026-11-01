import { z } from "zod";

// The statement exactly as typed: prose with $…$ / $$…$$ maths. This is
// the single source string that spans quote and the dashboard renders.
export const ProblemSchema = z.object({
  text: z.string().min(1),
});

export const SpanCategorySchema = z.enum([
  "setting",
  "definition",
  "rule",
  "goal",
  "informal",
]);

export const SpanSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  category: SpanCategorySchema,
  weight: z.number().int().min(0).max(100),
  reason: z.string(),
  uncertain: z.boolean().optional(),
});

export const ReadingSchema = z.object({
  cues: z.array(
    z.object({
      id: z.string().min(1),
      span_id: z.string().min(1),
      why_it_matters: z.string(),
      how_spotted: z.string(),
    })
  ),
  definitions: z.array(z.object({ term: z.string(), meaning_latex: z.string() })),
});

export const GoalSchema = z.object({
  asked: z.string(),
  answer_form: z.string(),
  final_line_would_say: z.string(),
});

export const InformalCuesSchema = z.array(
  z.object({ span_id: z.string().min(1), bearing: z.string() })
);

export const AbstractionSchema = z.object({
  underneath: z.array(
    z.object({ object: z.string(), really_is: z.string(), implies: z.string() })
  ),
  deeper_properties: z.array(z.string()),
});

export const SimplificationSchema = z.object({
  instance: z.string(),
  instance_latex: z.string(),
  what_to_try: z.string(),
  notice_prompt: z.string(),
});

export const MethodSchema = z.object({
  candidates: z.array(
    z.object({
      name: z.string(),
      deciding_span_ids: z.array(z.string()),
      from_first_principles: z.string(),
      kept: z.boolean(),
      why: z.string(),
    })
  ),
  chosen: z.string(),
});

export const PrerequisitesSchema = z.array(
  z.object({
    name: z.string(),
    needed_for: z.string(),
    flag: z.enum(["assumed", "needed"]),
  })
);

export const SecondReadingSchema = z.object({
  new_spans: z.array(z.string()),
  reweighted: z.array(
    z.object({
      span_id: z.string().min(1),
      old: z.number().int().min(0).max(100),
      new: z.number().int().min(0).max(100),
      why: z.string(),
    })
  ),
  what_changed: z.string(),
});

export const DomainSchema = z.enum(["maths", "not_maths"]);

export const ChainSchema = z
  .object({
    problem: ProblemSchema,
    spans: z.array(SpanSchema),
    reading: ReadingSchema,
    goal: GoalSchema,
    informal_cues: InformalCuesSchema,
    abstraction: AbstractionSchema,
    simplification: SimplificationSchema,
    method: MethodSchema,
    prerequisites: PrerequisitesSchema,
    second_reading: SecondReadingSchema,
    domain: DomainSchema,
  })
  .superRefine((chain, ctx) => {
    chain.spans.forEach((s, i) => {
      if (!chain.problem.text.includes(s.text)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `spans[${i}].text is not an exact substring`,
          path: ["spans", i, "text"],
        });
      }
    });
  });

// Every span_id and deciding_span_id must name an existing span. Shared by
// the expert and student model-response schemas in lib/providers/meta.ts.
export function refineChainReferences(
  chain: Chain,
  ctx: z.RefinementCtx
): void {
  const ids = new Set(chain.spans.map((s) => s.id));
  const check = (id: string, path: (string | number)[]) => {
    if (!ids.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `references unknown span id "${id}"`,
        path,
      });
    }
  };
  chain.reading.cues.forEach((c, i) =>
    check(c.span_id, ["reading", "cues", i, "span_id"])
  );
  chain.informal_cues.forEach((c, i) =>
    check(c.span_id, ["informal_cues", i, "span_id"])
  );
  chain.method.candidates.forEach((c, i) =>
    c.deciding_span_ids.forEach((id, j) =>
      check(id, ["method", "candidates", i, "deciding_span_ids", j])
    )
  );
  chain.second_reading.reweighted.forEach((r, i) =>
    check(r.span_id, ["second_reading", "reweighted", i, "span_id"])
  );
}

// The guide's five headings. Call C reports which of them the attempt
// actually wrote, which it had to infer from plain working, and which have
// no evidence on the page at all.
export const GuideStageSchema = z.enum([
  "reading",
  "goal",
  "abstraction",
  "simplification",
  "method",
]);

export const AttemptReportSchema = z.object({
  // guided: the five headings are written out. partial: some structure.
  // unstructured: plain working mapped into the chain by inference.
  structure: z.enum(["guided", "partial", "unstructured"]),
  inferred_stages: z.array(GuideStageSchema),
  missing_stages: z.array(GuideStageSchema),
  // Human-readable notes: illegible passages, cut-off pages, anything the
  // extraction could not read. Empty when the pages read cleanly.
  legibility: z.array(z.string()),
});

export const MissedCueSchema = z.object({
  span_id: z.string().min(1),
  what_it_unlocks: z.string().min(1),
  self_check: z.string().min(1),
});

export const ComparisonSchema = z.object({
  first_divergence: z.string(),
  missed_cues: z.array(MissedCueSchema),
  unused_cues: z.array(z.string()),
});

export const AnalysisSchema = z
  .object({
    problem: ProblemSchema,
    expert: ChainSchema,
    student: ChainSchema,
    comparison: ComparisonSchema,
    // Present once a real attempt has been extracted (call C); absent on
    // expert-only analyses and the hand-written dummies.
    attempt_report: AttemptReportSchema.optional(),
  })
  .superRefine((val, ctx) => {
    (["expert", "student"] as const).forEach((side) => {
      if (val[side].problem.text !== val.problem.text) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${side}.problem.text must match the analysis problem`,
          path: [side, "problem", "text"],
        });
      }
    });
  });

export type MissedCue = z.infer<typeof MissedCueSchema>;
export type Chain = z.infer<typeof ChainSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type SpanCategory = z.infer<typeof SpanCategorySchema>;
export type GuideStage = z.infer<typeof GuideStageSchema>;
export type AttemptReport = z.infer<typeof AttemptReportSchema>;
