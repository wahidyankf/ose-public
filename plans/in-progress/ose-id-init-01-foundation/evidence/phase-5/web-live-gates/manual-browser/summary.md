# Rule-9 manual browser pass — `ose-id-web` status shell

Build: uncommitted worktree, base HEAD `83b73f6b6b910ffeaf988323a9fd0a7b18e08f17`.
Tooling: Playwright MCP (`browser_navigate`/`browser_snapshot`/`browser_console_messages`/
`browser_take_screenshot`/`browser_resize`; dark mode via `browser_run_code_unsafe` calling the
Playwright page/context `emulateMedia({ colorScheme })` API — this shell has no client-side JS theme
toggle by design, so this is the only way to flip `prefers-color-scheme` for a live probe).

**Overall verdict: PASS**, with one non-blocking defect (RNP-001) and one plan-text-vs-architecture
disposition note (not a defect — see below).

## Ready state — run `343df6ee39d1` (`http://127.0.0.1:3500/`)

Full 6-viewport × light/dark matrix, all clean: `scrollWidth === clientWidth` at every width, no
horizontal scroll.

| Viewport | Light                    | Dark                    |
| -------- | ------------------------ | ----------------------- |
| 320px    | `ready-320px-light.png`  | `ready-320px-dark.png`  |
| 375px    | `ready-375px-light.png`  | `ready-375px-dark.png`  |
| 768px    | `ready-768px-light.png`  | `ready-768px-dark.png`  |
| 1024px   | `ready-1024px-light.png` | `ready-1024px-dark.png` |
| 1280px   | `ready-1280px-light.png` | `ready-1280px-dark.png` |
| 1440px   | `ready-1440px-light.png` | `ready-1440px-dark.png` |

Content: title, intro, "Authentication not enabled" notice, 3-row status card (web shell/Running,
backend/Not reported, Authentication/Disabled) — every state conveyed by text label, never color
alone. Dark mode verified live via `emulateMedia`: computed background resolved to
`lab(5.27552 -1.32231 -3.26218)`, matching the dark design-token value. `html[lang]="en"` — correct,
the one applicable locale fact for this app (see Locale section below).

Accessibility snapshot: `ready-1280px-light-a11y-snapshot.yml`.

## Keyboard-only pass (ready, 1280px)

Tab pressed 5× from a fresh load. `document.activeElement` stayed `<body>` on every press — zero
focusable elements confirmed live (matches the "zero interactive elements" assertions already in all
3 Phase 2 test layers), no focus trap.

## 200% zoom pass (ready, 1280px, light)

`body.style.zoom = 2`. No horizontal overflow (`scrollWidth === clientWidth` at 1280), vertical
reflow only (expected). `ready-1280px-light-zoom200.png`.

## PostgreSQL-unavailable / restored (same run `343df6ee39d1`)

`docker stop`/`docker start` on `ose-id-local-stack-pg-343df6ee39d1` (external to the runner, mirrors
the pattern already established in `evidence/phase-5/manual-verification-recovery-and-two-instance.txt`).
Web shell stayed `200` with byte-identical content throughout. Backend's own `/health/ready` went
`503` → `200` on recovery, matching the prior API-level evidence.

- Down: `postgres-down-1280px-light.png`, `postgres-down-1280px-dark.png`
- Restored: `restored-1280px-light.png`, `restored-1280px-dark.png`

## Backend-unavailable — second run `87fb06540a58` (ports 5439/8601/3600, `--fixture-profile=foundation-backend-down`)

Reached postgres/backend/web-ready cleanly — a third independent live confirmation this session that
Fix 8 (the postgres-bootstrap "already exists on retry" soundness gap; see `learnings.md`
2026-09-16 "AC-FND-01 local-stack runner") is resolved. Web shell stayed `200`, byte-identical
content, while the backend was confirmed unreachable via `curl`. Stack stopped cleanly afterward
(SIGTERM → full reverse-order cleanup, zero leftover containers).

- `backend-down-1280px-light.png`, `backend-down-1280px-dark.png`

## Locale

Confirmed via `find`/`grep` across `apps/ose-id-web/src`: no locale/i18n directory, no `i18n` block in
`next.config.ts`, no `Intl`/`toLocaleString` usage anywhere. This app has no locale/i18n
infrastructure — it is a fixed single-locale (English) shell with no translatable or user-configurable
long strings. "Supported default and pseudo/long-string locale" coverage from the Rule-9 instruction
text does not apply here; fabricating a pseudo-locale scenario this app cannot actually produce would
not be genuine evidence. `html[lang]="en"` is the one applicable, verified locale fact.

## Findings

**RNP-001 (LOW, non-blocking).** A fresh-session load logs a console 404 for `GET /favicon.ico`; no
favicon/icon file exists anywhere in `apps/ose-id-web` (confirmed: no `public/`, no `src/app/icon.*`,
no `src/app/favicon.ico`). Not repeated on reload (the browser caches the 404), but it violates the
Rule-9 acceptance line "console findings are zero" on a genuinely first-time load.
**Disposition**: accepted, not fixed this pass — no branded icon asset exists anywhere in this repo
to draw from (checked `libs/`, sibling public-marketing apps' `public/favicon.*`, and
`ose-app-web/src/app/icons/`), and fabricating placeholder iconography for a `robots: {index:
false}`, local-only, not-yet-authenticated foundation surface is out of this phase's scope. Deferred
to whichever future plan establishes real OSE ID branding assets.

**Architecture note (not a defect).** The web shell's rendered content is byte-identical across
ready/postgres-down/backend-down — it never queries backend health at all; its own copy states
"Backend readiness reporting is not part of this foundation build." The Rule-9 instruction text
("dependency-failure" state, "restored" transition) implies a visually distinguishable failure UI
that does not exist by design. Checked against the PRD (`AC-FND-07`, `prd.md` lines 288-296) and
Phase 2's delivery.md RED/GREEN/REFACTOR for the same acceptance criterion: neither requires a
distinct dependency-failure visual — AC-FND-07 is scoped entirely to keyboard/320px/heading/
status-region/non-color-only content, with no backend-down-specific clause. This is the same class
of stale generic plan wording as the earlier "Refresh status" PRD drift this plan already corrected
(same precedent, same resolution: trust the tested, delivered, deliberate architecture over
boilerplate plan text). The screenshots above still prove graceful, correct degradation — the page
never breaks, never leaks anything backend-specific, and stays fully accessible — there is simply no
separate visual to distinguish, by design.

## Stack status at completion

Original foundation-ready run (`b5rkmd1r6` / `343df6ee39d1`) confirmed still healthy (web `200`,
backend `/health/ready` `200`) and left running for the three live-site UX tester agents.
