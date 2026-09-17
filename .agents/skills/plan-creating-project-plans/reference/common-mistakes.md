# Common Mistakes

## Mistake 1: Missing acceptance criteria

**Wrong**: Plan without Gherkin scenarios
**Right**: Every plan has concrete acceptance criteria

## Mistake 2: Vague requirements

**Wrong**: "Improve system performance"
**Right**: "Reduce API response time to <200ms for 95th percentile"

## Mistake 3: No progress tracking

**Wrong**: Never updating delivery checklist
**Right**: Mark items complete with implementation notes

## Mistake 4: Wrong folder placement

**Wrong**: Active work in backlog/
**Right**: Move to in-progress/ when starting work

## Mistake 5: One omnibus checkbox instead of detailed TDD actions

**Wrong**: Activity without Input/Outcome/Proof

```markdown
- [ ] Implement email validation with tests
```

**Right**: One cohesive outcome section with separate detailed RED/GREEN/REFACTOR checkboxes

```markdown
### AC-EMAIL-02 — Valid and invalid email inputs follow the contract

- **Input:** AC-EMAIL-02 and the existing validation API.
- **Outcome:** the validator accepts and rejects the canonical cases.
- [ ] [AI] **RED:** add the exact failing cases in `[test path]`; run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ts-utils:test:unit`;
      acceptance: they fail for the missing rule.
- [ ] [AI] **GREEN:** implement the validator in `[source path/symbol]`; rerun the focused command;
      acceptance: all cases pass.
- [ ] [AI] **REFACTOR:** extract the named pattern constant; rerun focused and quick tests;
      acceptance: behaviour is unchanged.
- **Proof:** RED failure recorded; the focused command above passes.
```

`plan-checker` flags missing TDD detail or outcome fields as HIGH severity findings.
