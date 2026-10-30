// Fixed per-stage pedagogy sources. Static on purpose: they describe the
// method, not the data, so they survive the dummy -> real provider swap.

export type StageSource = {
  cite: string;
  note: string;
  url?: string;
};

export const STAGE_SOURCES: Record<string, StageSource> = {
  reading: {
    cite: "Pólya (1945)",
    note: "Understand the problem before planning anything.",
  },
  goal: {
    cite: "Pólya (1945)",
    note: "State what is asked and what the final line would say.",
  },
  informal: {
    cite: "Pólya (1945)",
    note: "Small words carry the quantifiers: always, finite, first.",
  },
  abstraction: {
    cite: "Chi, Feltovich & Glaser (1981)",
    note: "Experts sort by deep structure; novices by surface features.",
    url: "http://matt.colorado.edu/teaching/highcog/readings/cfg81.pdf",
  },
  simplification: {
    cite: "Pólya (1945)",
    note: "Solve a simpler related problem first.",
  },
  method: {
    cite: "Schoenfeld (1985)",
    note: "Control: pursue leads, abandon dead ends, record both.",
  },
  second_reading: {
    cite: "Pólya (1945); Schoenfeld (1992)",
    note: "Look back: re-read and verify after attempting.",
  },
  divergence: {
    cite: "Hattie & Timperley (2007)",
    note: "Process-level feedback fixes the next ten problems, not just this one.",
  },
};
