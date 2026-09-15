# Rule 9: Manual Behavioural Assertion Validation (Step 5c — MANDATORY)

After Step 5b, verify manual behavioural assertion steps when applicable.

**What to validate**:

1. **Playwright MCP steps for web UI plans** — any web-frontend change (Next.js, Flutter Web, any UI
   project) needs `browser_navigate`, `browser_snapshot`, `browser_click`/`browser_fill_form`,
   `browser_console_messages`, `browser_take_screenshot` steps naming which pages/flows. Missing
   entirely: **CRITICAL**.
2. **HTTP curl steps for API plans** — any endpoint change (REST, tRPC, backend service, BFF, or standard
   protocol endpoint) needs a literal, copy-pasteable `rtk curl` success command and at least one
   representative failure command for every changed HTTP-accessible operation. Validate exact local URL, method,
   headers, media type/body or fixture, expected status/headers/media type/body, schema or redirect,
   and documented transport-native error code, independently attributable evidence, synthetic setup, cleanup, and named failure
   route. A prose instruction, URL-only bullet, generated-client-only check, or one exchange claimed
   for several cases is incomplete. Missing commands for any changed HTTP-accessible operation: **CRITICAL**.
3. **Native-client steps for non-HTTP API plans** — every changed non-HTTP RPC/event operation needs
   fully written protocol-native success and representative failure recipes with exact request/fixture,
   response/schema or stable error, synthetic setup, independently attributable evidence, cleanup, and
   named failure route. A prose-only or generated-client-only instruction is incomplete. Missing recipes
   for any changed operation: **CRITICAL**.
4. **End-to-end flow assertion for full-stack plans** — UI-plus-API plans need full-flow assertion
   (UI → API → response → UI update). Missing entirely: **HIGH**.
5. **Locale coverage for multi-locale UI plans** — a frontend serving more than one locale (detect via
   `apps/<app>/src/features/i18n/` or locale-prefixed routes) needs verification across ALL supported
   locales (explicit "for each locale" or named locale URLs `/en/...`, `/id/...`). Single-locale-only:
   **HIGH**. Per
   [Evidence Capture Convention](../../../../repo-governance/development/quality/evidence-capture.md)
   and
   [Manual Behavioural Verification](../../../../repo-governance/development/quality/manual-behavioural-verification.md).
6. **Evidence Capture Steps** — every manual-verification section needs evidence-capture steps:
   screenshots to `evidence/` (named `phase-N-<description>-<locale>-<breakpoint>px.png`) referenced
   in `delivery.md`; HTTP or native API wire results inlined as fenced code blocks or saved as named
   sanitized evidence. Section
   present but no evidence-capture step: **HIGH**.
7. **Not-applicable exemption** — plans touching only docs/governance/non-code files don't need
   manual assertions; verify the exemption is legitimate (genuinely no UI/API changes).

**Finding severity**: missing Playwright steps for UI plan: **CRITICAL**. Missing per-operation curl
success/failure commands or native-client recipes for an API plan: **CRITICAL**. Present but non-copyable commands, incomplete
assertions/fixtures/evidence/cleanup, or non-independent multi-case proof: **HIGH**. Missing end-to-end flow for full-stack plan: **HIGH**. Single-locale-only on
multi-locale app: **HIGH**. Missing evidence-capture steps: **HIGH**. Steps present but vague (no
specific pages/endpoints): **MEDIUM**.
