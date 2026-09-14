---
description: >-
  Defines the planning capability roster a repository must expose and the uniform contract every workflow, skill, and
  agent in it satisfies.
when_to_use: >-
  Use when adopting the plan system, auditing planning capabilities, or resolving which form a new planning capability
  should take.
---

# Planning Capabilities

The [Plans Convention](../../conventions/structure/plans.md) says what a plan is. This standard says what a repository
must be able to _do_ with one, and in what form those abilities are published.

The two are separable on purpose. A repository can hold well-formed plans and still be unable to groom, review, or
archive them, and that gap is invisible to any check that only looks at documents.

## Modules

1. [Workflow Roster](planning-capabilities/001-workflow-roster.md) — Names the seven planning workflows a repository must make reachable, plus the implementation review that accompanies Gherkin criteria. Use when checking that a repository can run the whole plan lifecycle, or when a stage appears to have no owner.
2. [Skill and Agent Roster](planning-capabilities/002-skill-and-agent-roster.md) — Names the planning skills and agents a repository publishes, requires each to exist once, and forbids adapters from carrying an authored copy. Use when adding or auditing a planning skill or agent, or when a harness adapter appears to hold its own body text.
3. [Decision Gates](planning-capabilities/003-decision-gates.md) — Requires two sequential planning decision gates, fixes the protocol both use, and requires each to leave a durable decision record. Use before authoring a plan, after completing a draft, or when defining how choices are presented to a user.
4. [Executor Authority](planning-capabilities/004-executor-authority.md) — Makes AI execution the default for delivery items, closes the exception set to four cases, and rules out significance as a reason. Use when assigning an executor label to a checklist item, or when an item is proposed for human ownership.
5. [Delivery Seams and Ownership](planning-capabilities/005-delivery-seams-and-ownership.md) — Defines what makes a valid delivery seam and routes landing, integration state, and cross-repository coordination to this repository's delivery-boundary owners. Use when splitting a plan into delivery units, or when a plan touches more than one repository.
6. [Verification Routing](planning-capabilities/006-verification-routing.md) — Requires every behaviour-changing delivery item to route to a named verification layer, leaving no unspecified review bucket. Use when deciding how a delivery item will be verified, or when a plan proposes a review step with no named method.
7. [Execution Review](planning-capabilities/007-execution-review.md) — Fixes the six-step order of the execution review and makes its terminal verdict the precondition for archival. Use once every substantive delivery item is terminal and archival is the next step.

## The Uniform Contract in One Sentence

Every planning capability exists exactly once, in exactly one form, with one responsibility, and any harness-specific
copy of it is generated rather than authored.
