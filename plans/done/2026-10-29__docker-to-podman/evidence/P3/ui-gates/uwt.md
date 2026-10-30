# UWT - Spec-Blind Usability Pass (web, second pass of EWT -> UWT -> DWT)

Status: CLOSED (complete with totals; see the end of this record)

- Surface: `web`, http://127.0.0.1:3101 (learning website, `/en` and `/id`)
- Mode: in-flight variant; findings recorded as evidence, no plan produced.
- Spec-blind statement: the tester read only its own agent definition, the declared skills, the governance documents they link,
  and this record. Nothing under `specs/`, `apps/`, `libs/`, `plans/` (apart from this file and its captures) was read or
  listed, and no `git log`/`git diff` was run. The lens is therefore spec-blind (not spec-aware).
- Severity mapping: the skill's Nielsen 0-4 scale is mapped onto criticality as 4 = CRITICAL, 3 = HIGH, 2 = MEDIUM,
  1 = LOW, 0 = not a finding. (The skill gives the Nielsen table but no explicit criticality column; this mapping is the
  tester's reading and is stated here so it can be audited.)

Findings are appended below as confirmed.

## Setup and disclosures

- Date observed: 2026-10-28. Origin: http://127.0.0.1:3101 (anonymous, read-only; only the browser's own local storage
  changed: progress, theme).
- Tool: the repo's Playwright installation, `npx playwright` 1.61.0, driven from throwaway scripts kept outside the repo.
  Browsers: Chromium 149.0.7827.55 (headless, used for every task); Firefox 151.0 and WebKit 26.5 (lesson load and
  language switch only). No MCP browser tool was used. Network control through Playwright request routing and the Chrome
  DevTools Protocol (throttling). Video and traces were not recorded because the disk is nearly full.
- Viewports: mobile 375x667 (touch), tablet 768x1024, desktop 1280x800, plus 320x568 (reflow), 1024x768 (breakpoint) and
  640x400 (a 200% zoom stand-in). Locales: `/en` and `/id`.
- Spec-blind status: spec-blind. Disclosure: while listing my capture folder I also saw the file names (never the
  contents) of captures written by another lens (names mention a failed diagram, a smallest diagram scale, a drawer, a
  sidebar). I did not open them. I had already seen the diagram failure myself (browser console, task 1) before that
  listing, and every finding below was reproduced from my own observations. Treat the lens as spec-blind with a
  file-name-level leak from a shared folder.
- Reference fetched: one WebFetch of the published usability-probes principle (008) only.
- Rating: Nielsen 0-4 severity mapped to criticality 4 = CRITICAL, 3 = HIGH, 2 = MEDIUM, 1 = LOW. Confidence is HIGH
  unless stated (every finding was reproduced at least twice).
- Content note: the learning paths carry text that calls itself an "E2E fixture". This environment may be seeded with test
  data. Findings that depend on it say so.

## Findings

### UWT-001 - A diagram that does not draw is replaced silently by raw diagram code

- Criticality: HIGH (severity 3). Confidence: HIGH.
- Principle: Heuristic 1 (visibility of system status), Heuristic 9 (recognize, diagnose, recover), Heuristic 2 (no internal
  jargon).
- Area: `/en/learn/courses/concurrency-and-parallelism/learning/beginner`, Example 19 and Example 28 (always); every
  diagram (9 of 9) when the diagram script is blocked or slow.
- Persona and task: learner on T1, "read what each diagram says".
- Environment: Chromium 149, desktop 1280x800 and mobile 375x667, en, 2026-10-28. Firefox 151 and WebKit 26.5 show the
  same two failures.
- Steps: 1. Open the lesson URL. 2. Scroll to "Example 19: Condition -- wait() and notify()" (about 47,800 px down on
  desktop). 3. Scroll to "Example 28". 4. Repeat with the diagram script blocked (request abort) and with it delayed.
- Expected: either a drawn diagram or a plain sentence such as "This diagram could not be shown", with the text of what it
  meant.
- Actual: in place of the diagram a grey code box reads `%% Color Palette: Blue #0173B2, Orange #DE8F05 ...`,
  `sequenceDiagram`, `accTitle: ...`, `Cond-->>Consumer: wakes, re-acquires lock`. No message says a drawing failed. The
  console shows only a warning (`[mermaid] Failed to render diagram: Error: Parse error on line 9`). Blocked script: all 9
  diagrams stay as raw code, no message, no retry. Slow network (400 kbps, 400 ms): raw code on screen for about 19 s
  before the drawings replaced it, with no loading indicator; the first words appeared after about 4 s. The raw box is
  also a Tab stop, so keyboard users land on it.
- Evidence: `captures/uwt-t1-desktop-ex19-fail.jpeg`, `captures/uwt-t1-desktop-ex28-fail.jpeg`,
  `captures/uwt-t1-block-1280-diagram1.jpeg`, `captures/uwt-t1-block-375-diagram1.jpeg`,
  `captures/uwt-t1-slow-1280-during.jpeg`, `captures/uwt-sweep-slow3g-mobile-first-content.jpeg`.
- Reproducibility: Always (Examples 19 and 28 on every load, more than 10 loads, three engines; blocked state 3 of 3).
- Suggested clarification (hypothesis): show a visible "diagram unavailable" notice with the diagram's description as text,
  and show a loading state while drawing.

### UWT-002 - Two "Syntax error in text / mermaid version 11.15.0" graphics sit below the page footer

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 9 (plain-language messages, no raw error output), Heuristic 8 (irrelevant content), Heuristic 2.
- Area: bottom of the Beginner Examples lesson page (the page with the two failed diagrams).
- Persona and task: learner finishing the page on T1 ("continue to the end of the page").
- Environment: Chromium 149, mobile 375, tablet 768 and desktop 1280, en.
- Steps: 1. Open the lesson. 2. Press End (or scroll to the very bottom). 3. Look below the line "(c) 2026 AyoKoding".
- Expected: nothing after the footer.
- Actual: two large bomb icons with the text "Syntax error in text" and "mermaid version 11.15.0", outside the footer, at 87,348 px
  and 87,427 px on mobile (page height 87,507 px). Another course overview page with no failed diagram has none.
- Evidence: `captures/uwt-t1-mobile-page-bottom-strays.jpeg`, `captures/uwt-t1-desktop-page-bottom-strays.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): remove the temporary error output from the page.

### UWT-003 - Diagram text is 4 to 10 px on a phone and tablet, with no way to enlarge it

- Criticality: HIGH (severity 3). Confidence: HIGH.
- Principle: Heuristic 7 (flexibility and efficiency); WCAG 1.4.4 Resize Text and the responsive "readability" test; Fitts's/
  legibility for touch.
- Area: the 7 drawn diagrams of the Beginner Examples lesson.
- Persona and task: phone learner on T1, "read what each diagram says".
- Environment: Chromium 149, 375x667 touch, en. Measured effective text size = font size x scale.
- Steps: 1. Open the lesson at 375 px wide. 2. Scroll to Example 5. 3. Compare with 1280 px.
- Expected: diagram words as readable as body text, or a way to open the diagram larger.
- Actual: effective text size on 375 px: Example 1 7.4 px, Example 2 10.3, Example 5 4.2, Example 8 7.3, Example 15 9.4,
  Example 18 6.8, Example 21 8.7. On 768 px Example 5 is 6.2 px. Example 5 sits in a frame 476 px tall holding a drawing about
  36 px tall on a phone, so there is also a large empty gap. No zoom, expand, or scroll control is offered (0 buttons in the
  diagram frame). Pinch-zoom is not blocked (viewport allows it), which only partly helps.
- Evidence: `captures/uwt-t1-mobile-ex05-diagram.jpeg`, `captures/uwt-t1-desktop-ex05-diagram.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): let a diagram scroll sideways at a readable size or open full screen; size the frame
  to the drawing.

### UWT-004 - Diagram labels are cut off or hidden behind boxes

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 8 (aesthetic and minimalist design: overlap defeats the message), ISO 9241-110 self-descriptiveness.
- Area: Example 1 and Example 5 diagrams, desktop 1280.
- Persona and task: learner reading Example 1 ("concurrency" versus "parallelism") on T1.
- Steps: 1. Open the lesson. 2. Look at the first diagram at 2x zoom.
- Expected: each group shows its full label.
- Actual: the group titles are "Parallelism(simultaneous)" and "Concurrency(interleaved)" in the diagram text, but the second
  line is hidden behind the boxes: "(simultaneous)" cannot be seen and "interleaved" shows as "nterleaved" half covered by
  node B0 and A1. In Example 5 the word "total" of "Threaded: ~0.2s total" is covered by the arrow label. These words carry
  the point of the example.
- Evidence: `captures/uwt-t1-desktop-ex01-diagram-labels.jpeg`, `captures/uwt-t1-desktop-ex05-diagram.jpeg`.
- Reproducibility: Always (Chromium).
- Suggested clarification (hypothesis): give group titles room; show the two-line label.

### UWT-005 - "Skip to content" does not skip the side navigation

- Criticality: HIGH (severity 3). Confidence: HIGH.
- Principle: Heuristic 7; WCAG 2.4.1 Bypass Blocks; Predictability.
- Area: every desktop page with a left sidebar; measured on the lesson.
- Persona and task: keyboard-only learner on T1.
- Environment: Chromium 149, 1280x800, en.
- Steps: 1. Load the lesson, press Tab (focus lands on "Skip to content"). 2. Press Enter. 3. Press Tab and count stops
  until the first link inside the lesson text.
- Expected: focus moves to the lesson text.
- Actual: focus moves to the main region, which also contains the sidebar, so the next Tab goes to "Learn" in the sidebar.
  The first stop inside the article is stop 69, counting the skip link as stop 1 (6 header stops, then 62 sidebar stops).
  On a 375 px phone the first article stop is stop 7. Every page load repeats this.
- Evidence: step transcript above (Tab counts from a scripted pass); `captures/uwt-t1-desktop-lesson-top.jpeg` shows the
  sidebar in front of the text.
- Reproducibility: Always.
- Suggested clarification (hypothesis): point the skip link at the article, or add a second skip link past the sidebar.

### UWT-006 - A keyboard user meets 227 extra Tab stops reading one lesson

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 7 (efficiency for keyboard users); WCAG 2.4.3 Focus Order (cognitive cost).
- Area: Beginner Examples lesson, both viewports.
- Persona and task: keyboard-only learner on T1, "read start to finish".
- Steps: 1. Tab from the first article link to the end of the page, counting.
- Expected: moving through the reading in a manageable number of stops.
- Actual: 266 stops inside the article: 114 code boxes (each is focusable) and 113 "Copy" buttons, plus 39 links. A box
  taller than the screen takes focus and scrolls the page past the diagram. Home, End, Space and Page Down do scroll
  correctly (End reached 73,009 px; Home returned to 0), and the focus ring is visible on the code box and on Copy
  (blue ring seen), so reading without Tab is possible but not signposted.
- Evidence: `captures/uwt-t1-desktop-focus-copy-button.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): tell keyboard users about the shortcut keys, or give code boxes one stop each.

### UWT-007 - No in-page jump list and no "back to top" below 1280 px, on a page 87,507 px tall

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Responsive usability (content and function parity); Heuristic 7; Heuristic 6.
- Area: Beginner Examples lesson (28 examples), widths 375, 768, 1024.
- Persona and task: learner on T1 on a phone or tablet, "continue to the end and back to the top".
- Steps: 1. Open the lesson at 375, 768, 1024 and 1280. 2. Look for "On this page" and a "top" control.
- Expected: some way to jump to Example N, and to return to the top.
- Actual: "On this page" (28 entries) is shown only at 1280 px and above; at 375, 768 and 1024 it is absent. Page height is 87,507 px
  on a phone (about 130 screens) and 80,202 px on a tablet. No "back to top" link or button exists at any width (End/Home
  work with a hardware keyboard only).
- Evidence: `captures/uwt-sweep-768-lesson.jpeg`, `captures/uwt-t1-mobile-lesson-end.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): offer the example list in the mobile menu or an inline "jump to" control; add "Back to
  top".

### UWT-008 - Learner-facing paths contain test-fixture wording

- Criticality: HIGH (severity 3). Confidence: HIGH that it is visible; MEDIUM that it is unintended (the environment may be
  seeded with test data).
- Principle: Heuristic 2 (match with the real world), Heuristic 8; trust and credibility.
- Area: home "Choose your path" cards, `/en/learn`, `/en/learn/paths/...`, path pages, lesson path chip, and the same on `/id`.
- Persona and task: learner on T2, "find a learning path".
- Steps: 1. Open `/en`. 2. Open the first path card. 3. Read the description.
- Expected: a description of who the path is for and what it teaches.
- Actual: path text reads, verbatim, "E2E fixture: the third fixture arc - proves the careers category landing's arc chooser
  renders one arc card per arc (three total) rather than assuming exactly two."; phase heading "Phase 1 - Fixture core";
  "After this phase you can complete this fixture path"; "Fixture extension"; another path mentions "plan 02's closed
  restructure allowlist". All four home path cards and the whole `/en/learn` page carry such text. On `/id` the same
  English fixture text appears inside Indonesian pages.
- Evidence: `captures/uwt-t2-desktop-course-in-path.jpeg`, `captures/uwt-t2-mobile-path.jpeg`,
  `captures/uwt-t6-mobile-shared-link.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): learner-facing copy for every path; keep test data out of the served content.

### UWT-009 - Two different "Previous" targets on the same first lesson page

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 4 (consistency), Heuristic 6 and information scent (wayfinding); cognitive walkthrough question 3.
- Area: first lesson of a course opened from a path:
  `/en/learn/courses/computer-science-foundations/learning/overview?path=careers/fundamentally-strong/generalist-track`.
- Persona and task: learner on T2, "move to the next lesson; where am I in the path".
- Steps: 1. Start the Generalist Track, open Computer Science Foundations, press "Start course". 2. Scroll to the end of the
  page. 3. Read the two navigation blocks.
- Expected: one meaning of "Previous".
- Actual: the line in the text says "<- Previous: Technical Communication Drilling - Next: Beginner Examples ->" (the
  Previous link goes to another course, `/en/learn/courses/technical-communication/drilling/overview`, which is not in the
  path). The button row below says "<- Previous: Computer Science Foundations" (the course page). The text-line links also
  drop `?path=...` from the address (the path chip still shows from stored state), while the button links keep it.
- Evidence: step transcript; link list read from the page.
- Reproducibility: Always.
- Suggested clarification (hypothesis): use one navigation block that follows the path.

### UWT-010 - "Next: Overview" does not say which overview

- Criticality: LOW (severity 1). Confidence: HIGH.
- Principle: Heuristic 2 and information scent (weak label).
- Area: last page before the drill section, e.g. Capstone of Computer Science Foundations.
- Steps: 1. Reach the Capstone page via "Mark complete & continue". 2. Read the button.
- Actual: the button says "Mark complete & continue -> Next: Overview"; the destination is the first page of "Drilling"
  (`.../drilling/overview?path=...`). Nothing says "Drilling".
- Evidence: step transcript (T2 walk).
- Reproducibility: Always.
- Suggested clarification (hypothesis): "Next: Drilling - Overview".

### UWT-011 - "Browse the full course library" and the "Learn" labels do not lead to a course list

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 2 and information scent (Pirolli and Card); Heuristic 4 / WCAG 3.2.4 Consistent Identification.
- Area: home link "Browse the full course library ->", header "Learn", footer "Browse all", `/en/browse`.
- Persona and task: learner on T3, "find the list of all courses from the home page".
- Environment: Chromium 149, desktop and mobile, en.
- Steps: 1. Open `/en`. 2. Click "Browse the full course library ->". 3. Continue until a course list appears.
- Expected: the course list (or one step from it).
- Actual: it opens `/en/browse`: a page called "Browse" with two cards, "Learn - Explore this section." and "Rants - Explore this
  section." No course appears. The learner then clicks "Learn" (-> `/en/learn`), then "Browse all courses" (-> `/en/learn/courses`,
  "182 courses in 14 categories"): four clicks and three page loads. The header "Learn" also opens `/en/browse`, while the
  sidebar "Learn" and the home "Learn" card open `/en/learn`; breadcrumb "Learn" opens `/en/learn` on lessons but `/en/browse`
  on a course page. The same word has two destinations.
- Evidence: `captures/uwt-t3-mobile-browse-page.jpeg`, `captures/uwt-t3-mobile-courses-list.jpeg`,
  `captures/uwt-t3-desktop-courses-list.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): send that link to the course list, or label it for what it opens.

### UWT-012 - On desktop the side navigation hides the lesson list after "Start course"

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 4 (internal consistency), Heuristic 6, Heuristic 1 (where am I).
- Area: left sidebar on `/en/learn/courses/concurrency-and-parallelism/learning/overview`, desktop 1280.
- Persona and task: learner on T3, "move through its lessons using the side navigation".
- Steps: 1. Open `/en/learn/courses/concurrency-and-parallelism`. 2. Click "Start course" (in-app navigation). 3. Read the
  sidebar. 4. Press reload and read it again.
- Expected: the sidebar shows the lessons and the current one.
- Actual: after in-app navigation the "Learning" group is closed ("Learning >" with no child lines), so Overview, Beginner,
  Intermediate, Advanced and Capstone are not listed and the current page is not marked. After reload the same page shows
  the group open with "Beginner Examples" highlighted. A learner has to find the small arrow to open the group. (On mobile the
  drawer opened with the group open, so desktop is the odd one out.)
- Evidence: `captures/uwt-t3-desktop-after-start-course.jpeg`, `captures/uwt-t3-desktop-sidebar-overview.jpeg` (after reload).
- Reproducibility: Always (4 of 4).
- Suggested clarification (hypothesis): open the group that holds the current page on every navigation.

### UWT-013 - The phone menu opens on the wrong part of the tree and does not mark the current lesson

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 1 (status), Heuristic 6 (recognition), responsive "predictable transformation".
- Area: mobile menu ("Open navigation menu") on a lesson page, 375x667.
- Persona and task: phone learner on T3, "move through its lessons using the menu".
- Steps: 1. Open the Beginner Examples lesson. 2. Tap the menu button. 3. Look for the current lesson.
- Expected: the current lesson visible and marked.
- Actual: the menu opens at the top (Drawer width, Menu, Learn, Tools, About, then the whole course tree). "Beginner
  Examples" is 978 px down while the screen is 667 px tall, so it is off screen; no current-page marker (`aria-current`) was
  found. The drawer is 280 px wide, so names are cut ("Data Structures & Algorithms", "Object-Oriented Programming"); a
  "Drawer width: Default / Wide" switch is the workaround, and it is a good one. Esc closes the menu and returns focus to the
  menu button; Tab stays inside it (140 of 140 stops). Tapping a lesson in the menu closes it and opens the lesson at the top.
- Evidence: `captures/uwt-t3-mobile-menu-on-lesson.jpeg`, `captures/uwt-t3-mobile-menu-open.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): scroll the menu to the current lesson and mark it.

### UWT-014 - The language switch leads to "Not Found" from almost every content page, in both directions

- Criticality: CRITICAL (severity 4). Confidence: HIGH.
- Principle: Heuristic 3 (user control), Heuristic 5 (error prevention), Heuristic 4 / ISO 9241-110 conformity with
  expectations; WCAG 3.2.2 On Input (a change of language should not cause a dead end).
- Area: header language menu ("English" / "Bahasa Indonesia"), all pages.
- Persona and task: learner on T4, "open any page, switch to Indonesian, continue the same material, come back".
- Environment: Chromium 149 desktop, mobile and tablet; Firefox 151 and WebKit 26.5 (lesson only); en and id.
- Steps: 1. Open `/en/learn/courses/concurrency-and-parallelism/learning/beginner`. 2. Open the language menu and choose
  "Bahasa Indonesia". 3. Read the result. 4. Choose "English".
- Expected: the same material in Indonesian, or a clear note that no translation exists, with a way to stay.
- Actual: the address becomes `/id/learn/courses/concurrency-and-parallelism/learning/beginner`; the tab title is "Not Found |
  AyoKoding" and the page says "Page Not Found". The switch only swaps `/en` for `/id`, so it fails for: lessons, `/en/learn`,
  `/en/learn/courses`, `/en/rants`, `/en/learn/paths` (a working page with a "Not Found" tab title, see UWT-017). It works for
  `/en` (-> `/id`, Indonesian headline "Belajar membangun perangkat lunak...") and `/en/tools`; from Indonesian it works for
  `/id/browse`, `/id/tools/...` and `/id/learn/paths/...` pages. From Indonesian pages the same swap breaks too: `/id/belajar/perkenalan` -> `/en/belajar/perkenalan` "Not Found",
  likewise `/id/belajar` and `/id/celoteh`. The Indonesian section names differ (`/id/belajar`, `/id/celoteh`) from the English
  ones (`/en/learn`, `/en/rants`). Switching back to English from the dead end returns to the English page, so the learner
  can recover, but the menu gave no warning. The home page promises an "open, bilingual learning hub".
- Evidence: `captures/uwt-t4-desktop-id-not-found.jpeg`; transcript of 8 English start pages and 7 Indonesian start pages.
- Reproducibility: Always (every start page tested, 3 viewports).
- Suggested clarification (hypothesis): map each page to its counterpart; where none exists, say so and stay put.

### UWT-015 - Indonesian paths lead to course pages that do not exist

- Criticality: HIGH (severity 3). Confidence: HIGH.
- Principle: Heuristic 9 (recover from errors), Heuristic 5, Heuristic 4; cognitive walkthrough question 4 (progress).
- Area: `/id` home path cards, `/id/learn/paths/...`, course links such as
  `/id/learn/courses/computer-science-foundations?path=careers/fundamentally-strong/generalist-track`.
- Persona and task: Indonesian learner on T5, "find a course or path, open a lesson".
- Environment: Chromium 149, desktop and mobile, id.
- Steps: 1. Open `/id`. 2. Tap "Mulai" on the first path card. 3. Tap "Mulai: Computer Science Foundations".
- Expected: the course page.
- Actual: the path page opens, then the course link opens "Page Not Found" (HTTP 404). The path side panel still shows "KURSUS 1
  DARI 3" next to the error. Course addresses under `/id/learn/courses/` returned 404 for every one checked
  (`computer-science-foundations` and `concurrency-and-parallelism` by direct request; `data-structures-and-algorithms-essentials`,
  `software-testing` and `software-engineering-practices` through the page's background fetches). T5 was completed another way (see the
  task outcome): `Belajar` -> `Ikhtisar` -> `Perkenalan`, which are lessons in Indonesian but not a "course or path".
- Evidence: `captures/uwt-t5-desktop-id-path-course-dead-end.jpeg`, `captures/uwt-t5-mobile-id-path-course-dead-end.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): do not offer the Indonesian path as startable until its courses exist; or link to the
  English course with a note.

### UWT-016 - The Indonesian "Not Found" page is in English and "Go Home" sends the learner to the English site

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 9 (plain-language, in the user's language), Heuristic 3, WCAG 3.1.1 / 3.1.2 (language of the page and of
  parts).
- Area: any `/id/...` missing page, for example `/id/learn`, `/id/learn/courses/...`, `/id/rants`.
- Persona and task: Indonesian learner on T4 and T5.
- Steps: 1. Open `/id/learn`. 2. Read the page. 3. Press "Go Home".
- Actual: the header, menu and footer are Indonesian ("Belajar", "Alat", "Cari...", "Jelajahi semua"), but the body reads "Page Not
  Found / The page you are looking for does not exist or has been moved." and the button "Go Home" opens `/en`, so the learner
  loses the language they chose. The message gives no list of what exists and no link to the nearest working
  section (the header menu and footer do work).
- Evidence: `captures/uwt-t4-desktop-id-not-found.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): translate the message and send "Go Home" to `/id`.

### UWT-017 - The Indonesian site mixes English into its pages and one page has the wrong tab title

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: WCAG 3.1.2 Language of Parts, Heuristic 4 (consistency), Heuristic 1 (tab title says "Not Found" on a working page).
- Area: `/id` home path cards; `/id/learn/paths`; `/id/learn/paths/careers/.../generalist-track`; `/id/belajar/...`.
- Persona and task: Indonesian learner on T5.
- Actual: on `/id` the path cards read "Generalist Track (Fundamentally-Strong)", "~3 COURSES" (English). `/id/learn/paths` (HTTP 200,
  a working page) has the tab title "Not Found | AyoKoding", the heading "Paths" and the text "Choose your path." in English,
  next to Indonesian counts ("1 fase inti"). The path page says "Setelah fase ini Anda bisa complete this fixture path"
  (half Indonesian). The home page addresses the reader as "Anda" while the lesson `/id/belajar/perkenalan` uses "kamu".
  "Konten Video" card text is "Jelajahi bagian ini." (generic).
- Evidence: `captures/uwt-t4-desktop-id-paths-title-mismatch.jpeg`, `captures/uwt-t5-desktop-id-belajar.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): translate or hide the English fragments; fix the page title.

### UWT-018 - A shared `?path=` link on the Learn page is accepted but changes nothing

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 1 (visibility of status), Predictability / conformity with expectations; cognitive walkthrough question 4.
- Area: `http://127.0.0.1:3101/en/learn?path=skills%2Fe2e-fixture-alpha`.
- Persona and task: learner on T6, arriving from someone else's link.
- Environment: Chromium 149, desktop 1280 and mobile 375, en.
- Steps: 1. Open the link. 2. Read the page. 3. Compare with `/en/learn`.
- Expected: either the shared path is shown or marked, or a short note says the parameter was not used.
- Actual: the page is the ordinary "Learn" page. The visible text is identical to `/en/learn` (3,137 characters both ways on
  desktop, 3,071 on mobile); nothing is highlighted, selected, or scrolled; no note. "E2E Fixture Alpha Skills Path" is a card
  1,375 px down on desktop and 2,351 px down on mobile among 8 path cards. The page does make sense on its own (no error, no
  console error) and the course list is reachable ("Browse all courses ... 182 courses in 14 categories", see UWT-019).
- Evidence: `captures/uwt-t6-desktop-shared-link.jpeg`, `captures/uwt-t6-mobile-shared-link.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): scroll to and mark the named path, or drop the parameter from the address.

### UWT-019 - The Learn page tells the reader to "browse all courses" in plain text; the real link is at the bottom

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 6, affordance (links look like links), information scent.
- Area: `/en/learn` hero card "Start learning - Pick a path below, or browse all courses."
- Persona and task: learner on T6 and T3, "find your way to the course list".
- Steps: 1. Open `/en/learn` at 375 px. 2. Try to tap "browse all courses".
- Actual: the words are a paragraph, not a link (only the button "Choose a path" is). The link "Browse all courses - 182 courses in 14
  categories ->" is 2,939 px down on a 3,611 px page on mobile (1,939 of 2,403 on desktop), below all path cards.
- Evidence: `captures/uwt-t6-mobile-shared-link.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): turn the words into a link, or place the real link in the hero card.

### UWT-020 - Search shows a blank panel for real words that appear in lessons

- Criticality: HIGH (severity 3). Confidence: HIGH.
- Principle: Heuristic 1 (status), Heuristic 9 (clear message), WCAG 4.1.3 Status Messages.
- Area: search dialog (button "Search... Ctrl/Cmd+K"), every page.
- Persona and task: learner looking for a topic (support for T1 to T3).
- Environment: Chromium 149, desktop, en.
- Steps: 1. Press Ctrl+K on `/en`. 2. Type "lock" (also "mutex", "race condition"). 3. Wait 8 s. 4. Type "asyncio". 5. Type
  "zzqqxx".
- Expected: results, or "No results found".
- Actual: "lock", "mutex" and "race condition" leave an empty panel (only the input and the Close button): no results, no "No
  results" text, no loading text, even after 8 s. The same words do return results from the site's search request (10 results
  for "lock" when the request is made directly), so the panel hides them. "asyncio" lists results and "zzqqxx" shows "No results
  found". Reproduced with typing and with paste/fill. Also, the dialog is announced as "Command Palette - Search for a command
  to run...", a name that does not fit a content search.
- Evidence: `captures/uwt-sweep-desktop-search-blank-lock.jpeg`.
- Reproducibility: Always (4 of 4 runs for "lock").
- Suggested clarification (hypothesis): show every returned result, and show a message when the list is empty.

### UWT-021 - After following an example link on a course overview, the Back button needs two presses and the address loses its anchor

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Heuristic 3 (user control), Heuristic 4; URL naturalness (no redirect cruft).
- Area: `/en/learn/courses/computer-science-foundations/learning/overview`, the list "Examples by level".
- Persona and task: learner on T3, moving through lessons.
- Steps: 1. Open the overview. 2. Click "Example 3: -42 in 8-Bit Two's Complement" (link address
  `/en/c/learn/courses/computer-science-foundations/learning/beginner#example-3--42-in-8-bit-twos-complement`). 3. Press Back. 4. Press Back
  again.
- Actual: the page scrolls to Example 3 correctly, but the address bar reads `.../learning/beginner` with no `#example-3...`
  (so a refresh or a shared copy opens the top of the page). The first Back keeps the reader on "Beginner Examples" (address
  `/en/c/...#example-3...`); only the second Back returns to the overview. The links use an extra `/en/c/` address that redirects
  (HTTP 308). A direct load of the same `/en/c/...#...` address works and keeps the anchor.
- Evidence: `captures/uwt-sweep-desktop-overview-example-links.jpeg`.
- Reproducibility: Always (2 of 2 runs).
- Suggested clarification (hypothesis): link to the final address.

### UWT-022 - Tab titles do not say which course or page

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: WCAG 2.4.2 Page Titled, Heuristic 1, Heuristic 6 (recognition across tabs and history).
- Area: all pages.
- Actual: every course's lesson pages are titled "Overview | AyoKoding", "Beginner Examples | AyoKoding", "Intermediate Examples |
  AyoKoding" and so on, with no course name (three different courses all gave "Overview | AyoKoding"). The home page and the
  Tools page are both titled just "AyoKoding".
- Evidence: titles read in every transcript above.
- Reproducibility: Always.
- Suggested clarification (hypothesis): "Beginner Examples - Concurrency & Parallelism | AyoKoding".

### UWT-023 - The resize handle on the desktop side navigation is mouse-only and unlabelled; long names are cut

- Criticality: MEDIUM (severity 2). Confidence: HIGH.
- Principle: Probe A (hidden control), Heuristic 7, WCAG 2.1.1 Keyboard.
- Area: desktop sidebar, 1280 and 768.
- Actual: a 4 px dark bar at the right edge of the sidebar is a drag handle (pointer shows a column resize), has no label and
  no keyboard stop. Course names in the sidebar are cut ("Actor-Model Concurrenc", "Data Structures & Algo", "Concurrency &
  Paralleli"); the full name appears only as a hover title. The phone menu offers an explicit "Drawer width" switch, the
  desktop has only the hidden handle.
- Evidence: `captures/uwt-t1-desktop-lesson-top.jpeg`, `captures/uwt-sweep-768-lesson.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): add a visible, keyboard-operable width control.

### UWT-024 - Unexplained internal codes and labels (jargon probe)

- Criticality: MEDIUM (severity 2). Confidence: MEDIUM (may be understood by the intended audience).
- Principle: Heuristic 2 (match with the real world); Probe B.
- Area: lessons and course pages.
- Actual: under every example heading: "ex-01 - exercises co-01" (28 times on one page), and code comments such as "(co-03)", "(co-27)",
  with no key. Course types "CONCEPT WALKTHROUGH" and "CODE BY EXAMPLE" and a tag "OUTLINE" are not explained. "Drilling" and
  "Capstone" are used as section names; only the first line of the Drilling page explains it ("active-recall companion").
  "Legacy" in the sidebar has no gloss. The search dialog is called "Command Palette" (UWT-020).
- Evidence: `captures/uwt-t1-desktop-lesson-top.jpeg`, `captures/uwt-t2-desktop-course-in-path.jpeg`.
- Reproducibility: Always.
- Suggested clarification (hypothesis): add a one-line gloss or hide internal codes.

### UWT-025 - The same course has two different names

- Criticality: LOW (severity 1). Confidence: HIGH.
- Principle: Heuristic 4 / WCAG 3.2.4 Consistent Identification.
- Actual: lesson breadcrumbs read "Concurrency and parallelism" and "Computer science foundations" (sentence case, from the
  address) while the page chip, the course page, and the sidebar read "Concurrency & Parallelism" and "Computer Science
  Foundations".
- Evidence: `captures/uwt-t1-desktop-lesson-top.jpeg`.
- Reproducibility: Always.

### UWT-026 - Several standalone links are 20 px tall on a phone

- Criticality: LOW (severity 1). Confidence: HIGH.
- Principle: Fitts's Law; WCAG 2.5.8 Target Size (Minimum), 44 px preferred for touch.
- Actual: at 375 px: home links "Compare all paths ->" (130x20), "Explore skills paths ->" (137x20), "Browse the full course library ->"
  (195x20); breadcrumb links 20 px high ("Home" 36x20); footer "MIT" 22x17. 123 of 161 controls on the long lesson page are under
  44 px in one direction.
- Evidence: measurements (scripted pass); `captures/uwt-t2-mobile-home.jpeg`.
- Reproducibility: Always.

### UWT-027 - Some control names do not match what is shown or are repeated

- Criticality: LOW (severity 1). Confidence: HIGH. (The full accessibility audit belongs to the manual release check.)
- Principle: WCAG 2.5.3 Label in Name; WCAG 4.1.2 Name, Role, Value; Heuristic 4.
- Actual: the language button shows "English" but its name is "Switch language"; the sidebar arrows are all named "Expand
  section" or "Collapse section"; the phone menu panel is named "AyoKoding"; the current page link has no `aria-current`.
- Evidence: control list read from the header.
- Reproducibility: Always.

### UWT-028 - One lesson page scrolls sideways at 320 px

- Criticality: LOW (severity 1). Confidence: MEDIUM (cause not isolated).
- Principle: WCAG 1.4.10 Reflow.
- Actual: `/en/learn/courses/computer-science-foundations/learning/overview` at 320x568 has page width 338 px (scroll width 338 versus 320). The
  other 13 pages tested had none; at 200% zoom stand-in (640x400) none had.
- Evidence: `captures/uwt-sweep-320-overview-overflow.jpeg`.
- Reproducibility: Always.

### UWT-029 - Diagrams have no visible caption and their spoken description only lists boxes

- Criticality: LOW (severity 1). Confidence: MEDIUM.
- Principle: Heuristic 2 / WCAG 1.1.1 Non-text Content (comprehension side); Heuristic 1 (nothing says what to look for).
- Actual: the drawing has an assistive-technology title and description ("Flowchart with 6 nodes and 3 connections. Nodes: A0, B0, A1,
  B1, ... Connections: A0 to B0, B0 to A1, A1 to B1."), but no visible caption, and the description names parts, not the
  lesson ("two coroutines interleave; two processes overlap"). A learner who cannot see it, or cannot read it (UWT-001,
  UWT-003), gets only the structure.
- Evidence: `captures/uwt-t1-desktop-ex01.jpeg`.
- Reproducibility: Always.

### UWT-030 - Repeated navigation blocks (redundancy probe)

- Criticality: LOW (severity 1). Confidence: HIGH.
- Principle: Heuristic 8 and Hick's Law; Probe C.
- Actual: the end of each lesson shows "<- Previous: Overview - Next: Intermediate Examples ->" and, a few lines lower, the button
  row "<- Previous: Overview / Mark as complete / Mark complete & continue -> Next: Intermediate Examples" (see also UWT-009 where they
  disagree). The course page repeats its contents in the body and in the sidebar. The phone menu shows "Learn" twice (top
  menu and tree root). The overview page's "Examples by level" list repeats "On this page".
- Evidence: `captures/uwt-t1-desktop-lesson-end.jpeg`, `captures/uwt-t3-mobile-menu-open.jpeg`.
- Reproducibility: Always.

## Per-task outcomes (steps, verdicts, what went well)

Cognitive-walkthrough questions: Q1 try the right result, Q2 notice the action, Q3 associate action with result, Q4 see
progress. "Pass" below means the learner reached the goal; friction is listed with its finding.

### T1 - Read the concurrency lesson start to finish with the keyboard, then with diagrams blocked or slow

Outcome: reached the end and the top on both viewports (partly met: diagrams are not readable on a phone, two do not draw, and
the keyboard path is long).

- Desktop 1280 steps: 1. Open the URL (loads in about 0.8 s; page 129,524 characters; 112 code boxes; 9 diagrams). 2. Tab: the
  first stop is "Skip to content" (visible 2 px outline). Enter moves to the main region but the next stop is the sidebar
  (UWT-005). 3. 69 stops later focus reaches the first lesson link; 266 stops inside the article (UWT-006); the focus ring
  is visible on code boxes and "Copy". 4. Diagrams are not focusable; they are reached by scrolling (Space, Page Down, 700 px
  per press). 7 of 9 draw (UWT-003/-004), 2 show raw code (UWT-001). 5. End goes to 73,009 px; the end of the page has "<-
  Previous: Overview - Next: Intermediate Examples ->", "Mark as complete" and "Mark complete & continue -> Next: Intermediate
  Examples" (clear). Below the footer: two error graphics (UWT-002). 6. Home returns to the top; Space and Page Down scroll
  again.
- Mobile 375 steps: same page; the first article stop is stop 7; 262 stops in the article; diagram text 4 to 10 px (UWT-003); no
  jump list or top control (UWT-007); End reaches the footer.
- Blocked or slow diagram script: blocked, all 9 stay raw code, no notice (UWT-001); delayed, raw code first, then drawings
  once the scripts arrive (the three scripts load one after another: 2 s each gave drawings at about 7 s, 3.5 s each at about
  15 s, 5 s each at about 30 s; throttled 400 kbps: about 23 s). The text stays readable and nothing blocks it. Walkthrough: Q3
  and Q4 fail for the raw code box.
- Went well: skip link exists and is visible; focus rings are visible; End/Home work; the end-of-lesson block is clear;
  text is readable while diagrams load; deep link `#example-19-...` lands the heading 80 px below the top and does not move
  when diagrams draw (checked at 300 ms, 1.5 s, 4 s, 8 s on both viewports).

### T2 - Find a learning path from home, open a course, go to the next lesson, say where I am and how to continue

Outcome: met on desktop and mobile (with friction UWT-008, UWT-009, UWT-010).

- Steps (desktop): 1. `/en`: "Choose your path" shows four cards each with "Start". 2. "Start" on "Generalist Track" opens the path
  page (progress "0 of 2 core courses done", "Start: Computer Science Foundations"). 3. That link opens the course page with
  the sidebar "COURSE 1 OF 3 / PHASE 1 / 1 Computer Science Foundations, 2 Software Engineering Practices / OPTIONAL
  EXTENSIONS / 3 Capstone", plus "View full path" and "Browse all courses". 4. "Start course" opens the first lesson with
  the chip "Generalist Track > Phase 1 - Fixture core > Course 1 of 3, Page 1 of 6, 0 of 6 pages done". 5. "Mark complete &
  continue" moves through Beginner, Intermediate, Advanced, Capstone, Drilling; the counter rises ("1 of 6 pages done" ...). 6. The last page says "Mark complete & continue -> Next course: Software Engineering Practices", which opens course 2 of 3
  with the sidebar moved to course 2. The last course offers "Next: Capstone - Secure Service" (the optional extension).
- Steps (mobile): the path card, path page, and course page work; the course page shows "on path - course 1 of 3 - View path";
  the lesson shows the same chip as a three-line block.
- Walkthrough: Q1 yes; Q2 yes (blue primary button); Q3 yes ("Mark complete & continue -> Next: ..."); Q4 yes (counters).
- Went well: the position in the path is shown in the sidebar (desktop), in "on path - course 1 of 3" (mobile), and in the
  lesson chip; "Mark as complete" toggles to "Completed" and survives reload and back/forward; the next course is named at the
  end of the course.

### T3 - From home find the list of all courses, open one, move through lessons with the side navigation (menu on mobile)

Outcome: met on desktop and mobile, with detours (UWT-011, UWT-012, UWT-013, UWT-021).

- Steps: 1. `/en` -> "Browse the full course library ->" -> `/en/browse` (two cards, no course) -> "Learn" -> `/en/learn` -> "Browse all
  courses" -> `/en/learn/courses` ("182 courses in 14 categories", category chips, one card per course with time and "In 0
  paths"). 2. Open "Concurrency & Parallelism" (course page: "Start course", prerequisites, contents). 3. Desktop sidebar: after
  "Start course" the lesson group is closed (UWT-012); after reload the lessons show. 4. Mobile: open "Open navigation
  menu": a panel with Drawer width, the course tree; the current lesson is below the first screen (UWT-013); tapping
  "Intermediate Examples" closes the menu and opens the lesson at the top; Esc closes it and keeps focus on the button.
- Went well: the course list has category chips with counts and each card shows its duration and path count; the mobile menu traps focus, closes
  with Esc and offers a width switch; the sidebar tree reflects the whole catalogue.

### T4 - In English open any page, switch to Indonesian, continue the same material, return to English

Outcome: not met for lessons and most pages (UWT-014, UWT-016); met only for home and tools.

- Steps: 1. Lesson page -> language menu ("English", "Bahasa Indonesia") -> "Bahasa Indonesia" -> "Page Not Found" (Indonesian header,
  English body). 2. Language menu -> "English" returns to the same English lesson. 3. Home: switch gives the Indonesian home;
  back to English works. 4. Same result on desktop, tablet and mobile; same in Firefox and WebKit.
- Went well: the menu is easy to find (a globe icon with the current language name); after the failure the language menu is
  still available and returns the learner; the home and tool pages translate and keep the page.

### T5 - On /id find a course or path, open a lesson, finish reading its first page

Outcome: met only through "Belajar" (not through paths) (UWT-015, UWT-016, UWT-017).

- Steps: 1. `/id`: Indonesian headline and four path cards (English titles). 2. "Mulai" -> path page -> "Mulai: Computer Science
  Foundations" -> "Page Not Found" (UWT-015); "Go Home" -> `/en`. 3. Alternative: home "Belajar" card -> `/id/belajar` (list:
  Ikhtisar, Manusia, Perkenalan) -> "Ikhtisar" (short text, "Terakhir diperbarui 12 Desember 2025", "Selanjutnya: Perkenalan") ->
  "Perkenalan" (about 4,200 px on mobile, ends "Sebelumnya / Selanjutnya"). I read to the end on mobile (End key and the closing
  links); on desktop I read the page text through a page dump, not by scrolling.
- Went well: the Indonesian text reads naturally; `html lang` is `id`; previous/next links work; the section menu
  (Belajar, Celoteh, Konten Video) is understandable.

### T6 - Arrive from a shared `?path=` link, confirm the page makes sense, find the course list

Outcome: met (UWT-018, UWT-019).

- Steps: 1. Open `/en/learn?path=skills%2Fe2e-fixture-alpha` -> the ordinary Learn page (no error). 2. Scroll to find the link "Browse all
  courses" (plain-text version in the hero is not a link). 3. It opens `/en/learn/courses`. Also reachable from the sidebar
  "Courses" (desktop) and the menu (mobile).
- Went well: the page loads cleanly, has the full site header, and the course list is two clicks away.

## Probe results

| Probe                                  | Run?                                                  | Result                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Conditional / hidden controls       | Run                                                   | Enumerated: closed sidebar group (UWT-012), desktop resize handle (UWT-023), "Drawer width" in the phone menu (found; good), mobile breadcrumb "..." (labelled "More breadcrumb items"), collapsed optional extensions on the path page, "Mark as complete" toggle, calculator "School type: add school-age children to choose" (hint present; good).                            |
| B. Jargon scan                         | Run                                                   | UWT-024 (co-codes, course types, Drilling, Capstone, Legacy, Command Palette). Calculator terms (OOP) are glossed.                                                                                                                                                                                                                                                               |
| C. Cross-view redundancy               | Run                                                   | UWT-030.                                                                                                                                                                                                                                                                                                                                                                         |
| D. Unit / currency                     | Run on the calculator (Savings and Minimum role tabs) | Pass: "Currency: USD", "Annual gross: 0 USD" and a Target currency / Display currency selector sit beside the amount fields. No value was entered, so conversion consistency was not exercised.                                                                                                                                                                                  |
| Empty / zero-result state              | Run                                                   | Search with no hits shows "No results found" (good); search with hits hidden shows a blank panel (UWT-020). A first visit shows "Not started / 0 of N pages done". Returning-visitor progress persisted across reload.                                                                                                                                                           |
| Error state                            | Run                                                   | 404 pages checked in `/en` (clear message, "Go Home" works) and `/id` (UWT-016). Offline: in-app navigation to a page the browser had already prefetched worked; an unprefetched page offline was not tested.                                                                                                                                                                    |
| Loading / slow network                 | Run                                                   | UWT-001 (diagram script blocked or delayed; throttled 400 kbps / 400 ms: first text about 4 s, drawings about 23 s, blank white screen before first text, no progress indicator).                                                                                                                                                                                                |
| Keyboard-only                          | Run                                                   | UWT-005, UWT-006; drawer (focus trap, Esc) pass; search dialog opens with Ctrl+K and closes with Esc (pass). Language menu and theme menu were opened with the pointer; their keyboard use was not tested.                                                                                                                                                                       |
| Zoom / text size 200%                  | Partly run                                            | Viewport 640x400 (a 200% stand-in) and 320x568 over 14 pages: no sideways scroll except UWT-028. Browser text-only enlargement was not run.                                                                                                                                                                                                                                      |
| Reduced motion                         | Partly run                                            | Emulated `prefers-reduced-motion: reduce`: 0 running animations after load on the lesson page. Animations on menus and the drawer were not inspected.                                                                                                                                                                                                                            |
| Dark theme                             | Run                                                   | A theme menu exists (Light, Dark, System); dark persists after reload; text stays readable; diagrams keep pale backgrounds (still readable). Contrast was not measured.                                                                                                                                                                                                          |
| Focus visibility                       | Run                                                   | Skip link 2 px outline; links and code boxes have the browser's 1 px ring; buttons have a blue ring (seen on "Copy"). No element in the 371-stop pass had neither outline nor ring.                                                                                                                                                                                              |
| Back / forward                         | Run                                                   | UWT-021 (two presses); lesson-to-lesson back/forward and progress state fine.                                                                                                                                                                                                                                                                                                    |
| Deep links                             | Run                                                   | `#example-...` anchors land correctly and stay put; `?path=` links resolve; `/` redirects to `/en`; unknown pages 404 (en) / 404 in English (id).                                                                                                                                                                                                                                |
| Refresh                                | Run                                                   | Progress ("Completed", counters), theme, and path context persist; one reload that waited for network idle timed out once; not user-visible, cause not isolated.                                                                                                                                                                                                                 |
| URL naturalness                        | Run                                                   | Lowercase kebab-case, locale prefix, parents work (`/en/learn/courses/<course>/learning`, `/en/learn/paths/careers`), trailing slash redirects, uppercase 404. Issues: Indonesian section names differ from English (UWT-014); `/en/c/` redirecting links (UWT-021); `/id/learn`, `/id/learn/courses`, `/id/rants` 404; `?path=careers/...` appears both unencoded and as `%2F`. |
| Responsive (375, 768, 1024, 1280, 320) | Run                                                   | UWT-003, UWT-007, UWT-013, UWT-023, UWT-026, UWT-028. The mobile menu, path chip and breadcrumb collapse ("Home > ... > page") are predictable.                                                                                                                                                                                                                                  |
| Cross-browser                          | Partly run                                            | Firefox 151 and WebKit 26.5 for the lesson load and language switch only (same results; WebKit draws the diagrams after about 8 s).                                                                                                                                                                                                                                              |

## Coverage matrices

Legend: R = run and judged, P = partly, N = not run, n/a = not applicable.

| Task                             | Locale         | Mobile 375                           | Tablet 768                        | Desktop 1280                          |
| -------------------------------- | -------------- | ------------------------------------ | --------------------------------- | ------------------------------------- |
| T1 keyboard read                 | en             | R                                    | P (layout and diagram scale only) | R                                     |
| T1 blocked/slow diagrams         | en             | R                                    | N                                 | R (Chromium); P (Firefox/WebKit load) |
| T2 path to next lesson           | en             | R                                    | N                                 | R                                     |
| T2 path                          | id             | R (dead end)                         | N                                 | R (dead end)                          |
| T3 course list and navigation    | en             | R                                    | N                                 | R                                     |
| T3                               | id             | P (`/id/browse`, `/id/belajar` only) | N                                 | P                                     |
| T4 language switch and return    | en -> id -> en | R                                    | R                                 | R                                     |
| T4                               | id -> en       | N                                    | N                                 | R                                     |
| T5 Indonesian course/path/lesson | id             | R                                    | N                                 | R                                     |
| T6 shared link                   | en             | R                                    | N                                 | R                                     |

| Surface or state                                          | en                               | id                                     |
| --------------------------------------------------------- | -------------------------------- | -------------------------------------- |
| Home                                                      | R                                | R                                      |
| Learn, paths, path page, course list, course page, lesson | R                                | P (home, path page, dead end, Belajar) |
| Tools (calculator R, AI benchmark N)                      | P                                | P (switch only)                        |
| About, Terms, Rants                                       | N (links and 404 behaviour only) | N                                      |
| Search                                                    | R                                | N                                      |
| Light / dark                                              | R / R (lesson)                   | N                                      |
| 404                                                       | R                                | R                                      |

## Completeness critic

Categories enumerated and covered: pages of the learning journey (home, Learn, paths, path, course list, course, lesson, 404);
viewport classes (320, 375, 768, 1024, 1280, 640x400 stand-in); locales (en, id); control types (links, buttons, menus, drawer,
dialog, disclosure, toggle, select, number input, code box, diagram); states (empty, error, loading, slow, blocked, offline
for a prefetched page, returning visitor, dark theme); the four probes.

Open gaps (never covered, so not passes):

1. Tablet 768 for tasks T2, T3, T5, T6, and the id locale for T3 beyond `/id/browse` and `/id/belajar`.
2. Pages never opened: Rants (`/en/rants`, `/id/celoteh`), the video section (`/id/konten-video`), About, Terms, AI Model Benchmark tool.
   Skills paths pages (`/en/learn/paths/skills/...`) and the courses of other categories were opened only for links and status.
3. Other lessons: only Beginner Examples (concurrency) was read through; Intermediate and Advanced lessons, Capstone and
   Drilling pages were not read in full or checked for further diagram failures.
4. Keyboard operation of the language and theme menus; screen-reader behaviour; browser text-only 200% enlargement; high
   contrast / forced colours; colour contrast measurement; reduced-motion on menu animations.
5. Offline navigation to a page that was not prefetched; a cookie/consent prompt (none was seen, and third-party analytics
   requests are made by the page; this is a privacy question outside this pass).
6. Firefox and WebKit for any task beyond the lesson load and language switch; real phone hardware and touch gestures
   (pinch zoom was judged from the viewport setting, not exercised).
7. Probe D conversion behaviour (no values entered); the Cost-of-living table's wide-table behaviour on a phone.
8. First-visit versus returning experience beyond progress persistence (for example, "continue where I left off" entry
   points on the home page were not looked for).

## Spec-blind scenario proposals

Each is a proposal from usability principles. This lens did not read specifications; a spec-aware reviewer must confirm none
is already covered before adding it.

### USS-001 (pairs with UWT-014; Heuristic 3, 5)

```gherkin
Scenario: Switching language keeps the learner on the same material
  Given a learner is reading a lesson in English
  When the learner chooses Bahasa Indonesia in the language menu
  Then the learner sees the Indonesian version of that lesson
  When no Indonesian version of that page exists
  Then the learner stays on the English page
  And a message says the page is not available in Indonesian
```

### USS-002 (pairs with UWT-001, UWT-002; Heuristic 1, 9)

```gherkin
Scenario: A diagram that cannot be drawn is explained
  Given a lesson contains a diagram
  When the diagram cannot be drawn
  Then the learner sees a short notice that the diagram is unavailable
  And the notice shows the diagram's text description
  And no raw diagram code or error graphic is shown
```

### USS-003 (pairs with UWT-020; Heuristic 1, 9)

```gherkin
Scenario Outline: Search always answers
  Given a learner opens search
  When the learner types "<query>"
  Then the learner sees either a list of results or the message "No results found"

  Examples:
    | query          |
    | lock           |
    | race condition |
    | zzqqxx         |
```

### USS-004 (pairs with UWT-005; WCAG 2.4.1)

```gherkin
Scenario: The skip link reaches the lesson text
  Given a keyboard user has just loaded a lesson page
  When the user activates "Skip to content"
  Then the next Tab stop is inside the lesson text, not in the side navigation
```

### USS-005 (pairs with UWT-018; Heuristic 1)

```gherkin
Scenario: A shared path link shows the shared path
  Given a learner opens the Learn page with a path named in the address
  When the page has loaded
  Then that path is scrolled into view and marked
  Or a note says the named path could not be shown
```

### USS-006 (pairs with UWT-015, UWT-016; Heuristic 9, WCAG 3.1.1)

```gherkin
Scenario: An Indonesian learner never lands on an English dead end
  Given a learner is using the Indonesian site
  When the learner follows a path or course link
  Then the learner reaches a course page in Indonesian or a clear Indonesian message
  And "Go Home" returns the learner to the Indonesian home page
```

### USS-007 (pairs with UWT-003; Heuristic 7, WCAG 1.4.4)

```gherkin
Scenario: Diagram text is readable on a phone
  Given a learner views a lesson on a 375 px wide screen
  When a diagram is shown
  Then its text is as large as body text, or the learner can open it larger
```

## Totals (closed)

- Findings: 30.
  - CRITICAL 1: UWT-014.
  - HIGH 6: UWT-001, UWT-003, UWT-005, UWT-008, UWT-015, UWT-020.
  - MEDIUM 16: UWT-002, UWT-004, UWT-006, UWT-007, UWT-009, UWT-011, UWT-012, UWT-013, UWT-016, UWT-017, UWT-018, UWT-019, UWT-021,
    UWT-022, UWT-023, UWT-024.
  - LOW 7: UWT-010, UWT-025, UWT-026, UWT-027, UWT-028, UWT-029, UWT-030.
- Tasks: T1 partly met, T2 met, T3 met with detours, T4 not met for lessons (met for home and tools), T5 met only through
  "Belajar", T6 met.
- Probes: A, B, C, D run; the sweep states listed above run or marked partly run; 8 open gaps recorded in the completeness
  critic.
- Spec-blind scenario proposals: 7 (USS-001 to USS-007).
- Captures: 48 files named `uwt-*.jpeg` under `plans/in-progress/docker-to-podman/evidence/P3/ui-gates/captures/`.
- Nothing was fixed, committed, staged or pushed; no workflow, container tool, rebuild, or server restart was used.
