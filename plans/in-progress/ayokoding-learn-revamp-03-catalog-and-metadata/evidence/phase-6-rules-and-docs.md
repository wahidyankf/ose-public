# Phase 6 — Rules and Docs Evidence (plan 03)

## Rules Propagation — status `landed`

Inputs frozen: R1–R4 exactly as stated in `tech-docs/009-rule-and-docs-impact.md`
(MUST strength; R1–R2 scope `apps/ayokoding-www/content/en/learn/courses/**`;
R3 scope tutorial gates; R4 scope `content/en/learn/courses/_index.md` + generator).

- Falsifiable: one obligation per rule; violating/conforming examples recorded in the
  canonical homes (R1: course `_index.md` with no `category` vs `category:
data-and-databases`; R2: stored `estimatedHours` off by one vs equal; R3: `format:
annotated-concept-no-code` selecting no-code vs `annotated-concept` standard; R4:
  generated link list in `learn/courses/_index.md` vs frontmatter-only file).
- Already-sufficient search: `repo-governance/`, `.agents/`, `AGENTS.md` — no existing rule
  carried R1/R2/R4; R3 narrows (not contradicts) the existing mode sentence.
- Conflict resolution: adapter (higher layer) states R3/R4; the two
  `apps-ayokoding-www-authoring-annotated-concept` reference files amended to agree
  (course `_index.md` `format` field; content plan states it for new courses).
- Placements (narrowest surface; no `AGENTS.md`/`CLAUDE.md` change; no eviction needed):
  - R1+R2 → `.agents/skills/apps-ayokoding-www-developing-content/reference/course-metadata.md`
    (new), indexed in `reference/README.md`, linked from `SKILL.md` and from the adapter's
    "Front matter" bullet. Disposition: covered (course-metadata scenario fails
    `ayokoding-www:test:unit`).
  - R3 → `repo-governance/development/quality/gate-adapters/ayokoding-www/tutorial-kinds.md`
    ("Annotated Concept" → Mode). Disposition: gated (Tutorial Annotated Concept Quality Gate).
  - R4 → `repo-governance/development/quality/gate-adapters/ayokoding-www.md`
    ("Generated indexes" bullet). Disposition: covered (index-generation scenario +
    `validate-indexes`).
- Enforcement demo (CORPUS-GUARD = unit `course-metadata.steps.ts`):
  - Deleted `sql-essentials` `category` → exit 1 naming `sql-essentials` + `category`
    (see `evidence/phase-6-guard-missing-category.txt`).
  - Stored `estimatedHours: 9` (computed 8) → exit 1 with `stored 9, expected 8`
    (see `evidence/phase-6-guard-stale-hours.txt`).
  - Restored byte-identical (`diff` clean, `git status` clean for the file) → 19/19 pass.

## Harness generation

`harness adapters generate` current; `harness adapters validate` clean. Regenerated digests
only in the harness `catalog.json`/`provenance.json` mirrors (skill SKILL.md digests changed;
no name/description changed, no route body changed).

## Rules Quality Gate — `PASS_WITH_FINDINGS` (cycle 1 of 2, 0 blocking)

Checker verified implementation truth (14 ids/order, six formats, bounds, guard messages,
181 courses, R4 exception + scenario). Four non-blocking wording findings, all fixed:
(1) tutorial-kinds leadership sentence now names the `format` decider; (2) outlines "may
omit"; (3) R1/R2 labels removed from skill text (collision with course-titles rules —
canonical R1–R4 live only in 009 and this record); (4) effort formula corrected
(prose + code minutes; code shown twice counts once; min 1).

## Docs Propagation — status recorded

- `apps/ayokoding-www/README.md`: course-library paragraph (fields, catalog URL, drift guard).
- `specs/apps/ayokoding/www/architecture.md`: `content` row gains "course metadata validation".
- Three spec READMEs (Phase 1) confirmed still indexing the four new/appended features.
- `docs/` + `apps/ayokoding-www-fe-e2e/fixtures/manifests/README.md`: no stale statement found.
- Learning (not a fix): `architecture.md` components table still lacks the `course-paths`
  context (predates this plan).

## Deterministic verification

- `harness adapters validate`: clean. `governance word-budget validate`: exit 0.
- `md internal-link validate`: 18020 links, no findings. `md frontmatter`: exit 0.
- `md heading-hierarchy`: exit 0. `lint:md`: 0 errors.
- `ayokoding-www:typecheck`, `:lint`, `:validate-indexes`: success.
- `ayokoding-www:test:quick`: see Phase 6 gate commit (rerun below).
