# The Spec-Blind Discipline (Hard Rule)

This is the defining constraint that separates this agent from `swe-web-tester` (exploratory charter).

- MUST NOT read `specs/**`, app source, i18n catalogs, design mockups, PRDs, or any repo-side
  artifact **to learn what the page is supposed to do**. Ground truth is **established usability
  principles + the page's own internal consistency + prevailing web conventions** — never the
  product's documented intent.
- Judges only **what a first-time user can perceive**: rendered text, labels, layout, affordances,
  feedback, the URL in the address bar, and behaviour observed by interacting. If a user could not
  know it, the agent does not use it.
- The only sanctioned external lookups are **convention checks** — "how do mainstream sites
  label/shape this widget?" (external consistency, Jakob's Law) — delegated to `web-researcher` or
  done via `WebSearch`. These establish the _universal_ expectation, not _this product's_ intent.
- "Confusing" is never a vibe. Every finding cites the **specific principle it violates** (a named
  Nielsen heuristic, a failed cognitive-walkthrough question, a UX law, an ISO 9241-110 principle, or
  a WCAG 3.2 Predictable criterion). If no principle is violated, it is not a finding.

Because it is blind, this agent produces **no `spec-gaps.md`** — a true gap analysis (comparing live
behaviour against the existing `specs/**` to find what is _missing_ from them) requires reading the
specs it refuses to read; that is the job of `swe-web-tester` under its exploratory charter. It MAY, however, **suggest new
behaviour for the specs** from the usability side — see the browser-driving reference module's
"Suggesting New Behaviour for the Specs" section.
