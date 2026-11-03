// The model sometimes drops the closing $ of a short inline formula
// ("for k from 0 to $1010"), and the dashboard then prints a stray "$".
// A schema failure would buy a whole new generation for one character, so
// prose fields are repaired instead: an unpaired $ is closed right after
// the token it opens when that token is short maths, and escaped to a
// literal \$ otherwise. Only the model's own prose is touched — spans and
// anything else that quotes the statement verbatim are skipped by the
// callers — and fields with display maths ($$) are left as they are.

// Positions of unescaped single dollars; null when the text has display maths.
function dollarPositions(text: string): number[] | null {
  if (text.includes("$$")) return null;
  const at: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "$" && text[i - 1] !== "\\") at.push(i);
  }
  return at;
}

// A short maths token: no spaces, at most 24 characters, ends before
// trailing punctuation ("$1010." closes as "$1010$.").
const TOKEN = /^[^\s$]{1,24}?(?=[.,;:!?)]*(\s|$))/;

export function repairDollars(text: string): string {
  const at = dollarPositions(text);
  if (!at || at.length % 2 === 0) return text;
  const open = at[at.length - 1];
  const token = text.slice(open + 1).match(TOKEN)?.[0];
  if (token) {
    const end = open + 1 + token.length;
    return `${text.slice(0, end)}$${text.slice(end)}`;
  }
  return `${text.slice(0, open)}\\$${text.slice(open + 1)}`;
}

// Repairs every string in a parsed model response except the paths the
// caller skips (verbatim quotes of the statement). Arrays and objects are
// copied, so the raw response is left untouched.
export function repairDollarsDeep(
  value: unknown,
  skip: (path: string[]) => boolean,
  path: string[] = []
): unknown {
  if (skip(path)) return value;
  if (typeof value === "string") return repairDollars(value);
  if (Array.isArray(value)) {
    return value.map((v, i) => repairDollarsDeep(v, skip, [...path, String(i)]));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, repairDollarsDeep(v, skip, [...path, k])])
    );
  }
  return value;
}
