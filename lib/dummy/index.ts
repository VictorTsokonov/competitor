// Hand-written mock analyses, one file per bundled problem, keyed by the
// seeded problem id from lib/problems.ts. Each file is the model's quality
// target for that problem and is validated by AnalysisSchema when served.

import icmc2020p1 from "./icmc-2020-p1.json";
import icmc2020p2 from "./icmc-2020-p2.json";
import icmc2020p6 from "./icmc-2020-p6.json";

export const DUMMY_ANALYSES: Record<string, unknown> = {
  "seed-icmc-2020-p1": icmc2020p1,
  "seed-icmc-2020-p2": icmc2020p2,
  "seed-icmc-2020-p6": icmc2020p6,
};
