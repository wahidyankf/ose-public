---
description: Gherkin scenarios for what the scaffolding class admits and refuses, and for the entry-point documents no class may remove without naming them.
when_to_use: Use when validating or extending the scaffolding admission rule or the entry-point protection.
---

# Success Criteria — Scaffolding and Entry-Point Protection

```gherkin
Feature: Repository rules grooming — scaffolding and protected entry points

  Scenario: A named document's entry point is never removed without naming it
    Given a candidate that would delete or hollow a workflow, principle, or convention <name>.md
    When the checkpoint is presented
    Then the item requires explicit authorization naming that document
    And no class-level or batch approval removes it

  Scenario: Scaffolding is approved against the verbatim text
    Given a batch of admitted scaffolding candidates
    When the checkpoint is presented
    Then every sentence to be deleted is enumerated verbatim
    And an approval given against a count alone is not accepted

  Scenario: Entry-point authorization is not carried by a batch approval
    Given a batch-approved fragmentation or scaffolding candidate
    And the item would delete or hollow a named <name>.md
    When the hand-off is prepared
    Then the item is withheld until authorization naming that document is given
    And the batch approval does not stand in for it

  Scenario: A shard folder is ordinary corpus
    Given a shard inside a <name>/ folder
    When any discovery sweep admits it under its class rules
    Then the reduction proceeds without entry-point authorization
    And the owning <name>.md survives untouched

  Scenario: Meta-narration is deleted, not rewritten
    Given a sentence announcing what a document covers
    And removing it leaves the extracted obligation set byte-identical
    When the scaffolding sweep evaluates it
    Then the sentence is admitted for deletion
    And no surrounding sentence is reworded to absorb it

  Scenario: An obligation stated without a modal is refused
    Given the sentence "Filenames are lowercase kebab-case"
    And the sentence contains no must, never, or required
    When the scaffolding sweep evaluates it
    Then it is refused as a scaffolding candidate
    And modal absence is recorded as insufficient evidence

  Scenario: A deletion that changes the inventory is rejected, not adjudicated
    Given an admitted scaffolding candidate
    When removing it changes the extracted obligation set by one entry
    Then the candidate is rejected at Step 3d
    And the run does not weigh the change against its yield

  Scenario: The form enumeration is closed
    Given a sentence carrying no obligation
    And the sentence matches none of the enumerated non-normative forms
    When the scaffolding sweep evaluates it
    Then it is refused despite carrying no obligation

  Scenario: A wholly non-normative file is a retirement candidate
    Given a file whose every sentence is admissible scaffolding
    When the scaffolding sweep evaluates it
    Then the file is routed to the retirement sweep
    And it is not emptied one admitted sentence at a time
```

## Related

- [Success Criteria — Candidate Classes](./012-success-criteria-candidate-classes.md) — the other classes' scenarios.
- [Scaffolding Admission](./007-scaffolding-admission.md) — the admission rules these bind.
- [Scope Boundary](./002-scope-boundary-and-non-writing-invariant.md) — the refused reductions these enforce.
