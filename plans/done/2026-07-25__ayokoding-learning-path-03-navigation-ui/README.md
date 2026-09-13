# AyoKoding Learning Paths — Path-Aware Navigation UI

The **rendering layer** of the shared-course-library product on `ayokoding-www` — **eight** paths
(amended by A10, 2026-07-21 — up from six) in **two categories** (`careers/` and `skills/`) as of the
2026-07-21 category-split ruling; see
[Category Split Ruling](#category-split-ruling-2026-07-21-r1r8) below. This plan owns the UI design
funnel for Screens 0–3 plus the two new screen types the ruling introduces (category landing, arc
landing), the `course-paths` **shell** components, the `?path=` route wiring, the left path rail, the
path landing pages, the category-grouped paths hub, and the site landing hero that surfaces the four
career-goal paths.

It is **Wave 2** of a five-plan split of the closed `shared-course-library-and-learning-paths` plan.
It builds nothing that stores order (that is the schema plan's), moves no content bundle (that is the
URL-restructure plan's), authors no course body, and writes no path manifest.

> **Cross-plan source of truth** — the authoritative per-course and per-path specs live in
> `plans/done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/`. Do not copy
> them; do not author from any other source.
>
> **Programme decisions** — this plan cites the shared `R*`/`A*` decision ids (`R1`, `R6`, `A5`, `A10`,
> and so on) throughout; their definitions live in
> [tech-docs.md §Programme decisions](./tech-docs.md#programme-decisions), and the wave DAG is stated
> locally in [§Wave and dependency position](#wave-and-dependency-position) below.

## Scope in one screen

| Owned here                                                                                                                                                                                                                                                     | Owned elsewhere                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI design funnel — Screens 0–3 plus the new **Screen 1a** (category landing) and **Screen 1b** (arc landing) — low-fi wireframes, hi-fi renders, selections, rationale                                                                                         | Screen 4 funnel and its 6 renders — `ayokoding-learning-path-01-url-restructure`                                                                                                                                                                                                                            |
| `course-paths` **shell**: repository, path landing, path card, path rail, banner, prereq list, **category landing, arc landing**                                                                                                                               | `course-paths` **core** — `ayokoding-learning-path-02-schema-and-prerequisite-dag`                                                                                                                                                                                                                          |
| `?path=` route wiring (variable-depth `pathId`), path-aware prev/next and breadcrumb, canonical fallback                                                                                                                                                       | the `courses/` and `paths/` content homes, and every `careers/`-scoped `_index.md` (hub, category, arc landings) — `ayokoding-learning-path-01-url-restructure`                                                                                                                                             |
| The `/en` landing hero's four career-goal cards and "Compare all paths" escape hatch                                                                                                                                                                           | Every `.yaml` **careers** path manifest — `ayokoding-learning-path-05-manifests`                                                                                                                                                                                                                            |
| The category-grouped paths hub (Careers + Skills), the `careers/` category and arc landings, and the four **careers** path landing routes (rendered against **fixture** manifests, including a skills-shaped fixture proving variable-depth `pathId` handling) | Every course body — `ayokoding-learning-path-04-course-authoring`; the `skills/` category landing's `_index.md`, all **four** skills manifests (amendment A10), and the ERP + accounting corpus — the two skills-category plans (see [Category Split Ruling](#category-split-ruling-2026-07-21-r1r8) below) |
| The fixture-manifest e2e suite and the accessibility contract for path-aware navigation                                                                                                                                                                        | The per-course re-home redirect table — `ayokoding-learning-path-01-url-restructure`                                                                                                                                                                                                                        |

## Category Split Ruling (2026-07-21, R1–R8)

The maintainer ruled a **path-category split** on 2026-07-21, after this plan was first drafted
around a flat four-path model. Where the ruling contradicts earlier text anywhere in this folder,
**the ruling wins**. Summarized here for this plan's own reference; the full ruling record is
authoritative across all six split plans, not owned by this one alone.

- **R1 — two categories, deliberately different URL depth.** `careers/<arc>/<role>`
  (3 segments, 4 paths) and `skills/<subject>` (2 segments, **4** paths as of amendment A10 — up
  from the original two). `/en/learn/paths/` does not exist in today's content tree — plan 01
  creates the whole space — so inserting the category segment costs **zero redirects**.
- **R2 — `pathId` is variable-depth, by design.** The schema, the `?path=` parser, and the
  manifest-directory globbing must handle both 2- and 3-segment ids without hardcoding either depth
  as an invariant; only "first segment is `careers` or `skills`, and the id resolves to a manifest
  that exists" is validated. See
  [tech-docs.md §R2 rendering consequence](./tech-docs.md#r2-rendering-consequence-pathid-is-variable-depth)
  below.
- **R3 — the fourth path is a from-scratch AI-engineering path**, `careers/immediately-effective/ai-engineer` —
  a content change, not a rename of the retired `software-engineer-to-ai-engineer` transition path.
  It no longer assumes an already-working software engineer; its prerequisites are **included** in
  `courseOrder`, not linked. The included prerequisites are existing library courses, so this authors
  no new course body — the growth lands in the manifest (plan 05's scope), not in authoring (plan
  04's). Every place in this plan that assumed the old "already a SWE / prerequisites linked" framing
  has been corrected — see [prd.md Personas](./prd.md#personas-one-per-path) and
  [prd.md Screen 3](./prd.md#screen-3--course-page-in-path-context) (the `path-course-links` badge
  narrative).
- **R4 — ownership split.** Plans 01–05 stay **careers-only**; two skills-category plans own the
  `skills/` category end-to-end (amendment A10: all **four** path landings' content, four manifests,
  and the full ERP + accounting corpus, two paths each). Plan 05 still publishes exactly **4**
  manifests (careers). This plan's rendering components are category-agnostic so the skills-category
  plans can render through them — see the [Scope in one screen](#scope-in-one-screen) table above.
- **R5 — the skills corpus is authored, not scaffolded** (owned by the skills-category plans; this
  plan only needs a skills-**shaped** fixture to prove R2's variable-depth handling — no real skills
  content is owned here).
- **R6 — the hub changes shape.** The paths hub was a 2×2 grid, one card per manifest, for 4 paths.
  It now shows **eight** paths in 2 categories at different depths (amended by A10 — up from six) —
  see [prd.md Screen 1](./prd.md#screen-1--paths-hub-choose-your-path).
- **R7 — every URL segment renders a real page; no orphan segments.** Five new pages are needed:
  the `careers/` category landing, the three `careers/<arc>/` arc landings, and the `skills/`
  category landing. The arc landing is a genuinely new IA concept — an arc was previously only a URL
  segment and a manifest attribute. `careers/immediately-effective/` is the design case (it lists
  **2** paths; the other two arcs list 1 each and must not read as broken or empty for it). See
  [prd.md Screen 1a](./prd.md#screen-1a--category-landing-careers-and-skills) and
  [prd.md Screen 1b](./prd.md#screen-1b--arc-landing-careersarc-only).
- **R8 — skills paths are always the `immediately-effective` arc.** The arc is **constant** for
  every skills path, so the URL omits it (that is _why_ `skills/<subject>` is only 2 segments, not
  because skills lacks a pedagogy) — the arc still lives in the manifest's `arc` field, which is what
  keeps a future `skills/<arc>/<subject>` purely additive. Consequently the `skills/` category
  landing has **no arc chooser** — it states the ramp promise once — while the `careers/` category
  landing's whole job is helping a reader choose between three real arc options. The two category
  landings are **not** one template with swapped data; see
  [prd.md Screen 1a](./prd.md#screen-1a--category-landing-careers-and-skills).

## Wave and dependency position

```mermaid
%% Position of this plan (P3 · navigation-ui) in the five-way split.
%% Node SHAPE encodes wave: rectangle = Wave 1, stadium = Wave 2, hexagon = Wave 3.
%% Edge STYLE encodes strength: solid = hard blocking edge, dotted = transitive artefact need.
%% Colors are the repo's verified color-blind-friendly palette and are redundant with shape.
flowchart LR
    subgraph W1["Wave 1 — no prerequisite"]
        P1["url-restructure"]:::wave1
        P2["schema-and-prerequisite-dag"]:::wave1
    end
    subgraph W2["Wave 2 — needs both Wave 1 plans merged"]
        P3(["THIS PLAN · navigation-ui"]):::wave2
        P4(["course-authoring"]):::wave2
    end
    subgraph W3["Wave 3 — needs both Wave 2 plans merged"]
        P5{{"manifests"}}:::wave3
    end

    P1 -->|"redirect table · courses/ and paths/ homes · Screen 4 assets"| P3
    P2 -->|"core/ pure modules · PathManifest zod · MANIFESTS dir"| P3
    P1 -->|"populated flat courses/ namespace"| P4
    P2 -->|"syllabus/courses specs · prerequisite contract"| P4
    P3 -->|"path-landing · path-card · manifest-repository · ?path wiring"| P5
    P4 -->|"authored course bodies · band-completion signals"| P5

    P1 -.->|"transitive: content homes"| P5
    P2 -.->|"transitive: schema · integrity gates"| P5

    classDef wave1 fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef wave2 fill:#DE8F05,stroke:#000000,color:#000000
    classDef wave3 fill:#029E73,stroke:#000000,color:#FFFFFF
```

**Accessibility note.** The diagram never relies on colour alone. Wave membership is carried by node
shape — rectangle, stadium, hexagon — **and** by the three labelled subgraph containers. Edge kind is
carried by line style (solid = hard blocking edge; dotted = transitive artefact need already satisfied
by a solid path) **and** by every edge's own label. Fills use the verified accessible palette
(`#0173B2` blue, `#DE8F05` orange, `#029E73` teal) with black borders and WCAG-AA-contrasting text per
the
[Color Accessibility Convention](../../../repo-governance/conventions/formatting/color-accessibility.md).

## Depends-on

| Direction     | Plan (full folder name)                                  | Relationship                                              |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| **blockedBy** | `ayokoding-learning-path-01-url-restructure`             | hard — must be **merged to `origin/main`** before Phase 1 |
| **blockedBy** | `ayokoding-learning-path-02-schema-and-prerequisite-dag` | hard — must be **merged to `origin/main`** before Phase 1 |
| **blocks**    | `ayokoding-learning-path-05-manifests`                   | hard — that plan cannot publish a manifest without this   |
| _sibling_     | `ayokoding-learning-path-04-course-authoring`            | runs in parallel in Wave 2; no edge in either direction   |

**No FS-SE dependency.** The sibling `fundamentally-strong-software-engineer` plan is **closed**
([`plans/done/2026-07-19__fundamentally-strong-software-engineer/`](../../done/2026-07-19__fundamentally-strong-software-engineer/README.md));
its Passes 3–5 scope was absorbed by the split's course-authoring plan, not by this one (DL-12).

## Implementation Sequence and Prerequisites

This plan is **Wave 2** of a five-plan split of the closed
`shared-course-library-and-learning-paths` plan. It owns the **rendering layer**: the UI design
funnel for Screens 0–3 plus the new **Screen 1a** (category landing) and **Screen 1b** (arc landing),
the `course-paths` shell components, `?path=` route wiring, the path rail, path landings, and the
paths hub.

### Upstream — what must exist before this plan starts

| Upstream plan                                            | Artefact needed                                                                   | Why this plan cannot start without it                                                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ayokoding-learning-path-01-url-restructure`             | `apps/ayokoding-www/src/redirects/` per-course re-home table                      | the Phase-4 e2e asserts a legacy `fundamentally-strong` URL redirects to `/en/learn/courses/<id>`; without the table that spec can never go green |
| `ayokoding-learning-path-01-url-restructure`             | `apps/ayokoding-www/content/en/learn/courses/_index.md` and `.../paths/_index.md` | `PathLanding` and `PathCard` render from `<PATHS>_index.md`; with no content home there is no route to render into                                |
| `ayokoding-learning-path-01-url-restructure`             | the final three-bucket tree (`courses/`, `paths/`, `legacy/`)                     | the no-path regression sweep must compare against the final IA, not a hybrid one                                                                  |
| `ayokoding-learning-path-01-url-restructure`             | Open Question **Q-E** ruling (three residual `fundamentally-strong` index pages)  | determines what the legacy-browse coexistence guard asserts                                                                                       |
| `ayokoding-learning-path-02-schema-and-prerequisite-dag` | `apps/ayokoding-www/src/features/course-paths/core/` (all six pure modules)       | every shell component imports them; `manifest-repository.ts` cannot validate without `schemas.ts`                                                 |
| `ayokoding-learning-path-02-schema-and-prerequisite-dag` | `apps/ayokoding-www/src/features/course-paths/manifests/`                         | the repository globs `**/*.yaml` from this directory                                                                                              |

**Start precondition (checkable — all four must hold):**

1. PR for `ayokoding-learning-path-01-url-restructure` is **merged to `origin/main`**.
2. PR for `ayokoding-learning-path-02-schema-and-prerequisite-dag` is **merged to `origin/main`**.
3. `test -f apps/ayokoding-www/src/features/course-paths/core/schemas.ts` returns 0.
4. `test -f apps/ayokoding-www/content/en/learn/paths/_index.md` returns 0.

### Downstream — what this plan hands off, and to whom

| Downstream plan                        | Artefact handed over                                                                                         | Consumed by                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ayokoding-learning-path-05-manifests` | `<FEAT>shell/path-landing.tsx`, `path-card.tsx`                                                              | every path landing and the category-grouped paths-hub renders through these                                                              |
| `ayokoding-learning-path-05-manifests` | `<FEAT>shell/manifest-repository.ts`                                                                         | a published YAML manifest is inert until this loads and validates it                                                                     |
| `ayokoding-learning-path-05-manifests` | `?path=` wiring in `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`                        | path context, prev/next, breadcrumb (variable-depth `pathId`, per R2)                                                                    |
| `ayokoding-learning-path-05-manifests` | `<FEAT>shell/path-rail.tsx`, `path-banner.tsx`, `path-course-links.tsx`, `prerequisite-list.tsx`             | the manifest plan's manual verification walks all of these                                                                               |
| `ayokoding-learning-path-05-manifests` | the fixture-manifest e2e pattern                                                                             | the manifest plan re-asserts the same four nav behaviours against **real** manifests                                                     |
| the two skills-category plans (R4/A10) | `<FEAT>shell/category-landing.tsx`, `arc-landing.tsx`, `manifest-repository.ts` (2-segment `pathId` support) | the `skills/` category landing and all **four** skills path landings render through these, once those plans publish their four manifests |

### Screen 0 is design-only in this plan unless an implementation step is added

Screen 0 (the `/en` landing hero) carries a full funnel record and six renders but **no
implementing step existed in the source plan**. This plan either adds the implementation step
against `apps/ayokoding-www/src/features/app-shell/shell/hero.tsx` and `landing.tsx`, or records
the deferral explicitly here. Silently carrying the artefacts is the one outcome to avoid.

### Handoff signal

This plan is done for downstream purposes when its final PR is **merged to `origin/main`** AND
`test -f apps/ayokoding-www/src/features/course-paths/shell/path-landing.tsx` returns 0 AND
`npx nx run ayokoding-www-fe-e2e:test:e2e` exits 0.

## Screen 0 ruling — Option A, implementation carried (RECORDED)

The choice the section above demands is made here and is **not** deferred: **Option A**. Screen 0's
implementation lands in this plan's **Phase 3** as an explicit RED/GREEN/REFACTOR triplet against
`apps/ayokoding-www/src/features/app-shell/shell/hero.tsx` (which `landing.tsx` renders via
`<Hero locale={locale} />`) [Repo-grounded — both files exist today], alongside the `PathCard`
component Phase 3 already builds. The Gherkin scenario
**"The landing hero surfaces the four goal paths directly"** binds that RED step, and
[tech-docs §File Impact](./tech-docs.md#file-impact) lists `hero.tsx` and `path-card.tsx` in its
Group A row.

Consequently the archival gate's "all renders present, all selections recorded" check is **not** the
only Screen 0 assertion — the Phase 3 gate additionally requires the hero e2e spec to be green, so
this plan cannot tick archival on an unshipped screen. Screen 0 is **not** recorded as design-only.

## Blocked-on (open questions owned by another plan)

- **Q-E — what happens to `fundamentally-strong`'s three residual index pages?** Owned verbatim by
  `ayokoding-learning-path-01-url-restructure` (all six of Q-A…Q-F live there). Its ruling
  determines what this plan's legacy-browse coexistence guard and no-path regression sweep assert.
  See that plan's `tech-docs.md` §Open Questions for the authoritative copy and its recommended
  default (fold the three pages into the `careers/fundamentally-strong/software-engineer` path
  landing).

## Build order (inherited)

Reproduced **verbatim** from the source plan because Group A alone spans three of the five split
plans, so no single plan owns the sequencing rule.
`ayokoding-learning-path-05-manifests` is the canonical owner for citation purposes.

> **Stale relative to the 2026-07-21 category-split ruling — flagged, not silently corrected here.**
> The unprefixed path ids below (`immediately-effective/software-engineer`, etc.) and the
> `software-engineer-to-ai-engineer` name predate R1 (the `careers/` prefix) and R3 (the fourth path
> is renamed `ai-engineer` and its course-count estimate of "~17 courses" no longer holds now that
> its prerequisites are **included**, not linked — R3's own clarification is that this pulls in
> **existing** library courses only, so no new course body is authored, but the manifest is larger
> than "~17" implies). Because this block is a verbatim quote canonically owned by
> `ayokoding-learning-path-05-manifests`, this plan does **not** edit it in place — editing a
> verbatim-owned block from a sibling plan risks drifting from that plan's own concurrent correction.
> Plan 05 is responsible for updating its canonical copy; this plan's own content (personas, Screen
> designs, the `path-course-links` badge narrative) has been corrected — see
> [Category Split Ruling](#category-split-ruling-2026-07-21-r1r8) above.

- **DD-15 · Build order (locked; amended 2026-07-20 by DD-27 — see below).** Group A (architecture +
  `course-paths` UI — hard prerequisite) → `interview-ready` MVP ships first (re-home 1–33, author the
  4 interview courses + `capstone-interview-loop`, one manifest, deploy) → `immediately-effective`
  manifest → `fundamentally-strong` manifest → backfill topics 34–94 native into `courses/` as the
  library fills. **DD-27 amends steps 2 onward**: the MVP is narrowed to an architecture smoke test
  only (interview-course authoring is no longer bundled into it), and the fourth path is inserted as
  authoring priority #1 immediately after the MVP.

- **DD-27 · Build order amended: the fourth path is authoring priority #1, behind an
  architecture-smoke-test-only MVP (D7, amends DD-15).** Locked order: **Group A** (architecture + UI,
  unchanged hard prerequisite) → **`interview-ready` MVP, narrowed to an architecture smoke test only**
  (ships against topics 1–33, already live on disk; proves routing, manifest loading, `?path` context,
  prev/next, breadcrumb, and prerequisite display against real content, in days not months —
  authoring the 4 NEW interview courses + `capstone-interview-loop` is **no longer bundled into this
  MVP gate**) → **`software-engineer-to-ai-engineer`** (authoring priority #1 for all authoring effort)
  → **`immediately-effective/software-engineer`** manifest → **`fundamentally-strong/software-engineer`**
  manifest → **backfill topics 34–94**. Rationale (preserved from the original build-order decision):
  nothing in the AI path exists on disk (~17 courses); making it literally first — ahead of even the
  MVP — would mean nothing ships until all 17 are authored, with the UI architecture unvalidated the
  entire time. Ordering it immediately after an architecture-smoke-test MVP gives the AI path first
  claim on every unit of real authoring effort while keeping the architecture proven early against
  content that already exists.

**Split mapping of the inherited order.** Group A is delivered by three plans, not one:
`ayokoding-learning-path-02-schema-and-prerequisite-dag` builds the pure core,
`ayokoding-learning-path-01-url-restructure` builds the IA and content homes, and **this plan**
builds everything that renders. The MVP and every manifest step after it belong to
`ayokoding-learning-path-05-manifests`; all authoring belongs to
`ayokoding-learning-path-04-course-authoring`. Do not "optimize" the order — DD-27's rationale
paragraph exists to prevent exactly that.

## Decisions Locked (inherited)

Reproduced **verbatim**. `DL-11` does not exist — the slot between `DL-10` and `DL-12` is occupied by
`DN-11`, a Delivery Note. **Do not renumber to close the gap.** DL-7 below carries the same
category-split staleness flagged above the Build order section — not corrected in place here for the
same verbatim-ownership reason.

- **DL-7 · Build order — amended 2026-07-20, see DL-15 / tech-docs DD-27.** Deliver Group A
  (architecture + UI) first as a hard prerequisite; then an **interview-ready MVP that is an
  architecture smoke test only** (shipped against already-live topics 1–33, not the full interview
  cluster); then `immediately-effective/software-engineer-to-ai-engineer` (authoring priority #1); then
  the `immediately-effective/software-engineer` manifest; then the `fundamentally-strong/software-engineer`
  manifest; then backfill topics 34–94 native as the library fills. **Decided; amended 2026-07-20.**
- **DN-11 DECIDED — `[AI]` auto-merge (now the repo default).** `[AI]` merges each delivery unit's PR
  automatically once the 3-cycle PR-Review Maker→Fixer Cycle and all quality gates are green — this
  plan declares no `[HUMAN]` merge gate. When DN-11 was first recorded, `pr-merge-protocol.md` still
  defaulted to a `[HUMAN]` merge, so the maintainer authorized AI-auto-merge for **this plan**
  (in-session): (a) it uses the SAME delivery methods as the now-closed sibling plan
  `fundamentally-strong-software-engineer`; and (b) no maintainer permission is needed to merge a PR
  once it has passed 3 review cycles and the PR quality gate. The protocol has since been changed so
  that `[AI]` merges by default and `[HUMAN]` is an explicit per-plan opt-in, making DN-11 a
  confirmation of the default rather than an override. Recorded here and in
  [delivery.md](./delivery.md#delivery-mode-worktree-to-pr).

### This plan's own locked decision

- **DL-17 · Screen 3 is the left path rail (Option B), and the design funnel covers three viewports
  (2026-07-21 design revision).** The maintainer overturned the earlier Screen 3 selection: the course
  page in path context now carries the **path's whole ordered arc as the left rail** rather than a
  one-line top banner. The rail is a **content swap in two already-shipped hosts** — `ResizableSidebar`
  on `md+` and the `MobileNav` left `Sheet` below `md` — so the "needs a mobile sheet" objection that
  originally sank Option B is answered by an overlay that already exists; the residual cost (one
  net-new `PathRail`, truncation at the ~115 px width floor) is accepted deliberately and recorded, not
  quietly dropped. The `PathBanner` survives as the rail's compact readout and hosts the below-`md`
  disclosure trigger. With no `?path=`, both hosts render exactly what they render today. Alongside it,
  the funnel now carries **a lo-fi wireframe and a hi-fi render per screen, per option, at three
  viewports** (375 / 768 / 1280 px) — **30 `.png` total** — because the reselection turned on precisely
  the mobile question that desktop-only artefacts could not surface. See
  [tech-docs.md DD-46 / DD-47](./tech-docs.md#design-decisions),
  [prd.md Screen 3](./prd.md#screen-3--course-page-in-path-context), and
  [prd.md §Hi-fi asset matrix](./prd.md#hi-fi-asset-matrix-screen--option--viewport).
  **Decided 2026-07-21.**

> **DD-47 arithmetic after the split.** DL-17's "30 `.png` total" was a **two-plan** total under the
> original 4-path model (this plan: 24, Screens 0–3 × 2 options × 3 viewports;
> `ayokoding-learning-path-01-url-restructure`: the remaining 6, Screen 4 × 2 options × 3 viewports).
>
> **Amended 2026-07-21 by the category-split ruling (R6/R7).** Two screen types are added to this
> plan's own funnel — **Screen 1a** (category landing) and **Screen 1b** (arc landing) — and Screen 1
> (the hub) is redesigned rather than dropped, so this plan's own screen count rises from 4 to **6**
> (Screens 0, 1, 1a, 1b, 2, 3). This plan now produces and holds **36** renders
> (6 screens × 2 options × 3 viewports); `ayokoding-learning-path-01-url-restructure`'s Screen 4 share
> is unchanged at 6. The grand cross-plan total is therefore **42**, not 30. A reader auditing DD-47
> against this plan alone must **not** read 36 as over- or under-delivery relative to the old 24/30
> figures — those predate the category split. No executor may "fix" any apparent gap by copying the
> other plan's renders here — a duplicated matrix drifts.

## Design decisions owned here

Three of the source plan's 41 design decisions are canonically owned by this plan; the full text is in
[tech-docs §Design Decisions](./tech-docs.md#design-decisions).

| ID    | Subject                                                                         |
| ----- | ------------------------------------------------------------------------------- |
| DD-4  | Graceful canonical fallback is first-class                                      |
| DD-46 | Screen 3 is the left path rail (Option B); the banner survives as its readout   |
| DD-47 | Every screen's every option carries a wireframe and a render at three viewports |

## Personas (one per path)

Duplicated verbatim into every split plan: a plan whose personas live in a sibling folder cannot be
reviewed for fit-for-purpose. All four **careers** personas are carried, not just the ones this
surface serves — every screen this plan builds is reached by readers of all four careers paths. Two
of this plan's own screens (the paths hub, the category landing) are **also** reached by skills
readers once the skills-category plan publishes its content (R4); this plan does not carry skills
personas — that plan owns them — but its rendering components are proven category-agnostic against a
skills-shaped fixture (see [tech-docs.md §Fixture strategy](./tech-docs.md#fixture-strategy-how-this-plan-is-provable-before-any-manifest-exists)).
See [prd.md §Personas](./prd.md#personas-one-per-path) for the authoritative copy in this folder.

## Navigation

- [Business Requirements (brd.md)](./brd.md) — WHY the navigation UI is a real frontend change, who
  it serves, and the business risks this plan carries.
- [Product Requirements (prd.md)](./prd.md) — personas, user stories, the **complete UI-design-funnel
  for Screens 0–3 plus the new Screen 1a (category landing) and Screen 1b (arc landing)** (low-fi
  wireframes at three viewports, hi-fi finalists, selections, rationale, responsive strategy), the
  hi-fi asset matrix, the R7 prior-art record, and the Gherkin acceptance criteria.
- [Technical Docs (tech-docs.md)](./tech-docs.md) — the `course-paths` shell architecture, routing and
  `?path=` propagation, prev/next and breadcrumb resolution, the path rail's two hosts, the
  accessibility contract, design decisions, file impact, and the testing strategy.
- [Delivery Checklist (delivery.md)](./delivery.md) — the phased executable checklist.
- [Syllabus (cross-plan)](../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/README.md)
  — the per-course and per-path detail layer, owned by
  `ayokoding-learning-path-02-schema-and-prerequisite-dag`. Read-only from here; never copied.
- [Learnings (learnings.md)](./learnings.md) — knowledge-capture running log.

## Delivery Mode: worktree-to-pr

`worktree-to-pr` (the repo default, inherited from the source plan as a tier-2 plan-field value): work
in `worktrees/ayokoding-learning-path-03-navigation-ui/`, open a draft PR at each **delivery boundary**
(see [delivery.md §Delivery Boundaries](./delivery.md#delivery-boundaries) — Phase 1; Phases 2-5;
Phases 7-8; Phase 0 opens none) against `main`,
run the PR-Review Maker→Fixer Cycle (3 sequential CI-gated cycles), then `[AI]` merges once the review
and all quality gates are green — a plan-scoped confirmation of the repo-default `[AI]` merge, which
this plan does not opt out of (see **DN-11 DECIDED** above). `ayokoding-www` is deployed to
`prod-ayokoding-www` after every merge. See [delivery.md](./delivery.md) for the `## Worktree` and
`## Delivery Mode` declarations and the PR-review-cycle steps.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
