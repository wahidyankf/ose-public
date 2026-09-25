---
description: Why this convention exists and which agents, skills, and workflows it governs
when_to_use: Read this before adding WebSearch or WebFetch to an agent's tool list, to confirm whether the delegation rule applies.
---

# Web Research Delegation: Purpose and Scope

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: A single named agent (`web-researcher`) is the explicit, canonical entry point for public-web research. Agents name the delegated agent rather than silently invoking `WebSearch`/`WebFetch`, and the delegation threshold (2+ searches or 3+ fetches per claim) is stated in a number rather than left to author judgement. Exceptions are enumerated, not inferred.

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: One rule, one agent, one threshold. Replacing a collection of per-agent, per-skill heuristics with a single default reduces the cognitive surface every agent author must carry. Main-conversation context stays lean because multi-page research happens in an isolated delegated agent context.

- **[Documentation First](../../../principles/content/documentation-first.md)**: The `web-researcher` agent enforces citation of every factual claim and surfaces confidence tags (`[Verified]`, `[Outdated]`, `[Unverified]`, `[Needs Verification]`). Delegating by default means every agent that consumes web facts consumes them already-cited.

## Purpose

This convention exists to:

- Make `web-researcher` the default, not one option among many, whenever any agent needs to gather information from the public web.
- Prevent silent scattering of `WebSearch`/`WebFetch` calls across agents, which wastes tokens and produces uneven sourcing.
- Define a bright-line delegation threshold so agent authors and reviewers can answer "should this call `web-researcher`?" without judgement.
- Enumerate the narrow contexts where in-context web research remains correct, so exceptions do not expand by drift.

## Scope

### What This Convention Covers

- Any AI agent in the canonical agent directory (`.agents/agents/`) that declares the `network` capability (its generated routes carry `WebSearch` or `WebFetch`), or that consumes skills which invoke these tools.
- Any skill in the platform binding skill directories (e.g., `.agents/skills/`) whose workflow calls `WebSearch` or `WebFetch`.
- Any workflow under `repo-governance/workflows/` that orchestrates agents performing web research.
- Any `CLAUDE.md` or `AGENTS.md` guidance that shapes agent behaviour around external information gathering.

### What This Convention Does NOT Cover

- **Internal repository lookups** — `Read`, `Grep`, `Glob` against local files. This convention is about the public web, not the local checkout.
- **Link reachability checks** (HTTP status, redirect chains) — covered by `docs-link-checker`, `apps-ayokoding-www-link-checker`, and their fixer counterparts. Their domain is URL liveness, not content research.
- **Content authorship and writing style** — see [Content Quality Principles](../quality.md) and [Convention Writing Convention](../conventions.md).
- **Verification methodology itself** — the confidence classifications, source priority tiers, and validation patterns live in [Factual Validation Convention](../factual-validation.md). This convention governs _who does the research_, not _how verification is classified_.
