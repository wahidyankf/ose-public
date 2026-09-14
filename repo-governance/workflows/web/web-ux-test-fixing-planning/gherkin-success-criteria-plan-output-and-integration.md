---
description: "The first four Gherkin scenarios (of eight) proving one-combined-plan output, sequential tester integration, and UI-bearing vs non-UI assets/ handling."
when_to_use: "Use when verifying the workflow's success criteria for a single combined plan, sequential integration, or the assets/ folder rule."
---

# Gherkin Success Criteria — Part 1

```gherkin
Feature: web UX test-fixing planning

Scenario: One run produces one combined, source-attributed plan
  Given a reachable live URL and a testing goal
  And the ose-public working tree is clean
  When the workflow runs to completion in plan-mode=new
  Then a plan exists at plans/in-progress/<identifier>/
  And the plan contains README.md, brd.md, prd.md, findings.md, tech-docs.md, and delivery.md
  And findings.md has separate "Exploratory findings (EWT-###)", "Usability findings (UWT-###)", and "Design findings (DWT-###)" sections
  And delivery.md is TDD-shaped with Specs & Gherkin coverage steps
  And the plan receives a PASS verdict from plan-quality-gate
  And no file under apps/ or libs/ source is modified

Scenario: Testers run sequentially with incremental integration
  Given a reachable live URL and a testing goal
  When the workflow runs
  Then the exploratory tester runs and its EWT-### findings are integrated into the plan
  And only then does the usability tester run and its UWT-### findings get integrated
  And only then does the design tester run and its DWT-### findings get integrated
  And tech-docs.md and delivery.md are authored after all three findings sets are integrated

Scenario: A UI-bearing plan carries an assets folder with both-tier mockups
  Given at least one finding's fix changes a user-facing screen or component
  When the plan is solidified
  Then the plan contains an assets/ folder
  And each changed screen has a low-fidelity ASCII wireframe and a high-fidelity .excalidraw.png finalist
  And mobile, tablet, and desktop layouts are all designed
  And mockup colors use design-system tokens rather than raw hex

Scenario: A non-UI plan omits the assets folder
  Given no finding's fix touches a user-facing screen or component
  When the plan is solidified
  Then no assets/ folder is created
```

**Continued in** [Gherkin Success Criteria — Part 2](./gherkin-success-criteria-merge-mode-and-escalation.md).
