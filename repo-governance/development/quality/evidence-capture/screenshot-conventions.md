---
description: "Naming, format, and content requirements for captured screenshots."
when_to_use: "Use when naming or capturing a screenshot as plan evidence."
---

# Screenshot Conventions

## Naming Pattern

```
phase-{N}-{description}-{locale}-{breakpoint}.{ext}
```

Examples:

- `phase-1-homepage-en-1280px.png` — Phase 1 homepage, English, desktop
- `phase-1-homepage-id-375px.png` — Phase 1 homepage, Indonesian, mobile
- `phase-2-calculator-en-768px.png` — Phase 2 calculator, English, tablet
- `phase-3-error-state-en-1280px.png` — Phase 3 error state, English, desktop

## Required Coverage

For **every web-UI manual verification step**:

| Coverage axis | Minimum required                                                  |
| ------------- | ----------------------------------------------------------------- |
| Breakpoints   | Mobile (375 px), tablet (768 px), desktop (1280 px) — all three   |
| Locales       | Every locale the app supports (e.g., `en`, `id`) — all of them    |
| States        | Normal state; plus error/empty states when the step exercises one |

Zero screenshots for a UI verification step is a finding under
[Plan Execution Checker](../../../../.agents/agents/plan-execution-checker.md) Step 7.

## How to Capture

Write a Playwright script to `local-tmp/` and run it via `npx playwright`:

```bash
# Example: capture homepage at all breakpoints in all locales
npx playwright test local-tmp/capture-evidence.spec.ts
```

Or use Playwright MCP `browser_take_screenshot` for interactive captures. Either way, save
screenshots to the plan's `evidence/` subfolder, not to `local-tmp/`.
