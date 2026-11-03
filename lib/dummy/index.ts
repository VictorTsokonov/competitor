// Hand-written analyses, one file per problem, keyed by its fixtures/ id.
// They are the model's quality target: scripts/expert-pass.ts reads their
// statements and scripts/rubric.ts judges model output against them. The
// demo never serves them; it serves the recorded runs in lib/examples/.

import icmc2019p1 from "./icmc-2019-p1.json";
import icmc2019p2 from "./icmc-2019-p2.json";
import icmc2020p6 from "./icmc-2020-p6.json";

export const DUMMY_ANALYSES: Record<string, unknown> = {
  "icmc-2019-p1": icmc2019p1,
  "icmc-2019-p2": icmc2019p2,
  "icmc-2020-p6": icmc2020p6,
};
