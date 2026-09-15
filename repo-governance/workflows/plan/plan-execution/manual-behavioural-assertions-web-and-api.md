---
description: Defines mandatory post-CI web UI verification and protocol-appropriate API wire verification.
when_to_use: Use when a phase touches web UI or API code and its behaviour must be manually verified before proceeding.
---

# Manual Behavioural Assertions — Web UI and API Verification

After CI is green, manually verify actual application behaviour using Playwright MCP and the API's
real wire client.
Evidence MUST be captured: screenshots committed to the plan's `evidence/` subfolder and
referenced in `delivery.md`; HTTP or native-protocol wire results inlined as fenced code blocks or
saved as named sanitized evidence. "Verified manually" without evidence is incomplete. See
[Evidence Capture Convention](../../../development/quality/evidence-capture.md).

**Orchestrator action**:

1. **For Web UI changes** — use Playwright MCP tools across ALL supported locales and breakpoints:
   - Discover supported locales: read `apps/<app>/src/features/i18n/` or `apps/<app>/next.config.ts`
   - Start dev server: `nx dev [project-name]`
   - For EACH locale (e.g., `en`, `id`) × EACH breakpoint (375 px, 768 px, 1280 px):
     - `browser_resize(width, 900)`
     - `browser_navigate` to the locale-prefixed URL (e.g., `/en/page`, `/id/page`)
     - `browser_snapshot` to inspect rendered DOM; verify `html[lang]` matches the locale
     - `browser_console_messages` to check for JS errors
     - `browser_network_requests` to verify API calls
     - `browser_take_screenshot` — save to `evidence/phase-{N}-{description}-{locale}-{breakpoint}px.png`
   - `browser_click`, `browser_fill_form` to test interactive flows (any locale sufficient for flow)
   - Record screenshot paths in `delivery.md` under the relevant checkbox per the Evidence Capture Convention
2. **For HTTP API changes** — use `rtk curl` via Bash:
   - Start backend server: `nx dev [project-name]`
   - Run the plan's literal `rtk curl` success command and representative failure command for every
     changed HTTP-accessible operation; do not improvise a missing recipe during execution
   - Assert each case's documented status, required headers, media type, body/schema, and stable error
     code against its synthetic fixture
   - Capture a distinct sanitized evidence row/file per operation and case, run cleanup, and route any
     mismatch to the named owner
3. **For non-HTTP RPC/event API changes** — use the plan's protocol-native wire client:
   - Run every operation's fully written success and representative failure recipes against the real
     local service; a generated-client-only or improvised command is insufficient
   - Assert the exact request/fixture, response/schema or stable error, and redaction contract
   - Capture independently attributable sanitized evidence, execute cleanup, and route mismatches to
     the operation's named owner
