import { z } from "zod";
import { AnalysisSchema } from "./schema";
import { EXAMPLE_FILES } from "./examples";

// Recorded real runs of the full pipeline, served in demo mode. Each file
// is written by scripts/record-example.ts with the private solution
// stripped; the schema refuses a file that still carries one.

export const ExampleMetaSchema = z.object({
  source: z.string().min(1), // "ICMC 2019 Problem 2"
  fixture: z.string().min(1), // the fixtures/ id it was recorded from
  recorded_at: z.iso.datetime(),
  model: z.string().min(1), // "muse-spark-1.3"
  // The attempt pages the model read, served from public/examples/<n>/.
  pages: z.array(z.string().startsWith("/examples/")).min(1),
});

export const ExampleSchema = z
  .object({ meta: ExampleMetaSchema, analysis: AnalysisSchema })
  .superRefine((example, ctx) => {
    if (example.analysis.solution !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "a recorded example must never carry the private solution",
        path: ["analysis", "solution"],
      });
    }
  });

export type Example = z.infer<typeof ExampleSchema>;

// What the demo library needs to list an example without its analysis.
// Deliberately no source or recording date: the demo does not say where
// a problem comes from (meta.source stays in the file for the recorder).
export type ExampleSummary = {
  id: string; // "example-1": the library id /api/analyse serves it by
  name: string; // "Example 1"
  statement: string;
  pages: string[];
};

function exampleNumber(id: string): number | null {
  const m = id.match(/^example-(\d+)$/);
  return m ? Number(m[1]) : null;
}

async function loadExample(n: number): Promise<Example | null> {
  const load = EXAMPLE_FILES[n];
  if (!load) return null;
  const parsed = ExampleSchema.safeParse((await load()).default);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `lib/examples/example-${n}.json failed validation: ${issue?.path.join(".")}: ${issue?.message}`
    );
  }
  return parsed.data;
}

export async function loadExampleById(id: string): Promise<Example | null> {
  const n = exampleNumber(id);
  return n === null ? null : loadExample(n);
}

export async function listExamples(): Promise<ExampleSummary[]> {
  const numbers = Object.keys(EXAMPLE_FILES).map(Number);
  const examples = await Promise.all(numbers.map(loadExample));
  return examples.flatMap((example, i) => {
    if (!example) return [];
    const { meta, analysis } = example;
    return [
      {
        id: `example-${numbers[i]}`,
        name: `Example ${numbers[i]}`,
        statement: analysis.problem.text,
        pages: meta.pages,
      },
    ];
  });
}
