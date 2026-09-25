---
description: "What the plan-execution-checker agent inspects in captured evidence."
when_to_use: "Use when you need to know what evidence the plan-execution-checker gate inspects."
---

# What plan-execution-checker Validates

The [plan-execution-checker](../../../../.agents/agents/plan-execution-checker.md) validates evidence
capture as part of Step 7 (Manual Behavioural Assertions). It checks:

1. **Screenshots exist** — for each UI verification step, `evidence/` contains at least one
   screenshot per locale per breakpoint tested.
2. **Delivery.md references evidence** — implementation notes under ticked UI-verification
   checkboxes contain `![...]` references or explicit `evidence/` file paths.
3. **Locale coverage** — for multi-locale apps, evidence covers ALL supported locales.
4. **API wire evidence** — each changed HTTP operation records its `rtk curl` success/failure commands,
   status/headers/media type/body, and evidence; each changed non-HTTP RPC/event records equivalent
   protocol-native invocations and results.
5. **No "verified manually" without evidence** — a bare "verified manually" note with no
   screenshot and no attributable HTTP/non-HTTP API wire result is a **HIGH** finding.
