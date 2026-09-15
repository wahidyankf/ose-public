---
description: Defines full-stack verification covering both UI and API, and the evidence-capture requirements for delivery.md.
when_to_use: Use when a phase touches both UI and API, or when documenting evidence for a manual behavioural assertion.
---

# Manual Behavioural Assertions — Full-Stack Verification and Evidence

**Continues** [Manual Behavioural Assertions — Web UI and API Verification](./manual-behavioural-assertions-web-and-api.md).

- For locale-sensitive APIs (localized messages, locale-dependent formatting), verify with
  `Accept-Language` header for EACH supported locale
- Inline the command, HTTP status, and response body (or first 20 lines) in `delivery.md` as
  fenced code blocks; save long responses (> 20 lines) to `evidence/phase-{N}-{endpoint}.txt`

1. **For full-stack changes** — run both real-browser proof and the API's appropriate wire client:
   - Verify UI renders correctly in ALL locales at ALL breakpoints
   - Verify API responds correctly
   - Verify the full flow (UI action → API call → response → UI update)
2. **Fix any broken behaviour** — including preexisting issues (Iron Rule 3)
3. **Document evidence** in `delivery.md` under each ticked checkbox:
   - Screenshot references via Markdown image syntax pointing at `./evidence/phase-N-...-{locale}-{breakpoint}px.png`
   - HTTP `rtk curl` or non-HTTP native-client commands and wire results as fenced code blocks
   - Console-clean confirmation per locale

**Output**: All manual assertions pass, application behaviour verified, evidence committed in
`evidence/` with `delivery.md` references

**On failure**: Fix broken behaviour, re-run assertions. Do NOT proceed to next phase with broken UI or API.

**Notes**:

- This step is MANDATORY when the plan touches web UI or API code
- Skip ONLY if the plan touches no UI and no API (e.g., pure documentation or governance changes)
- For multi-locale apps, testing ONLY the default locale is INCOMPLETE — verify ALL locales
- Playwright MCP provides real browser interaction — use it to catch rendering, JS, and integration issues that automated tests may miss
- `rtk curl` provides direct HTTP verification; a protocol-native client provides equivalent
  non-HTTP verification
- See [Evidence Capture Convention](../../../development/quality/evidence-capture.md) for screenshot naming, locale requirements, and delivery.md format
