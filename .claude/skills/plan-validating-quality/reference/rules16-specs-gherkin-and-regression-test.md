# Rules 16 and 16b: Specs/Gherkin Coverage and Regression Test Mandate

## 16. Specs and Gherkin Delivery Coverage (Step 5j — MANDATORY)

Enforces the
[Feature Change Completeness Convention §Two Paths](../../../../repo-governance/development/quality/feature-change-completeness.md)
for the plan path: a plan creating, modifying, or deleting observable behaviour in `apps/`, `libs/`,
or `specs/` MUST carry explicit steps adding/updating companion `specs/` `.feature` files and running
`test:coverage:behaviour`.

**What to validate**:

1. **Scope detection** — from Scope (`README.md`/`prd.md`), the chosen technical form's file-impact
   analysis, and delivery steps, determine whether observable behaviour under `apps/**`, `libs/**`,
   or `specs/**` is created, modified, or deleted.
2. **Specs/Gherkin authoring step present** — if yes, the checklist includes at least one step
   creating/updating the relevant `specs/apps/**` or `specs/libs/**` feature file(s). Missing:
   **HIGH**.
3. **`test:coverage:behaviour` gate present** — the checklist or a phase gate runs the project's
   `test:coverage:behaviour` target. Missing: **HIGH**.
4. **Owner-scoped copy-ready Gherkin** — packets destined for `specs/` contain no plan slug, number,
   phase, delivery-unit name, or plan acceptance-criterion ID. The external delta map records the plan
   requirement, action, exact feature path, durable scenario title, and adapter disposition. Leakage or
   a missing map is **HIGH**.
5. **Behaviour-change exemption** — behaviour-preserving refactors, no-behaviour-change dependency bumps,
   docs/governance-only plans are exempt (mirrors Feature Change Completeness applicability). Verify
   the exemption is legitimate and stated; an illegitimate exemption is **HIGH**.

**Finding severity**: behaviour-affecting plan with no specs/Gherkin step: **HIGH**. Specs step present
but no `test:coverage:behaviour` gate: **HIGH**. Step present but vague (no specific feature path/domain):
**MEDIUM**. Plan identity inside copy-ready Gherkin or missing external traceability: **HIGH**.
Illegitimate "no behaviour change" exemption: **HIGH**.

## 16b. Regression Test Mandate (bug-fix plans — MANDATORY)

Enforces the
[Regression Test Mandate](../../../../repo-governance/development/quality/regression-test-mandate.md):
a plan fixing discovered bugs/regressions (e.g. built from EWT/UWT/DWT findings) MUST carry an
explicit delivery step per finding adding a **reproducing test** (failing-first, pins the bug) —
Gherkin in `specs/**` plus the consuming test for behavioural defects, or a DOM/computed-style/content
test for visual/copy defects.

**What to validate**: (1) bug-fix detection — does the plan exist to fix defects? (2) per-finding
reproducing-test step — each finding's delivery steps include a failing-first test before its fix
step (RED→GREEN); missing for any finding: **HIGH**. (3) no exemption — applies to cosmetic/visual
findings too (the test form adapts, a test is still required); an untested cosmetic fix is **HIGH**.
