import { z } from "zod";

export const ProblemSchema = z.object({
  text: z.string().min(1),
  latex: z.string(),
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

export const ComparisonSchema = z.object({
  first_divergence: z.string(),
  missed_cues: z.array(z.string()),
  unused_cues: z.array(z.string()),
});

export const AnalysisSchema = z
  .object({
    problem: ProblemSchema,
    expert: ChainSchema,
    student: ChainSchema,
    comparison: ComparisonSchema,
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

export type Chain = z.infer<typeof ChainSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type SpanCategory = z.infer<typeof SpanCategorySchema>;
