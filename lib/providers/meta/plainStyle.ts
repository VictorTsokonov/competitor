// The writing style of everything a student reads, shared so the prompts
// cannot drift apart: the expert reading (call A, the second reading B,
// the audit R and its revision), the feedback cards (explain call) and, in
// a lighter scribe form, the student-reading extraction (call C). The
// reader is stuck on the problem, so every field must be followable on its
// own, and short. Notation (3 Nov, after the all-words style read as walls
// of text): the statement's own notation always, new notation only where
// it is clearer than the sentence it replaces, glossed once when it first
// appears. The 2 Nov rule stands: show the mathematics, never classify it.
// So do never-solve and no-leak.

const PRINCIPLES = `- Write for a student who is stuck on THIS problem. Every field must be followable on its own, and short enough to read at a glance.
- The statement's notation, always. Whenever a field refers to something the statement writes in symbols, write it exactly as the statement does, as $...$ LaTeX ($\\binom{2020}{2}$, $A^n - I$, $s_n$, $n+1$), never as a word paraphrase ("the choose number with 2 at the bottom", "the matrix minus the identity"). Keep the statement's words for its objects too ("matrix", "boundary", "balanced table"), never a synonym of your own ("table", "edge", "pattern"). The same holds for the student's notation when you refer to their work.
- New notation only when it earns its place. Bring in a symbol, letter or formula the statement does not use only when it makes the field shorter AND easier to follow than the sentence it replaces: a general term like $(-3)^k\\binom{2020}{2k}$, an equation like $x^2 = -3$, a short identity the route needs. The first time a new symbol appears, gloss it in a few plain words right there: "$i$, the number with $i^2 = -1$"; "$|z|$, the distance of $z$ from $0$". Gloss it ONCE in your whole output, never again in later fields; never gloss a symbol the same sentence already defines ("counting from $k = 0$" needs no second gloss of $k$), and never gloss a symbol with itself. Indices are subscripts: $j_1$, $x_2$, never j1. Never use notation as shorthand for reasoning: no chains of \\Rightarrow, \\forall or \\exists, no set-builder braces standing in for a sentence.
- A formula beats a sentence that only describes it: write "term $k$ is $(-3)^k\\binom{2020}{2k}$", not "a power of minus three times a choose number with an even bottom number". Words carry the reasoning (why it matters, what to try, what it buys); symbols carry the objects.
- Small numbers first. Show an idea on a small case in digits ("5 points become $5 + 6 = 11$") before, or instead of, the general form.
- Show the mathematics, never a category. Say exactly what happens; "this suggests multiplicative structure" or "this calls for polar form" are banned shapes in any wording.
- Exact, not loose. A sentence must be as exactly true as the formula it replaces. Recompute every small-case value you state. Before writing a pattern in words ("keeps doubling", "points the same way", "every step", "always"), check it on each small case you mention and on one more; if it fails anywhere, say only what holds.
- From basics. When a step relies on a named fact or technique, say in one short clause what it does: "de Moivre's theorem (a power of a complex number raises its distance from $0$ to that power and multiplies its angle)". A technique named with no account of what it does is a defect.
- Length: typically 1-3 short sentences per prose field, one idea per sentence. Cut every sentence that does not help the next step, and never restate in words what a formula beside it already says.
- No loophole in words or symbols. The never-solve and no-leak rules bind words exactly as they bind symbols: "the answer is one less than a power of two" gives an answer away just as "$2^n - 1$" does.
- Hiding a value is never a reason to misdescribe it. When a result depends on two things (a size and how much of it survives, a sign and a factor), say that both decide it without computing either; never shorten it to the one that is easy to say.`;

// Calls A, B and the audit's revision: the expert reading.
export const PLAIN_STYLE = `WRITING STYLE — binding on every prose field the student reads
${PRINCIPLES}`;

// The frames the dashboard prints the expert chain in (components/
// reading/*), so each field is written to read as a sentence where it lands.
export const CHAIN_FIELD_SHAPES = `HOW EACH FIELD IS SHOWN — write it to read as a sentence in its frame
- spans[].reason is a plain-text tooltip where maths is NOT rendered: one short line, no $ and no LaTeX at all (write x, 2x, n+1 as plain text).
- Labels stay short: a method candidate's name (printed "<name>."), method.chosen (one line), prerequisite names, definition terms.
- reading.cues: why_it_matters shows what noticing the phrase buys, with the statement's notation and small numbers; how_spotted is something the student can DO with the statement text ("copy out the first three terms and compare their signs"), never a label and never "it looked important".
- reading.definitions are printed "term: meaning": meaning_latex is a short meaning with any maths inline as $...$, no semicolons and no closing full stop. Only when a formula IS the whole meaning may it be bare LaTeX (printed "term = formula").
- goal fields follow "Asked.", "Answer form." and "The final line would say.": complete sentences.
- informal_cues[].bearing follows the quoted phrase and a colon: complete sentences.
- abstraction.underneath is printed "<object> is really <really_is> → <implies>.": object a short noun phrase, really_is a phrase completing "is really", implies a clause with no closing full stop. Each deeper_properties entry is a paragraph of its own.
- simplification is printed as one paragraph, "<instance> <instance_latex> <what_to_try>", then notice_prompt on its own: instance says which smaller case to try, numbers as digits; instance_latex writes that case out (its actual numbers, a short formula, or a plain sentence); what_to_try is the first experiment; notice_prompt is ONE question. Since the three run on as one paragraph, instance and what_to_try are complete sentences ending in a full stop (instance may end in a colon before a formula), and so is instance_latex when it is a plain sentence.
- method: the kept candidate is printed "<name>. Deciding cues: <phrases>. <from_first_principles>", a dropped one "<name>. <why>": complete sentences a student can follow step by step.`;

// The explain call: the cards the student reads first.
export const FEEDBACK_PLAIN_STYLE = `WRITING STYLE — binding on every field the student reads
${PRINCIPLES}
- Quotes keep the student's notation. Wherever evidence_student quotes the student's work, it keeps their notation exactly as written (as $...$ LaTeX); its location is plain words. Every other field refers to the statement's and the student's objects in their own notation ("your $(-3)^n$ on page 1"), and adds new notation only under the rule above.
- Field lengths: where_you_are 1-2 sentences; first_divergence 1-2 sentences; diagnosis 2-3 sentences; redirection ONE sentence; self_check ONE question; where_to_next ONE sentence.
- The dashboard prints the label "Next:" before redirection and "Self-check:" before self_check, so never write those labels yourself: redirection is one concrete instruction, self_check is one plain question.`;

// Call C: a faithful scribe. Its own descriptions are plain; the
// student's working is quoted exactly, never tidied into plain words.
export const SCRIBE_PLAIN_STYLE = `PLAIN WORDS — for your words, never for the student's
- Your own descriptive words (what a phrase meant to the student, where the evidence sits, what an approach did and why it stopped) are plain everyday language a struggling student would recognise as their own reading. Add no symbols, shorthand or jargon of your own.
- The student's working is quoted, never translated or tidied: keep their notation exactly as written, as $...$ LaTeX, mistakes included. Where they wrote words, keep their words.
- Never put your description in the student's mouth: a heading, label or arrow is reported as what it is ("a heading 'Induction?' with an arrow under it"), not as a sentence the student wrote ("try induction next"). Only words that are on the page go inside quotation marks or after "wrote".`;
