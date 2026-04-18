# Business Requirements — ose-primer Separation

## Business Goal

Reshape the `ose-public` ↔ `ose-primer` boundary from a **silent, drifting duplication** ("both repos contain the same 17 demo apps; nobody keeps them in sync") into an **explicit, non-overlapping separation with an auditable sync loop for the shared layer**, such that:

1. **One source of truth per concern**: The `a-demo-*` polyglot showcase lives exclusively in `ose-primer` after extraction; product apps (OrganicLever, AyoKoding, OSE Platform) live exclusively in `ose-public`; governance, skills, agents, conventions, and generic libraries are shared and kept aligned via the sync loop.
2. **Generic scaffolding improvements in `ose-public`** — new conventions, new workflows, new generic agents, new skills, polyglot toolchain bumps, governance refinements — flow to `ose-primer` without manual copy-paste or human recall of "what did I change this week?"
3. **Improvements made to `ose-primer` in isolation** — wording simplified by product-context removal, generic abstractions extracted during templating, template-specific discoveries that generalise — surface back to `ose-public` for evaluation, so the source of truth does not stagnate relative to its derivative.
4. **Product-specific material** (OrganicLever, AyoKoding, OSE Platform site, FSL-licensed specs, product plans, product `*-e2e` suites) **never** flows to the public primer, even accidentally.
5. **Human review** is the final gate for every sync in either direction AND for the one-time extraction event. The system produces readable proposals; humans approve or reject. The extraction itself is a reviewable set of commits, not an automated delete-and-push.

The business goal is **not** "eliminate manual work" — it is threefold:

- **Eliminate duplicate maintenance**: cut the 17-demo-app maintenance burden out of `ose-public`'s daily CI and the maintainer's daily attention surface, consolidating it in the repo whose purpose is to host it.
- **Eliminate the cognitive load** of remembering what needs to be synced.
- **Eliminate the error class** of accidentally propagating product-specific material to a public template.

A well-designed extraction event plus an adopter/propagator pair turns an error-prone, memory-dependent ritual into a mechanically verifiable diff-and-review pass — and in one stroke trims `ose-public` down to what it actually is: a product monorepo, not a polyglot scaffolding catalogue.

## Business Rationale

### Why bidirectional

A **one-way propagation only** (`ose-public` → `ose-primer`) would suffice if the template never evolved independently. In practice, templating pressure surfaces friction points that product development masks:

- When product context is stripped out of a doc for the template, the bones of the doc become visible and frequently read badly — that reading-pass yields better wording that should flow back.
- Extracting a generic agent from a product-specific one forces a clean abstraction; the abstraction is an improvement the product-side could also benefit from.
- Template users file issues (or the maintainer notices drift) against the template that reveal latent problems in the source.

Closing the adoption direction keeps `ose-public` honest and prevents the template from diverging into its own unmaintained branch of conventions.

### Why two agents instead of one

A single "sync" agent would have to hold both classifier directions in its head at once and would produce reports mixing two distinct review concerns:

- **Propagation review** requires the maintainer to ask: "Is this generic enough to go public? Does this leak product context? Is the FSL/MIT licensing consistent?"
- **Adoption review** requires the maintainer to ask: "Does this improvement generalise? Does importing this break invariants the product-side depends on? Does the change conflict with a recent product-side update?"

These are different review mindsets. Separating the agents separates the reports, which separates the review sessions, which improves review quality. The cost is duplicate skill-consumption patterns and duplicate classifier lookups — both trivially shared via a single skill and a single governance doc.

### Why make it now

The awareness gap (nothing in `ose-public` mentions `ose-primer`) is the visible symptom. The underlying problem is that without agents, the sync lives only in the maintainer's head and will fail on any of: vacation, context switch between Phase 1 and Phase 2, onboarding a second maintainer, or simply a long-enough gap between touching the template. Building the agents before the gap widens is cheaper than building them after a painful divergence.

### Why extract the demos now (not later)

The 17 `a-demo-*` apps exist in `ose-public` for three historical reasons: (a) to validate the monorepo's multi-language scaffolding, (b) to anchor the governance docs (three-level testing standard, OpenAPI contract enforcement, polyglot toolchain convergence) with concrete implementations, (c) to showcase the polyglot posture for external readers. With `ose-primer` now published and fulfilling **all three** purposes as a dedicated template — and with `ose-public` entering Phase 1 (OrganicLever) and Phase 2 (SMB application) where the monorepo's identity is product-oriented — keeping the demos in `ose-public` creates four ongoing costs:

- **Duplicate CI surface**: Every push to `main` exercises 14 `test-a-demo-*.yml` workflows plus 4 reusable demo-backend workflows. These minutes are paid twice (once in `ose-public`, once in `ose-primer`). Extraction halves the cost.
- **Attention tax during product work**: Any change to a generic convention, Nx target, or root config requires checking whether 17 demos still pass. With demos gone, the maintainer can focus on OrganicLever/AyoKoding/OSE Platform's 4–6 projects.
- **Drift risk**: Bug fixes to a demo in `ose-public` have to be remembered and forwarded to `ose-primer` (or vice versa). Every drift is a future puzzle for a downstream adopter who forks `ose-primer` and finds a subtly different demo.
- **Misleading front-door signal**: A visitor landing on `wahidyankf/ose-public` today sees 17 demo apps alongside the product apps; the product identity is crowded out. A visitor landing on `ose-public` after extraction sees "OSE platform in development — OrganicLever first," a clearer narrative.

**Do it now** because: (i) the sync infrastructure this plan builds is the safety net that makes the extraction reviewable, not a leap of faith; (ii) the extraction is strictly easier today (one maintainer, one product, no downstream forks of `ose-public` to coordinate with) than after Phase 2 adds more product apps; (iii) delaying means more months of duplicate-CI cost the project doesn't need to pay.

**Do it as part of this plan** because: the extraction's main risks (losing demo content, breaking downstream agents, leaving dangling references) are the exact risks the classifier + propagator-parity-check were designed to mitigate. Extracting before the sync infrastructure exists would be reckless; extracting after it exists but in a separate plan would duplicate the classifier work.

## Business Impact

### Pain points addressed

- **Cognitive load (ongoing sync)**: "What did I change in `ose-public` this week that needs to go to the primer?" — today, the answer is `git log` + memory + hope. Tomorrow, the answer is "run the propagation-maker."
- **Error surface (ongoing sync)**: Accidentally propagating a FSL-licensed spec or a product-specific README snippet to a public MIT template is a **licensing and privacy leak**. Today, the only safeguard is maintainer vigilance. Tomorrow, the classifier in the governance doc is the safeguard, enforced by the propagation-maker.
- **Discoverability**: A contributor (or an AI agent in an `ose-public` session) who asks "how do I start a new OSE-style monorepo?" has no pointer today. Tomorrow, the awareness docs and the sync convention answer this in one hop.
- **Template stagnation (ongoing sync)**: Without a feedback loop, the template decays relative to its source. The adoption-maker closes the loop.
- **Duplicate CI burden (extraction)**: Every push to `main` runs 14 demo-specific workflows plus shared reusables configured for ~10 backends. After extraction, product-app workflows alone run in `ose-public`; `ose-primer` independently exercises its demos.
- **Attention dilution (extraction)**: The 17 demo apps plus their specs, configs, and CI files represent the single largest block of generic content in `ose-public`. Extracting them makes the remaining repo's identity (a product monorepo) legible at a glance.
- **Downstream confusion (extraction)**: A forker of `ose-primer` today is unsure whether the demos in `ose-public` are "ahead" or "behind" the primer's. After extraction, there is no ambiguity: `ose-primer` is authoritative, `ose-public` is product-only.
- **Library overhead (Commit I)**: `libs/clojure-openapi-codegen/`, `libs/elixir-cabbage/`, `libs/elixir-gherkin/`, `libs/elixir-openapi-codegen/` are orphaned the moment `a-demo-be-clojure-pedestal` and `a-demo-be-elixir-phoenix` are deleted. Leaving them in `libs/` after extraction creates four zero-consumer projects that still show up in `nx graph`, still have `project.json` targets, still need language-specific toolchains (Elixir, Clojure) in `npm run doctor`. Removal drops the lib count and shrinks the generic-toolchain footprint.
- **CLI surface dilution (Commit J)**: `rhino-cli` ships three commands whose only targets were demo apps — `java validate-annotations` (Java-specific), `contracts java-clean-imports` (Java OpenAPI codegen), `contracts dart-scaffold` (Dart/Flutter). After extraction, every Java and Dart app in `ose-public` is gone; these commands have zero production callers. Keeping them is dead weight in `rhino-cli --help`, dead code in `cmd/` and `internal/java/`, and dead coverage burden against the ≥90% threshold. Removing them sharpens `rhino-cli` to its ongoing role (generic repo hygiene: doctor, coverage, spec-coverage, agents, workflows, docs, env, git hooks).

### Expected benefits

- **_Judgment call:_** Per-sync review time drops from "hours of manual diff hunting" to "minutes of reviewing a structured proposal." No baseline measured — gut target.
- **_Judgment call:_** Zero propagations of product-specific material to the public primer, going forward. No prior incidents; the goal is to keep the count at zero.
- **Observable fact (awareness)**: After Phase 1 completes, `grep -rnI 'ose-primer' ose-public/ --include='*.md'` returns non-empty matches in at least `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/reference/related-repositories.md`, `docs/reference/README.md`, `governance/conventions/structure/ose-primer-sync.md`, `.claude/skills/repo-syncing-with-ose-primer/SKILL.md`, `.claude/agents/repo-ose-primer-adoption-maker.md`, and `.claude/agents/repo-ose-primer-propagation-maker.md`.
- **Observable fact (smoke test)**: After Phase 6 completes, running both agents in dry-run mode produces proposal reports in `generated-reports/` with valid UUID chains and valid UTC+7 timestamps, and both reports correctly identify at least one candidate change (since the current state of the two repos is non-identical).
- **Observable fact (primer parity)**: After Phase 7 completes, the parity report committed to `generated-reports/` enumerates every `apps/a-demo-*` path in `ose-public` and confirms each is byte-equivalent or strictly older than the corresponding path in `ose-primer`.
- **Observable fact (extraction executed)**: After Phase 8 completes, `ls ose-public/apps/ | grep -E '^a-demo-'` returns empty; `ls ose-public/specs/apps/a-demo/` returns "No such file or directory"; `ls ose-public/.github/workflows/ | grep -E '^test-a-demo-'` returns empty; `ls ose-public/docs/reference/demo-apps-ci-coverage.md` returns "No such file or directory".
- **Observable fact (post-extraction health)**: After Phase 9 completes, `nx affected -t typecheck lint test:quick spec-coverage` passes and `nx graph` contains no project whose name starts with `a-demo-`.
- **Observable fact (first real propagation)**: After Phase 10 completes, a PR against `wahidyankf/ose-primer:main` exists and is traceable from the propagation-maker's report.
- **Observable fact (first real adoption)**: After Phase 11 completes, an `ose-public` commit exists whose message or associated changes trace to an adoption-maker report; or the report explicitly states "no actionable findings" and the classifier coverage is full.

### Affected roles (hats + agents)

- **Maintainer** (single-maintainer repo) — primary consumer of both agents' reports; applies propagation findings to `ose-primer` via PR review; applies adoption findings to `ose-public` via direct commit or `repo-rules-fixer`-style flow.
- **`repo-ose-primer-adoption-maker`** (new agent) — consumes the shared skill; produces adoption reports.
- **`repo-ose-primer-propagation-maker`** (new agent) — consumes the shared skill; produces propagation reports; optionally creates branches and draft PRs in the primer clone.
- **`repo-rules-checker`** (existing agent) — audits the new governance doc (ose-primer sync convention) as part of normal passes; validates classifier internal consistency.
- **`docs-link-checker`** (existing agent) — validates new cross-references and external link to `github.com/wahidyankf/ose-primer` on normal cadence.
- **AI agents operating in `ose-public` sessions** (all) — consume the cross-references in `CLAUDE.md`/`AGENTS.md` and the new reference doc when asked about bootstrapping new OSE-style projects.
- **External readers of `ose-public` on GitHub** — discover the template via README and reference doc; no action required on their side.

Solo-maintainer framing: this BRD is a **content-placement container**, not a sign-off artifact. There is one maintainer collaborating with AI agents; code review (the PR against `ose-public`) is the only approval gate. No sponsor/stakeholder approval ceremonies exist.

## Business-Level Success Metrics

Each metric is either an **observable fact** that can be verified on demand, a **cited measurement**, a **qualitative reasoning** statement, or a labelled **judgment call**. Fabricated numeric targets are not used.

### Observable facts (preferred)

1. **Awareness layer present** — `grep -r 'ose-primer' ose-public/ --include='*.md' -l` returns non-empty matches in all of: `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/reference/related-repositories.md`, `docs/reference/README.md`, `governance/conventions/structure/ose-primer-sync.md`, `.claude/skills/repo-syncing-with-ose-primer/SKILL.md`, `.claude/agents/repo-ose-primer-adoption-maker.md`, `.claude/agents/repo-ose-primer-propagation-maker.md`.
2. **Classifier present and parseable** — `governance/conventions/structure/ose-primer-sync.md` contains a table whose rows are paths and whose columns include a "Direction" column with values exclusively from `{propagate, adopt, bidirectional, neither}`.
3. **Both agents present in both harnesses** — `.claude/agents/repo-ose-primer-adoption-maker.md` and `.claude/agents/repo-ose-primer-propagation-maker.md` exist; mirror twins exist in `.opencode/agent/`; filenames pass the Agent Naming Convention regex.
4. **Shared skill present in both harnesses** — `.claude/skills/repo-syncing-with-ose-primer/SKILL.md` exists; mirror in `.opencode/skill/`.
5. **Dry-run reports generated** — after Phase 6, `generated-reports/repo-ose-primer-adoption-maker__*__*__report.md` and `generated-reports/repo-ose-primer-propagation-maker__*__*__report.md` each exist with at least one finding.
6. **Primer-parity verified** — after Phase 7, `generated-reports/parity__*__report.md` exists listing every demo path and concluding with "parity verified: ose-public may safely remove".
7. **Demos extracted from `ose-public`** — after Phase 8, all of the following are absent from `ose-public`: every `apps/a-demo-*/` directory (17 directories), `specs/apps/a-demo/`, every `.github/workflows/test-a-demo-*.yml` file (14 files), `docs/reference/demo-apps-ci-coverage.md`. All inbound references in `README.md`, `CLAUDE.md`, `AGENTS.md`, `ROADMAP.md`, governance docs, reusable CI workflows, `codecov.yml`, `go.work`, `open-sharia-enterprise.sln` have been pruned or updated to point at `ose-primer`.
   7.1. **Orphan libs removed** — after Phase 8 Commit I, `ls libs/` contains no directory named `clojure-openapi-codegen`, `elixir-cabbage`, `elixir-gherkin`, or `elixir-openapi-codegen`; `libs/README.md` lists only the retained libraries; `nx graph` shows no project matching `clojure-*` or `elixir-*`.
   7.2. **`rhino-cli` trimmed** — after Phase 8 Commit J, `rhino-cli --help` contains no `java validate-annotations`, no `contracts java-clean-imports`, no `contracts dart-scaffold`; `ls apps/rhino-cli/cmd/ | grep -E '^(java|contracts)'` returns only surviving command files (none today since both groups collapse to zero subcommands); `apps/rhino-cli/internal/java/` does not exist; `apps/rhino-cli/README.md` documents only the surviving command surface; `nx run rhino-cli:test:quick` passes with coverage ≥ 90%.
8. **Post-extraction health** — after Phase 9, `nx affected -t typecheck lint test:quick spec-coverage` passes; `nx graph` has no `a-demo-*` project; `grep -rnI 'a-demo' ose-public/ --include='*.md' --include='*.yml' --include='*.yaml' --include='*.json' --include='*.toml' --include='Brewfile' --include='*.sln' --include='go.work'` returns matches ONLY in `plans/done/` (archived plans referencing demo work historically), `plans/in-progress/2026-04-18__ose-primer-separation/` (this plan), and the classifier row in `governance/conventions/structure/ose-primer-sync.md`.
9. **First real propagation applied** — after Phase 10, a PR exists at `https://github.com/wahidyankf/ose-primer/pulls` authored or co-authored by the maintainer with a branch name matching the propagation-maker's branch convention.
10. **First real adoption applied** — after Phase 11, an `ose-public` commit exists whose message or associated changes trace to an adoption-maker report ID; or the report explicitly states "no actionable findings" with full classifier coverage.
11. **No regressions** — `npm run lint:md` returns clean at every phase boundary. Product-app E2E suites still green after Phase 9.
12. **Link integrity** — `docs-link-checker` run after Phase 9 reports zero new broken internal links and confirms the external `https://github.com/wahidyankf/ose-primer` link is reachable. No dangling link to `docs/reference/demo-apps-ci-coverage.md` or any `apps/a-demo-*` path survives.

### Qualitative reasoning

- A system where classifier + agent + maintainer review each catch different error classes is strictly more robust than a system with only maintainer review, regardless of quantitative improvement.
- Separating adoption from propagation into two agents allows reports to be reviewed independently, which allows reviews to be smaller and more focused, which reduces review fatigue.

### Judgment calls (labelled)

- _Judgment call:_ Per-sync review time drops from hours to minutes. No baseline measured.
- _Judgment call:_ Zero propagations of FSL-licensed or product-specific material to the public primer, going forward. No prior incidents; goal is to keep count at zero.
- _Judgment call:_ The adoption loop yields at least one merged improvement to `ose-public` per quarter once in routine use, given that template maintenance pressure reveals friction points at a roughly quarterly cadence. No baseline.

## Business-Scope Non-Goals

- **No automated / scheduled sync.** Sync invocations remain human-triggered. Adding a cron/CI schedule is a future plan after confidence in the maker-pair reporting is established.
- **No sync checker/fixer triad in this plan.** If review load grows, a `repo-ose-primer-sync-checker` and `-fixer` pair can be added later — the maker pair's reports are structured to accept a checker pass without rewrite.
- **No license bridging.** FSL-1.1-MIT content does not flow to the MIT template. Classifier marks FSL-scoped paths as `neither`.
- **No content rewriting beyond mechanical filtering.** The propagator does not rewrite product-flavoured prose into generic prose. If a doc is product-specific in `ose-public` and its generic equivalent does not yet exist in `ose-primer`, the propagator reports the gap but does not invent the generic version. Writing a generic version is a separate authoring task.
- **No enforcement via git hooks.** Pre-commit / pre-push hooks stay focused on local quality gates. The sync agents are run on demand, not on every commit.
- **No `ose-infra` awareness in this plan.** Separate plan if ever needed.
- **No parent `ose-projects` awareness beyond what naturally flows from the plan.** The parent already treats `ose-public` and `ose-infra` as gitlinks; adding a third gitlink for `ose-primer` is out of scope.
- **No polyglot toolchain pruning in this plan.** After extraction, many of the 18+ toolchains `scripts/doctor/` enforces become unused in `ose-public`. Trimming them is a logical follow-up (it affects `Brewfile`, `scripts/doctor/`, `npm run doctor` scope) but is **out of scope here**.
- **No authoring of new demo content in `ose-primer`.** This plan extracts what is already present; it does not add demos, rename them, or refactor them. Demo evolution is `ose-primer`'s own concern post-extraction.
- **No re-licensing of extracted content.** The demo code is already MIT-licensed (per the per-directory licensing rule in `ose-public`), and `ose-primer` is MIT. No license change is performed or documented as part of extraction.
- **No downstream coordination.** If any external party has forked `ose-public` and depends on the demos living there, this plan does not coordinate with them. The extraction changelog entry in the `ose-public` root README and the `ose-primer` sync convention document the move for any future forker; that is the extent of the communication burden.
- **No revert-safety windowing.** The extraction commits are a permanent change to `main`. Git history preserves the pre-extraction state and `ose-primer` carries the demos going forward; no temporary tag, branch, or feature flag is added to make a later "undo" easier.

## Business Risks and Mitigations

### Risk 1 — Accidentally propagating FSL-licensed or product-specific material

**Severity**: Critical. A public commit in `ose-primer` containing FSL-licensed content creates a licensing inconsistency; a public commit containing unreleased product information is a privacy leak.

**Likelihood reduction**:

- Classifier in `governance/conventions/structure/ose-primer-sync.md` explicitly lists every `apps/*` and `specs/apps/*` path and tags product apps + FSL specs as `neither`.
- Shared skill's safety rules instruct the propagation-maker to refuse to emit a diff for any path tagged `neither`, even if the path changed in `ose-public`.
- Propagation-maker reports group findings by classifier tag; `neither`-tagged paths are never in the proposal body, only in an optional "classifier coverage" appendix for auditability.
- Maintainer reviews every propagation PR before merge.

**Impact mitigation** (if a bad propagation happens anyway):

- `ose-primer` commits are revertable; maintainer immediately reverts and force-rewrites only if the content is sensitive (deferred to maintainer judgement).
- Post-incident review updates the classifier to prevent the recurring pattern.

### Risk 2 — Classifier rot

**Severity**: High. As `ose-public` adds or removes paths, the classifier goes stale. A stale classifier either propagates content it should not, or drops content it should propagate.

**Mitigation**:

- `repo-rules-checker` runs a new audit: every top-level directory and every `apps/*` / `libs/*` / `specs/apps/*` subdirectory must appear in the classifier table. Orphan paths (present in the repo, absent from the classifier) are governance violations.
- Classifier audit runs as part of the normal repo-rules quality-gate cycle. Adding a new app therefore requires a classifier-table entry in the same PR.

### Risk 3 — Primer clone divergence or corruption

**Severity**: Medium. If the maintainer hand-edits the primer clone and forgets to push or reset, the next propagation/adoption pass operates on a stale baseline.

**Mitigation**:

- Both agents' default behaviour is `git fetch --prune && git checkout main && git reset --hard origin/main` before diffing.
- Agents refuse to run if the clone has uncommitted changes on a non-`main` branch that is tracking something other than `origin/main`, unless an explicit `--use-clone-as-is` flag is passed.

### Risk 4 — Review fatigue from noisy reports

**Severity**: Medium. If every trivial whitespace/wording change in `ose-public` becomes a propagation finding, the maintainer starts rubber-stamping and the safety property erodes.

**Mitigation**:

- Shared skill defines a noise-suppression filter: whitespace-only diffs, line-ending changes, and changes to files matching `.gitignore` patterns are excluded.
- Reports group findings by significance (structural / substantive / trivial) so the maintainer can review the top bucket first and skim or skip the tail.

### Risk 5 — Clone path collision with other tools

**Severity**: Low. `$OSE_PRIMER_CLONE/` is the agreed primer clone path. If another tool expects the same path, conflicts arise.

**Mitigation**:

- Path documented in the shared skill and in the governance convention.
- Path is user-chosen via the `OSE_PRIMER_CLONE` env var (convention default: `~/ose-projects/ose-primer`, a sibling of the `ose-public` checkout); lives outside any Nx workspace so Nx does not walk it.

### Risk 6 — Agent duplication with future checker/fixer pair

**Severity**: Low. When a checker/fixer pair is eventually added, the maker pair's reports must be structured to feed the checker without rewrite.

**Mitigation**:

- Shared skill defines the report schema (sections, frontmatter, finding structure) explicitly. The checker/fixer pair (future plan) consumes the same schema.

### Risk 7 — Agent naming convention drift

**Severity**: Low. Role `maker` is the intended suffix. If a later reviewer argues for `-syncer` or `-adopter` as a role, the convention must be amended first.

**Mitigation**:

- Plan tech-docs analyses the naming choice and commits to `maker`.
- If a future reviewer insists on a new role, that is a convention amendment (separate plan), not a rename under this plan.

### Risk 8 — Demo content lost because primer-parity check was skipped

**Severity**: Critical. If the extraction commits land in `ose-public` without first verifying that `ose-primer` carries every demo path at equal-or-newer state, a demo-side fix that happened in `ose-public` and was never propagated to the primer is permanently lost from the public, actively-maintained surface.

**Likelihood reduction**:

- Phase 7 is a hard precondition to Phase 8 in the delivery checklist.
- The Phase 7 parity report is committed to `generated-reports/` and referenced in the Phase 8 commit messages. Phase 8 commits without a valid parity report reference are caught in review.
- The propagation-maker in parity-check mode enumerates every demo path and asserts byte-equivalence-or-older for each; any mismatch aborts the phase and triggers a catch-up propagation before extraction resumes.

**Impact mitigation** (if a demo-side fix is lost anyway):

- `ose-public` git history preserves every pre-extraction SHA. The lost fix can be recovered from history and re-applied to `ose-primer` via a follow-up propagation PR.

### Risk 9 — Dangling demo references survive extraction

**Severity**: High. After the apps and workflows are deleted, references to them in governance docs, README listings, CI reusables, configs (`codecov.yml`, `go.work`, `.sln`), scripts, and inline examples in explanation docs will 404 or 500 if not pruned in the same change set.

**Mitigation**:

- Delivery checklist includes a **grep sweep** step before Phase 8 commits as a final close-out: `grep -rnI 'a-demo' ose-public/ --include='*.md' --include='*.yml' --include='*.yaml' --include='*.json' --include='*.toml' --include='Brewfile' --include='*.sln' --include='go.work'`. Allowed matches are limited to `plans/done/`, this plan's own folder, and the classifier table row in the sync convention. Every other match is a finding to resolve.
- `docs-link-checker` re-runs after Phase 9 confirms no broken internal links point at any `apps/a-demo-*` or `docs/reference/demo-apps-ci-coverage.md` path.

### Risk 10 — Extraction breaks a shared reusable workflow that product apps depend on

**Severity**: Medium. The `_reusable-*.yml` workflows under `.github/workflows/` are consumed by both demo and product pipelines. Removing only the demo callers is safe; modifying or removing a reusable itself could break product pipelines.

**Mitigation**:

- Delivery checklist includes an enumeration step: list every workflow calling `_reusable-*`, classify each caller as `a-demo` or product, remove only the demo callers, leave the reusables untouched.
- Post-extraction, run `test-and-deploy-ayokoding-web.yml`, `test-and-deploy-organiclever.yml`, `test-and-deploy-oseplatform-web.yml`, `pr-quality-gate.yml`, `codecov-upload.yml`, `pr-validate-links.yml` manually or via next push and confirm they still succeed.

### Risk 11 — `codecov.yml` or `go.work` left pointing at deleted projects

**Severity**: Medium. `codecov.yml` has per-project flags for demo backends; `go.work` has `use` directives for Go-based demos; `open-sharia-enterprise.sln` has project references for C# demos. Leaving these references after directory removal causes upload or build failures.

**Mitigation**:

- Delivery checklist treats each of these three config files as a named cleanup item under Phase 8.
- Post-extraction `nx graph` + `go work sync` + `dotnet sln list` return clean states.

### Risk 12 — Extraction happens during active demo work in `ose-primer`

**Severity**: Low. If a maintenance change to the primer's demos is in flight while the extraction runs, the parity check could pass and yet the primer's `main` could advance before the extraction commits land, leaving `ose-public` momentarily "behind."

**Mitigation**:

- The maintainer does not open unrelated primer PRs during the Phase 7 → Phase 8 window.
- The parity report records the primer's `main` SHA at the time of verification; any later divergence is surfaced by the next propagation run, not by this plan.

### Risk 13 — Third parties discover extraction via broken external links

**Severity**: Low. External content (blog posts, tweets, AI model training corpora) may link to `wahidyankf/ose-public/tree/main/apps/a-demo-be-golang-gin` or similar. After extraction, those links 404.

**Mitigation**:

- The new reference doc `docs/reference/related-repositories.md` explains the move and points readers at `wahidyankf/ose-primer`.
- The root README's "Related Repositories" section names the template prominently.
- A brief changelog entry under the README (or in `ROADMAP.md`) records the extraction date and motivation.

## Related Documents

- [prd.md](./prd.md) — Product perspective: personas, user stories, Gherkin acceptance criteria.
- [tech-docs.md](./tech-docs.md) — Technical perspective: classifier, agent specs, skill, governance doc.
- [delivery.md](./delivery.md) — Sequential delivery checklist.
- [Licensing Convention](../../../governance/conventions/structure/licensing.md) — FSL vs MIT split governing classifier decisions.
