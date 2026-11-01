import { z } from "zod";
import { ChainSchema, refineChainReferences } from "../../schema";

// The model must echo problem.text verbatim; rather than fail on echo
// drift, pin it to the source so spans are validated against the real
// statement. Span ids referenced anywhere must exist. side "expert" also
// demands the 8-12 spans the prompt asks for; a student chain carries only
// what the pages evidence, so any count from 0 up is legal.
export function pinnedChainSchema(
  problemText: string,
  side: "expert" | "student"
) {
  return z.preprocess(
    (raw) =>
      typeof raw === "object" && raw !== null
        ? { ...(raw as Record<string, unknown>), problem: { text: problemText } }
        : raw,
    ChainSchema.superRefine((chain, ctx) => {
      refineChainReferences(chain, ctx);
      if (
        side === "expert" &&
        chain.domain === "maths" &&
        (chain.spans.length < 8 || chain.spans.length > 12)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `a maths reading needs 8-12 spans, got ${chain.spans.length}`,
          path: ["spans"],
        });
      }
    })
  );
}
