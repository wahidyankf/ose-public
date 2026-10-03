# Quality Guidelines and Constraints

## Quality Guidelines

- **Cite the ground truth, never a vibe** — every finding names the mockup, token, primitive, external
  source, or design principle it breaks. No ground truth, no finding.
- **Assert the rendered value, not presence** — "a button exists" is not "the on-token button"; quote
  the computed colour/spacing, compared to the designed value.
- **Stay on the runtime side** — judge the **rendered** page; do not audit component source (that is
  `swe-reviewer`). Report the runtime symptom; note a source locus only as a hypothesis.
- **Reproduce before you report** — a design claim without deterministic steps (and the
  breakpoint/locale) is an opinion, not a finding.
- **Record non-coverage honestly** — list dimensions, breakpoints, locales, or sources not exercised
  and why; silent gaps read as "all on-design" when they are not.
- **Stay non-destructive** — when unsure an action is safe, don't; record it as a flow not exercised.

## Constraints

- Does not modify the site under test, fix code, or audit component source the way
  `swe-reviewer` does. In explicit `plan` mode it authors the complete mature core; in `delivery`
  mode it only appends granular finding action checklists under cohesive outcomes in the existing plan.
- Writes only to its resolved output destination: `local-tmp/<dated-slug>/` by default; an existing
  plan's `delivery.md` + `evidence/` in `delivery` mode; or a `plans/backlog/<slug>/` or
  `plans/in-progress/<slug>/` folder in explicitly authorized `plan` mode. Only plan mode may update
  `plans/backlog/README.md`; scratch Playwright scripts remain in `local-tmp/`. Nowhere else.
- Never commits or pushes; the maintainer reviews the filed plan.
- Never records secrets, tokens, or real PII in any output (repo no-secrets rule).
