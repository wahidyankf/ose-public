---
name: grill-me
description: >
  Interview the user relentlessly about a plan or design, presenting choices one at a time
  until shared understanding is reached. Resolves every branch of the decision tree. Use
  when the user wants to stress-test a plan, get grilled on their design, or mentions
  "grill me".
when_to_use: >-
  Use at a planning gate or before any irreversible choice with more than one defensible answer.
---

# Grill Me

Stress-test plans and designs through relentless, structured questioning before implementation
begins.

## When to activate

Activate when:

- User says "grill me", "challenge my plan", "stress-test this", "interrogate my design",
  or any close variant
- A new plan is being created and design decisions remain open
- A design review is requested before committing to implementation

## Process

Interview the user about every aspect of the plan until shared understanding is reached. Walk
down each branch of the decision tree, resolving dependencies one-by-one.

This skill is the canonical implementation of the
[Grilling-With-Options Convention](../../../repo-governance/development/workflow/grilling-with-options.md) —
that convention is the normative source for the format, mechanism, and scope below. Keep them in
sync.

See [Process — Hard Rules](./reference/process-and-hard-rules.md) for the seven HARD rules (explore-first, 2-4 mutually-exclusive options, exactly one Recommended, one decision per question, unlisted write-in support, the two standing options, continue until resolved) and the two most common failure modes.

## Mechanism

See [Mechanism and Staged Native Rendering](./reference/mechanism-and-staged-rendering.md) for the native-interactive-tool requirement, delegated-agent handoff envelope, staged rendering for 3-4-leaf envelopes, and the non-interactive fallback format.

## After the grilling

When all decision tree branches are resolved:

1. Summarize every decision made and its rationale
2. Confirm shared understanding explicitly
3. Signal readiness to proceed to plan writing or implementation

## Platform Binding Examples

See [Platform Binding Examples](./reference/platform-binding-examples.md) for the Claude Code (`AskUserQuestion`), OpenCode (`question` tool), and Codex (`request_user_input`) invocation contracts.
