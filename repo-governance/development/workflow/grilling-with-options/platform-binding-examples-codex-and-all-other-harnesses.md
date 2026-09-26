---
description: How the root orchestrator invokes a third harness's user-input tool, and the markdown fallback required for any harness without a native interactive tool.
when_to_use: Use when implementing or verifying a grilling interaction on that harness, or on a harness with no native multiple-choice tool at all.
---

# Platform Binding Examples — Codex and All Other Harnesses

The content under this heading is intentionally vendor-specific. Per the
[Governance Vendor-Independence Convention](../../../conventions/structure/governance-vendor-independence.md),
vendor names are expected here. The vendor gate has no skip logic, so this page carries a
per-term vocabulary exception in `repo-config.yml` for each vendor name it uses.

## OpenAI Codex

Codex exposes `request_user_input` to the interactive root thread when the repository enables
`[features].default_mode_request_user_input = true` in `.codex/config.toml`. Codex currently marks
this feature as under development and keeps it off by default, so the repository-level opt-in is
required.

The root orchestrator MUST own every grill and invoke `request_user_input` directly. After the user
resolves the questions, it constructs and passes the canonical Resolved User Decisions Envelope
verbatim to any delegated `plan-maker` or `plan-checker`; it MUST NOT delegate the user interaction
itself.

One `request_user_input` call carries 1–3 tightly coupled question objects. Each object MUST use:

- `header`: a short label of at most 12 characters
- `id`: a stable `snake_case` identifier
- `question`: one self-contained decision prompt
- `options`: 2–3 option objects total; Rule 2's two-substantive-option minimum plus the standing
  **"Let's chat about this"** option means a grill uses exactly 3

Put the Recommended option first and suffix its label with `(Recommended)`. Every option object has
a 1–5 word `label`, including that suffix, and a one-sentence trade-off in `description`. Do not add
an `Other` option because the client supplies the free-form entry. Each question accepts one answer
only; never request or simulate multi-select.

For a 3–4-leaf envelope, the root follows
[Staged Native Rendering](./staged-native-rendering.md#staged-native-rendering): the
first stage has two branch groups plus Chat, and a multi-leaf follow-up has two original leaves plus
Chat. A selected singleton group is terminal and records its original leaf ID without a follow-up
prompt.

A non-root subagent returns `## User Decisions Required` to the root and stops; it MUST NOT render a
user prompt or select an answer. The root asks through `request_user_input`, then resumes or
reinvokes the delegated agent with the resolved answers. A non-interactive root, including
`codex exec`, emits the Rule 6 markdown fallback to its caller.

## All Other Harnesses

A genuinely non-interactive root or harness without a native interactive multiple-choice tool emits
the inline markdown format defined in Rule 6 to its caller. A subagent returns unresolved decisions
to the root and stops. A native tool with a 2–3-substantive-option limit follows
[Staged Native Rendering](./staged-native-rendering.md#staged-native-rendering). The structured format requirements (Rules 2–5)
are identical regardless of rendering mechanism.
