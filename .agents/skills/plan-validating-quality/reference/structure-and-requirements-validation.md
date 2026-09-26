# Structure and Requirements Validation (Scope 1-2)

## 1. Structure Validation

- Plan folder naming is stage-aware: `plans/ideas/<quadrant>/<slug>.md`, undated
  `plans/backlog/<slug>/` and `plans/in-progress/<slug>/`, and
  `plans/done/YYYY-MM-DD__<slug>/` only after completion. Prospective archival instructions must
  resolve the repository-local date after completion gates and use `<completion-date>` until then;
  a hardcoded or forecast date is **HIGH**.
- Plan documents (`README.md`, `brd.md`, `prd.md`, technical docs, `delivery.md`, and idea
  two-pagers) state no time estimate, duration, or date as an effort commitment, per
  [No Time Estimates](../../../../repo-governance/principles/content/no-time-estimates.md); each
  occurrence is **HIGH**. Product durations such as timeouts, and `evidence/` and `learnings.md`,
  are out of scope.
- File structure for newly created formal plans: `README.md`, `brd.md`, `prd.md`, `delivery.md`,
  `learnings.md`, and exactly one technical form (`tech-docs.md` or mapped `tech-docs/`); flag
  missing core files or both/neither technical forms **HIGH**. Reader jobs and cohesion decide the
  technical shape; line counts do not. Do not raise migration findings for `plans/done/`, the
  existing Rhino plan, or another plan that predates this contract.
- Required sections per file: BRD (business goal, impact, affected roles, success metrics,
  non-goals, risks); PRD (product overview, personas, user stories, Gherkin acceptance criteria,
  product scope, product risks); tech-docs (architecture, decisions, file-impact, rollback);
  delivery (phased checkboxes with implementation-notes blocks).
- Folder sits under `plans/backlog/`, `plans/in-progress/`, or `plans/done/`.
- A junior engineer fresh from bootcamp with no professional work experience and no repository or
  stack context can trace current evidence, goals/non-goals, alternatives, decision, design, delivery,
  proof, rollout, rollback, and learnings without author or chat context; gaps are **HIGH**.
- Every material decision records the selected option plus two viable alternatives (status quo when
  viable), repository and applicable external prior art, evidence, trade-offs, rejection reasons, consequences,
  and revisit triggers. Evidence-backed disqualification is valid; invented alternatives are
  **HIGH**.
- A material decision changes the proposed product, architecture, implementation contract,
  delivery boundary, rollout, operation, testing strategy, or recovery behaviour. Wording, section
  layout, checker/fixer iterations, and other plan-authoring history are not alternatives unless
  they change that delivered contract; flag editorial changelogs presented as decision records
  **HIGH**.

## 2. Requirements Validation (BRD + PRD)

Per the
[Content-Placement Rules](../../../../repo-governance/conventions/structure/plans/content-placement-rules.md#content-placement-rules-brdmd-vs-prdmd),
business and product concerns live in separate files — misplacement is a structural violation, not
a stylistic issue.

**In `brd.md` (business perspective)**: business goal/rationale; business impact (pain points,
expected benefits); affected roles — **not** sponsor/stakeholder sign-off mapping (flag **HIGH** if
present); business-level success metrics grounded in observable facts, cited measurements (inline
excerpt, URL, access date), qualitative reasoning, or explicitly labeled Judgment calls — flag
**HIGH** a fabricated numeric target presented as already-measured with no baseline; business-scope
Non-Goals; business risks and mitigations.

**In `prd.md` (product perspective)**: product overview; personas (solo-maintainer hats and
consuming agents — not external stakeholder roles, flag **HIGH** if present); user stories in
`As a … I want … So that …` form; Gherkin acceptance criteria (Given/When/Then/And; flag if Gherkin
lives elsewhere); **journey coherence** — every scenario has explicit `When` and `Then`; repeated
primary keywords are valid for one continuous journey; split only independently meaningful
actions/outcomes; flag incoherent or missing action/outcome scenarios **HIGH** — see the
[Acceptance Criteria Convention](../../../../repo-governance/development/infra/acceptance-criteria/gherkin-format-and-step-keyword-cardinality.md);
product scope (in/out); product-level risks.

**Content-placement violations (flag HIGH)**: business framing (sign-off, sponsors, stakeholders,
KPIs) in `prd.md`; user stories or Gherkin in `brd.md`; personas in `brd.md`; affected roles in
`prd.md`.

**Internet-citation compliance**: a plan citing external data must inline the specific
excerpt/number/quote plus URL and access date — URL-only citations are a finding (links rot, future
readers must verify claims from the plan alone).

**Minimal-sufficiency boundary (HIGH)**: read the requested outcome, explicit Non-Goals and
out-of-scope items, Gherkin acceptance criteria, every applicable repository rule, and required
lifecycle obligations and quality gates together as the plan's stop condition. Delivery or
technical scope is permitted when traceable either to the requested outcome or acceptance criteria,
or to a named applicable rule or required lifecycle obligation; flag scope with no such
traceability. Also flag any attempt to remove mandatory tests, specifications, regression coverage,
accessibility, security, documentation, governance propagation, or required gates in the name of
minimalism.
