# Delivery Plan Structure — Detailed TDD Checklists

## Code Outcome Sections (TDD Detail — MANDATORY)

Every production-code outcome section preserves RED→GREEN→REFACTOR as separate ordered checkboxes.
Do not write “implement X, then write tests,” combine the cycle, or omit detail to reduce checklist
length. Write for a junior engineer fresh from bootcamp with no professional work experience and no
repository or stack context.

Use [Focused Runs and Regression Gates](../../../../repo-governance/development/workflow/test-driven-development/the-red-green-refactor-cycle.md#focused-runs-and-regression-gates) for case selection, evidence, and full regression boundaries.

```markdown
### AC-### — [cohesive behaviour outcome]

- **Input:** canonical AC, prerequisites, and affected scope.
- **Outcome:** [observable contracted behaviour].
- [ ] [AI] **RED:** write `[exact test path/case]`; run `[copyable command]`; acceptance: it fails
      for `[expected missing behaviour]`; save output at `[evidence destination]`.
- [ ] [AI] **GREEN:** implement `[exact symbol/path]`; rerun `[copyable command]`; acceptance: the
      new and existing focused cases pass.
- [ ] [AI] **REFACTOR:** clean `[specific concern/path]`; run `[named affected-boundary selection]`;
      acceptance: behaviour and diagnostics remain unchanged.
- **Proof:** RED evidence plus passing focused outputs, executed identities, and positive counts.
  The phase/pre-PR gates carry full required regression proof.
- _Suggested executor: `swe-[lang]-dev`._
```

Use another RED/GREEN/REFACTOR trio for every independently testable behaviour slice inside the same
outcome. `plan-checker` flags combined or missing cycle actions, or missing paths, commands, expected
observations, and evidence, as HIGH. Canonical Gherkin stays in PRD/spec files and is referenced by
ID/title; never copy full scenarios into `delivery.md`.

Non-code work does not require TDD labels, but every independently verifiable action remains its own
detailed checkbox with exact path, command/inspection, acceptance observation, and proof.

## Validation Checklist

```markdown
### Validation Checklist

- [ ] Every code outcome has separate detailed RED, GREEN, and REFACTOR checkboxes.
- [ ] All tests pass (`rtk npm run affected:test`, the existing guarded root alias).
- [ ] Code meets quality standards.
- [ ] Documentation and rules are reconciled.
- [ ] Acceptance criteria are verified.
```
