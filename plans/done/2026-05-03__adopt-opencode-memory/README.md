# Plan: Adopt OpenCode Memory & Token Compression Tools

## Metadata

| Field       | Value                                  |
| ----------- | -------------------------------------- |
| **Plan ID** | `2026-05-03__adopt-opencode-memory`    |
| **Date**    | 2026-05-03                             |
| **Owner**   | Wahidyan Kresna Fridayoka              |
| **Scope**   | `ose-public` repository + OpenCode IDE |
| **Status**  | In Progress — **Partially Started**    |

## Context

RTK (Rust Token Killer) is already adopted for output token filtering. This plan adopts two complementary tools from the caveman ecosystem:

- **caveman** (primary) — planned for OpenCode, **NOT YET INSTALLED** (only active for Claude Code via `.caveman-active`)
- **cavemem** (secondary) — **INSTALLED** as OpenCode MCP server (v0.1.3, in production use)

Both are MIT-licensed and explicitly support OpenCode. `claude-mem` was rejected due to AGPL-3.0 license incompatibility with this repository's MIT license.

## Goal

Enable ~75% token reduction in OpenCode agent responses while maintaining technical accuracy, and explore cross-session memory persistence shared between Claude Code and OpenCode.

## Documents

- [Business Requirements (BRD)](./brd.md) — Why this exists, business impact, constraints
- [Product Requirements (PRD)](./prd.md) — What gets built, acceptance criteria in Gherkin
- [Technical Documentation](./tech-docs.md) — How to install, configure, and verify
- [Delivery Checklist](./delivery.md) — TDD-shaped implementation steps

## Quick Links

- [caveman on GitHub](https://github.com/JuliusBrussee/caveman) — MIT, v1.7.0 (May 1, 2026)
- [cavemem on GitHub](https://github.com/JuliusBrussee/cavemem) — MIT, v0.1.3 (April 2026)
