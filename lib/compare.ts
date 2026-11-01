// The comparison skeleton, computed in TypeScript with no model call:
// both chains quote the same statement, so missed and unused cues are set
// differences over located span ranges (lib/marks.ts). This is the input
// and the fallback for the explain call (lib/providers/meta/explain.ts),
// which rewrites the prose as elaborated feedback; the facts here are
// authoritative either way.

import type { Chain, Comparison, FeedbackCard } from "./schema";
import { locateMarks, type Mark } from "./marks";

// Spans the expert leaned on hard enough that missing one changes the
// route: the brief's weight bands put decisive levers at 80+, structural
// cues at 40-70; 70 keeps the top of the structural band in view.
const MISSED_WEIGHT = 70;
const MAX_CARDS = 3;

function overlaps(a: Mark, b: Mark): boolean {
  return a.start < b.end && a.end > b.start;
}

function missedCard(expert: Chain, mark: Mark): FeedbackCard {
  const cue = expert.reading.cues.find((c) => c.span_id === mark.id);
  return {
    kind: "missed_cue",
    evidence_student: `Your pages show no mark or use of "${mark.text}".`,
    expert_span_ids: [mark.id],
    diagnosis: cue?.why_it_matters || mark.reason,
    redirection: `Re-read the statement with "${mark.text}" in view and ask what it forces before settling on a method.`,
    self_check:
      cue?.how_spotted ||
      `Re-read the statement and ask what "${mark.text}" is doing there.`,
  };
}

// Statement phrases the student marked but no method of theirs used:
// marked spans absent from every method candidate's deciding evidence.
function unusedCues(student: Chain): string[] {
  const used = new Set(
    student.method.candidates.flatMap((c) => c.deciding_span_ids)
  );
  return student.spans
    .filter((s) => !used.has(s.id))
    .filter((s) => !s.uncertain) // only what the student visibly marked
    .map((s) => s.text);
}

function firstDivergence(expert: Chain, missed: Mark[]): string {
  if (missed.length === 0) {
    return "Your reading covered every cue the expert weighted highly. The remaining differences are in how the cues were used, below.";
  }
  const first = missed[0];
  const cue = expert.reading.cues.find((c) => c.span_id === first.id);
  const why = cue?.why_it_matters || first.reason;
  return `You never marked "${first.text}". The expert weighted it ${first.weight}: ${why}`;
}

export type CompareSkeleton = {
  missed: { span_id: string; text: string; weight: number }[];
  unused: string[];
  expert_chosen: string;
  student_chosen: string;
  student_dropped: string[];
};

// The computed facts, for the explain call's prompt: which heavy expert
// spans the attempt never touched, which marks went unused, and the
// method routes on each side.
export function compareSkeleton(expert: Chain, student: Chain): CompareSkeleton {
  const source = expert.problem.text;
  const studentMarks = locateMarks(source, student.spans);
  const missed = locateMarks(source, expert.spans)
    .filter((m) => m.weight >= MISSED_WEIGHT)
    .filter((m) => !studentMarks.some((s) => overlaps(m, s)));
  return {
    missed: missed.map((m) => ({ span_id: m.id, text: m.text, weight: m.weight })),
    unused: unusedCues(student),
    expert_chosen: expert.method.chosen,
    student_chosen: student.method.chosen,
    student_dropped: student.method.candidates
      .filter((c) => !c.kept)
      .map((c) => c.name),
  };
}

export function compareChains(expert: Chain, student: Chain): Comparison {
  const source = expert.problem.text;
  const studentMarks = locateMarks(source, student.spans);
  const missed = locateMarks(source, expert.spans)
    .filter((m) => m.weight >= MISSED_WEIGHT)
    .filter((m) => !studentMarks.some((s) => overlaps(m, s)));
  const byWeight = [...missed].sort((a, b) => b.weight - a.weight);
  const marked = locateMarks(source, expert.spans).filter(
    (m) => m.weight >= MISSED_WEIGHT && studentMarks.some((s) => overlaps(m, s))
  ).length;
  const heavy = marked + missed.length;
  return {
    where_you_are: `You marked ${marked} of the expert's ${heavy} heavy cues; your route on the page was ${
      student.method.chosen ? `"${student.method.chosen}"` : "never settled"
    }.`,
    // The divergence is the first heavy miss in reading order; the cards
    // are ordered by weight so the costliest miss leads.
    first_divergence: firstDivergence(expert, missed),
    cards: byWeight.slice(0, MAX_CARDS).map((m) => missedCard(expert, m)),
    unused_cues: unusedCues(student),
    where_to_next:
      byWeight.length > 0
        ? `Take one fresh pass at the problem using only the cue above before reading any further.`
        : `Re-run your kept route and watch where it leans on the cues you marked but never used.`,
  };
}
