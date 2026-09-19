---
description: How plan-maker must express code-shipping delivery items as TDD-shaped steps, and how plan-executor and swe-*-dev agents follow TDD during execution.
when_to_use: Use when authoring a plan's delivery.md checklist, or when executing a delivery item that ships code.
---

# Applying TDD to Plans

## Plan Creation (plan-maker)

When `plan-maker` authors a `delivery.md` checklist, items that ship code MUST be expressed as
TDD-shaped outcome sections with separate, detailed RED, GREEN, and REFACTOR checkboxes. Do not
write "implement X, then write tests," combine the cycle into one checkbox, or omit detail merely to
keep the checklist short.

Write instead:

```markdown
### AC-EXAMPLE-01 — [observable behaviour]

- **Input:** canonical scenario AC-EXAMPLE-01 and the current implementation boundary.
- **Outcome:** [observable behaviour] matches the canonical scenario.
- [ ] [AI] **RED:** add `[test case]` in `[test path]`; run `[focused command]`; acceptance: it fails
      for `[expected missing behaviour]`; record the output.
- [ ] [AI] **GREEN:** implement `[symbol]` in `[source path]`; rerun `[focused command]`;
      acceptance: the focused suite passes.
- [ ] [AI] **REFACTOR:** clean `[specific concern]`; run `[focused command]` and
      `rtk nx run <project>:test:quick`; acceptance: behaviour stays green.
- **Proof:** RED failure evidence, focused pass, and the project `test:quick` result.
```

When one cohesive outcome needs multiple cycles, give every behaviour slice its own checkbox trio in
the same outcome section:

```markdown
- **Input:** AC-EXAMPLE-02 and existing focused tests.
- **Outcome:** both paths satisfy AC-EXAMPLE-02 without duplication.
- [ ] [AI] **RED — happy path:** [exact test/path/command/failure].
- [ ] [AI] **GREEN — happy path:** [exact source/symbol/command/pass].
- [ ] [AI] **REFACTOR — happy path:** [exact cleanup/commands/invariant].
- [ ] [AI] **RED — error path:** [exact test/path/command/failure].
- [ ] [AI] **GREEN — error path:** [exact source/symbol/command/pass].
- [ ] [AI] **REFACTOR — error path:** [exact cleanup/commands/invariant].
- **Proof:** each RED failure and GREEN/refactor pass plus `rtk nx run <project>:test:quick`.
```

The TDD actions remain one cohesive delivered behaviour, but they are independent checklist progress
and harness tasks. Outcome cohesion does not erase execution detail.

Acceptance criteria in `prd.md` are written as Gherkin scenarios (per the
[plan-writing-gherkin-criteria skill](../../../../.agents/skills/plan-writing-gherkin-criteria/SKILL.md)).
Those Gherkin scenarios are the natural source of the first failing tests. The chain:

```
prd.md Gherkin scenario → first failing test → minimum implementation → refactor
```

`plan-checker` flags code-shipping outcome sections that combine or omit the RED/GREEN/REFACTOR
checkboxes, or omit paths, commands, expected observations, or proof, as HIGH.

## Plan Execution

`plan-executor` (the calling context orchestrating the plan-execution workflow) and all
language-specific `swe-*-dev` agents follow TDD when implementing delivery items:

- Before writing any production code for a checklist item, write a failing test.
- Confirm the test fails for the right reason.
- Write the minimum implementation to pass.
- Refactor.
- Run the full test suite (`nx run [project]:test:quick`) to confirm no regressions.

This applies inside subrepo worktrees too. The worktree execution context does not change the
TDD requirement.
