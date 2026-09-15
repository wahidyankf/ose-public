# Gherkin Acceptance Criteria

**All plans must have Gherkin-format acceptance criteria:**

```gherkin
Given [precondition]
When [action]
Then [expected outcome]
And [additional outcome]
```

## Durable Spec Language and Plan Traceability

Any copy-ready packet destined for `specs/` must use only the owning app/lib's durable domain
language. Keep the plan slug, plan number, phase, delivery-unit name, and plan acceptance-criterion
identifier outside Feature, Rule, Background, Scenario, Scenario Outline, Examples, steps, comments,
and tags. In the plan's BDD delta map, map the plan requirement to the action, exact feature path,
exact durable scenario title, and Unit/Integration/E2E disposition outside the Gherkin fence.

**Example**:

```gherkin
Given the user is logged out
When they submit valid credentials
Then they are redirected to the dashboard
And their session is created with correct permissions
```

**Journey coherence**: Every scenario requires explicit `When` and `Then`. Prefer `And`/`But` for
continuation, but allow repeated primary keywords for one continuous journey. Split only
independently meaningful actions/outcomes. See the
[acceptance-criteria convention](../../../../repo-governance/development/infra/acceptance-criteria/gherkin-format-and-step-keyword-cardinality.md).

**Best Practices**:

- Use concrete, testable conditions
- Focus on behaviour, not implementation
- One independently meaningful behaviour or coherent journey per scenario
- Make scenarios independent
- Use consistent language
- Prefer `And`/`But` for a continuation; repeat a primary keyword when one coherent journey changes
  semantic phase, as defined by the canonical convention above

See [delivery-plan-tdd-structure.md](delivery-plan-tdd-structure.md) for how these scenarios map to delivery-checklist TDD cycles.
