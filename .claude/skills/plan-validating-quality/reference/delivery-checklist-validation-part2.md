# Delivery Checklist Validation, Part 2 (Scope 4)

- **Canonical Gherkin references**: every behaviour outcome section names stable IDs or exact titles and links
  the canonical PRD/spec source. Full inline Gherkin is duplication and **HIGH**. Multiple scenarios
  share one section only when one cohesive outcome and proof boundary binds them; otherwise split.
  Pure refactors and docs/governance-only sections are exempt. See
  [Gherkin-Tagged Delivery Steps](../../../../repo-governance/development/workflow/test-driven-development/gherkin-tagged-delivery-steps.md#gherkin-tagged-delivery-steps).
- **UI-design-funnel completeness (UI-bearing plans)**: plans adding/changing user-facing
  screens/components need the design-funnel artefacts (≥2 named low-fi alternatives, 2 hi-fi
  `.excalidraw.png` finalists, named selection, rationale, grounding/prior-art note, responsive
  strategy across mobile/tablet/desktop). Full detail in
  `reference/rule17-ui-design-funnel-completeness.md` (Step 5k). Pure-refactor/no-UI/
  governance-only plans exempt. See
  [UI Mockups in Plan Docs convention](../../../../repo-governance/conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#ui-mockups-in-plan-docs-principles-in-practice-and-scope).
- **Manual-assertion locale and evidence completeness (UI/API plans)**: manual-assertion steps must
  cover all supported locales on a multi-locale app and capture committed evidence (screenshots to
  `evidence/`; HTTP or native wire results inlined or saved as named sanitized evidence). An
  API-changing plan must additionally provide literal,
  copy-pasteable `rtk curl` success and representative failure commands per changed HTTP-accessible operation, with
  exact assertions, synthetic fixtures, independently attributable evidence, cleanup, and failure
  routing. Every changed non-HTTP RPC/event operation needs an equivalent fully written
  protocol-native client success/failure recipe and proof. Full detail in
  `reference/rule9-manual-behavioural-assertion-validation.md` items 2-3 and 6 (Step 5c). Single-locale
  coverage, no evidence-capture step, or a non-executable/non-independent wire recipe is **HIGH**;
  an operation with no applicable curl/native-client recipe is **CRITICAL**. See
  [Evidence Capture Convention](../../../../repo-governance/development/quality/evidence-capture.md).
- **Rule-15 three-tester retest (web-UI feature-change plans)**: a near-end step runs the
  [`web-ux-test-fixing-planning`](../../../../repo-governance/workflows/web/web-ux-test-fixing-planning.md)
  triad (`web-exploratory-tester`, `web-usability-tester`, `web-design-tester`) across all supported
  locales, with every EWT/UWT/DWT defect finding folded into `delivery.md` as an unchecked checkbox
  fixed before archival (deferral needs explicit user permission, only when genuinely impossible;
  SG-###/USS-### proposals may be triaged/deferred). Unfixed defect checkbox at archival, missing
  step, or single-locale scope: **HIGH**. CLI/text-output and pure governance/agent-definition plans
  exempt. See
  [User-Facing Delivery Hardening](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
  Rule 15.
- **Rule-16 API exploratory retest (API feature-change plans)**: a near-end step runs
  `api-exploratory-tester` (`output-mode: delivery`) against the running endpoint(s), with every
  AET-### defect finding folded into `delivery.md` and fixed before archival (same deferral rule;
  SG-### proposals triageable). Unfixed defect checkbox, or missing step on an API feature-change
  plan: **HIGH**. Independent of Rule 15 (a plan changing both UI and API carries both retests).
  Frontend-only/CLI/governance-only plans exempt. See
  [User-Facing Delivery Hardening](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
  Rule 16.
- **Knowledge Capture phase presence**: every substantive plan's `delivery.md` carries a final
  Knowledge Capture phase (or explicit "none" record). Full detail in
  `reference/rule18-knowledge-capture-phase-presence.md` (Step 5l). Silent absence: **MEDIUM**;
  explicit "none": PASS. See
  [Knowledge Capture Convention](../../../../repo-governance/development/quality/knowledge-capture.md).
- **Automatic rules-propagation coverage (conditional HARD RULE)**: independently classify scope
  and file impacts against the full normative surface. Every affected repository must have a
  repository-local outcome in the rule-changing delivery unit with separate actions for inventory,
  conflict/precedence and supersession, placement/eviction, canonical/config/enforcement/index
  edits, three-way enforcement dispositions, generated bindings, verification and
  `rules-quality-gate`, manifest/final status, and sibling obligation. A missing outcome, generic
  invocation, reusable checkbox template standing in for repeated concrete actions, or
  cross-repository evidence substitution is **HIGH**.

### Granular Delivery Within Outcome Cohesion

- Each outcome section has Input, Outcome, Proof, and canonical AC references; every concrete,
  independently verifiable action is a separate executor-tagged checkbox.
- Code behaviour slices have separate RED/GREEN/REFACTOR checkboxes. Flag omitted detail and omnibus
  actions; do not flag a high useful checkbox count.
- Split outcome sections at independent proof boundaries. Reject only mechanical keystroke
  micro-checkboxes with no distinct observation.
- Checklist, LOC, and file counts never create, erase, or force Delivery Boundaries. Require each
  unit to follow a natural cohesive seam, exclude unrelated purposes, and keep every artifact
  needed to build, verify, operate, roll back, and remain internally consistent together. Require
  its exact resulting `main` state to be safe to deploy to production immediately. Incomplete
  behaviour must be complete-and-inert behind a temporary production-disabled feature flag with
  enabled and disabled path tests and recorded rollout, rollback, and removal. Missing any of this
  delivery evidence is **HIGH**.
- Phase transitions have explicit verification steps (e.g. "Verify
  `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run app:typecheck` passes").
- Input/Outcome/Proof prose is not a task; every action checkbox is an independent harness task.
