# Grill Me — Platform Binding Examples

## Platform Binding Examples

The content under this heading is intentionally vendor-specific. Per the
[Governance Vendor-Independence Convention](../../../../repo-governance/conventions/structure/governance-vendor-independence.md),
vendor names are expected here. This file sits in the `.agents/` binding root, outside the vendor
gate's declared roots, so the gate does not scan it; the gate itself has no skip logic.

## Claude Code

Use `AskUserQuestion` with 1–4 tightly coupled questions per call. Each question object has a
`header` of at most 12 characters, a self-contained `question`, 2–3 substantive
`{ label, description }` option objects plus **"Let's chat about this"** (3–4 total), and
`multiSelect: false`. The client-provided free-text **"Other"** entry remains implicit and satisfies
the blank-state type requirement. For a 3–4-leaf envelope, follow [Staged native
rendering](./mechanism-and-staged-rendering.md#staged-native-rendering).

## OpenCode

Use OpenCode's `question` tool with 2–4 substantive options plus the standing **"Let's chat about
this"** option per question, preserving its rich multiple-choice UI path. The client-provided custom
answer remains implicit. If the current version does not expose `question` to the interactive root
thread, use the markdown fallback.

## Codex

Use `request_user_input` in the root thread. One call carries 1–3 tightly coupled question objects;
each object MUST have:

- `header`: a short label of at most 12 characters
- `id`: a stable `snake_case` identifier
- `question`: one self-contained decision prompt
- `options`: 2–3 option objects total; Rule 2's two-substantive-option minimum plus the standing
  **"Let's chat about this"** option means a grill uses exactly 3

Put the Recommended option first and suffix its label with `(Recommended)`. Give every option a
1–5 word `label`, including that suffix, and a one-sentence trade-off in `description`. Do not add an
`Other` option: the client supplies the free-form entry. Each question accepts one answer only; do
not request or simulate multi-select.

For a 3–4-leaf envelope, follow [Staged native rendering](./mechanism-and-staged-rendering.md#staged-native-rendering).

Codex currently classifies `default_mode_request_user_input` as under development and keeps it off
by default. This repository opts in through `.codex/config.toml` so interactive root threads expose
the native tool outside plan mode. A non-root subagent returns `## User Decisions Required` to the
root and stops. A non-interactive root, including `codex exec`, emits the markdown fallback to its
caller. No context chooses silently.
