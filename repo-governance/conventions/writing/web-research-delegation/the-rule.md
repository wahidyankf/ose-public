---
description: The delegation threshold and the three documented exceptions to mandatory web-researcher delegation
when_to_use: Read this to apply the bright-line test for whether a piece of web research must delegate to web-researcher.
---

# The Rule

**Any AI agent that needs to gather information from the public web MUST delegate to the `web-researcher` delegated agent unless a documented exception applies.**

## The Delegation Threshold

Use this bright-line test whenever an agent considers `WebSearch` or `WebFetch`:

> **For a single claim, if research requires 2 or more `WebSearch` calls OR 3 or more `WebFetch` calls, delegate to `web-researcher`. Otherwise an in-context single-shot call is permitted.**

| Situation                                                                 | Action                                      |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| Single-shot `WebFetch` against a known authoritative URL (e.g., npm page) | In-context — permitted                      |
| 2+ searches needed to find the right source for one claim                 | **Delegate to `web-researcher`**            |
| 3+ pages to cross-reference before deciding                               | **Delegate to `web-researcher`**            |
| Open-ended "current best practice" survey                                 | **Delegate to `web-researcher`**            |
| Link reachability check (HTTP 200 vs 404)                                 | In-context — link-checker exception applies |
| Fixer agent re-validating a single audit finding                          | In-context — fixer exception applies        |

## Documented Exceptions

The rule has exactly three exceptions. Exceptions are closed-ended — adding a new one is a governance change, not a judgement call.

1. **Single-shot verification of a known URL.** When an agent already has the authoritative URL (from checker notes, from an audit report, from explicit user instruction) and one `WebFetch` answers the question, run it in-context. Do not launch a delegated agent for one call.

2. **Fixer agents re-validating a single audit finding.** Fixer agents (`docs-fixer`, `content-fixer`, `apps-ayokoding-www-link-fixer`) intentionally operate in the same context as the audit they consume. Their re-validation must be decisive and paired with the fix; delegating to a delegated agent breaks that coupling. If a fixer discovers research much larger than the audit frame, it should escalate MEDIUM or FALSE_POSITIVE rather than spawn `web-researcher` itself.

3. **Link-reachability checker and fixer agents.** `docs-link-checker`, `apps-ayokoding-www-link-checker`, and their fixer counterparts are scoped to URL liveness — HTTP status codes, redirect chains, cache freshness. Their domain is explicitly URL-reachability, not content research. They invoke `WebFetch` directly against the URL under test; delegating to `web-researcher` would add latency without improving the signal (a 404 is a 404).

An exception agent still cites this convention in its body, stating which exception applies and why, so the rule is visible in the agent's own file rather than hidden in the convention.
