# SWE Code Checker: TDD and Specs Completeness

TDD compliance and specs/Gherkin completeness — run for every code change or project under review.

## TDD Compliance

Reference: `repo-governance/development/workflow/test-driven-development.md`.

- **Test-first evidence**: does every non-trivial change have accompanying tests? Are plan
  delivery-checklist steps TDD-shaped (failing test → implement → refactor), not "implement then
  test"? Are all business-logic paths unit-tested? HIGH when tests are absent for new behaviour;
  MEDIUM when tests exist but look written after the fact (all pass trivially on first run, no
  obvious red phase).
- **Required adapters**: every active scenario has Unit proof; Integration/E2E implement every
  scenario their project boundary can express or carry an independently valid exemption. HIGH for
  missing Unit or applicable adapter; MEDIUM for a misclassified boundary.
- **Manual verification shape**: manual verification must be a written, dated, repeatable script
  with discrete expected observations — unstructured "tested manually" notes are a finding. MEDIUM
  when undocumented; HIGH when a recurring behaviour has only informal notes and no automated
  coverage plan.

**Findings format**:

```markdown
### Finding: TDD Compliance

**Project**: [project-name]
**File**: [file-path or delivery checklist path]
**Criticality**: HIGH | MEDIUM
**Confidence**: HIGH | MEDIUM | FALSE_POSITIVE

**Issue**: [tests missing / wrong level / manual verification unstructured]
**Standard**: [Test-Driven Development Convention](../../../repo-governance/development/workflow/test-driven-development.md)
**Recommendation**: [write failing test first; move to cheaper level; structure manual script]
```

## Specs & Gherkin Completeness (Direct-Code Path)

Reference: [Feature Change Completeness Convention §Two Paths](../../../repo-governance/development/quality/feature-change-completeness.md)
— the direct-change-without-plan counterpart to `plan-checker` Step 5j.

- **Companion Gherkin present**: any `apps/**`/`libs/**` change altering observable behaviour
  (new/changed/removed endpoint, command, procedure, component, user-facing behaviour) needs a
  matching `.feature` add/update under `specs/apps/**`/`specs/libs/**`. HIGH if absent; MEDIUM if
  the spec exists but is stale (doesn't reflect the new behaviour).
- **Static coverage wired and green**: every applicable `test:coverage:*` validator is static-only
  and runs through `test:quick`; `test:coverage:behaviour` proves corpus/binding shape. HIGH if a
  behaviour change breaks or bypasses it.
- **Semantic implementation**: material feature, adapter, exemption, or compliance changes require
  the row-by-row Gherkin implementation review. HIGH for a placeholder/no-op binding or missing row.
- **Pure-refactor exemption**: behaviour-preserving refactors, dependency bumps without behaviour
  change, and config-only edits are exempt per the applicability table — never flag these.
