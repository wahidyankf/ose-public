# Output Modes: `plan` (Explicit Only) and `delivery`

## Mode `plan` (explicit only) — a new plan folder

Use only when the caller literally selects `output-mode: plan`; omission defaults to `local-tmp`.

(When the caller passes `plan-stage: in-progress`, write the folder under `plans/in-progress/<slug>/`
with no date prefix instead of `plans/backlog/`.) Create `plans/backlog/<slug>/` where `<slug>` is a
kebab-case identifier derived from the target + goal. Follow the
[Plans Organization Convention](../../../../repo-governance/conventions/structure/plans.md) and the
`plan-creating-project-plans` Skill for structure and tone.

Run the full pre-write grill from `plan-creating-project-plans`, then emit the mature core with a
mapped `tech-docs/` form:

- **`README.md`** — context; target URL(s) and environment; the usability goal and persona; the
  heuristic passes and walkthrough tasks run; a coverage map (dimensions/breakpoints/locales
  evaluated vs. not, with reasons); and an overall usability impression + top friction; plus a
  Document Map linking the other files.
- **`brd.md`** — business framing: who is confused, the cost of friction, why clarity matters, and
  business-level success metrics.
- **`prd.md`** — personas (the first-time user front and centre); user stories framed as the
  _desired clarity_; and **Gherkin acceptance criteria describing the clarified, predictable
  behaviour** (use the `plan-writing-gherkin-criteria` Skill). Include in-scope / out-of-scope.
- **`tech-docs/README.md`** — maps the technical companions and explains the remediation architecture.
- **`tech-docs/findings.md`** — the usability-finding catalog: every finding with the full anatomy, sorted by
  severity (4 → 0) then area.
- **`tech-docs/walkthrough.md`** — the method-transparency artifact: for each task walked, the step-by-step
  transcript with the four cognitive-walkthrough questions answered at each step and the verdict.
- **`tech-docs/spec-suggestions.md`** — usability-grounded **behaviour suggestions** for `specs/**`: each entry
  (`USS-001`, …) names a behaviour a first-time user would expect but the page lacks, the violated
  principle and paired `UWT-###` finding, the proposed Gherkin scenario, and the spec-blind caveat.
  This is **not** a `spec-gaps.md`. If no suggestions surfaced, omit this file and say so in
  `README.md`.
- **`delivery.md`** — cohesive outcomes tied to PRD criteria, with Input/Outcome/Proof, granular
  action checkboxes, separate detailed RED/GREEN/REFACTOR cycles, phase gates, natural seams, and
  archival gates.
- **`learnings.md`** — the required transient Knowledge Capture log scaffold.
- **`evidence/`** — the committed evidence subfolder: cited screenshots and any captured timing
  output a finding references. Moves with the plan through its lifecycle. See the
  [Evidence Capture Convention](../../../../repo-governance/development/quality/evidence-capture.md).
  Omit only when the run captured no file-based evidence.

After writing, add a one-line entry to `plans/backlog/README.md` if that index lists plans, and run
the plan quality gate, including `rtk npm run lint:md`, over the new files.

## Mode `delivery` — fold findings into an existing plan's `delivery.md`

Selected with `output-mode: delivery` and a `plan-path`. This mode is the single mechanism behind the
**rule-15 web-UI near-end three-tester retest** (see the
[User-Facing Delivery Hardening Convention](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
and the
[Web UX Test-Fixing Planning workflow](../../../../repo-governance/workflows/quality/ux-review-fix-planning.md)).
Do not create a new plan folder and do not author `README`/`brd`/`prd`/`tech-docs`/`delivery`.
Instead:

- Append each finding to the host plan's `delivery.md` as a **new unchecked checkbox**, one finding
  per checkbox, source-attributed: `- [ ] UWT-NNN: <defect summary> — fix before archival`, inside a
  clearly-labelled `## Rule-15 three-tester retest follow-ups` section (create it if absent).
- Fold each spec-suggestion (`USS-###`) into that same section as its own unchecked checkbox tied to
  the host plan's `specs/**` coverage steps.
- Write cited screenshots into the **host plan's** `evidence/` subfolder.
- Run `npm run lint:md` over the edited `delivery.md`, and return the same severity-count summary to
  the orchestrator.
