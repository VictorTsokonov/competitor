// The comparison, computed in TypeScript with no model call: both chains
// quote the same statement, so missed and unused cues are set differences
// over located span ranges (lib/marks.ts). The card prose is drawn from
// the expert chain's own cue fields; a later explain call may sharpen the
// wording, never the facts.

import type { Analysis, Chain, MissedCue } from "./schema";
import { locateMarks, type Mark } from "./marks";

type Comparison = Analysis["comparison"];

// Spans the expert leaned on hard enough that missing one changes the
// route: the brief's weight bands put decisive levers at 80+, structural
// cues at 40-70; 70 keeps the top of the structural band in view.
const MISSED_WEIGHT = 70;
const MAX_MISSED = 4;

function overlaps(a: Mark, b: Mark): boolean {
  return a.start < b.end && a.end > b.start;
}

function missedCue(expert: Chain, mark: Mark): MissedCue {
  const cue = expert.reading.cues.find((c) => c.span_id === mark.id);
  return {
    span_id: mark.id,
    what_it_unlocks: cue?.why_it_matters || mark.reason,
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
  const why = missedCue(expert, first).what_it_unlocks;
  return `You never marked "${first.text}". The expert weighted it ${first.weight}: ${why}`;
}

export function compareChains(expert: Chain, student: Chain): Comparison {
  const source = expert.problem.text;
  const studentMarks = locateMarks(source, student.spans);
  const missed = locateMarks(source, expert.spans)
    .filter((m) => m.weight >= MISSED_WEIGHT)
    .filter((m) => !studentMarks.some((s) => overlaps(m, s)));
  const byWeight = [...missed].sort((a, b) => b.weight - a.weight);
  return {
    // The divergence is the first heavy miss in reading order; the cards
    // are ordered by weight so the costliest miss leads.
    first_divergence: firstDivergence(expert, missed),
    missed_cues: byWeight.slice(0, MAX_MISSED).map((m) => missedCue(expert, m)),
    unused_cues: unusedCues(student),
  };
}
