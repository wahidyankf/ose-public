---
description: "The refuse-on-uncertainty rule; the web-research threshold."
when_to_use: "Use when uncertain about a plan claim."
---

# Refuse-on-Uncertainty Rule and Web-Research Delegation

## Refuse-on-Uncertainty Rule

When the author cannot verify a claim — even after running the recipe — the author MUST refuse to write the claim as a fact. Acceptable refusals (in order of preference):

1. **Skip the claim** — do not include it in the plan; the plan is shorter but accurate.
2. **Use a placeholder** — write `_Unknown — verify before authoring_`, flagging it for verification before execution, and treat it as a delivery item rather than a stated fact.
3. **Reword as an expectation** — convert the claim from "this is true" to a plainly worded best guess (for example "we expect review time to drop; no baseline measured").

Forbidden: writing an unverified claim as a fact and hoping it is correct. None of these refusals uses an inline confidence label; see [No Inline Confidence Labels](./no-inline-confidence-labels.md). This is the single most damaging hallucination pattern in plan content.

## Web-Research Delegation (Lower Threshold for Plans)

The universal threshold from [Web Research Delegation Convention](../../../conventions/writing/web-research-delegation.md) is "2+ `WebSearch` calls OR 3+ `WebFetch` calls per claim → delegate to `web-researcher`". For plan content, the threshold is LOWER:

> **Any external claim that is not already documented in the repo (`docs/`, `repo-governance/`, `apps/*/README.md`, `package.json`, `go.mod`, `Cargo.toml`, etc.) and that requires more than a single `WebFetch` against an already-known authoritative URL MUST be delegated to `web-researcher`.**

Concretely:

| Situation                                                                              | Action                           |
| -------------------------------------------------------------------------------------- | -------------------------------- |
| Claim about a library version is already in `package.json` / lockfile                  | `Grep`, no web call needed       |
| Claim about Nx behaviour already in `repo-governance/development/infra/nx-targets.md`  | `Read`, no web call needed       |
| Single `WebFetch` against a known URL (e.g., a specific Next.js docs page) confirms it | In-context `WebFetch` permitted  |
| Two or more searches/fetches needed to find the right source                           | **Delegate to `web-researcher`** |
| Open-ended "current best practice" question                                            | **Delegate to `web-researcher`** |
| Library API surface unfamiliar to the maker                                            | **Delegate to `web-researcher`** |

The `plan-quality-gate` repair pass retains Exception 2 from the universal convention (in-context only; same-context re-validation is required for repair atomicity). All other plan agents follow the lower threshold above.
