---
description: Lists the general and software-engineering principles, and the repo conventions, that the plan-establishment workflow implements.
when_to_use: Use when auditing plan-establishment against the repo's principle and convention catalog.
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**:
  Two grill sessions and a research step ensure the plan is built on verified understanding, not
  assumptions
- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: Repo
  exploration in Step 0 prevents duplicating existing conventions and surfaces conflicts early
- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**:
  The full research → grill → write → validate → push lifecycle is orchestrated without manual
  intervention at each step
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  Push target, plan identifier, and definition of done are confirmed explicitly in Step 1 before
  any work begins

## Conventions Implemented/Respected

- **[Plans Organization Convention](../../../conventions/structure/plans.md)**: Creates plans in
  `plans/in-progress/` (default) or `plans/backlog/<identifier>/` (when
  `target-stage=backlog`, also no date prefix) with correct identifier format and worktree specification
- **[Governance Vendor-Independence Convention](../../../conventions/structure/governance-vendor-independence.md)**:
  Step 1 grill includes an explicit harness-neutrality checkpoint for plans touching agents,
  skills, or `repo-governance/` paths
- **[Web Research Delegation Convention](../../../conventions/writing/web-research-delegation.md)**:
  External research delegated to `web-researcher`
- **[Commit Messages Convention](../../../development/workflow/commit-messages.md)**: Conventional
  Commits format in Step 7
- **[CI Post-Push Verification Convention](../../../development/workflow/ci-post-push-verification.md)**:
  Step 7 monitors GitHub Actions after push
- **[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md)**:
  Steps 1 and 3 grill sessions MUST present 2-4 concrete options with trade-offs, exactly one
  Recommended option, and use the harness's native interactive multiple-choice tool when available
