---
description: How grilling narrows to validation passes inside plan-maker, why grilling is a process artifact rather than a document, and the tools that implement and check this convention.
when_to_use: Use when grilling is invoked from inside plan-maker, when verifying compliance without a generated artifact, or when identifying which tool implements or checks this convention.
---

# Special Considerations and Tools and Automation

## Special Considerations

### Grilling Within plan-maker

When `plan-maker` is invoked by `plan-planning`, the macro design decisions
are already resolved by Steps 1 and 3 of that workflow. The `plan-maker` grilling sessions
in that context become root-orchestrated **validation passes** for micro-decisions (exact Gherkin
phrasing, section ordering, step granularity). The specialist returns `## User Decisions Required`
and stops; the root resolves it and resumes or reinvokes the specialist. The structured format
(Rules 2–5) still applies, but questions are narrower.

Standalone plan-maker triggers still require full pre-write and post-write grill sessions, but the
calling root orchestrates them. A directly invoked specialist returns the envelope; it never renders
the native UI itself.

### Grilling Is a Process Artifact, Not a Document Artifact

Grilling produces answers that are captured in plan documents (resolved decisions in
`tech-docs.md`, design-decision lists in the plan-establishment handoff). The grill session
itself does not produce a standalone artifact. Compliance with this convention is verified
primarily by checking that plan-creation workflows and agent definitions reference it — not
by inspecting a generated file.

`rules-checker`'s general cross-reference and consistency validation flags a
plan-creation touchpoint that drops its reference to this convention. The touchpoints
expected to reference this convention are:

- The plan-establishment workflow's Step 1 and Step 3 sections.
- The plan-execution workflow's pre-execution grill section.
- The Plans Organization Convention, where design-decision resolution is discussed.
- The development/README.md index.
- The `plan-maker` agent (pre-write grill step and post-write grill step).
- The `grill-me` skill (canonical implementation of this convention's rules).
- The `plan-creating-project-plans` skill (pre-write and post-write grill gates in the plan
  lifecycle).

## Tools and Automation

- **`grill-me` skill** — The canonical implementation of this convention. The
  [grill-me Skill](../../../../.agents/skills/grill-me/SKILL.md) provides the grilling
  service used by `plan-planning` and `plan-maker`. This convention governs
  the format and mechanism that `grill-me` MUST use. Platform-specific tool invocations
  live in the [Platform Binding Examples](./platform-binding-examples-claude-code-and-opencode.md) sections.
- **`rules-checker`** — Its general cross-reference/consistency validation flags a
  plan-creation touchpoint that has dropped its reference to this convention.
- **`rules-propagation`** — Restores missing convention references to touchpoint files when
  flagged.
