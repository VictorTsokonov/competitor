import OpenAI from "openai";
import type { z } from "zod";

// Meta Model API, OpenAI-compatible (dev.meta.ai/docs). Chat completions
// take a top-level reasoning_effort; "none" is rejected by Muse Spark.
// Server side only: the key never reaches the browser.
const BASE_URL = "https://api.meta.ai/v1";
const MODEL = "muse-spark-1.3";

export type MetaEffort = "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

export type AttemptInfo = {
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  // Present only when the attempt failed validation.
  issues?: string[];
  // Parsed JSON of a failed attempt, when it at least parsed.
  raw?: unknown;
};

export type JsonCall<T> = { data: T; attempts: AttemptInfo[] };

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

function issueList(issues: string[], cap: number): string {
  const shown = issues.slice(0, cap).map((i) => `- ${i}`);
  const more = issues.length - cap;
  if (more > 0) shown.push(`- (+${more} more)`);
  return shown.join("\n");
}

// One JSON call: system + user to muse-spark-1.3 in JSON mode, parse,
// validate with the given zod schema; on validation failure retry once
// with the model's reply and the errors appended, then throw. The user
// turn is plain text, or content parts when the call carries page images.
export async function requestValidatedJson<T>(opts: {
  label: string;
  system: string;
  user: string | OpenAI.ChatCompletionContentPart[];
  schema: z.ZodType<T>;
  effort: MetaEffort;
}): Promise<JsonCall<T>> {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MODEL_API_KEY is not set: add it to .env.local and restart the server."
    );
  }
  const client = new OpenAI({ apiKey, baseURL: BASE_URL });
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];

  const attempts: AttemptInfo[] = [];
  let lastIssues: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = Date.now();
    let completion: OpenAI.ChatCompletion;
    try {
      completion = await client.chat.completions.create({
        model: MODEL,
        reasoning_effort: opts.effort,
        response_format: { type: "json_object" },
        messages,
      });
    } catch (e: unknown) {
      if (e instanceof OpenAI.APIConnectionError) {
        throw new Error(
          `Could not reach the Meta Model API: ${e.message}. Check your network and try again.`
        );
      }
      if (e instanceof OpenAI.APIError) {
        const hint = e.status === 401 ? " — check MODEL_API_KEY in .env.local" : "";
        throw new Error(`Meta Model API error (${e.status}): ${e.message}${hint}`);
      }
      throw e;
    }
    const durationMs = Date.now() - started;
    const usage = completion.usage;
    const info: AttemptInfo = {
      durationMs,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
    };
    console.log(
      `[meta] ${opts.label} attempt ${attempt}: ${durationMs}ms, ` +
        `tokens prompt=${usage?.prompt_tokens ?? "?"} completion=${usage?.completion_tokens ?? "?"}`
    );

    const content = completion.choices[0]?.message?.content ?? "";
    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch (e: unknown) {
      info.issues = [
        `response was not valid JSON: ${e instanceof Error ? e.message : "parse error"}`,
      ];
      attempts.push(info);
      lastIssues = info.issues;
    }
    if (!info.issues) {
      const parsed = opts.schema.safeParse(raw);
      if (parsed.success) {
        attempts.push(info);
        return { data: parsed.data, attempts };
      }
      info.issues = formatIssues(parsed.error);
      info.raw = raw;
      attempts.push(info);
      lastIssues = info.issues;
    }

    if (attempt === 1) {
      console.log(
        `[meta] ${opts.label} attempt 1 failed validation (${info.issues.length} issue(s)); retrying once`
      );
      messages.push(
        { role: "assistant", content },
        {
          role: "user",
          content:
            `Your JSON above failed validation:\n${issueList(info.issues, 25)}\n\n` +
            "Return the complete corrected JSON object and nothing else. " +
            "Copy every spans[].text character for character from the problem " +
            "statement, including $…$ maths, punctuation and spacing. Keep " +
            "everything that already validates unchanged.",
        }
      );
    }
  }
  throw new Error(
    `${opts.label} failed schema validation after a retry: ${lastIssues.slice(0, 8).join("; ")}`
  );
}
