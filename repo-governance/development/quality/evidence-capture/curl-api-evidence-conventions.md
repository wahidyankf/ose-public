---
description: "How to capture and format HTTP curl or non-HTTP native-client API evidence."
when_to_use: "Use when capturing API wire evidence for a plan."
---

# API Wire Evidence Conventions

For every changed API operation verified:

1. Record the actual command run (so it is reproducible).
2. Record the full response (or the first 20 lines if very long, with "…truncated" noted).
3. Record HTTP status/headers/media type or the protocol-native equivalent.
4. If the result is > 20 lines, save it to `evidence/phase-{N}-{operation}.txt`.

**Minimum coverage per operation**: one success plus at least one representative failure, each with
independently attributable evidence. HTTP recipes use literal `rtk curl`; non-HTTP RPC/events use the
protocol-native wire client. Both assert the documented result and stable failure code.

Example inline record:

````markdown
> **Evidence** (2026-06-20): API verification for `/api/tools`
>
> ```bash
> rtk curl -s http://localhost:8202/api/tools | jq .
> ```
>
> ```json
> { "tools": [{ "id": "cost-of-living-calculator", "name": "Cost of Living Calculator" }] }
> ```
>
> HTTP 200. Error path: `rtk curl -s -w "\n%{http_code}" http://localhost:8202/api/tools/nonexistent` → 404.
````

For non-HTTP operations, use the same record shape with the exact native-client invocation, protocol
result metadata, serialized result/problem, evidence destination, and cleanup outcome.
