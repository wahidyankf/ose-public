---
title: "Manual Behavioral Verification Convention"
description: Practice requiring manual verification of UI features and API endpoints using Playwright MCP tools and curl after implementing changes
category: explanation
subcategory: development
tags:
  - verification
  - testing
  - playwright
  - api
  - quality
  - manual-testing
created: 2026-04-04
---

# Manual Behavioral Verification Convention

After implementing UI or API changes, manual behavioral verification is **mandatory** -- not optional. Automated tests validate correctness at the code level; manual verification validates that the feature actually works as a user or consumer would experience it. Both are required. They complement each other.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Manual verification forces the implementer to observe the actual behavior of the system, not just trust that tests passed. This deliberate observation step catches integration issues, visual regressions, and behavioral mismatches that automated tests may not cover.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: Bugs that reach production often stem from skipping manual verification. The root cause is not inadequate tests -- it is the absence of a human or agent observing the actual behavior before declaring the work complete. This convention addresses that root cause directly.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The verification step is an explicit, required action in the implementation workflow. It is not assumed to have happened because tests passed. The evidence of verification (screenshots, console output, API responses) makes the check visible and auditable.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Three-Level Testing Standard](./three-level-testing-standard.md)**: Manual verification supplements the three automated testing levels (unit, integration, E2E). It does not replace any of them. All three levels plus manual verification form the complete quality assurance picture.

- **[Code Quality Convention](./code.md)**: Automated quality gates (typecheck, lint, test:quick) catch code-level issues. Manual verification catches behavioral issues that survive those gates. Together they form a complete quality boundary.

## The Rule

**Manual behavioral verification is MANDATORY after implementing UI or API changes.**

This applies to:

- New UI features (pages, components, interactions)
- UI bug fixes
- New API endpoints
- API behavior changes (request/response shape, validation rules, error handling)
- Integration changes (connecting UI to API, connecting API to data source)

## UI Verification

Use Playwright MCP tools to verify UI features and bugs in a real browser environment.

### Required Tools

| Tool                       | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| `browser_navigate`         | Open the relevant page                                 |
| `browser_snapshot`         | Capture the current DOM state for inspection           |
| `browser_click`            | Interact with buttons, links, and interactive elements |
| `browser_fill_form`        | Fill form fields to test input handling                |
| `browser_console_messages` | Check for JavaScript errors, warnings, and logs        |
| `browser_take_screenshot`  | Capture visual evidence of the rendered state          |
| `browser_network_requests` | Verify API calls, response codes, and payload shapes   |

### UI Verification Checklist

After implementing a UI change, verify:

1. **Page renders**: Navigate to the page and take a snapshot. Confirm the expected elements are present.
2. **Interactions work**: Click buttons, fill forms, and navigate between pages. Confirm the expected behavior occurs.
3. **No console errors**: Check `browser_console_messages` for JavaScript errors or unexpected warnings.
4. **Network requests succeed**: Check `browser_network_requests` for failed API calls, unexpected 4xx/5xx responses, or missing requests.
5. **Visual correctness**: Take a screenshot and confirm the layout, typography, and content match expectations.

### Example: UI Feature Verification

```
1. browser_navigate("http://localhost:3200/products")
2. browser_snapshot() -- confirm product list renders
3. browser_click("Add Product button")
4. browser_fill_form("Product Name", "Test Product")
5. browser_click("Submit button")
6. browser_snapshot() -- confirm product appears in list
7. browser_console_messages() -- confirm no errors
8. browser_network_requests() -- confirm POST /api/products returned 201
9. browser_take_screenshot() -- capture visual evidence
```

## API Verification

Use `curl` via Bash to verify API endpoints respond correctly.

### API Verification Checklist

After implementing an API change, verify:

1. **Health check**: Confirm the server is running and responding.
2. **Happy path**: Send a valid request and confirm the expected response shape, status code, and data.
3. **Error cases**: Send invalid requests and confirm proper error responses (4xx status codes, error messages).
4. **Edge cases**: Test boundary conditions (empty payloads, missing fields, maximum lengths).

### Example: API Endpoint Verification

```bash
# Health check
curl -s http://localhost:8202/health | jq .

# Happy path -- create a resource
curl -s -X POST http://localhost:8202/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Product", "price": 9.99}' | jq .

# Verify the response status code
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8202/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Product", "price": 9.99}'

# Error case -- missing required field
curl -s -X POST http://localhost:8202/api/products \
  -H "Content-Type: application/json" \
  -d '{"price": 9.99}' | jq .

# Error case -- invalid data type
curl -s -X POST http://localhost:8202/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": "not-a-number"}' | jq .
```

## When Verification Is Required

| Change Type                                 | UI Verification              | API Verification                       |
| ------------------------------------------- | ---------------------------- | -------------------------------------- |
| New UI page or component                    | Yes                          | No (unless it calls an API)            |
| UI bug fix                                  | Yes                          | No (unless the bug involved API calls) |
| New API endpoint                            | No (unless a UI consumes it) | Yes                                    |
| API behavior change                         | No (unless a UI consumes it) | Yes                                    |
| Full-stack feature (UI + API)               | Yes                          | Yes                                    |
| Styling-only change                         | Yes (visual check)           | No                                     |
| Internal refactor with no behavioral change | No                           | No                                     |
| Documentation-only change                   | No                           | No                                     |

## Relationship to Automated Tests

Manual verification does **not** replace automated tests. The relationship is complementary:

| Layer                   | What It Catches                                                            | When It Runs                                |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| **Unit tests**          | Logic errors, edge cases, contract violations                              | On every commit (test:quick)                |
| **Integration tests**   | Cross-component failures, database issues                                  | On demand or CI                             |
| **E2E tests**           | Full-stack flow failures, regression                                       | On demand or CI                             |
| **Manual verification** | Visual regressions, UX issues, integration mismatches, real-world behavior | After implementation, before declaring done |

A feature is not complete until **both** automated tests pass **and** manual verification confirms the expected behavior.

## Examples

### PASS: Complete verification workflow

```
1. Implement the feature (code changes)
2. Write/update automated tests (unit, integration, E2E as appropriate)
3. Run test:quick -- all pass
4. Start dev server
5. Manually verify UI renders correctly (browser_navigate, browser_snapshot)
6. Manually verify API responds correctly (curl)
7. Check for console errors (browser_console_messages)
8. Declare the feature complete
```

### FAIL: Skipping manual verification

```
1. Implement the feature
2. Write automated tests
3. Run test:quick -- all pass
4. Declare the feature complete
   [No manual verification -- visual regression ships to production]
```

### FAIL: Manual verification without automated tests

```
1. Implement the feature
2. Manually check it works in the browser
3. Declare the feature complete
   [No automated tests -- regression introduced in next commit]
```

## Scope

This convention applies to:

- All AI agents implementing UI or API changes
- All human developers implementing UI or API changes
- All apps in `apps/` that have a UI or API surface

It does not apply to:

- Library-only changes (`libs/`) with no UI or API surface
- Documentation changes (`docs/`, `governance/`, `plans/`)
- Configuration changes that do not affect runtime behavior
- Internal refactors with no observable behavioral change

## Tools and Automation

- **Playwright MCP tools**: Available to all agents for browser-based verification
- **curl**: Available via Bash for API verification
- **jq**: Available via Bash for JSON response inspection

## Related Documentation

- [Three-Level Testing Standard](./three-level-testing-standard.md) -- Automated testing architecture that manual verification complements
- [Code Quality Convention](./code.md) -- Automated quality gates (typecheck, lint, test:quick)
- [Implementation Workflow Convention](../workflow/implementation.md) -- Three-stage workflow where manual verification fits in the "make it work" stage
- [Specs-Application Sync Convention](./specs-application-sync.md) -- Spec updates required alongside code changes
