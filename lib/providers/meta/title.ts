import { z } from "zod";
import { requestValidatedJson, type JsonCall } from "./client";
import { TITLE_SYSTEM_PROMPT } from "./titlePrompt";

// The title call: a 2-6 word plain-text name for a problem, read from its
// statement. The schema holds the prompt's limits, so a title that breaks
// them buys the client's one validation retry instead of reaching the UI.

export const TITLE_MAX_LENGTH = 48;

const TitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "the title is empty")
    .max(TITLE_MAX_LENGTH, `the title must be at most ${TITLE_MAX_LENGTH} characters`)
    .refine((t) => !/[$\\]/.test(t), "the title must be plain text: no $ and no backslash")
    // An apostrophe ("Euler's") is fine; quoting the title is not.
    .refine(
      (t) => !/["“”‘«»`]/.test(t) && !/^['’]|['’]$/.test(t),
      "the title must not contain quotation marks"
    )
    .refine((t) => !t.endsWith("."), "the title must not end with a full stop")
    .refine((t) => {
      const words = t.split(/\s+/).length;
      return words >= 2 && words <= 6;
    }, "the title must be 2 to 6 words"),
});

export type TitleResult = z.infer<typeof TitleSchema>;

export async function runTitle(problemText: string): Promise<JsonCall<TitleResult>> {
  return requestValidatedJson<TitleResult>({
    label: "title",
    system: TITLE_SYSTEM_PROMPT,
    user: problemText,
    schema: TitleSchema,
    effort: "low",
  });
}
