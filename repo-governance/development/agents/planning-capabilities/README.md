---
description: >-
  Indexes the ordered modules that hold the complete planning-capability roster and its uniform contract.
when_to_use: >-
  Use to locate the module governing a particular part of the planning capability set.
---

# Planning Capabilities Modules

Read in order. Together these hold the rule the [Planning Capabilities](../planning-capabilities.md) entrypoint indexes.

## Directory Map

- [001 Workflow Roster](001-workflow-roster.md) — Names the seven planning workflows a repository must make reachable, plus the implementation review that accompanies Gherkin criteria. Use when checking that a repository can run the whole plan lifecycle, or when a stage appears to have no owner.
- [002 Skill and Agent Roster](002-skill-and-agent-roster.md) — Names the planning skills and agents a repository publishes, requires each to exist once, and forbids adapters from carrying an authored copy. Use when adding or auditing a planning skill or agent, or when a harness adapter appears to hold its own body text.
- [003 Decision Gates](003-decision-gates.md) — Requires two sequential planning decision gates, fixes the protocol both use, and requires each to leave a durable decision record. Use before authoring a plan, after completing a draft, or when defining how choices are presented to a user.
- [004 Executor Authority](004-executor-authority.md) — Makes AI execution the default for delivery items, closes the exception set to four cases, and rules out significance as a reason. Use when assigning an executor label to a checklist item, or when an item is proposed for human ownership.
- [005 Delivery Seams and Ownership](005-delivery-seams-and-ownership.md) — Defines what makes a valid delivery seam and routes landing, integration state, and cross-repository coordination to this repository's delivery-boundary owners. Use when splitting a plan into delivery units, or when a plan touches more than one repository.
- [006 Verification Routing](006-verification-routing.md) — Requires every behaviour-changing delivery item to route to a named verification layer, leaving no unspecified review bucket. Use when deciding how a delivery item will be verified, or when a plan proposes a review step with no named method.
- [007 Execution Review](007-execution-review.md) — Fixes the six-step order of the execution review and makes its terminal verdict the precondition for archival. Use once every substantive delivery item is terminal and archival is the next step.
