---
description: "The pre-flight checklist this workflow runs before any tester dispatches: clean tree, reachable targets, browser-tool discovery, plan-mode resolution, and recurrence/diff-since-last-run memory."
when_to_use: "Use when checking exactly what pre-flight verifies and compiles before Phase 1 starts, or what aborts the workflow early."
---

# Phase 0 — Pre-flight

**Actions**:

- Confirm the `ose-public` working tree is clean (`git status --porcelain` empty).
- Verify every URL in `target-urls` returns HTTP 200 (curl). If the server is down, abort and ask
  the user to start it — the testers cannot run against a dead target.
- **Browser-tool preflight** — before browser-facing verification, discover the real-browser
  integrations installed on the machine and confirm which are healthy and callable in the current
  harness. Prefer Playwright MCP first, then Chrome DevTools MCP; if neither is available, use an
  equivalent installed browser-driving integration. Record the selected tool, any fallback,
  browser/version when available, and capability gaps in the verification evidence. Static source,
  fetched HTML, WebFetch, and curl inspection are useful baselines, but do not count as live-browser
  verification when a working browser integration exists.
- Resolve `plan-mode`. For `new`, resolve `plan-identifier` (input, else derive from the target,
  e.g. `ayokoding-www-calc-test-fixing`). For `merge`, require `target-plan-path` to point at an
  existing folder under `plans/in-progress/`; abort if absent.
- Resolve `breakpoints` and `locales` (defaults = testers' own standard coverage; `locales` defaults
  to ALL locales the target supports — discovered from the app's i18n config or locale-prefixed
  routes — never just the default locale).
- **Recurrence memory** — locate prior findings plans for this target (`plans/**` whose slug names the
  same app/feature) and extract the **classes** of defect they recorded (e.g. cross-tab consistency,
  state-not-in-URL, unstyled control, hidden affordance). Hand this class list to all three testers as a
  **mandatory re-check** so a target does not keep re-yielding the same class a fresh charter would skip.
- **Diff-since-last-run targeting** — determine what changed in the target's source since the last
  findings run (`git log`/`git diff` on `apps/<target>/**`, `libs/**`). Features added or changed after
  the prior test are the **highest-risk untested surface**; direct the testers to cover them explicitly.

**Output**: Targets reachable; plan destination resolved; prior-class re-check list + changed-surface
list compiled for the testers.

**On failure**: Dirty tree → ask the user to commit/stash first. Unreachable URL or missing
merge target → abort with a clear message.
