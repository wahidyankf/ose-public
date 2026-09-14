---
description: Gherkin scenarios for lifecycle delegation, external research, evidence invalidation, and catalog updates.
when_to_use: Use when verifying or testing this workflow's Phase 0/Phase 1 and fixer-update behaviour against its acceptance criteria.
---

# Success Criteria (Gherkin) — Part 1

```gherkin
Scenario: Registered parity predicates are delegated before external drift check
  Given exact registry gate IDs and lifecycle evidence are supplied
  When harness-compatibility-checker runs Phase 0
  Then it does not rerun vendor, binding, ownership, catalog, or duplication predicates they own
  And it retains genuinely unregistered semantic parity
  And it proceeds to Phase 1 web research independently of lifecycle status

Scenario: Missing delegated evidence remains pending
  Given an applicable delegated gate has no exact current evidence
  When the harness compatibility gate completes with no domain findings
  Then final-status is pass
  And lifecycle-status is pending
  And no local rerun or AI imitation is used as fallback

Scenario: A harness fix invalidates only affected lifecycle evidence
  Given an external-drift fix changes files within a delegated binding gate's scope
  When harness-compatibility-fixer completes
  Then that gate's lifecycle evidence becomes pending
  And unaffected delegated evidence is preserved
  And the fixer does not rerun the delegated gate

Scenario: Checker delegates web research and produces a cited drift audit
  Given the workflow runs with scope "all"
  When harness-compatibility-checker completes Phase 1
  Then it delegates multi-page upstream research to web-researcher for each harness
  And it diffs the fetched data against docs/reference/platform-bindings.md and committed binding files
  And it writes a drift audit to local-tmp/harness-compat/ citing the web sources for each finding
  And each finding identifies the affected harness, the stale field, and the upstream source URL

Scenario: Fixer updates catalog entries for unambiguous in-scope drift
  Given the audit contains a HIGH-confidence finding that a harness now reads AGENTS.md natively
  And the current catalog marks that harness as Tier 2
  When harness-compatibility-fixer is invoked
  Then it updates the harness row in docs/reference/platform-bindings.md to Tier 1
  And it records the web citation and verification date in the catalog entry
  And it writes a fix report using the same UUID chain as the audit
```

**Continued in** [Success Criteria (Gherkin) — Part 2](./success-criteria-gherkin-escalation-scenarios.md).
