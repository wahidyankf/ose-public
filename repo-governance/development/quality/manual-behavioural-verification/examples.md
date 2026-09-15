---
description: "Worked examples of manual behavioural verification."
when_to_use: "Use for a concrete example of this convention applied."
---

# Examples

## PASS: Complete HTTP verification workflow

```
1. Implement the feature (code changes)
2. Write/update automated tests (unit, integration, E2E as appropriate)
3. Run test:quick -- all pass
4. Start dev server
5. Manually verify UI renders correctly in ALL locales at ALL breakpoints
   (browser_navigate, browser_snapshot, browser_take_screenshot → evidence/)
6. Run each changed HTTP operation's literal rtk curl success and representative
   failure recipe from delivery.md; assert status, headers, media type, body/schema,
   and stable failure code independently
7. Check for console errors (browser_console_messages)
8. Record independently attributable sanitized screenshots, headers, and bodies at
   the delivery.md evidence destinations; run cleanup or its named failure route
9. Declare the feature complete
```

For a changed non-HTTP RPC/event operation, replace step 6 with its fully written protocol-native
wire-client success/failure recipe under the same assertions, evidence, and cleanup standard.

## FAIL: Skipping manual verification

```
1. Implement the feature
2. Write automated tests
3. Run test:quick -- all pass
4. Declare the feature complete
   [No manual verification -- visual regression ships to production]
```

## FAIL: Manual verification without automated tests

```
1. Implement the feature
2. Manually check it works in the browser
3. Declare the feature complete
   [No automated tests -- regression introduced in next commit]
```
