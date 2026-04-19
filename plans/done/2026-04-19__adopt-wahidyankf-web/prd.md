# PRD — Adopt wahidyankf-web

## Product Overview

`wahidyankf-web` is a personal portfolio Next.js 16 site that renders:

- A home page with About-Me, Top Skills / Languages / Frameworks (last 5
  years), Quick Links, and social links.
- A CV page with searchable, filterable, highlight-matched entries.
- A personal-projects index.
- A global theme toggle (dark / light with system preference detection).
- A site-wide search that filters list entries on the home and CV pages.
- Google Analytics and Google Tag Manager loaded via
  `@next/third-parties/google` (same package used elsewhere in the repo's
  Next.js stack).

After adoption the site is deployed via Vercel on the `prod-wahidyankf-web`
branch — identical to `ayokoding-web`, `oseplatform-web`, and
`organiclever-fe`. It ships its own unit tests, an axe-core accessibility
E2E smoke, and an `@amiceli/vitest-cucumber` Gherkin suite mirroring this
PRD's acceptance criteria.

**Target users of the product** (not plan personas): The primary product
user is a **visitor / recruiter** who arrives at `/`, reads the About Me
and top skills, and navigates to CV or projects within a few clicks.
A secondary audience is a **template adopter** — a future external user
who forks `apps/wahidyankf-web/` as a starting point for their own
portfolio, expecting every configuration file (Nx, Vitest, Playwright,
Tailwind, oxlint, tsconfig) to be either identical to the other three
Next.js apps or explicitly delta-documented so their fork has zero
unexplained bespoke behaviour. These are product-audience descriptions,
not plan personas — user stories can read "As a visitor" without
"Visitor" being a formal plan persona.

## Personas

Personas are content-placement hats / agent roles, not external
stakeholder titles.

- **Maintainer authoring content** — edits `app/data.ts` and
  `public/` assets; expects hot reload on `nx dev wahidyankf-web`.
- **AI agents consuming the file**:
  - `plan-checker` / `plan-execution-checker` — reads the functional
    requirements and Gherkin ACs to decide whether the implementation
    matches the plan.
  - `swe-typescript-dev` — reads the requirements list to know which
    routes/components must port over.
  - Future `apps-wahidyankf-web-content-maker` / `-checker` agents (not
    created in this plan) — would read the data shape and content
    expectations here.
  - Future `apps-wahidyankf-web-journal-maker` (not created in this plan)
    — will consume the app skeleton this plan lands to add `/journal`
    routes and a content pipeline.

## User Stories

- **US-1** — _As a visitor,_ I want to land on the site at `/` _so that_
  I can see a portfolio summary and quickly find the CV or projects.
- **US-2** — _As a visitor,_ I want to search across skills, languages,
  and frameworks _so that_ I can filter the list by typed text and see
  match highlights.
- **US-3** — _As a visitor,_ I want to open `/cv` and `/personal-projects`
  from the home page _so that_ I can read longer-form content.
- **US-4** — _As a visitor,_ I want to switch between light and dark
  themes _so that_ I can read comfortably regardless of system setting.
- **US-5** — _As a visitor using assistive tech,_ I want WCAG AA
  compliant contrast, keyboard navigability, and accessible ARIA roles
  _so that_ the site is usable without a mouse or with low vision.
- **US-6** — _As the maintainer,_ I want `nx dev wahidyankf-web` to start
  a local server on a unique port _so that_ it does not clash with the
  other three web apps' dev servers.
- **US-7** — _As the maintainer,_ I want `nx run wahidyankf-web:test:quick`
  to run unit tests + coverage gate in a few minutes _so that_ the
  pre-push hook stays fast.
- **US-8** — _As the maintainer,_ I want `nx run wahidyankf-web-e2e:test:e2e`
  to run a smoke + accessibility suite headlessly _so that_ regressions are
  caught automatically without manual intervention.
- **US-9** — _As the maintainer,_ I want pushing `main` → `prod-wahidyankf-web`
  to be a one-agent force-push _so that_ the deploy ritual matches the
  other three web apps.

## Functional Requirements

- **R1** — The home page (`app/page.tsx`) renders the About-Me section,
  Skills / Languages / Frameworks pills (top five-year, click-to-search),
  Quick Links to `/cv` and `/personal-projects`, and Connect-With-Me
  social buttons.
- **R2** — The CV page (`app/cv/page.tsx`) renders the full CV with search
  highlighting and the skill-click-to-filter behaviour the upstream app
  ships.
- **R3** — The personal-projects page (`app/personal-projects/page.tsx`)
  renders the upstream project list.
- **R4** — A shared `Navigation` component appears on every page (left
  sidebar on desktop, bottom nav on mobile).
- **R5** — A `ThemeToggle` controls a dark/light CSS variable theme,
  with system preference detection as the initial value.
- **R6** — A `SearchComponent` synchronises its input value with the URL
  `?search=` query string and persists across navigation between `/` and
  `/cv`.
- **R7** — A `HighlightText` component wraps matched substrings in a
  `<mark>` tag without breaking accessibility.
- **R8** — A `ScrollToTop` element appears after scrolling and returns to
  top on click.
- **R9** — Google Analytics and Google Tag Manager load through
  `@next/third-parties/google` when `NEXT_PUBLIC_GA_ID` /
  `NEXT_PUBLIC_GTM_ID` are set; the site renders correctly when they are
  absent.
- **R10** — The Nx project exposes `dev`, `build`, `start`, `typecheck`,
  `lint`, `test:unit`, `test:integration` (empty placeholder per the
  three-level testing standard — no integration tests in scope for this
  plan), `test:quick`, `spec-coverage` (mandatory per Nx Target Standards
  for all apps).
- **R11** — A sibling Nx project `wahidyankf-web-e2e` exposes `install`,
  `typecheck`, `lint`, `test:quick`, `test:e2e`, `test:e2e:ui`,
  `test:e2e:report`, `spec-coverage` matching the `organiclever-fe-e2e`
  shape.
- **R12** — A `prod-wahidyankf-web` environment branch is created
  from `main` after P5 passes, and an `apps-wahidyankf-web-deployer`
  agent supports the force-push-from-main workflow.
- **R13** — The layout is **responsive** across three reference
  breakpoints captured in `./baseline/`: desktop (1440 × 900), tablet
  (768 × 1024), mobile (375 × 812). Desktop shows a left-sidebar
  nav; tablet and mobile hide the sidebar and render a fixed
  bottom-tab-bar with the same three nav targets (Home, CV, Personal
  Projects). Each viewport × page × theme combination MUST
  structurally match its reference PNG in `./baseline/` after the
  port.
- **R14** — Theme toggle exposes two themes — **dark** (default) and
  **light** — with a fixed circular button at the top-right of the
  viewport. The button's aria-label flips between `Switch to light
theme` (when dark is active) and `Switch to dark theme` (when light
  is active). Light theme adds a `light-theme` class to `<html>`;
  dark theme removes it. Theme persists across client-side navigation
  within a single session but does NOT persist across hard reload
  (upstream does not write to `localStorage`; the port preserves that
  behaviour).
- **R15** — **Baseline fidelity**: the adopted app, rendered locally
  via `nx dev wahidyankf-web` on `http://localhost:3201/`, matches
  the live-site baseline in `./baseline/` at every viewport × theme ×
  page combination, as measured by the Playwright-MCP sweep defined
  in `delivery.md` phases P2/P3/P4/P7. Cosmetic drift from the
  Tailwind 3 → 4 migration is acceptable and recorded in commit
  bodies; structural drift blocks the phase commit.

## Gherkin Acceptance Criteria

```gherkin
Feature: Home page renders the portfolio summary
  As a visitor
  I want to land on the home page
  So that I can see a portfolio summary

  Scenario: Home page shows About Me and skill pills
    Given I navigate to "/"
    Then the "About Me" section is visible
    And the "Top Skills Used in The Last 5 Years" section is visible
    And the "Top Programming Languages Used in The Last 5 Years" section is visible
    And the "Top Frameworks & Libraries Used in The Last 5 Years" section is visible

  Scenario: Home page exposes quick links
    Given I navigate to "/"
    When I look at the "Quick Links" section
    Then I see a link with text "View My CV" pointing to "/cv"
    And I see a link with text "Browse My Personal Projects" pointing to "/personal-projects"
```

```gherkin
Feature: Search filters list entries
  As a visitor
  I want to type a search term
  So that I can filter the displayed lists

  Scenario: Typing filters the skills list
    Given I navigate to "/"
    And the skills list contains "TypeScript"
    And the skills list contains "Haskell"
    When I type "TypeScript" into the search input
    Then the skills list shows "TypeScript"
    And the skills list does not show "Haskell"
    And the URL contains query parameter "search=TypeScript"

  Scenario: Clicking a skill pill navigates to CV with the search prefilled
    Given I navigate to "/"
    When I click the skill pill "Go"
    Then I am on "/cv"
    And the search input on "/cv" has value "Go"
```

```gherkin
Feature: CV page renders and filters
  As a visitor
  I want the CV page to render with search highlighting
  So that I can find relevant experience fast

  Scenario: CV page renders
    Given I navigate to "/cv"
    Then a heading containing "CV" is visible
    And the CV entries list is not empty

  Scenario: CV search highlights matches
    Given I navigate to "/cv?search=React"
    Then at least one CV entry contains a "<mark>" element
    And the marked text is "React"
```

```gherkin
Feature: Theme toggle persists preference
  As a visitor
  I want to switch between dark and light themes
  So that the site matches my reading preference

  Scenario: Toggling theme updates the document class
    Given I navigate to "/"
    And the document has theme "dark"
    When I click the theme toggle
    Then the document has theme "light"
```

```gherkin
Feature: Personal projects page renders the project list
  As a visitor
  I want to open the personal-projects page
  So that I can browse the maintainer's public projects

  Scenario: Personal projects page renders
    Given I navigate to "/personal-projects"
    Then a heading containing "Personal Projects" is visible
    And the personal-projects list is not empty
```

> **Note**: The three Feature blocks below (`Responsive layout across viewports`, `Theme parity with the live-site baseline`, `Baseline fidelity against the live site`) have two authoring outcomes per `delivery.md` P3/P4. `Responsive` and `Theme parity` become runnable `.feature` files under `specs/apps/wahidyankf/fe/gherkin/` with unit-level step definitions. `Baseline fidelity` is a plan-level verification criterion — the Scenario Outline drives the manual Playwright-MCP baseline sweep and is NOT generated as a runnable `.feature` file (the "navigate to, then do NOT navigate to" assertion cannot be automated in step code).

```gherkin
Feature: Responsive layout across viewports
  As a visitor on any device
  I want the layout to adapt to my screen size
  So that navigation and content remain usable at desktop / tablet / mobile

  Scenario: Desktop shows the left-sidebar nav
    Given my viewport is 1440 x 900
    When I navigate to "/"
    Then I can see a left-sidebar navigation with links "Home", "CV", "Personal Projects"
    And I cannot see a bottom-tab-bar navigation

  Scenario: Tablet hides the sidebar and shows the bottom tab bar
    Given my viewport is 768 x 1024
    When I navigate to "/"
    Then I cannot see a left-sidebar navigation
    And I can see a bottom-tab-bar navigation with buttons "Home", "CV", "Personal Projects"

  Scenario: Mobile hides the sidebar and shows the bottom tab bar
    Given my viewport is 375 x 812
    When I navigate to "/"
    Then I cannot see a left-sidebar navigation
    And I can see a bottom-tab-bar navigation with buttons "Home", "CV", "Personal Projects"
```

> **Note**: This feature block maps to a runnable `specs/apps/wahidyankf/fe/gherkin/responsive.feature` file created in P3. Step implementations ship in `apps/wahidyankf-web/test/unit/steps/responsive.steps.ts` (unit) and `apps/wahidyankf-web-e2e/steps/responsive.steps.ts` (E2E). See `tech-docs.md` Gherkin Location table.

```gherkin
Feature: Theme parity with the live-site baseline
  As a visitor
  I want light and dark themes to render per the baseline
  So that my theme preference is preserved per session

  Scenario: Default theme on first load is dark
    Given I clear my browser state
    When I navigate to "/"
    Then the "<html>" element does not have the class "light-theme"
    And the theme toggle aria-label is "Switch to light theme"

  Scenario: Toggling to light theme adds the light-theme class
    Given I navigate to "/"
    When I click the theme toggle button
    Then the "<html>" element has the class "light-theme"
    And the theme toggle aria-label becomes "Switch to dark theme"

  Scenario: Theme persists across client-side navigation within a session
    Given I navigate to "/"
    And I click the theme toggle to switch to light theme
    When I click the "CV" nav link
    Then the "<html>" element still has the class "light-theme"
```

> **Note**: This feature block maps to the existing runnable `specs/apps/wahidyankf/fe/gherkin/theme.feature` file created in P3 (same file as `Feature: Theme toggle persists preference` above — the deeper theme-parity scenarios are added to that same file). Step implementations ship in `apps/wahidyankf-web/test/unit/steps/theme.steps.ts` (unit) and `apps/wahidyankf-web-e2e/steps/theme.steps.ts` (E2E). See `tech-docs.md` Gherkin Location table.

```gherkin
Feature: Baseline fidelity against the live site
  As the maintainer validating the port
  I want the adopted app to structurally match the live-site baseline
  So that recruiters see no regression after Vercel cutover

  Scenario Outline: Every viewport / theme / page matches its baseline
    Given "nx dev wahidyankf-web" is running on "http://localhost:3201/"
    And my viewport is <width> x <height>
    And the theme is "<theme>"
    When I navigate to "<route>"
    Then the rendered DOM structurally matches the reference at "baseline/<pngfile>"
    And the browser reports zero console errors

    Examples:
      | width | height | theme | route              | pngfile                                  |
      | 1440  | 900    | dark  | /                  | 01-home-desktop-dark.png                 |
      | 1440  | 900    | dark  | /cv                | 02-cv-desktop-dark.png                   |
      | 1440  | 900    | dark  | /personal-projects | 03-personal-projects-desktop-dark.png    |
      | 1440  | 900    | light | /                  | 04-home-desktop-light.png                |
      | 768   | 1024   | dark  | /                  | 06-home-tablet-dark.png                  |
      | 768   | 1024   | dark  | /cv                | 07-cv-tablet-dark.png                    |
      | 768   | 1024   | dark  | /personal-projects | 08-personal-projects-tablet-dark.png     |
      | 768   | 1024   | light | /personal-projects | 09-personal-projects-tablet-light.png    |
      | 768   | 1024   | light | /cv                | 10-cv-tablet-light.png                   |
      | 768   | 1024   | light | /                  | 11-home-tablet-light.png                 |
      | 375   | 812    | light | /                  | 12-home-mobile-light.png                 |
      | 375   | 812    | light | /cv                | 13-cv-mobile-light.png                   |
      | 375   | 812    | light | /personal-projects | 14-personal-projects-mobile-light.png    |
      | 375   | 812    | dark  | /personal-projects | 15-personal-projects-mobile-dark.png     |
      | 375   | 812    | dark  | /cv                | 16-cv-mobile-dark.png                    |
      | 375   | 812    | dark  | /                  | 17-home-mobile-dark.png                  |

  # Policy constraint: Do NOT navigate to https://www.wahidyankf.com/ during validation.
  # Rationale: Vercel binding still points at upstream build during plan execution.
  # Compare against "baseline/" PNGs only — never against a refetched live URL.
```

> **Note**: This feature block describes plan-level verification criteria checked manually by `plan-execution-checker` via the Playwright-MCP sweep in `delivery.md` P2/P3/P4/P7. The Scenario Outline drives a manual visual-comparison workflow, not an automated `.feature` file run by `@amiceli/vitest-cucumber` or `playwright-bdd`. The 16-row Scenario Outline maps to 16 of the 17 baseline PNGs; desktop-light covers only `/` (see `tech-docs.md` "Capture matrix" for rationale). This feature is NOT a runnable `.feature` file — do not create a `baseline-fidelity.feature` for automated execution.

```gherkin
Feature: Accessibility AA compliance
  As a visitor using assistive tech
  I want the site to meet WCAG AA
  So that I can use the site without barriers

  Scenario: Home page has no axe-core violations
    Given I navigate to "/"
    When I run an axe-core scan with WCAG 2.1 AA rules
    Then zero violations are reported

  Scenario: CV page has no axe-core violations
    Given I navigate to "/cv"
    When I run an axe-core scan with WCAG 2.1 AA rules
    Then zero violations are reported
```

```gherkin
Feature: Quality gates on the new Nx project
  As the maintainer
  I want the standard Nx targets green
  So that pre-push and PR gates pass

  Scenario: test:quick passes with coverage
    Given the app source and unit tests are committed
    When I run "nx run wahidyankf-web:test:quick"
    Then the quality gate passes
    And code coverage meets the 80% line threshold
    And a coverage report is generated at "apps/wahidyankf-web/coverage/lcov.info"

  Scenario: spec-coverage passes
    Given all Gherkin feature files have corresponding step implementations
    When I run "nx run wahidyankf-web:spec-coverage"
    Then the spec-coverage gate passes

  Scenario: affected quality gate passes
    Given the full implementation is committed
    When I run "nx affected -t typecheck lint test:quick spec-coverage"
    Then all affected targets pass with exit code 0
```

> **Note**: This feature block describes plan-level verification criteria. It is NOT a runnable `quality-gates.feature` file — it is checked manually by `plan-execution-checker` against the final state of the implementation.
>
> The `Production deployment wiring` block directly below is also plan-level verification, not a runnable `.feature` file.

```gherkin
Feature: Production deployment wiring
  As the maintainer
  I want a production branch and deployer agent
  So that deployment matches the other three web apps

  Scenario: Production branch exists
    When I run "git branch -r"
    Then the output contains "origin/prod-wahidyankf-web"

  Scenario: Deployer agent definition exists
    When I read ".claude/agents/apps-wahidyankf-web-deployer.md"
    Then the file's frontmatter declares name "apps-wahidyankf-web-deployer"
    And the body describes a force-push from main to "prod-wahidyankf-web"
```

> **Note**: This feature block describes plan-level verification criteria. It is NOT a runnable `production-deployment.feature` file — it is checked manually by `plan-execution-checker` against the final state of the implementation. The `git branch -r` and file-existence checks are infrastructure-level assertions that cannot be expressed as automated Gherkin step definitions.

## Product Scope

**In scope (features)**:

- Home, CV, personal-projects pages (ported 1:1 from upstream)
- Search with URL sync, theme toggle, scroll-to-top, highlight text
- Google Analytics / GTM wiring via `@next/third-parties`
- Unit tests for every ported component + page
- Playwright-BDD E2E: smoke (all three pages reachable) + axe-core a11y

**Out of scope (features)**:

- **Personal journal route / feed / MDX pipeline** — deferred to a
  follow-up plan. This plan lands only the three upstream routes (`/`,
  `/cv`, `/personal-projects`). The app structure leaves a clear slot
  for a future `/journal` addition without refactor.
- Admin panel, CMS, or any dynamic content source beyond `app/data.ts`
- Internationalisation (site stays English-only — no Indonesian mirror)
- Server-side API routes or auth
- PWA / service worker support
- Image optimisation pipeline beyond Next.js defaults (upstream uses
  `images.unoptimized: true`; we preserve that for portability)
- External-facing "use this as a template" documentation (the app will
  function as a template structurally, but writing the adopter guide is
  a separate plan)

## Product-Level Risks

| Risk                                                                                                                                                  | Mitigation                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind 3 → 4 migration silently breaks the green-on-black theme                                                                                     | P2 dedicates a checkbox to running `npx @tailwindcss/upgrade` and Playwright smoke in P4 renders each page at both themes                                                                                                                                |
| React 19 + `useSearchParams` changes Suspense boundaries subtly                                                                                       | Upstream `page.tsx` already wraps `HomeContent` in `<Suspense>`; port preserves that; Gherkin US-2 ACs re-verify end-to-end                                                                                                                              |
| Dev port clashes with an existing app                                                                                                                 | Assign `3201` (first free above `organiclever-fe`'s `3200`) and document in top-level `CLAUDE.md` under the app's section                                                                                                                                |
| axe-core flags upstream contrast (dark background + green-400 text)                                                                                   | Contrast pair `#4ade80` on `#111827` measures above WCAG AA (≈ 6.4:1); if scan reports violations, adjust tokens in P4                                                                                                                                   |
| Recruiters hit the site during the deploy-branch creation cutover                                                                                     | P6 creates the branch from a verified green `main`; Vercel bindings happen post-merge so no partial deploy window                                                                                                                                        |
| Responsive regression at tablet or mobile goes unnoticed (e.g. sidebar reappears at 768 px or bottom tab bar disappears at 375 px)                    | Baseline sweep in P2/P3/P4/P7 uses exact reference PNGs at 1440 × 900, 768 × 1024, and 375 × 812 — any structural mismatch blocks the phase commit. R13 in the functional-requirements list makes the three breakpoints first-class acceptance criteria. |
| Post-port validation accidentally hits `https://www.wahidyankf.com/` and compares against the stale upstream Vercel build, producing false-fail noise | `delivery.md` preconditions explicitly forbid hitting the live URL; every baseline checkpoint re-states the ban; `./baseline/README.md` explains the rationale in one place                                                                              |
