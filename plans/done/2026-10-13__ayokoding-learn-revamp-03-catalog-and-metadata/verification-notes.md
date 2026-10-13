# Verification notes (MD) — plan 03, Phase 5

- Option A ships (card grid; collapsed groups; stacked summary): every post-fix observation
  above matches the option-A mockups; the option-B variants were never built.
- Keyboard: group toggles are native `<button>` elements; Enter and Space both toggle in all
  three browsers (the first WebKit run used page-level keyboard events after a layout shift;
  locator press, which focuses the button first, passes everywhere).
- Reduced motion: chevron rotation is `motion-safe`-gated; no scroll animation anywhere.
- No backend drift: the only wire change is the additive optional `category` on
  `content.getTree` nodes (see tech-docs/010); `getBySlug` errors unchanged.
- No screenshots: Phase-0 before-screenshots and Phase-5 after-screenshots are absent
  because this execution environment has no screenshot-capable browser tooling (the cited
  "decision 29 / rule 35" does not exist in the repository; corrected here during Phase 6).
  UI proof is the green Playwright runs above — real Chromium/Firefox/WebKit browsers
  driven against the running production build, asserting the same catalog/header/sidebar
  behavior the manual assertions list. The `verification-screenshots-NNN/` subfolders are
  therefore not created.

## Tester-gate follow-ups (Phase 5 close-out)

UI gate (static review vs tech-docs/005; no live-browser pass): 1 major + 3 minor, no blockers.
Backend gate (38 unit tests + probes): PASS, 2 minor, no blockers.

- [x] F-01 (major): catalog `_index.md` description did not match the 005-mandated copy.
      Fixed: description is now the 005 text; `validate-indexes` green.
- [x] F-04 (minor): summary hardcoded 14 categories. Fixed: uses `groups.length` with a
      regression test rendering one group ("2 courses in 1 categories.").
- [x] BE-1 (minor): `category`/`format`/`estimatedHours` copied onto non-course tree nodes.
      Fixed: `repository-fs` maps catalog fields only for `learn/courses/<course>` section
      roots, with a regression test; matches the tech-docs/010 contract.
- [x] BE-2 (minor): empty-string `category`/`format` serialized on the wire. Fixed: schema
      normalizes empty/blank strings to absent, with a regression test.
- [x] F-02 (minor): card focus ring relied on `:has()` while the link removed its native
      outline. Fixed per 005: the link keeps its native `focus-visible` outline (regression test
      asserts no `outline-none` on card links); the card ring stays for modern browsers.
- [x] F-03 (minor): header `aria-label` was inert per HTML-AAM (nested `<header>` maps to the
      generic role). Fixed: `role="region"` exposes the "Course summary" labelled landmark
      without changing structure or E2E locators (regression test asserts
      `getByRole("region", { name: "Course summary" })`).
