---
description: Forbidden coding-agent product and vendor company names, part 1 of the Forbidden Vendor Terms catalog, and why binding directory paths are allowed.
when_to_use: Use when checking whether a coding-agent product name, a vendor company name, or a binding directory path in governance prose is forbidden.
---

# Forbidden Vendor Terms — Product Names and Paths

> **A listed name is not a support claim.** Dropped harnesses stay here on purpose — their names
> must not leak into governance prose either. `repo-config.yml` `harness:` decides support.

The following terms are forbidden in the governed files except where a per-file vocabulary exception
names that file (see [Allowlist Mechanism](./allowlist-mechanism.md)). Each term is matched as a
plain, case-sensitive substring; there is no regular expression and no word boundary. The
authoritative list is `policies.governance.vendor.forbidden-terms` in `repo-config.yml`.

## Coding-agent / harness product names

| Term              | Reason                                                 |
| ----------------- | ------------------------------------------------------ |
| `Claude Code`     | Vendor product name                                    |
| `OpenCode`        | Vendor product name                                    |
| `Cursor`          | Vendor product name (Anysphere)                        |
| `Windsurf`        | Vendor product name (Cognition AI; formerly Codeium)   |
| `Codeium`         | Vendor product name (legacy brand for Windsurf)        |
| `Copilot`         | Vendor product name (GitHub / Microsoft)               |
| `Aider`           | Vendor product name                                    |
| `Cline`           | Vendor product name                                    |
| `Devin`           | Vendor product name (Cognition AI)                     |
| `Junie`           | Vendor product name (JetBrains)                        |
| `JetBrains`       | Vendor company name                                    |
| `Amazon Q`        | Vendor product name (AWS); the qualified phrase only   |
| `Antigravity`     | Vendor product name (Google)                           |
| `Pi Coding Agent` | Vendor product name (Earendil); the qualified phrase   |
| `pi.dev`          | Vendor product domain (Earendil); the qualified domain |
| `Earendil`        | Vendor company name (Pi)                               |

## Model-vendor company names

| Term        | Reason              |
| ----------- | ------------------- |
| `Anthropic` | Vendor company name |
| `OpenAI`    | Vendor company name |
| `xAI`       | Vendor company name |

## Binding directory paths are allowed

Binding directory paths — `.agents/`, `.claude/`, `.codex/`, `.opencode/`, and any other harness
directory — are not vendor terms. Governance prose may name them wherever a real path is meant,
because a path identifies a file, not a product. Only vendor, product, and model names are forbidden.

Case sensitivity keeps the two apart: `.claude/` and `CLAUDE.md` never match `Claude Code`, and
`.opencode/` never matches `OpenCode`.
