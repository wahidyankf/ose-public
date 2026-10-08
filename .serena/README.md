---
description: Explains tracked Serena indexing policy and ignored runtime state
when_to_use: Use when configuring semantic indexing for this checkout
---

# Serena Project Configuration

`project.yml` owns this checkout's language servers and search exclusions for Claude Code and Command Code.
OpenCode and Codex Serena registrations are deferred; Codex retains its existing guards.

- Protected paths derive from [repository agent policy](../.agents/agent-policy.json), ignoring ASCII letter case.
- Ordinary environment templates stay available; protected subtrees remain excluded even for template filenames.

Caches, memories, logs, local overrides, and other runtime files stay ignored.
