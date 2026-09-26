---
description: How the grill-me skill invokes the native multiple-choice tool on the primary and secondary harnesses, including the example invocation shape.
when_to_use: Use when implementing or verifying a grilling interaction on a primary- or secondary-harness root session.
---

# Platform Binding Examples — Claude Code and OpenCode

The content under this heading is intentionally vendor-specific. Per the
[Governance Vendor-Independence Convention](../../../conventions/structure/governance-vendor-independence.md),
vendor names are expected here. The vendor gate has no skip logic, so this page carries a
per-term vocabulary exception in `repo-config.yml` for each vendor name it uses.

## Primary Coding Harness — Claude Code

Claude Code exposes `AskUserQuestion` as its native interactive multiple-choice tool. When
grilling inside an interactive Claude Code root session, the `grill-me` skill MUST invoke
`AskUserQuestion`
with:

- `questions`: 1–4 questions (one per tightly-coupled decision cluster)
- `header` per question: a short label of at most 12 characters
- `question` per question: one self-contained decision prompt
- `options` per question: 2–3 substantive `{ label, description }` option objects plus the standing
  `"Let's chat about this"` option (3–4 total)
- `multiSelect` per question: `false`
- The harness's auto-provided free-text `"Other"` entry is the blank-state type option — the
  answer is whatever the user writes; it is always present and satisfies the Rule 8 blank-state
  requirement

`AskUserQuestion` returns a structured response the agent uses directly without parsing
free-text. A delegated agent returns unresolved decisions to the root and stops; only a genuinely
non-interactive root without `AskUserQuestion` emits the markdown fallback to its caller.
For a 3–4-leaf envelope, the root follows
[Staged Native Rendering](./staged-native-rendering.md#staged-native-rendering).

Example invocation shape:

```binding-example
AskUserQuestion({
  questions: [
    {
      header: "Plan scope",
      question: "Where should the new convention live?",
      options: [
        {
          label: "Development workflow (Recommended)",
          description: "Layer-coherent and matches adjacent workflow documentation."
        },
        {
          label: "Writing convention",
          description: "Co-locates writing rules but conflicts with the documentation-only layer."
        },
        {
          label: "Let's chat about this",
          description: "Discuss the placement before selecting an option."
        }
      ],
      multiSelect: false
      // The harness auto-appends a free-text "Other" entry — that is the blank-state type
      // option (answer = whatever the user writes), always present per Rule 8.
    }
  ]
})
```

## Secondary Harness — OpenCode

OpenCode provides the `question` tool. When running in an interactive OpenCode root session, use
`question` with 2-4 substantive options plus the standing `"Let's chat about this"` option per
question. The client-provided custom answer remains implicit. If `question` is unavailable in the
current OpenCode version, fall back to the markdown option format defined in Rule 6.
