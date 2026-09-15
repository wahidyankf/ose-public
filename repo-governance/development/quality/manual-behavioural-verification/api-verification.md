---
description: "How to manually verify HTTP and non-HTTP API operations at their wire boundary."
when_to_use: "Use when preparing to manually verify an API change with curl or a protocol-native client."
---

# API Verification

**Enforcement disposition:** Unenforced by decision. Contract completeness, copy-ready command
semantics, and live response/evidence fidelity require human or agent review against the running API;
repository validators enforce Markdown, links, plan structure, and registered automated gates but do
not claim to prove those semantic properties.

Use `rtk curl` via Bash to verify HTTP-accessible operations. Use the protocol-native wire client for a
non-HTTP RPC/event operation.

## API Verification Checklist

After implementing an API change, verify:

1. **Health check**: Confirm the server is running and responding.
2. **Happy path**: Send a valid request and confirm the expected response shape, status code, and data.
3. **Error cases**: Send invalid requests and confirm proper error responses (4xx status codes, error messages).
4. **Edge cases**: Test boundary conditions (empty payloads, missing fields, maximum lengths).

## Formal-Plan Recipe Contract

When a formal plan adds, updates, or deletes an HTTP-accessible API operation, put the manual recipe
in `delivery.md`; do not leave it to the executor to invent. For every changed
HTTP operation, include:

- a literal, copy-pasteable `curl` success command and at least one representative failure command;
- the exact local base URL, method, path/query, headers, media type, and body or fixture file;
- synthetic fixture/setup prerequisites without real secrets or personal data;
- assertions for the expected status, required response headers, media type, and response body,
  redirect, or schema, including the documented failure code in its transport-native representation;
- an independently attributable evidence row or file for each operation and case; and
- cleanup plus the owner/failure route when an assertion differs.

Use `rtk curl` in repository plan recipes. A non-HTTP RPC or event uses its protocol-native wire
client and the same assertion/evidence standard. A bounded committed driver is acceptable only when the
plan includes its exact invocation and the driver emits and asserts a distinct result for every
named operation/case. “Verify with curl”, a URL-only bullet, a generated-client test, or one exchange
claimed as proof for several faults is incomplete.

## Example: API Endpoint Verification

```bash
# Health check
rtk curl -s http://localhost:8202/health | jq .

# Happy path -- create a resource
rtk curl -s -X POST http://localhost:8202/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Product", "price": 9.99}' | jq .

# Verify the response status code
rtk curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8202/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Product", "price": 9.99}'

# Error case -- missing required field
rtk curl -s -X POST http://localhost:8202/api/products \
  -H "Content-Type: application/json" \
  -d '{"price": 9.99}' | jq .

# Error case -- invalid data type
rtk curl -s -X POST http://localhost:8202/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": "not-a-number"}' | jq .
```

This compact example illustrates interactive diagnosis, not the complete formal-plan recipe. A formal
plan additionally fixes its synthetic setup and cleanup, captures response headers and media type, asserts
the body/schema or redirect and documented error code, and saves a distinct sanitized artifact for every named
operation/case. If a response is long, save it under the plan's `evidence/` directory and reference that
path from `delivery.md`.

## Locale-Aware API Verification

For APIs that serve locale-specific responses (e.g., localized error messages, locale-dependent
formatting), verify each supported locale explicitly:

```bash
# Verify locale-specific response (Accept-Language header or query param)
rtk curl -s -H "Accept-Language: en" http://localhost:8202/api/products | jq .name
rtk curl -s -H "Accept-Language: id" http://localhost:8202/api/products | jq .name
```
