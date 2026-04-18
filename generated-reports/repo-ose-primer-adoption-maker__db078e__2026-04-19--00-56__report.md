---
agent: repo-ose-primer-adoption-maker
mode: dry-run
invoked-at: 2026-04-19 00:56 +07:00
ose-public-sha: 23a712b73de8ca98af8083e9c2a0347ec73ed802
ose-primer-sha: 7c34e73f8ea557411c1153fc718e5aff53f71c45
classifier-sha: ba65c7914e91ae11881df49b5f29b635d8ade758632036681b0b8b146d5123c8
report-uuid-chain: db078e
---

# ose-primer Adoption Maker — Dry-Run Report

## Summary

Phase 11.1 dry-run of the `repo-ose-primer-adoption-maker` agent against the
`ose-primer` clone at `/Users/wkf/ose-projects/ose-primer` (bare repository,
`origin/main` at `7c34e73f8ea557411c1153fc718e5aff53f71c45`) and `ose-public`
HEAD at `23a712b73de8ca98af8083e9c2a0347ec73ed802`. The classifier section of
`governance/conventions/structure/ose-primer-sync.md` was parsed (sha256
`ba65c7914e91ae11881df49b5f29b635d8ade758632036681b0b8b146d5123c8`); zero rows
carry direction `adopt`, so all candidates come from `bidirectional` rows.

Across all paths classified `bidirectional`, **474 paths differ between primer
and public** (469 with content drift in both repos; 5 primer-only files). The
overwhelming majority are NOT actionable for adoption. They divide into three
non-actionable categories:

1. **Primer-side scrubbing of public-flavored references** (~430 files): primer
   replaced product names (`OrganicLever` → `demo`, `OSE Platform` → `demo`,
   `apps/organiclever-fe` → `apps/demo-fe-ts-nextjs`, `com.oseplatform` →
   `com.demo`, `FSL-1.1-MIT` → `MIT`, `a-demo-*` → `demo-*`). Adopting these
   would re-import primer's voice and erase ose-public's product identity.
2. **Primer-perspective polyglot content** (~30 files): primer covers 11
   backend stacks ose-public no longer has (Java, Kotlin, Python, Rust, Elixir,
   Clojure, C#, Dart). Adopting these expanded sections would re-introduce
   text about apps that were extracted in Phase 8.
3. **Primer-side emoji retrofit on H2/H3 headings** (commit `7c34e73f`):
   added decorative section emojis (`🧪`, `🔗`, `🧭`, `✍️`, `🗂️`, `♿`, `🎨`,
   `✅`) to many headings. Style choice; not actionable as adoption since
   ose-public has not opted into the same heading style.

After filtering, **2 findings are genuinely actionable** (both `high`
significance): primer added new generic governance content not present in
public — a "Tasteful Usage" section in `governance/conventions/formatting/emoji.md`
and several diagram-guidance sections in `governance/conventions/structure/plans.md`.

No `neither`-tagged path leaked into the findings list. Five primer-only paths
in `.github/workflows/test-demo-*.yml` and how-to docs reference extracted
demo apps and are recorded in the Excluded paths appendix as
non-adoption-relevant.

## Classifier coverage

Counts below are primer-side files matching each `bidirectional` (adoption-relevant)
pattern. Classifier rows tagged `propagate` (e.g. `apps/rhino-cli`,
`libs/golang-commons`) are excluded — those flow outward only and are not
adoption candidates.

| Pattern                                       | Primer files matched | Comment                                                       |
| --------------------------------------------- | -------------------- | ------------------------------------------------------------- |
| `governance/principles/**`                    | 16                   | All governance principles                                     |
| `governance/conventions/**`                   | 26                   | Excludes `licensing.md` and `ose-primer-sync.md` (neither)    |
| `governance/development/**`                   | 57                   | Full development tree                                         |
| `governance/workflows/**`                     | 19                   | Excludes `repo/repo-ose-primer-*.md` (neither)                |
| `docs/tutorials/**`                           | 1                    | Just the README                                               |
| `docs/how-to/**`                              | 13                   | Includes 5 primer-only demo-related how-tos                   |
| `docs/reference/**`                           | 12                   | Excludes `related-repositories.md` (neither)                  |
| `docs/explanation/**`                         | 322                  | Largest tree by far                                           |
| `.husky/**`                                   | 3                    | All hook scripts                                              |
| `.github/workflows/**`                        | 25                   | Includes 15 primer-only `test-demo-*.yml` workflows           |
| `.github/actions/**`                          | 13                   | Includes 5 primer-only `setup-*` actions                      |
| `scripts/**`                                  | 4                    | Generic repo scripts                                          |
| `AGENTS.md`                                   | 1                    | Top-level                                                     |
| `CLAUDE.md`                                   | 1                    | Top-level                                                     |
| `README.md`                                   | 1                    | Top-level                                                     |
| `CONTRIBUTING.md`                             | 1                    | Top-level                                                     |
| `SECURITY.md`                                 | 1                    | Top-level                                                     |
| `Brewfile`                                    | 1                    | Top-level                                                     |
| `codecov.yml`                                 | 1                    | Top-level                                                     |
| `commitlint.config.js`                        | 1                    | Top-level                                                     |
| `openapitools.json`                           | 1                    | Top-level                                                     |
| `opencode.json`                               | 1                    | Top-level                                                     |
| `nx.json`                                     | 1                    | Top-level                                                     |
| `tsconfig.base.json`                          | 1                    | Top-level                                                     |
| `package.json`                                | 1                    | Top-level                                                     |
| `go.work`                                     | 1                    | Top-level                                                     |
| `go.work.sum`                                 | 1                    | Top-level                                                     |
| `.gitignore`                                  | 1                    | Top-level                                                     |
| `.dockerignore`                               | 1                    | Top-level                                                     |
| `.markdownlintignore`                         | 1                    | Top-level                                                     |
| `.prettierignore`                             | 1                    | Top-level                                                     |
| `.nxignore`                                   | 1                    | Top-level                                                     |
| `.golangci.yml`                               | 1                    | Top-level                                                     |
| `.markdownlint-cli2.jsonc`                    | 1                    | Top-level                                                     |
| `.prettierrc.json`                            | 1                    | Top-level                                                     |
| `.tool-versions`                              | 1                    | Top-level                                                     |
| `.claude/agents/repo-*.md`                    | 6                    | Excludes `repo-ose-primer-*.md` (neither)                     |
| `.claude/agents/plan-*.md`                    | 4                    | Plan lifecycle agents                                         |
| `.claude/agents/docs-*.md`                    | 8                    | Generic docs agents                                           |
| `.claude/agents/specs-*.md`                   | 3                    | Specs agents                                                  |
| `.claude/agents/readme-*.md`                  | 3                    | Readme agents                                                 |
| `.claude/agents/ci-*.md`                      | 2                    | CI agents                                                     |
| `.claude/agents/agent-*.md`                   | 1                    | Meta-agent                                                    |
| `.claude/agents/swe-*.md`                     | 16                   | Includes language-dev + UI agents                             |
| `.claude/agents/web-*.md`                     | 1                    | web-research-maker                                            |
| `.claude/skills/* (other)`                    | 32                   | All non-`apps-*` and non-`repo-syncing-with-ose-primer` skills |

Patterns whose direction is `propagate` (e.g. `apps/rhino-cli`,
`libs/golang-commons`, `libs/*` other, `specs/apps/rhino/**`) intentionally
have zero coverage entries here because the adoption-maker never reads from
them. Patterns whose direction is `neither` (e.g. `apps/{ayokoding,oseplatform,
organiclever}-*`, `apps/oseplatform-cli`, `apps/ayokoding-cli`, `apps-labs/`,
`libs/ts-ui`, `libs/hugo-commons`, `governance/vision/**`, `infra/**`,
`plans/**`, `archived/**`, `LICENSE`, `LICENSING-NOTICE.md`, `ROADMAP.md`,
`open-sharia-enterprise.sln`, `graph.html`, `bin/**`, all build-artifact and
editor-cache patterns) are also excluded by design.

## Findings

Findings are limited to the two paths where the primer added genuinely
generic, content-bearing improvements that ose-public lacks. All other 472
differing paths fall into the non-actionable categories described in the
Summary and are NOT proposed for adoption.

### `bidirectional` / `high`

#### Finding 1 — `governance/conventions/formatting/emoji.md`

- **Direction**: `bidirectional`
- **Transform**: `identity`
- **Significance**: `high`
- **Change**: Primer added a new `## Tasteful Usage` H2 section (≈ 91 lines)
  with H3 subsections "Where Emojis Help", "Where Emojis Do NOT Help
  (Anti-Patterns)", "Density Cap", and "Good vs Bad Examples". The section is
  fully generic — no product-app references — and provides concrete guidance
  on emoji density limits, anti-patterns to avoid (every-bullet emojis,
  per-heading emojis, decorative emojis, emoji-as-bullet-substitute), and
  good/bad examples. It complements but does not contradict the existing
  Rules 1–7 in the file.
- **Why actionable**: Generic content, no product references in the new
  section, complements ose-public's existing emoji convention (which already
  permits emojis but lacks tasteful-usage guidance), and the primer's
  `updated:` frontmatter (`2026-04-18`) is more recent than ose-public's
  (`2026-03-04`) for this file.

Diff snippet (primer-side `< `, public-side `> `; first 20 lines, elided):

```diff
13c13
< updated: 2026-04-18
---
> updated: 2026-03-04
63,153d62
< ## Tasteful Usage
<
< Emojis in this repository are **allowed** across documentation (see Rule 7
< for the full path list), but permission to use does not mean obligation to
< use. The goal is scannability — helping readers locate content quickly —
< not decoration. Tasteful usage aligns with the [Documentation First] and
< [Progressive Disclosure] principles: emojis must earn their place by
< adding semantic value, and a reader should grasp the same structure even
< with emojis stripped.
<
< ### Where Emojis Help
<
< Emojis pay for themselves when they do one of these jobs:
<
< - **Section markers in long docs** — a single emoji at the start of an
<   H2/H3 in a 500+ line reference or explanation speeds location-finding
<   on re-read
< - **Status indicators in examples** — PASS / FAIL / warning inline
... (76 more lines covering Density Cap, Good vs Bad Examples, anti-pattern
       blocks)
```

#### Finding 2 — `governance/conventions/structure/plans.md`

- **Direction**: `bidirectional`
- **Transform**: `identity`
- **Significance**: `high`
- **Change**: Primer rewrote the `## Mermaid Diagrams in Plans` section with
  more nuanced "When a Plan SHOULD Include a Diagram", "When a Plan MAY Skip
  Diagrams", and "Accessibility and Palette Requirements" subsections, plus a
  new `### Example: Plan-Appropriate Flowchart` subsection containing a
  worked Mermaid example with palette-conformant `style` declarations. The
  new content is generic and consistent with ose-public's diagram standards
  (it explicitly defers to `governance/conventions/formatting/diagrams.md`).
- **Why actionable**: The new "When SHOULD / When MAY" framing is
  decision-aiding guidance ose-public's current `plans.md` lacks. The
  Mermaid example is generic (uses abstract `Plan in backlog/`,
  `plan-execution-checker`, etc., not product names). One unrelated row in
  the diff (`apps/demo-be-golang-gin/README.md` row in a relative-link
  example) replaces ose-public's `apps/organiclever-be/README.md` row and is
  NOT recommended for adoption — only the diagram-guidance subsections are.

Diff snippet (primer-side `< `, public-side `> `; first 20 lines of the
relevant additive sections):

```diff
347c347
< ## Mermaid Diagrams in Plans
---
> ## Diagrams in Plans
349c349
< Files in `plans/` folder **SHOULD** include Mermaid diagrams when visual
< structure clarifies intent better than prose. Diagrams belong primarily in
< `tech-docs.md` (multi-file layout) or the Technical Approach section
< (single-file layout); other files may reference them. Text-only plans
< remain acceptable for trivial scopes — the rule is "diagram when it helps,"
< not "diagram always."
---
> Files in `plans/` folder should use **Mermaid diagrams** as the primary
> format (same as all markdown files in the repository).
351,353c351
< ### When a Plan SHOULD Include a Diagram
<
< Add a Mermaid diagram whenever the plan covers one of these concerns and
< a reader would otherwise have to reconstruct the picture mentally from
... (78 more lines covering When MAY Skip, Accessibility, Example
       flowchart with palette-conformant Mermaid styles)
```

### `bidirectional` / `medium`

None. All medium-bucket candidates surfaced by the diff sweep fell into the
non-actionable categories described in the Summary.

### `bidirectional` / `low`

None recommended. The dominant low-bucket pattern (decorative emojis added to
H2/H3 headings on ~70 governance/conventions/principles/skill files) is a
style-only choice the primer made unilaterally; absent a deliberate decision
in ose-public to opt into the same heading style, adopting these is not
recommended.

## Transform-gap appendix

None. All adoption-relevant patterns use the `identity` transform. No
`bidirectional` files require `strip-product-sections` on adoption (that
transform applies on the propagation direction, where ose-public-flavored
content needs to be sanitised before reaching the primer).

## Excluded paths appendix

Paths listed below differ between primer and public but were dropped from
findings. Each entry includes the reason.

### Suppressed by classifier (`neither`-tagged paths)

None encountered. The diff sweep traversed only `bidirectional`-classified
paths; `neither` paths under `apps/`, `apps-labs/`, `archived/`, `infra/`,
`plans/`, `generated-reports/`, `generated-socials/`, `local-temp/`,
`docs/metadata/`, `docs/reference/related-repositories.md`,
`governance/vision/`, `governance/conventions/structure/licensing.md`,
`governance/conventions/structure/ose-primer-sync.md`,
`governance/workflows/repo/repo-ose-primer-*.md`,
`.claude/agents/{social,apps,repo-ose-primer}-*.md`,
`.claude/skills/{apps-,repo-syncing-with-ose-primer}*`,
`libs/{ts-ui,ts-ui-tokens,hugo-commons,clojure-openapi-codegen,elixir-*}`,
`specs/apps/{a-demo,organiclever,ayokoding,oseplatform}/**`, `LICENSE`,
`LICENSING-NOTICE.md`, `ROADMAP.md`, `open-sharia-enterprise.sln`,
`graph.html`, and tooling-cache directories were never inspected.

### Suppressed for non-adoption-relevance (primer-only files referencing
extracted demo apps)

These files exist in primer's `bidirectional`-tagged trees but reference
`demo-*` apps that no longer exist in ose-public (extracted in Phase 8).
Adopting them would create dangling references.

- `.github/workflows/test-demo-be-clojure-pedestal.yml`
- `.github/workflows/test-demo-be-csharp-aspnetcore.yml`
- `.github/workflows/test-demo-be-elixir-phoenix.yml`
- `.github/workflows/test-demo-be-fsharp-giraffe.yml`
- `.github/workflows/test-demo-be-golang-gin.yml`
- `.github/workflows/test-demo-be-java-springboot.yml`
- `.github/workflows/test-demo-be-java-vertx.yml`
- `.github/workflows/test-demo-be-kotlin-ktor.yml`
- `.github/workflows/test-demo-be-python-fastapi.yml`
- `.github/workflows/test-demo-be-rust-axum.yml`
- `.github/workflows/test-demo-be-ts-effect.yml`
- `.github/workflows/test-demo-fe-dart-flutterweb.yml`
- `.github/workflows/test-demo-fe-ts-nextjs.yml`
- `.github/workflows/test-demo-fe-ts-tanstack-start.yml`
- `.github/workflows/test-demo-fs-ts-nextjs.yml`
- `.github/actions/setup-clojure/action.yml`
- `.github/actions/setup-elixir/action.yml`
- `.github/actions/setup-flutter/action.yml`
- `.github/actions/setup-jvm/action.yml`
- `.github/actions/setup-rust/action.yml`
- `docs/how-to/add-gherkin-scenario.md`
- `docs/how-to/add-new-demo-backend.md`
- `docs/how-to/local-dev-docker.md`
- `docs/how-to/run-demo-tests.md`
- `docs/how-to/update-api-contract.md`

### Suppressed for primer-side scrubbing (anti-adoptions)

The largest category by file count. Primer-side commits `cb49fa19b` (`a-demo-*`
→ `demo-*` rename), `d1dda5e75` (drop FSL docs), and `4b2689c91` (scrub
product refs) replaced ose-public-flavored references with primer-flavored
ones. Adopting these diffs would invert the substitution and re-import the
primer's voice into ose-public. Examples (representative; full set is ~430
files across `docs/explanation/**`, `governance/development/**`,
`governance/principles/**`, `governance/conventions/**`,
`governance/workflows/**`, `.claude/agents/{repo,docs,specs,readme,ci,
agent,swe,web}-*.md`, `.claude/skills/* (other)`):

- `governance/principles/general/simplicity-over-complexity.md` — primer
  replaces `PASS:` / `FAIL:` markers with `✅` / `❌`; replaces
  `license: FSL-1.1-MIT` with `license: MIT`.
- `governance/principles/README.md` — primer adds H2 emojis (`🧪`, `🔗`,
  `🧭`).
- `governance/conventions/structure/README.md` — primer removes the
  ose-primer-sync, licensing, and programming-language-docs-separation
  index entries (those exist only in public).
- `.claude/agents/repo-rules-checker.md` — primer replaces
  `apps-ayokoding-web-developing-content` references with
  `docs-applying-content-quality`; replaces `FSL-1.1-MIT` with `MIT`;
  renames `a-demo-*` → `demo-*`.
- `AGENTS.md` / `CLAUDE.md` / `README.md` — primer renames the project to
  `ose-primer`, drops product-app sections, restructures intro.
- `package.json` — primer renames the project, replaces `dev:a-demo-*` npm
  scripts with `dev:demo-*` and removes `organiclever:dev` scripts.
- `codecov.yml` — primer swaps coverage flags from `oseplatform-web`,
  `ayokoding-web` to `rhino-cli`, `golang-commons`, `demo-fs-ts-nextjs`.
- `go.work` — primer drops `./apps/ayokoding-cli`, `./apps/oseplatform-cli`,
  and `./libs/hugo-commons` (those don't exist in primer).
- `.gitignore`, `.dockerignore`, `.prettierrc.json`, `go.work.sum` — same
  pattern of product-name swaps.
- `docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/
  best-practices.md` — primer replaces `com.oseplatform` package paths
  with `com.demo`.
- `docs/explanation/software-engineering/programming-languages/c-sharp/**`,
  `clojure/**`, `dart/**`, `kotlin/**`, etc. — primer prunes
  product-specific examples and replaces them with `demo-*` examples.

### Suppressed for primer-perspective polyglot content

Files where primer covers extracted polyglot stacks ose-public no longer
runs:

- `docs/reference/project-dependency-graph.md` — primer's mermaid graph
  includes `demo-contracts`, `elixir-gherkin`, `clojure-openapi-codegen`,
  etc.; ose-public removed these in Phase 8 (Commits I and J).
- `docs/reference/code-coverage.md` — primer documents JaCoCo, Kover,
  Coverlet, cloverage, ExCoveralls thresholds that ose-public no longer
  enforces.
- `docs/how-to/setup-development-environment.md` — primer's prerequisites
  list spans 11 languages; ose-public's lean version (TypeScript, Go, F#)
  is correct for the current state.
- `governance/development/infra/nx-targets.md` — primer's tag table covers
  `demo-be-*`, `demo-fe-*` projects ose-public lacks.
- `governance/workflows/infra/development-environment-setup.md` — primer's
  19-tool checklist vs. ose-public's 9-tool checklist; the difference
  reflects extraction, not omission.
- `.github/workflows/codecov-upload.yml`,
  `.github/actions/install-language-deps/action.yml` — both reference
  Elixir, Clojure, Python, Rust install steps for `demo-be-*` apps.

### Suppressed by noise rules

Standard noise-suppression filters defined in the shared skill applied:
no trailing-whitespace-only diffs, no EOL-only diffs, no
frontmatter-timestamp-only diffs (the two actionable findings include real
body changes alongside the timestamp bump). No paths fell solely into the
noise category.

## Next steps

1. **Review the two actionable findings** above. The maintainer should
   decide whether to adopt the new generic content from primer:
   - `governance/conventions/formatting/emoji.md` — port the entire
     `## Tasteful Usage` H2 section (lines 63–153 of the primer file) into
     ose-public, immediately after the existing Rule 7 block. Bump the
     `updated:` frontmatter to today's date.
   - `governance/conventions/structure/plans.md` — port the rewritten
     `## Mermaid Diagrams in Plans` section, including the new SHOULD/MAY
     subsections, the Accessibility and Palette Requirements subsection, and
     the Example: Plan-Appropriate Flowchart subsection. Do NOT adopt the
     unrelated `apps/demo-be-golang-gin/README.md` row substitution in the
     relative-link table — keep ose-public's `apps/organiclever-be/README.md`
     example.

2. **Apply by direct commit to `main`** (per Trunk-Based Development
   Safety Invariant 5 in `governance/conventions/structure/ose-primer-sync.md`).
   Adoption changes do not require a PR in ose-public. Two suggested commits:
   - `docs(conventions): adopt primer's tasteful-usage section in emoji.md`
   - `docs(conventions): adopt primer's diagram-guidance subsections in plans.md`

3. **No re-invocation needed**. This was a dry-run; there is no `apply` mode
   for the adoption-maker. Manual or fixer-driven application of the two
   findings completes the task.

4. **Defect check (negative result)**: zero `neither`-tagged paths surfaced
   in this run. The classifier's exclusion lists held. No governance-finding
   to file against `repo-rules-checker`.

5. **For Phase 11.2**: the propagation-maker dry-run already executed in
   Phase 10.1 surfaced ~140 primer-newer paths as suppressed candidates;
   this adoption run is the counterpart that demonstrates those same
   primer-newer paths are NOT actionable for adoption either, because they
   are either primer scrubbing of public-flavored references, primer
   coverage of extracted polyglot stacks, or primer-only emoji retrofit.
   The two actionable adoption findings represent genuine generic primer
   improvements that should flow back to ose-public.
