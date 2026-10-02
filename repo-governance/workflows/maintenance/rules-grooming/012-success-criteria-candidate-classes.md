---
description: Gherkin scenarios for what each candidate class admits, what it refuses, and the reductions no class may ever produce.
when_to_use: Use when validating or extending a candidate class's admission rule.
---

# Success Criteria — Candidate Classes

```gherkin
Feature: Repository rules grooming

  Scenario: Reabsorption is tested per parent, not per shard
    Given a parent whose sibling shards each fit it individually
    When the fragmentation sweep evaluates them
    Then they are packed against one parent budget smallest-first
    And only the shards that still fit once packed are admitted

  Scenario: A key no validator reads but a convention mandates is out of scope
    Given a frontmatter key read by no gate, generator, or harness
    And a convention that requires the field
    When the fragmentation sweep evaluates it
    Then it is not admitted as a fragmentation candidate

  Scenario: Fragmentation overhead is reduced without changing an obligation
    Given a shard whose parent has budget headroom to reabsorb it
    And the shard has no inbound links from outside its own subtree
    When the candidate is approved and handed to propagation
    Then the shard's frontmatter, Contents line, and index entry are removed
    And the post-run obligation inventory is identical to the pre-run inventory

  Scenario: A duplicate collapses only into a complete target
    Given one obligation stated on two surfaces with no keep rationale
    When the duplication sweep nominates a canonical home
    Then the surviving home is diffed against the text to be removed
    And a target missing any covered case is completed before the removal is handed off

  Scenario: Retirement is approved one item at a time
    Given a manifest containing several retirement candidates
    When the checkpoint is presented
    Then each retirement requires its own approval and recorded rationale
    And a batch approval of retirements is refused

  Scenario: A word budget is never raised to land a merge
    Given a fragmentation candidate whose merge no longer fits the parent budget
    When propagation evaluates the item
    Then the item is recorded as rejected
    And the shard remains split
    And no threshold is changed

  Scenario: Prose is never rewritten to save words
    Given a rule file well over its word budget
    When the discovery sweeps run
    Then no candidate proposes rewording, tightening, or densifying its prose
    And the file is referred to progressive-disclosure remediation instead

  Scenario: A safety guardrail is never a candidate
    Given a secrets rule, the Git Identity Guardrail, or an environment-branch rule
    When any discovery sweep runs
    Then it produces no candidate touching that rule in any class

```

## Related

- [Success Criteria](./011-success-criteria.md) — the run-lifecycle scenarios.
- [Steps 3-4](./004-steps-3-4-candidate-discovery-and-ranking.md) — the admission rules these bind.
