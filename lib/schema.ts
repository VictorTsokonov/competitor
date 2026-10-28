import { z } from "zod";

export const ProblemSpanSchema = z.object({
  text: z.string().min(1),
  weight: z.number().int().min(0).max(3),
  reason: z.string(),
});

export const CueTypeSchema = z.enum([
  "quantifier",
  "constraint",
  "symmetry",
  "extremal",
  "parity_divisibility",
  "boundary",
  "definition",
]);

export const CueSchema = z.object({
  id: z.string().min(1),
  span: z.string().min(1),
  type: CueTypeSchema,
  why_it_matters: z.string(),
  how_spotted: z.string(),
});

export const RelationSchema = z.object({
  cue_ids: z.array(z.string()),
  statement: z.string(),
  maths: z.string(),
});

export const ModelSchema = z.object({
  objects: z.array(z.string()),
  definitions: z.array(z.string()),
  formal_statement: z.string(),
});

export const RejectedSchema = z.object({
  method: z.string(),
  why: z.string(),
});

export const SelectionSchema = z.object({
  method: z.string(),
  deciding_cue_ids: z.array(z.string()),
  rejected: z.array(RejectedSchema),
  unlocking_observation: z.string(),
});

export const Pass2Schema = z.object({
  new_cues: z.array(z.string()),
  reweighted: z.array(
    z.object({ text: z.string(), weight: z.number().int().min(0).max(3) })
  ),
  what_changed: z.string(),
});

export const DomainSchema = z.enum(["maths", "not_maths"]);

export const ChainSchema = z.object({
  problem_spans: z.array(ProblemSpanSchema),
  cues: z.array(CueSchema),
  relations: z.array(RelationSchema),
  model: ModelSchema,
  selection: SelectionSchema,
  pass_2: Pass2Schema,
  domain: DomainSchema,
});

export const ComparisonSchema = z.object({
  first_divergence: z.string(),
  missed_cues: z.array(z.string()),
  unused_cues: z.array(z.string()),
});

export const AnalysisSchema = z
  .object({
    problem: z.string().min(1),
    expert: ChainSchema,
    student: ChainSchema,
    comparison: ComparisonSchema,
  })
  .superRefine((val, ctx) => {
    (["expert", "student"] as const).forEach((side) => {
      val[side].problem_spans.forEach((s, i) => {
        if (!val.problem.includes(s.text)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${side}.problem_spans[${i}].text is not an exact substring`,
            path: [side, "problem_spans", i, "text"],
          });
        }
      });
      val[side].cues.forEach((c, i) => {
        if (!val.problem.includes(c.span)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${side}.cues[${i}].span is not an exact substring`,
            path: [side, "cues", i, "span"],
          });
        }
      });
    });
  });

export type Chain = z.infer<typeof ChainSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
