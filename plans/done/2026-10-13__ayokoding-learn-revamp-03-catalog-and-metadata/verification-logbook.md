# Verification logbook (TXT) — plan 03, Phase 5

No Playwright MCP tool exists in this session, so every script below is a Playwright E2E
spec file that ran in real Chromium, Firefox, and WebKit against the production build
(`nx run ayokoding-www:build` + Playwright-owned standalone server on :3101), plus curl
wire recipes for the changed tRPC operation. Each entry states the setup, the discrete
expected observations, and the verdict.

## Script 1 — catalog (course-catalog.feature.spec.js, en)

Setup: production build, viewport default + 375px runs.
Expect: 14 category sections in fixed order; one card per course; SQL card shows description,
"Code by example", "About 8 h", path count; outline card shows Outline badge and no time;
jump link lands on the section heading; no card links to overview/learning/drilling pages.
Verdict: PASS on chromium, firefox, webkit.

## Script 2 — header (course-landing-header.feature.spec.js, en)

Setup: production build.
Expect: description + format + time + category in the Course summary header; prerequisites
and path links; Start opens learning/overview; rule-2 fallback opens
capstone-data-pipeline/learning/capstone/overview; rule-3 fallback opens
capstone-first-working-software/overview; contents list below header with exactly one
prerequisites list; outline header shows Outline and no time; inner pages have no header.
Verdict: PASS on chromium, firefox, webkit.

## Script 3 — sidebar groups (sidebar-course-categories.feature.spec.js, en)

Setup: production build, desktop + 375px drawer runs.
Expect: one group button per category on /en/learn/courses, all closed; current group open
on the course page with the course marked current; keyboard Enter/Space toggles with
aria-expanded; drawer shows the same groups with the current one open.
Verdict: PASS on chromium, firefox, webkit.

## Script 4 — API wire (curl, production build on :3102)

Setup: standalone server, no fixture data (real content tree).
Expect: getTree returns 181 course roots; sql-essentials carries
category "data-and-databases"; its learning child has no category key; getBySlug for
learn/courses/no-such-course returns tRPC NOT_FOUND "Page not found".
Verdict: PASS (evidence/phase-5-api-wire.txt; raw bodies in /tmp/wire-tree.json).
