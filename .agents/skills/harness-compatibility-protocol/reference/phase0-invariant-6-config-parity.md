# Invariant 6 — Hand-authored config parity

Checks Multi-Harness Binding Rule 10: a change to one supported harness's hand-authored config
carries the same intent into every other supported harness's config, or records why it does not.

Scope is the `config:` path declared on each `harness:` entry in `repo-config.yml`, plus whatever
those configs reference — hook scripts, subagent definitions, plugin modules. Generated trees are
out of scope; Invariant 3 already covers them.

This semantic intent comparison remains active in a quality-gate invocation unless the registry
later declares an exact gate ID (or `verifies` relationship) for it.

- **Tools**: read every `harness:` entry's `config:` from `repo-config.yml`; for the diff under
  review, determine which declared configs changed; for each changed config, check the others for
  a corresponding change or a recorded absence in
  `repo-governance/conventions/structure/multi-harness-binding/config-parity.md`
- **Pass**: either every declared config changed together, or each unchanged one has a recorded
  absence naming the setting
- **Fail**: a declared config changed while another has neither a corresponding change nor a
  recorded absence — report the setting and the harnesses missing it
- **Registry drift sub-check**: a config file present on disk but absent from `repo-config.yml`,
  or declared and missing on disk. Both are Fail — the registry is authoritative for which configs
  exist, so an undeclared config is invisible to this invariant and silently exempt from Rule 10.
- **Default criticality**: MEDIUM (a harness silently loses a setting the others have).
  **Confidence**: HIGH for the registry drift sub-check, MEDIUM for parity itself — whether two
  differently-shaped configs express the same intent is a judgement a mechanical diff cannot settle
- **Fix scope**: human-required. Deciding the equivalent form in another harness's schema is
  authoring, and recording an absence requires distinguishing an **exception** (the harness cannot
  express it) from a **gap** (it can, and the work is outstanding). A fixer that records a gap as
  an exception converts unfinished work into a permanent-looking decision.

## Known Outstanding Gaps

| Setting                              | claude-code                 | opencode                                                    | codex                                                                 |
| ------------------------------------ | --------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Pre-write rules-propagation reminder | Present — `PreToolUse` hook | **Gap** — expressible as a `.opencode/plugins/` module hook | **Gap** — expressible via `config.toml` hooks, opt-in and Bash-scoped |

Both are gaps, not exceptions: each harness can express the behaviour, and neither implementation
has been written or verified.
