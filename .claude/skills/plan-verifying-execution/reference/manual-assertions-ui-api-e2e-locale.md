# Manual Behavioural Assertion Verification (Step 5c): UI, API, End-to-End, Locale

## 2. Verify Manual Behavioural Assertions (Step 5c — MANDATORY)

After verifying operational readiness (Step 5b), verify that manual behavioural assertions were
performed.

### What to Validate

1. **Playwright MCP Assertions for Web UI Changes**
   - If the plan touched any web frontend, check delivery.md for "Manual UI Verification" notes
   - Start the dev server and use Playwright MCP to independently verify key UI flows:
     `browser_navigate` to affected pages, `browser_snapshot` to inspect DOM state,
     `browser_console_messages` to check for JS errors, `browser_network_requests` to verify API
     integration
   - If UI is broken or has JS console errors: CRITICAL finding
   - If no manual UI verification was documented but plan touched UI: HIGH finding

2. **Wire Assertions for API Changes**
   - If the plan changed an HTTP, BFF, RPC, event, or standard-protocol operation, check `delivery.md`
     for its manual API verification notes.
   - For **every changed HTTP-accessible operation**, start the real local backend and independently run
     the plan's literal `rtk curl` success command and at least one representative failure command.
     Assert the exact URL, method, request headers/media/body or fixture, expected status, response
     headers/media/schema, and stable failure code. Confirm synthetic setup, independently attributable
     sanitized evidence, cleanup, and the named owner for any mismatch.
   - For every changed non-HTTP RPC/event operation, run the plan's protocol-native wire client with
     the same success/failure, setup, assertion, evidence, cleanup, and ownership standard. A generated
     client or one exchange claimed as proof for several operation/case rows is insufficient.
   - If an operation returns an unexpected response or the documented recipe is not runnable: CRITICAL finding.
   - If manual API verification was omitted for any changed operation: HIGH finding.

3. **End-to-End Flow Verification**
   - If the plan touches both UI and API, verify the full flow: use Playwright MCP to interact with
     the UI, verify that UI actions trigger correct API calls (`browser_network_requests`), verify API
     responses are correctly rendered in the UI
   - If end-to-end flow is broken: CRITICAL finding

4. **Locale Coverage (multi-locale apps)**
   - If the plan touched a web frontend serving more than one locale (detect via
     `apps/<app>/src/features/i18n/` or locale-prefixed routes `/en/`, `/id/`), verify the delivery
     notes show UI verification was performed for ALL supported locales, not just the default.
     Independently spot-check: `browser_navigate` to a non-default locale URL and confirm `html[lang]`
     matches and content is translated.
   - Verification documented for only the default locale on a multi-locale app: **HIGH** finding
   - Per the
     [Evidence Capture Convention](../../../../repo-governance/development/quality/evidence-capture.md).
