# UI Mockups in UI-Bearing Plans — the UI-design-funnel (HARD RULE)

A plan is **UI-bearing** when it adds or changes user-facing screens or components under `apps/` or
`libs/` (e.g. `libs/web-ui`). Pure refactors, no-UI plans, and governance-only plans are exempt —
exactly as with the specs/Gherkin binding.

Every UI-bearing plan MUST document its draft UI through the **UI-design-funnel**
(diverge → narrow → select → justify), authored per the
[UI Mockups in Plan Docs convention](../../../../repo-governance/conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#ui-mockups-in-plan-docs-principles-in-practice-and-scope).

**PLACEMENT HARD RULE**: ALL funnel artefacts MUST be placed in the plan's **`prd.md`** — not in
`README.md`, `brd.md`, `tech-docs.md`, or any separate file. Binary mockup image assets live
under the plan's `assets/` folder and are referenced from `prd.md` via `![]()` image embeds.
A UI-bearing plan whose `prd.md` does NOT contain the funnel record (all four stages plus embedded
mockup links) fails the plan quality gate. See
[UI Mockups in Plan Docs — Placement](../../../../repo-governance/conventions/formatting/diagrams/ui-mockups-placement-hard-rule-requirements.md#placement--the-ui-lives-in-prdmd-hard-rule-requirements-and-enforcement).

The funnel produces four kinds of artefact, all visible in the plan (`prd.md` + the plan's
`assets/`); no alternative is silently discarded:

- **Both tiers per screen** — each screen gets a **low-fidelity** ASCII/Unicode wireframe in a
  fenced code block AND a **high-fidelity** `.excalidraw.png` referenced via `![](./file)`, in
  separate labelled subsections. Never use inline HTML+CSS, MDX, Mermaid-as-wireframe, or
  `.excalidraw.svg` (GitHub strips/garbles them).
- **Diverge** — **≥ 2 (aim for 3) genuinely different** named low-fi alternatives (Option A / B / C).
- **Narrow** — the **2 strongest** carried forward as hi-fi `.excalidraw.png` finalists, with a
  one-line drop reason for each alternative cut.
- **Select** — the chosen design **named explicitly** (e.g. "Selected: Option A — Ranked Table").
- **Justify** — a short **rationale / decision record** (a small table is enough): why the winner
  won and why each runner-up lost.
- **Grounding note (R5)** — before drafting either tier, survey the existing UI of the related
  app(s) and lib(s) (`libs/web-ui` component inventory + tokens + Storybook, the target app's
  shell, sibling screens; reference the `developing-frontend-ui` skill) and reuse what already
  exists; name any net-new component explicitly.
- **Prior-art citation (R7)** — consult prior art on how comparable tools solve the screen via the
  `web-researcher` agent, so the divergent alternatives are informed rather than invented.
- **Responsive design (mobile/tablet/desktop)** — the funnel MUST address **responsive** behaviour,
  **mobile-first**, across mobile (`< sm`), tablet (`md` ≥ 768 px), and desktop (`lg` ≥ 1024 px).
  The low-fi tier must show the mobile↔desktop reflow where it differs (e.g. table → stacked cards,
  side rail → top sheet); the selected design's record must state the **responsive strategy** per
  breakpoint; and each finalist is evaluated on its **mobile-first responsive behaviour**, not its
  desktop appearance alone. A desktop-only design is not a valid finalist.

`plan-maker` requires these artefacts; `plan-checker` flags any missing artefact at HIGH criticality
(sibling to the specs/Gherkin Step 5j); the gate's repair pass scaffolds missing funnel sections. A UI-bearing
plan never passes quality gates without its design funnel.

See [ui-design-funnel-grilling-and-learning-plans.md](ui-design-funnel-grilling-and-learning-plans.md) for the grilling questions.
