# Live-Site Baseline (wahidyankf.com)

Captured 2026-04-19 against the live production site at
<https://www.wahidyankf.com/> using Playwright MCP from the plan-maker
session. The screenshots and behavioural notes in this directory are
the **authoritative reference** the adopted `apps/wahidyankf-web/` must
match after every port phase — **verified locally against
`http://localhost:3201/`, not against `www.wahidyankf.com/`**.

## Why local-only verification after the port

The Vercel project binding for `www.wahidyankf.com` still points to the
upstream `wahidyankf/oss` build. The user will swap the binding to the
new `prod-wahidyankf-web` branch in this repository manually, after
plan completion. During and immediately after the port, the live
production URL therefore serves the old app, not the adopted one.

Consequence: every "does the adopted site match the baseline" check in
this plan compares:

- **Left side** — the PNGs and behavioural notes in this directory
  (captured from the live site on 2026-04-19).
- **Right side** — the adopted app running locally via
  `nx dev wahidyankf-web` on `http://localhost:3201/`.

The plan MUST NOT compare the adopted app to a refetched live URL
after the port — they will disagree until the user performs the
Vercel swap.

## Viewports captured

Three viewports spanning the responsive breakpoints that the upstream
Tailwind-3 layout expects. Mobile narrowest, tablet iPad-portrait,
desktop ≥ 1440 for the sidebar-on layout.

| Viewport | Dimensions | Use case                    |
| -------- | ---------- | --------------------------- |
| Mobile   | 375 × 812  | iPhone 12-class phone       |
| Tablet   | 768 × 1024 | iPad portrait               |
| Desktop  | 1440 × 900 | Desktop browser, sidebar on |

## Themes captured

Both themes captured at every viewport. The site's default is **dark**;
toggling persists across client-side navigation inside a session.

| Theme | `<html>` class                      | Toggle button aria-label | Page background                     | Text colour                                             |
| ----- | ----------------------------------- | ------------------------ | ----------------------------------- | ------------------------------------------------------- |
| Dark  | `__className_xxxx` (no theme class) | `Switch to light theme`  | `rgb(0, 0, 0)` body / gray-900 main | Green-400 body, yellow-400 headings                     |
| Light | `__className_xxxx light-theme`      | `Switch to dark theme`   | `rgb(255, 255, 255)`                | Black body, brown-ish headings, purple underlined links |

Theme class lives on `<html>`, not `<body>`. Toggle button is a circular
yellow button top-right with a sun icon (dark mode) or moon icon
(light mode).

## Screenshot index

Every PNG below is a **viewport** screenshot at the indicated
viewport+theme+page, except `01-home-desktop-dark.png` which is
full-page so the entire home page layout is in one image.

### Desktop (1440 × 900)

| #   | File                                         | Page                  | Theme | Notes                                   |
| --- | -------------------------------------------- | --------------------- | ----- | --------------------------------------- |
| 01  | `01-home-desktop-dark.png`                   | `/`                   | dark  | Full-page; all sections visible         |
| 02  | `02-cv-desktop-dark.png`                     | `/cv`                 | dark  | Viewport only; Curriculum Vitae heading |
| 03  | `03-personal-projects-desktop-dark.png`      | `/personal-projects`  | dark  | Full-page; 3 project cards              |
| 04  | `04-home-desktop-light.png`                  | `/`                   | light | Viewport; light theme confirmation      |
| 05  | `05-home-desktop-dark-search-typescript.png` | `/?search=TypeScript` | dark  | Search filter + mark highlight          |

### Tablet (768 × 1024)

| #   | File                                    | Page                 | Theme | Notes                                  |
| --- | --------------------------------------- | -------------------- | ----- | -------------------------------------- |
| 06  | `06-home-tablet-dark.png`               | `/`                  | dark  | Left sidebar collapses, bottom tab bar |
| 07  | `07-cv-tablet-dark.png`                 | `/cv`                | dark  | Same bottom tab bar                    |
| 08  | `08-personal-projects-tablet-dark.png`  | `/personal-projects` | dark  | Same                                   |
| 09  | `09-personal-projects-tablet-light.png` | `/personal-projects` | light | Light theme at tablet                  |
| 10  | `10-cv-tablet-light.png`                | `/cv`                | light | Light theme at tablet                  |
| 11  | `11-home-tablet-light.png`              | `/`                  | light | Light theme at tablet                  |

### Mobile (375 × 812)

| #   | File                                    | Page                 | Theme | Notes                                 |
| --- | --------------------------------------- | -------------------- | ----- | ------------------------------------- |
| 12  | `12-home-mobile-light.png`              | `/`                  | light | Title clipped by theme-toggle overlap |
| 13  | `13-cv-mobile-light.png`                | `/cv`                | light | Search input full-width               |
| 14  | `14-personal-projects-mobile-light.png` | `/personal-projects` | light | Cards stacked vertically              |
| 15  | `15-personal-projects-mobile-dark.png`  | `/personal-projects` | dark  | Same stack, dark palette              |
| 16  | `16-cv-mobile-dark.png`                 | `/cv`                | dark  | Dark palette                          |
| 17  | `17-home-mobile-dark.png`               | `/`                  | dark  | Title clipped by theme-toggle overlap |

## Accessibility snapshots

Machine-readable `browser_snapshot` outputs for the three primary pages
at desktop-dark — useful for diffing DOM structure:

- `home-snapshot.yml`
- `cv-snapshot.yml`
- `personal-projects-snapshot.yml`

## Observed behaviour

### Layout and responsive behaviour

- **Desktop (lg breakpoint and above)** — Left sidebar fixed 320 px
  wide (`lg:ml-80`) with site logo ("📁 WahidyanKF"), a horizontal
  rule, and three nav links with page icons (Home, CV, Personal
  Projects). Theme toggle is a fixed circular button, top-right of the
  viewport.
- **Tablet and mobile (below lg)** — Sidebar collapses entirely. A
  fixed bottom tab bar replaces it, showing the same three nav items
  (Home / CV / Personal Projects) as icon + label buttons. Active tab
  is colour-highlighted. Theme toggle stays fixed top-right.
- **Mobile clipping** — On 375 px wide viewports the home-page H1
  "Welcome to My Portfolio" visually collides with the top-right theme
  toggle (the toggle overlays the end of the H1 text). This is an
  **existing upstream characteristic**; the port preserves it rather
  than fixing it, so baseline comparison is not a net-new finding. A
  future responsive polish plan can address it.

### Active-route highlighting in nav

Active route is underlined in both desktop sidebar and mobile bottom
tab bar, using the current text colour (yellow in dark, purple in
light).

### Home page (`/`)

- H1 "Welcome to My Portfolio" centred.
- Single search input: placeholder "Search skills, languages, or
  frameworks...". Magnifying-glass icon left, clear-x icon right
  (appears only after typing).
- About Me card: three paragraphs of biography.
- Skills & Expertise card with three subsections:
  - "Top Skills Used in The Last 5 Years" — coloured pills with star
    icon + skill name + duration badge (e.g. `(8 years 10 months)`).
  - "Top Programming Languages Used in The Last 5 Years" — pills with
    code-bracket icon + name.
  - "Top Frameworks & Libraries Used in The Last 5 Years" — pills
    with package icon + name.
- Quick Links card: two inline links with icons — "View My CV" →
  `/cv`, "Browse My Personal Projects" → `/personal-projects`.
- Connect With Me card: five icon-linked items — Github, GithubOrg,
  LinkedIn, Website, Email. Icons come from react-icons (GitHub) and
  lucide-react (Mail, Globe).

### CV page (`/cv`)

- H1 "Curriculum Vitae" centred.
- Single search input: placeholder "Search CV entries...".
- First section header "Highlights" with person icon.
- Highlights section includes an About Me card (same biography as home
  page) and the skills summary tables.
- Long content; scroll reveals further CV entries (work history,
  education, skills tables). Not fully screenshotted — scope of this
  baseline is layout not content exhaustiveness.

### Personal Projects page (`/personal-projects`)

- H1 "Personal Projects" centred.
- Single search input: placeholder "Search projects...".
- Card list: three entries visible in baseline — AyoKoding, Organic
  Lever, The Organic — each with heading, description, bulleted
  features, and external-link icons (Repository / Website / YouTube
  as applicable).

### Search behaviour (home page confirmed)

- Typing in the search input updates the URL to `/?search=<term>` via
  `router.push` (Next.js App Router client-side navigation). No full
  page reload.
- Matching text inside skill / language / framework pills is wrapped
  in a `<mark class="bg-yellow-300 text-gray-900">` element for
  highlight. Non-matching pills are hidden.
- About Me section renders the literal string "No matching content in
  the About Me section." when the biography text does not contain the
  search term. This is an app-level behaviour (not a framework default)
  and MUST be preserved in the port.
- Skills subsections still render their headings even when no pill
  matches — they become visually empty under their heading rather
  than hiding the whole section.
- Clicking a skill pill navigates to `/cv?search=<skill>&scrollTop=true`
  (home → CV cross-link behaviour, preserved from upstream).

### Theme toggle

- Single button, fixed top-right, outside the `<main>` element (on the
  outer layout so it persists across route changes).
- aria-label flips between `Switch to light theme` and
  `Switch to dark theme` — so the label always describes the
  destination state, not the current state.
- Toggle sets/removes the `light-theme` class on `<html>`.
- State persists across client-side navigation (visiting `/cv` then
  `/personal-projects` keeps the chosen theme).
- Hard reload resets to the default theme (dark); therefore the
  upstream app does NOT persist the choice in `localStorage`. The port
  can either preserve this behaviour or add a `localStorage`-backed
  preference as a stretch goal. Base plan is "preserve upstream
  behaviour verbatim"; a preference-persistence enhancement, if
  wanted, is a follow-up plan.

### Colour palette (dark theme)

- Background: `bg-gray-900` (`rgb(17, 24, 39)` Tailwind).
- Headings: `text-yellow-400`.
- Body text: `text-green-400` / `text-green-300`.
- Card borders: `border-green-400`.
- Pills: `bg-gray-800` with `text-green-400`.
- Mark/highlight: `bg-yellow-300 text-gray-900`.

### Colour palette (light theme)

- Background: white (`rgb(255, 255, 255)`).
- Headings: brown/olive tones (appears to be a custom yellow-800 /
  amber-800 equivalent).
- Body text: black.
- Links: purple underlined.
- Active-nav tab: purple with underline.

## How the port validates against this baseline

See `delivery.md` — P0, P2, P3, P4, and P7 each have explicit "compare
to baseline" checkboxes. The comparison is always:

1. Run `nx dev wahidyankf-web` locally on port 3201.
2. Open `http://localhost:3201/`, `/cv`, `/personal-projects`.
3. Use Playwright MCP (`browser_navigate` / `browser_snapshot` /
   `browser_take_screenshot`) at the same three viewports (1440 × 900,
   768 × 1024, 375 × 812) and both themes.
4. Visually compare the new shots against the 17 PNGs in this
   directory.
5. Differences that break the baseline's listed behaviour (above)
   block the phase commit. Cosmetic Tailwind-4-migration drift (e.g.
   pill border-radius rounding 2 px tighter, font-weight shift from a
   CSS-reset change) are acceptable; structural regressions (missing
   section, broken search filter, theme toggle inoperable) are NOT.

## Why the baseline lives in the plan folder

When the plan is archived to `plans/done/` after P7, these screenshots
and notes move with it. The baseline outlasts the plan as a historical
record of "what the site looked like on 2026-04-19 when it was
adopted". Future bug reports ("the home page looked different back in
April") can diff against this record. If the plan folder were deleted
on archival, the record would be lost.
