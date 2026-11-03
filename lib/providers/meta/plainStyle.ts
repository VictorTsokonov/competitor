// The writing style of everything a student reads, shared so the prompts
// cannot drift apart: the expert reading (call A, the second reading B,
// the audit R and its revision), the feedback cards (explain call) and, in
// a lighter scribe form, the student-reading extraction (call C). The
// reader is assumed stuck on the problem and shaky on the basics, so ideas
// come in plain words and small worked numbers first, and notation only
// where it reads more easily than the sentence. The 2 Nov rule stands:
// show the mathematics, never classify it. So do never-solve and no-leak.

const PRINCIPLES = `- Write for a student who is stuck on THIS problem and shaky on the basics. They must be able to follow every field on their own, from the ground up, in everyday words. A longer explanation in words beats a compact formula.
- Words before symbols. Say each idea in a plain sentence first. Use a formula only where it is genuinely easier to read than the sentence (an expression from the statement, or a short equation the student will actually write down), and then say in words what it says. Everyday arithmetic and the statement's own symbols are always fine.
- No new notation. Never bring in a symbol or letter the statement does not already use unless the route truly needs it, and then say what it means the first time it appears. Shorthand never stands in for a sentence: no quantifiers (\\forall, \\exists), no implication or "becomes" arrows (\\Rightarrow, \\implies, \\iff, \\to, \\mapsto), no \\equiv or mod, no \\sum or \\prod, no set-builder braces, \\in or \\mathbb, no ceilings or floors, no \\operatorname{Re}, no polar-exponential forms like $e^{i\\theta}$. Write "for every whole number", "rounded up", "the part without $i$", "at distance 2 from zero, a sixth of a turn round".
- Small numbers before general symbols. Show an idea by doing it on a small case, in words and digits: "with 5 points on the sphere, Alice adds 6, so there are 11", not "$n \\to 2n+1$". When the general step is needed too, give it after the small case and say it in words. Numbers stay digits (0.4, 1/3, 11), never spelled out.
- Show the mathematics, never a category. Still say exactly what happens; "this suggests multiplicative structure" or "this calls for polar form" are banned shapes in any wording.
- Plain is not loose. A sentence must be as exactly true as the formula it replaces. Before writing a pattern in words ("keeps doubling", "every step", "always"), check it on each small case you mention and on one more; if it fails anywhere, say only what holds.
- From basics. When a step relies on a fact, say in one simple sentence why it holds, or name it and say in plain words what it does: "de Moivre's theorem: raising a complex number to a power raises its distance from zero to that power and multiplies its angle by it". A technique named with no plain-words account is a defect.
- Length: as long as it takes to be followed, and no longer. Typically 2-4 short sentences per prose field, one idea per sentence. Never pad: every sentence must help the student take the next step, and every extra sentence is a longer wait.
- Plain words are no loophole. The never-solve and no-leak rules bind words exactly as they bind symbols: "the answer is one less than a power of two" gives an answer away just as "$2^n - 1$" does.
- Hiding a value is never a reason to misdescribe it. When a result depends on two things (a size and how much of it survives, a sign and a factor), say that both decide it without computing either; never shorten it to the one that is easy to say.`;

// Calls A, B and the audit's revision: the expert reading.
export const PLAIN_STYLE = `PLAIN STYLE — binding on every prose field the student reads
${PRINCIPLES}`;

// The frames the dashboard prints the expert chain in (components/
// reading/*), so each field is written to read as a sentence where it lands.
export const CHAIN_FIELD_SHAPES = `HOW EACH FIELD IS SHOWN — write it to read as a sentence in its frame
- spans[].reason is a plain-text tooltip where maths is NOT rendered: one line of plain words, no $ and no LaTeX at all (write x, 2x, n+1 as plain text).
- Labels stay short: a method candidate's name (printed "<name>."), method.chosen (one line), prerequisite names, definition terms.
- reading.cues: why_it_matters shows what noticing the phrase buys, in words and small numbers; how_spotted is something the student can DO with the statement text ("copy out the first three terms and compare their signs"), never a label and never "it looked important".
- reading.definitions are printed "term: meaning": meaning_latex is a short plain-words meaning with any maths inline as $...$, no semicolons and no closing full stop. Only when a formula IS the whole meaning may it be bare LaTeX (printed "term = formula").
- goal fields follow "Asked.", "Answer form." and "The final line would say.": complete sentences.
- informal_cues[].bearing follows the quoted phrase and a colon: complete sentences.
- abstraction.underneath is printed "<object> is really <really_is> → <implies>.": object a short noun phrase, really_is a phrase completing "is really", implies a clause with no closing full stop. Each deeper_properties entry is a paragraph of its own.
- simplification is printed as one paragraph, "<instance> <instance_latex> <what_to_try>", then notice_prompt on its own: instance says in plain words, numbers as digits, which smaller case to try; instance_latex writes that case out (its actual numbers, a short formula, or a plain sentence); what_to_try is the first experiment in words; notice_prompt is ONE question. Since the three run on as one paragraph, instance and what_to_try are complete sentences ending in a full stop (instance may end in a colon before a formula), and so is instance_latex when it is a plain sentence.
- method: the kept candidate is printed "<name>. Deciding cues: <phrases>. <from_first_principles>", a dropped one "<name>. <why>": complete sentences a student can follow step by step.`;

// The explain call: the cards the student reads first.
export const FEEDBACK_PLAIN_STYLE = `PLAIN STYLE — binding on every field the student reads
${PRINCIPLES}
- Quotes keep the student's notation; your own words add none. Wherever evidence_student quotes the student's work, it keeps their notation exactly as written (as $...$ LaTeX); its location and any paraphrase are plain words. where_you_are, first_divergence, diagnosis, redirection, self_check and where_to_next are plain words that use no notation beyond what the student or the statement already used.
- The dashboard prints the label "Next:" before redirection and "Self-check:" before self_check, so never write those labels yourself: redirection is one concrete instruction, self_check is one plain question.`;

// Call C: a faithful scribe. Its own descriptions are plain; the
// student's working is quoted exactly, never tidied into plain words.
export const SCRIBE_PLAIN_STYLE = `PLAIN WORDS — for your words, never for the student's
- Your own descriptive words (what a phrase meant to the student, where the evidence sits, what an approach did and why it stopped) are plain everyday language a struggling student would recognise as their own reading. Add no symbols, shorthand or jargon of your own.
- The student's working is quoted, never translated or tidied: keep their notation exactly as written, as $...$ LaTeX, mistakes included. Where they wrote words, keep their words.
- Never put your description in the student's mouth: a heading, label or arrow is reported as what it is ("a heading 'Induction?' with an arrow under it"), not as a sentence the student wrote ("try induction next"). Only words that are on the page go inside quotation marks or after "wrote".`;
