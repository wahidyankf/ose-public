---
title: "Web Research Delegation Convention"
description: Normative rule requiring AI agents to delegate public-web information gathering to the web-research-maker delegated agent, with a narrow documented exception list
category: explanation
subcategory: conventions
tags:
  - ai-agents
  - web-research
  - delegation
  - factual-validation
  - governance
created: 2026-04-16
---

# Web Research Delegation Convention

AI agents frequently need facts that live outside the repository — current API signatures, library versions, specification wording, best-practice guidance. Without a rule, every agent re-implements its own ad-hoc search loop, bloats the caller's context window with raw fetch output, and produces findings whose sourcing is uneven. This convention establishes `web-research-maker` as the single default primitive for public-web information gathering across the repository, and defines the narrow exceptions where in-context research remains appropriate.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: A single named agent (`web-research-maker`) is the explicit, canonical entry point for public-web research. Agents name the delegated agent rather than silently invoking `WebSearch`/`WebFetch`, and the delegation threshold (2+ searches or 3+ fetches per claim) is stated in a number rather than left to author judgement. Exceptions are enumerated, not inferred.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: One rule, one agent, one threshold. Replacing a collection of per-agent, per-skill heuristics with a single default reduces the cognitive surface every agent author must carry. Main-conversation context stays lean because multi-page research happens in an isolated delegated agent context.

- **[Documentation First](../../principles/content/documentation-first.md)**: The `web-research-maker` agent enforces citation of every factual claim and surfaces confidence tags (`[Verified]`, `[Outdated]`, `[Unverified]`, `[Needs Verification]`). Delegating by default means every agent that consumes web facts consumes them already-cited.

## Purpose

This convention exists to:

- Make `web-research-maker` the default, not one option among many, whenever any agent needs to gather information from the public web.
- Prevent silent scattering of `WebSearch`/`WebFetch` calls across agents, which wastes tokens and produces uneven sourcing.
- Define a bright-line delegation threshold so agent authors and reviewers can answer "should this call `web-research-maker`?" without judgement.
- Enumerate the narrow contexts where in-context web research remains correct, so exceptions do not expand by drift.

## Scope

### What This Convention Covers

- Any AI agent in the primary binding directory (`.claude/agents/`) or secondary directories (`.opencode/agents/`) that has `WebSearch` or `WebFetch` in its tool list, or that consumes skills which invoke these tools.
- Any skill in the platform binding skill directories (e.g., `.claude/skills/`) whose workflow calls `WebSearch` or `WebFetch`.
- Any workflow under `governance/workflows/` that orchestrates agents performing web research.
- Any `CLAUDE.md` or `AGENTS.md` guidance that shapes agent behaviour around external information gathering.

### What This Convention Does NOT Cover

- **Internal repository lookups** — `Read`, `Grep`, `Glob` against local files. This convention is about the public web, not the local checkout.
- **Link reachability checks** (HTTP status, redirect chains) — covered by `docs-link-checker`, `apps-ayokoding-web-link-checker`, and their fixer counterparts. Their domain is URL liveness, not content research.
- **Content authorship and writing style** — see [Content Quality Principles](./quality.md) and [Convention Writing Convention](./conventions.md).
- **Verification methodology itself** — the confidence classifications, source priority tiers, and validation patterns live in [Factual Validation Convention](./factual-validation.md). This convention governs _who does the research_, not _how verification is classified_.

## The Rule

**Any AI agent that needs to gather information from the public web MUST delegate to the `web-research-maker` delegated agent unless a documented exception applies.**

### The Delegation Threshold

Use this bright-line test whenever an agent considers `WebSearch` or `WebFetch`:

> **For a single claim, if research requires 2 or more `WebSearch` calls OR 3 or more `WebFetch` calls, delegate to `web-research-maker`. Otherwise an in-context single-shot call is permitted.**

| Situation                                                                 | Action                                      |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| Single-shot `WebFetch` against a known authoritative URL (e.g., npm page) | In-context — permitted                      |
| 2+ searches needed to find the right source for one claim                 | **Delegate to `web-research-maker`**        |
| 3+ pages to cross-reference before deciding                               | **Delegate to `web-research-maker`**        |
| Open-ended "current best practice" survey                                 | **Delegate to `web-research-maker`**        |
| Link reachability check (HTTP 200 vs 404)                                 | In-context — link-checker exception applies |
| Fixer agent re-validating a single audit finding                          | In-context — fixer exception applies        |

### Documented Exceptions

The rule has exactly three exceptions. Exceptions are closed-ended — adding a new one is a governance change, not a judgement call.

1. **Single-shot verification of a known URL.** When an agent already has the authoritative URL (from checker notes, from an audit report, from explicit user instruction) and one `WebFetch` answers the question, run it in-context. Do not launch a delegated agent for one call.

2. **Fixer agents re-validating a single audit finding.** Fixer agents (`docs-fixer`, `apps-ayokoding-web-facts-fixer`, `plan-fixer`, `apps-ayokoding-web-link-fixer`) intentionally operate in the same context as the audit they consume. Their re-validation must be decisive and paired with the fix; delegating to a delegated agent breaks that coupling. If a fixer discovers research much larger than the audit frame, it should escalate MEDIUM or FALSE_POSITIVE rather than spawn `web-research-maker` itself.

3. **Link-reachability checker and fixer agents.** `docs-link-checker`, `apps-ayokoding-web-link-checker`, and their fixer counterparts are scoped to URL liveness — HTTP status codes, redirect chains, cache freshness. Their domain is explicitly URL-reachability, not content research. They invoke `WebFetch` directly against the URL under test; delegating to `web-research-maker` would add latency without improving the signal (a 404 is a 404).

An exception agent still cites this convention in its body, stating which exception applies and why, so the rule is visible in the agent's own file rather than hidden in the convention.

## How Agents Apply This Rule

### In an agent definition file

Agents with `WebSearch` or `WebFetch` in their `tools:` list include a short **Web Research Delegation** subsection citing this convention and the delegation threshold. The subsection sits near the "External Information" responsibility or before the core loop.

### In a skill file

Agent skills that describe web verification (for example `docs-validating-factual-accuracy`) do not re-state the delegation rule inline; they cite this convention as the authoritative source and keep only the skill-specific integration notes (for example, how returned confidence tags map to audit-report dual-labels).

### In a workflow

Workflows under `governance/workflows/` that include factual verification steps point to this convention at the relevant step rather than duplicating the threshold.

## Examples

### Good — a checker delegating multi-page research

```markdown
### External Information

For single-shot verification against a known authoritative URL, use `WebFetch` in-context.
For multi-page research (2+ searches or 3+ fetches per claim), delegate to the
[`web-research-maker`](../agents/web-research-maker.md) subagent per the
[Web Research Delegation Convention](../../governance/conventions/writing/web-research-delegation.md).
```

### Good — a link-checker stating its exception explicitly

```markdown
### Web Research Delegation

This agent is exempt from the [Web Research Delegation Convention](../../governance/conventions/writing/web-research-delegation.md)
default. Its domain is URL reachability (HTTP status, redirect chains), not content research. It invokes
`WebFetch` directly against the URL under test. If content-level research is required (for example, to rewrite
a broken reference), escalate to the maker or checker family, which delegates to `web-research-maker`.
```

### Bad — silent ad-hoc searching

```markdown
### Verification

Use WebSearch and WebFetch to check the claim, then write the finding.
```

**Problems:** no threshold, no delegation default, no citation to the convention or the delegated agent. An author reading this has no guidance on when to delegate and no paper trail justifying the choice either way.

## Validation

To validate an agent complies with this convention:

1. **Does the agent have `WebSearch` or `WebFetch` in its `tools:` list?** If no, this convention does not apply.
2. **Is there a short Web Research Delegation block citing this convention?** If no, the agent is non-compliant.
3. **Does the block state the threshold (2+ searches or 3+ fetches per claim) or cite the convention in which it lives?** If no, the agent is non-compliant.
4. **If the agent claims an exception, is the exception one of the three enumerated above, and is it named explicitly?** If no, the exception is not documented and the agent is non-compliant.

`repo-rules-checker` enforces these four checks as part of its agent-frontmatter and agent-body audit.

## Tools and Automation

- **`web-research-maker`** — the default research primitive. Read-only delegated agent that returns cited, confidence-tagged findings without bloating the caller's context.
- **`repo-rules-checker`** — validates agent compliance with this convention as part of routine governance audits.
- **`repo-rules-fixer`** — applies fixes to non-compliant agents (adds Web Research Delegation block, cites convention).
- **Skill: `docs-validating-factual-accuracy`** — the factual-validation methodology that calls this convention as the authoritative source of the delegation rule.

## References

**Related Conventions:**

- [Factual Validation Convention](./factual-validation.md) — methodology and confidence classification that `web-research-maker` output maps to
- [Content Quality Principles](./quality.md) — universal markdown standards every agent-written finding must satisfy
- [Convention Writing Convention](./conventions.md) — meta-convention this document follows

**Agents:**

- [`web-research-maker`](../../../.claude/agents/web-research-maker.md) — the default research primitive
- `docs-checker`, `docs-tutorial-checker`, `apps-ayokoding-web-facts-checker`, `plan-checker` — validation agents that delegate to `web-research-maker` above the threshold
- `docs-maker`, `docs-tutorial-maker`, `plan-maker` — authoring agents that commission research before writing
- `docs-fixer`, `apps-ayokoding-web-facts-fixer`, `plan-fixer` — fixer agents invoking Exception 2 (same-context re-validation)
- `docs-link-checker`, `apps-ayokoding-web-link-checker`, `apps-ayokoding-web-link-fixer` — link-reachability agents invoking Exception 3

**Agent skills:**

- [`docs-validating-factual-accuracy`](../../../.claude/skills/docs-validating-factual-accuracy/SKILL.md) — factual-validation methodology
- [`docs-applying-content-quality`](../../../.claude/skills/docs-applying-content-quality/SKILL.md) — universal content-quality standards

**Workflows:**

- [Plan Quality Gate](../../workflows/plan/plan-quality-gate.md)
- [Documentation Quality Gate](../../workflows/docs/docs-quality-gate.md)
- [AyoKoding General Quality Gate](../../workflows/ayokoding-web/ayokoding-web-general-quality-gate.md)
- [AyoKoding By-Example Quality Gate](../../workflows/ayokoding-web/ayokoding-web-by-example-quality-gate.md)
- [AyoKoding In-the-Field Quality Gate](../../workflows/ayokoding-web/ayokoding-web-in-the-field-quality-gate.md)

**Repository Architecture:**

- [Repository Governance Architecture](../../repository-governance-architecture.md) — six-layer hierarchy. This convention is Layer 2, governing behaviour of Layer 4 agents consumed at runtime by Layer 5 workflows.
