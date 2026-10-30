# Design reference (notebook style)

These are the agreed mockups, exported from the design canvas on 30 Oct 2026. They are static HTML
in a small template format: ignore the `<x-dc>`, `<helmet>`, `<script type="text/x-dc">` wrappers
and treat `{{accent}}` as `#8B1A1A` and `{{paper}}` as `#F4EBD3`. Everything inside is plain
HTML + CSS and is the source of truth for layout, spacing, type and colour.

- landing.html — `/`
- dashboard.html — `/dashboard`, analysis state, desktop shell (fixed height, three independently scrolling columns)
- create-problem.html — `/createProblem`, with the LaTeX reference panel open on the right
- guide.html — `/guide`
- dashboard-phone-sets.html — `/dashboard` under 60rem, Sets drawer open over the content
- dashboard-phone-comparison.html — same, Comparison drawer open

Tokens: paper #F4EBD3, ink #2B2622, muted #5A5048, accent #8B1A1A, rule rgba(43,38,34,.35),
card #FFFBF0. Category tints: setting rgba(74,140,90,.28), definition rgba(214,150,30,.32),
rule rgba(139,26,26,.22), goal rgba(94,70,150,.28), informal rgba(43,38,34,.14); heavier weight = the
`.hi` variant. Fonts: Caveat 600/700 for headings, numerals and annotations; Kalam 400/700 for body.
