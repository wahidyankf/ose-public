# Manual Behavioural Assertions — UI and API Wire Boundaries

When the plan touches web UI or API code, delivery plans MUST include manual assertion sections.
**Two hard requirements bind every manual-assertion section:**

1. **Locale coverage** — for a **multi-locale** app, every UI-verification step runs across ALL
   supported locales (e.g. `en` AND `id`), never just the default. Discover the locale set from
   `apps/<app>/src/features/i18n/` or `next.config.ts`. Single-locale verification on a bilingual app
   is INCOMPLETE.
2. **Evidence capture** — every manual-verification step produces a committed artifact: screenshots
   in the plan's `evidence/` subfolder (named `phase-N-<description>-<locale>-<breakpoint>px.png`),
   HTTP curl and non-HTTP native-client results inlined in `delivery.md` or saved as named sanitized evidence. For every changed
   HTTP-accessible operation, the plan supplies literal `rtk curl` commands for success and at least one representative
   failure plus exact expected status, headers, media type, body/schema, fixture, evidence, cleanup,
   and failure routing. For every changed non-HTTP RPC/event operation, supply equivalent success/failure
   recipes using its protocol-native wire client. A prose placeholder or one exchange standing in for
   several cases is incomplete. See the
   [Evidence Capture Convention](../../../../repo-governance/development/quality/evidence-capture.md).

## For Web UI Plans — Playwright MCP

```markdown
### Manual UI Verification (Playwright MCP) — all locales × all breakpoints

- [ ] [AI] Discover supported locales: read `apps/[app]/src/features/i18n/` or `next.config.ts`
- [ ] [AI] Start dev server: `rtk ./hippo run --class service --disk-path . -- npm exec nx -- dev [project-name]`
- [ ] [AI] For EACH locale × EACH breakpoint (375 / 768 / 1280 px): navigate to the locale-prefixed
      URL (`/en/...`, `/id/...`) via `browser_navigate` + `browser_resize`
- [ ] [AI] Inspect DOM via `browser_snapshot` — verify `html[lang]` matches the locale, no untranslated strings
- [ ] [AI] Test interactive flows via `browser_click` / `browser_fill_form`
- [ ] [AI] Check for JS errors via `browser_console_messages` — must be zero errors per locale
- [ ] [AI] Verify API integration via `browser_network_requests`
- [ ] [AI] Capture one screenshot per locale per breakpoint via `browser_take_screenshot`, saved to
      `evidence/phase-N-[feature]-[locale]-[breakpoint]px.png`
- [ ] [AI] Document evidence in this checklist: reference each screenshot (`![alt](./evidence/...)`)
```

## For API Plans — HTTP curl or Non-HTTP Native Client

```markdown
### Manual API Wire Verification

- [ ] [AI] Start backend server: `rtk ./hippo run --class service --disk-path . -- npm exec nx -- dev [project-name]`
- [ ] [AI] Verify health endpoint: `rtk curl -sS -D <headers-file> -o <body-file> http://127.0.0.1:<port>/health/ready`; assert the documented status, headers, media type, and body/schema.
- [ ] [AI] For every changed HTTP-accessible operation, run its fully written `rtk curl` success command and assert the documented response; do not leave method, URL, headers, body, or fixture to discovery.
- [ ] [AI] For every changed HTTP-accessible operation, run at least one fully written representative failure command and assert its status, headers, media type, body/schema or redirect, and documented transport-native error code.
- [ ] [AI] For every changed non-HTTP RPC/event operation, run its fully written protocol-native client success and representative failure recipes and assert the same wire-level contract.
- [ ] [AI] For locale-sensitive responses, verify each locale via `Accept-Language` header
- [ ] [AI] Document a distinct sanitized evidence row/file for each operation and case, then run the written cleanup; route any mismatch to the named operation owner.
```

## For Full-Stack Plans — Both + End-to-End

Include both sections above plus an end-to-end flow verification step (per locale).

See [manual-verification-retest-rules.md](manual-verification-retest-rules.md) for the mandatory rule-15/rule-16 pre-archival retests.
