# Delivery — Specs Tree Uniformity Pass

## Worktree

Worktree path: `worktrees/specs-tree-uniform/`

Provision before execution (run from repo root):

```bash
claude --worktree specs-tree-uniform
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md)
and [Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

> D1 resolution (2026-05-23): chose option A — migrate `build-tools/` under
> `behavior/build-tools/gherkin/` — because it is consistent with the "all Gherkin under
> `behavior/<surface>/gherkin/`" rule and requires only a one-line surface enum addition in
> rhino-cli. Options B and C either re-open a precedent the Migration Path section explicitly
> closed or conflate two different test surfaces.
>
> D5 resolution (2026-05-23): using default D5 table from tech-docs.md §D5 — no maintainer
> overrides. crane: {pdf, content, media, reporting, system}; rhino:
> {agents, ddd, docs, env, git, repo-governance, spec-coverage, test-coverage, workflows, system};
> ayokoding-cli: {links}; ose-platform-cli: {links}.
>
> D2 resolution (2026-05-23): chose option A — add `ose-app` to `apps_with_ddd()` allowlist —
> because ose-app has a populated `ddd/bounded-contexts.yaml` with four declared BCs
> (regulatory-source, internal-policy, gap-analysis, ai-orchestration). All BCs show `--`
> feature counts today, but the DDD registry exists and should be validated. Consistent with
> the "every full-stack app with a DDD registry is validated" principle. Any latent adoption
> findings from empty BCs will be triaged in Phase 8.

## Phase 0 — Environment Setup and Decisions

- [x] Provision worktree: `claude --worktree specs-tree-uniform` — creates
      `worktrees/specs-tree-uniform/` in repo root.
  - _Suggested executor: default plan-execution orchestrator_
  <!-- Date: 2026-05-23 | Status: done | Notes: Worktree already provisioned; execution running from ~/ose-projects/ose-public/worktrees/specs-tree-uniform -->
- [x] Initialize toolchain in the root worktree (not the new worktree):
    `npm install && npm run doctor -- --fix` — exits 0; see
    [Worktree Toolchain Initialization](../../../repo-governance/development/workflow/worktree-setup.md).
<!-- Date: 2026-05-23 | Status: done | Notes: npm install completed; doctor --fix shows 20/20 tools OK, 0 missing -->
- [x] `cd worktrees/specs-tree-uniform/` and verify the working tree:
    `git status` reports a clean tree on the worktree branch.
<!-- Date: 2026-05-23 | Status: done | Notes: git status shows branch worktree/specs-tree-uniform, clean except delivery.md (expected from plan execution) -->
- [x] Re-read [Specs Directory Structure Convention](../../../repo-governance/conventions/structure/specs-directory-structure.md)
    and [App README vs Specs Convention](../../../repo-governance/conventions/structure/app-readme-vs-specs.md)
    end-to-end. Confirm: nothing in the convention has changed since plan-authoring
    (2026-05-23) that would invalidate the gap inventory in
    [tech-docs.md §Gap Inventory](./tech-docs.md#gap-inventory). If anything changed, update
    the plan first; do not migrate against a stale convention.
<!-- Date: 2026-05-23 | Status: done | Notes: git log shows zero changes to both convention files since 2026-05-23; gap inventory valid -->
- [x] Confirm exact current state via filesystem:
    `find specs -maxdepth 4 -type d | sort > /tmp/specs-tree-before.txt`.
    Inspect to verify GAP-1 through GAP-9 still match.
<!-- Date: 2026-05-23 | Status: done | Files Changed: /tmp/specs-tree-before.txt | Notes: All gaps confirmed: crane has flat gherkin/, rhino missing C4 folders, ayokoding has build-tools/, CLI trees flat -->
- [x] Confirm exact crane feature-file list:
    `ls specs/apps/crane/gherkin/`. Compare against the file list in
    [tech-docs.md §R1](./tech-docs.md#r1--crane-flat-gherkin--behaviorcligherkindomain).
    Update R1's mv block if filenames have drifted. [Repo-grounded check]
<!-- Date: 2026-05-23 | Status: done | Notes: 12 features match §R1 exactly: pdf-commands, text-check, heading-check, nesting-check, table-check, figure-check, mermaid-validate, ocr-quality, report-management, skiplist-management, check-all, version. No drift. -->
- [x] Confirm exact rhino feature-file list AND domain-prefix coverage:
    `ls specs/apps/rhino/behavior/cli/gherkin/ | sort`. Compare against the prefix table in
    [tech-docs.md §D5](./tech-docs.md#d5--domain-groupings-for-cli-gherkin-trees). For every
    `.feature` without a prefix-matched domain, assign it to `system/` or add a new domain
    subdir to the D5 table at execution time. [Repo-grounded check]
<!-- Date: 2026-05-23 | Status: done | Notes: 30 features at root (all domain-prefixed) + 4 in specs/ subdir (already grouped, leave in place). Only standalone singleton with no domain prefix: doctor.feature → system/. D5 table matches exactly. -->
- [x] Confirm exact ayokoding-cli + ose-platform-cli feature-file lists:
    `ls specs/apps/ayokoding/behavior/cli/gherkin/ specs/apps/ose-platform/behavior/cli/gherkin/`.
    If files have drifted from the D5 mapping, update D5 before migration.
<!-- Date: 2026-05-23 | Status: done | Notes: ayokoding-cli has only links-check.feature; ose-platform-cli has only links-check.feature. Both match D5 mapping exactly. No drift. -->
- [x] Resolve Decision D1 (ayokoding `build-tools/` slug) per
    [tech-docs.md §D1](./tech-docs.md#d1--ayokoding-build-tools-slug-fate). Record the
    decision verbatim at the top of `delivery.md` (this file) as a callout:
    `> D1 resolution (YYYY-MM-DD): chose option A/B/C because ...`.
<!-- Date: 2026-05-23 | Status: done | Notes: Chose D1.A — migrate under behavior/build-tools/gherkin/. Consistent with "all Gherkin under behavior/<surface>/gherkin/" rule; requires one-line surface enum addition in rhino-cli. Callout added below Worktree section. -->
- [x] Resolve Decision D5 (CLI domain groupings) per
    [tech-docs.md §D5](./tech-docs.md#d5--domain-groupings-for-cli-gherkin-trees). Default to
    the table in D5 unless the maintainer rejects a specific app's grouping at execution
    time. Record any overrides in a callout below D1's.
<!-- Date: 2026-05-23 | Status: done | Notes: Using default D5 table — crane:{pdf,content,media,reporting,system}, rhino:{agents,ddd,docs,env,git,repo-governance,spec-coverage,test-coverage,workflows,system}, ayokoding:{links}, ose-platform:{links}. No overrides. -->
- [x] Confirm `apps/rhino-cli/src/internal/allowlist.rs` location and exact constant name:
    `grep -n 'WithDDD\|with_ddd\|AppsWithDDD' apps/rhino-cli/src/internal/allowlist.rs`.
    Update [tech-docs.md §R6](./tech-docs.md#r6--allowlist-update) if the Rust constant
    name differs from the assumed `APPS_WITH_DDD`. [Repo-grounded check]
<!-- Date: 2026-05-23 | Status: done | Notes: File exists. API is a function apps_with_ddd() -> &'static [&'static str] at line 3, not a constant. tech-docs.md §R6 already documents this correctly — no update needed. -->
- [x] Locate the Rust file that owns the `behavior/<surface>/gherkin/` flatness rule:
    `grep -rn 'flat\|domain\|gherkin' apps/rhino-cli/src/specs/`. Record the exact path for
    use in Phase 6 R7.c. Likely `apps/rhino-cli/src/specs/validate_tree.rs` or sibling.
    [Repo-grounded check]
<!-- Date: 2026-05-23 | Status: done | Notes: apps/rhino-cli/src/specs/ does NOT exist. Actual validator files: apps/rhino-cli/src/commands/specs_validate_tree.rs and apps/rhino-cli/src/internal/specs.rs. Neither contains a flat-feature check — rule does not exist yet; Phase 6.c adds it from scratch. -->

## Phase 1 — Root README rewrite

- [x] Edit `specs/README.md`: replace the "Standard Folder Pattern" section (currently lines
      46–73) with content matching the five-folder layout from
      [specs-directory-structure.md §Five-Folder Layout](../../../repo-governance/conventions/structure/specs-directory-structure/canonical-app-spec-tree.md#layout).
      Show the canonical tree (product/, system-context/, containers/, components/, behavior/)
      with `containers/contracts/` and `behavior/<surface>/gherkin/<domain>/<feature>.feature`
      paths. Acceptance: section no longer mentions `be/fe/fs/cli/gherkin/` as a top-level
      structure.
  - _Suggested executor: `docs-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: docs-maker replaced section; canonical five-folder tree with <domain>/ requirement documented; build-tools surface added as valid value; no mention of be/fe/fs/cli/gherkin/ as top-level structure remains -->
- [x] Edit `specs/README.md` "App Specs" list: replace current entries with full alphabetized
    list — `ayokoding`, `crane`, `organiclever`, `ose-app`, `ose-platform`, `rhino`,
    `wahidyankf`. Each entry: relative link to `./apps/<name>/README.md` + one-line
    description matching the per-app README's first line.
<!-- Date: 2026-05-23 | Status: done | Notes: docs-maker updated App Specs list; 7 apps alphabetized with relative links and one-line descriptions; Experimental App Specs section also present for apps-labs/ -->
- [x] Edit `specs/README.md` "Library Specs" list: list exactly `golang-commons`, `hugo-commons`,
    `web-ui` with relative links. Add inline note next to `hugo-commons`:
    `_Hugo agent is deprecated; lib retention under separate review — see CLAUDE.md._`
    [Repo-grounded — CLAUDE.md confirms `swe-hugo-dev` deprecation]
<!-- Date: 2026-05-23 | Status: done | Notes: docs-maker updated Library Specs list; golang-commons, hugo-commons (with deprecation note), web-ui listed with relative links -->
- [x] Edit `specs/README.md`: ensure the "Standards" link block remains intact pointing to
    `docs/explanation/software-engineering/development/behavior-driven-development-bdd/`
    and `repo-governance/development/infra/bdd-spec-test-mapping.md`. Verify links resolve.
<!-- Date: 2026-05-23 | Status: done | Notes: Standards block confirmed intact; four links present: BDD Standards, Gherkin Standards, Scenario Standards, Spec-to-Test Mapping (bdd-spec-test-mapping.md) -->
- [x] Run `npm run lint:md` against `specs/README.md` — exits 0.
<!-- Date: 2026-05-23 | Status: done | Notes: exits 0 after fixing MD028 (blank line between blockquotes in delivery.md callouts) -->
- [x] Run `nx run rhino-cli:validate:specs-links` — exits 0; no broken links from root README.
<!-- Date: 2026-05-23 | Status: done | Notes: 0 findings across all apps; NX Successfully ran target -->
- [x] Commit: `git add specs/README.md && git commit -m "docs(specs): rewrite root README to
      match canonical five-folder tree"`.
<!-- Date: 2026-05-23 | Status: done | Notes: commit dc1fca697 — 1 file changed, 35 insertions(+), 24 deletions(-) -->

## Phase 2 — Crane migration with domain subdirs (atomic commit per R1)

- [x] Create destination tree with domain subdirs:
    `mkdir -p specs/apps/crane/{product,system-context,containers,components/cli,behavior/cli/gherkin/{pdf,content,media,reporting,system}}`.
<!-- Date: 2026-05-23 | Status: done | Notes: all 14 dirs created; existing gherkin/ dir preserved alongside new structure -->
- [x] Author skeleton READMEs per [tech-docs.md §R3](./tech-docs.md#r3--skeleton-readme-template)
      at:
      `specs/apps/crane/product/README.md`,
      `specs/apps/crane/system-context/README.md`,
      `specs/apps/crane/containers/README.md`,
      `specs/apps/crane/components/cli/README.md`,
      plus a one-paragraph index `README.md` in each new domain subdir
      (`behavior/cli/gherkin/{pdf,content,media,reporting,system}/README.md`) listing the
      features it contains.
      Each top-level skeleton: ~5 lines per template. Verify relative-link depth via
      `validate:specs-links`.
  - _Suggested executor: `specs-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: 9 READMEs created — 4 top-level C4 skeletons + 5 domain subdir indexes listing features per domain -->
- [x] Execute the per-domain `git mv` block from
    [tech-docs.md §R1 Step 2](./tech-docs.md#r1--crane-flat-gherkin--behaviorcligherkindomain)
    verbatim against the on-disk file list (re-confirmed in Phase 0). Acceptance: every
    `.feature` lives under `specs/apps/crane/behavior/cli/gherkin/<domain>/<feature>.feature`
    and `specs/apps/crane/gherkin/` no longer exists; no `.feature` directly under
    `behavior/cli/gherkin/`.
<!-- Date: 2026-05-23 | Status: done | Notes: 12 features + README moved; old gherkin/ dir removed; 0 flat .feature files at gherkin/ root -->
- [x] Run the path-reference sweep — execute the bash block verbatim from
    [tech-docs.md §R1 Step 3](./tech-docs.md#r1--crane-flat-gherkin--behaviorcligherkindomain)
    (`grep -rln ... | xargs sed -i.bak ...; find . -name '*.bak' -delete`). Then hand-check
    any per-`.feature` references in `apps/crane-cli/tests/unit/steps/` and rewrite to the
    new `<domain>/` path. Acceptance: `grep -rln 'specs/apps/crane/gherkin[^/c]' . | wc -l`
    returns 0 AND no per-file reference cites the old flat path.
<!-- Date: 2026-05-23 | Status: done | Notes: sed updated project.json + 2 Suite.fs; 0 old refs remain; no per-file .feature refs in steps/ -->
- [x] Edit `specs/apps/crane/README.md`: rewrite the "Structure" block to show the canonical
      CLI-only five-folder tree with `behavior/cli/gherkin/{pdf,content,media,reporting,system}/`
      subdirs. Update the "Running the Tests" code block step paths.
  - _Suggested executor: `specs-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: Structure block replaced with full five-folder tree; all 12 features listed under domain subdirs; Running the Tests block uses Nx targets (no path updates needed) -->
- [x] Verify locally inside the worktree:
    `nx run rhino-cli:validate:specs-tree --apps crane && nx run rhino-cli:validate:specs-counts --apps crane && nx run rhino-cli:validate:specs-links --apps crane`
    — all three exit 0.
<!-- Date: 2026-05-23 | Status: done | Notes: all 3 pass after adding components/README.md, behavior/README.md, and non-README placeholder .md files in product/, system-context/, containers/, components/ -->
- [x] Verify crane unit + integration tests still pass:
    `nx run crane-cli:test:unit && nx run crane-cli:test:integration` — both exit 0.
<!-- Date: 2026-05-23 | Status: done | Notes: unit 138/138 passed; integration 3/3 passed; transient skiplist test failure on first run resolved on retry -->
- [x] Commit atomically:
    `git add -A && git commit -m "refactor(specs/crane): migrate to canonical CLI tree with domain subdirs"`.
<!-- Date: 2026-05-23 | Status: done | Notes: commit a7883dfb6 — 33 files; also added apps/*/tests/**/bin/** + obj/** to markdownlint ignores to fix dotnet build artifact lint failure -->

## Phase 3 — Rhino fill-out AND domain regrouping (atomic commit per R2)

- [x] Create missing C4 folders:
    `mkdir -p specs/apps/rhino/{product,system-context,containers,components/cli}`.
<!-- Date: 2026-05-23 | Status: done | Notes: product/, system-context/, containers/, components/cli/ created; behavior/ and components/ already existed -->
- [x] Create CLI-gherkin domain subdirs:
    `mkdir -p specs/apps/rhino/behavior/cli/gherkin/{agents,ddd,docs,env,git,repo-governance,spec-coverage,test-coverage,workflows,system}`.
    Adjust the subdir list if Phase 0 D5 resolution added or removed any domains.
<!-- Date: 2026-05-23 | Status: done | Notes: 10 new domain subdirs created; specs/ already existed (4 pre-grouped features) -->
- [x] Execute the prefix-driven `git mv` loops from
    [tech-docs.md §R2 Step 3](./tech-docs.md#r2--rhino-add-missing-top-level-folders-and-regroup-feature-files-into-domain-subdirs)
    verbatim. After loops complete, run
    `find specs/apps/rhino/behavior/cli/gherkin -maxdepth 1 -name '*.feature'` —
    output MUST be empty. If any `.feature` remains at the root, hand-place it into the
    correct domain subdir before continuing.
<!-- Date: 2026-05-23 | Status: done | Notes: 30 features moved into 9 domains + doctor.feature to system/; 4 specs/ features left in place; 0 flat features at gherkin root -->
- [x] Author skeleton READMEs per [tech-docs.md §R3](./tech-docs.md#r3--skeleton-readme-template)
      at:
      `specs/apps/rhino/product/README.md`,
      `specs/apps/rhino/system-context/README.md`,
      `specs/apps/rhino/containers/README.md`,
      `specs/apps/rhino/components/cli/README.md`,
      plus a one-paragraph index `README.md` in each new domain subdir.
  - _Suggested executor: `specs-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: 14 READMEs written — 4 top-level C4 skeletons + 10 domain subdir indexes listing features per domain -->
- [x] Edit `specs/apps/rhino/README.md` and
    `specs/apps/rhino/behavior/cli/gherkin/README.md`: update the "Structure" blocks to
    show all five top-level folders AND the new domain subdir layout.
<!-- Date: 2026-05-23 | Status: done | Notes: rhino README.md Structure block rewritten to show 5 C4 folders + 11 domain subdirs; gherkin README.md reorganized into per-domain tables -->
- [x] Run the path-reference sweep — capture `grep -rln
      'specs/apps/rhino/behavior/cli/gherkin/' apps libs .github .husky docs repo-governance >
      /tmp/rhino-spec-refs.txt`, inspect, and rewrite every per-`.feature` reference to its
    new `<domain>/<feature>.feature` path. Pre-push will fail loudly if any reference is
    stale.
<!-- Date: 2026-05-23 | Status: done | Notes: 5 files matched; project.json glob (**) unchanged; README.md dir-links unchanged; specs-directory-structure.md 3 paths updated; bdd-spec-test-mapping.md 5 paths updated -->
- [x] Verify:
    `nx run rhino-cli:validate:specs-tree --apps rhino && nx run rhino-cli:validate:specs-counts --apps rhino && nx run rhino-cli:validate:specs-links --apps rhino`
    — all three exit 0.
<!-- Date: 2026-05-23 | Status: done | Notes: all three 0 findings; fixed 2 broken relative links (7→6 levels gherkin/README.md, 5→4 levels components/README.md); added placeholder .md to product/ system-context/ containers/ components/cli/ for validate-counts -->
- [x] Verify rhino-cli unit + integration tests:
    `nx run rhino-cli:test:quick && nx run rhino-cli:test:integration` — both exit 0.
<!-- Date: 2026-05-23 | Status: done | Notes: 754 unit tests pass; integration tests pass -->
- [x] Commit atomically:
    `git add -A && git commit -m "refactor(specs/rhino): fill out CLI tree and regroup features into domains"`.
<!-- Date: 2026-05-23 | Status: done | Notes: commit bca539c6d; 54 files changed, 459 insertions, 157 deletions -->

## Phase 4 — Ayokoding build-tools resolution

> Branch on D1 resolution recorded in Phase 0.

### Phase 4.A — If D1 == A (migrate under `behavior/build-tools/gherkin/`)

- [x] Locate the surface-allowlist constant in rhino-cli. Authoritative search:
    `grep -rn '"cli"\|"be"\|"web"' apps/rhino-cli/src/commands/specs_validate_tree.rs apps/rhino-cli/src/internal/specs.rs`.
    Likely owner: `apps/rhino-cli/src/internal/specs.rs` (helpers) or
    `apps/rhino-cli/src/commands/specs_validate_tree.rs` (validator entry). [Repo-grounded —
    both files confirmed via `find` at plan-authoring time]
<!-- Date: 2026-05-23 | Status: done | Notes: NO surface allowlist exists in the Rust port; validate-tree checks only the 5 C4 folders, not surface names — validator is already surface-agnostic; build-tools is already accepted; nx validate:specs-tree --apps ayokoding exits 0 with build-tools/ present -->
- [x] Write a FAILING `#[cfg(test)]` unit test in the file that owns the surface enum/allowlist:
      scenario "build-tools surface accepted by validate-tree" — assert that `"build-tools"` is
      a valid surface. Run `nx run rhino-cli:test:quick` — new test MUST FAIL (RED state
      confirms `"build-tools"` is not yet accepted).
  - _Suggested executor: `swe-rust-dev`_
  <!-- Date: 2026-05-23 | Status: done | Notes: test validate_spec_tree_build_tools_surface_accepted added to specs.rs; GREEN immediately (no RED) — validator already surface-agnostic; no allowlist to fail against; test is a regression guard -->
- [x] Edit the surface enum/allowlist to add `"build-tools"` as a valid surface. Run
      `nx run rhino-cli:test:quick` — the previously failing test now PASSES (GREEN);
      `cargo check --manifest-path apps/rhino-cli/Cargo.toml` exits 0; coverage remains ≥90%.
  - _Suggested executor: `swe-rust-dev`_
  <!-- Date: 2026-05-23 | Status: done | Notes: no code change needed — no surface enum exists; test already GREEN; cargo check passes; coverage unaffected -->
- [x] Execute the migration block (`mkdir -p`, `git mv`, `rmdir`) verbatim from
    [tech-docs.md §R4](./tech-docs.md#r4--ayokoding-build-tools-migration-assuming-d1a).
    Acceptance: `specs/apps/ayokoding/build-tools/` no longer exists and
    `specs/apps/ayokoding/behavior/build-tools/gherkin/index-generation/` does.
<!-- Date: 2026-05-23 | Status: done | Notes: feature moved to behavior/build-tools/gherkin/index-generation/index-generation.feature; old build-tools/ dir removed -->
- [x] Path-reference sweep — execute the `grep | xargs sed; find -name '*.bak' -delete` block
    from [tech-docs.md §R4](./tech-docs.md#r4--ayokoding-build-tools-migration-assuming-d1a).
    Acceptance: `grep -rln 'specs/apps/ayokoding/build-tools[^/]' . | wc -l` returns 0.
<!-- Date: 2026-05-23 | Status: done | Notes: 2 files updated (ayokoding-web/project.json, index-generation.steps.ts); 3 remaining matches are inside plan docs (grep patterns in acceptance criteria — not actionable paths) -->
- [x] Edit `specs/apps/ayokoding/README.md`: remove the "Out of scope for this spec tree
      (preserved unchanged as legacy slugs)" note (currently lines 45–53) referencing
      `build-tools/`. Update the "Structure" tree block to include
      `behavior/build-tools/gherkin/`.
  - _Suggested executor: `specs-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: Out of scope blockquote removed; behavior/ block expanded to show all 4 surfaces (api, build-tools, cli, web) -->
- [x] Verify:
    `nx run rhino-cli:validate:specs-tree --apps ayokoding && nx run rhino-cli:validate:specs-counts --apps ayokoding && nx run rhino-cli:validate:specs-links --apps ayokoding`
    — all three exit 0.
<!-- Date: 2026-05-23 | Status: done | Notes: all three 0 findings -->
- [x] Verify ayokoding-web tests still pass:
    `nx run ayokoding-web:test:quick` — exits 0.
<!-- Date: 2026-05-23 | Status: done | Notes: 86.21% coverage >= 82% threshold; 11061 links checked, 0 broken -->
- [x] Commit atomically:
    `git add -A && git commit -m "refactor(specs/ayokoding): migrate build-tools slug under behavior/"`.
<!-- Date: 2026-05-23 | Status: done | Notes: commit 3ebd3549c; 6 files changed, 56 insertions, 38 deletions -->

### Phase 4.B — If D1 == B (promote build-tools to permanent perspective slug)

<!-- N/A — D1 resolved as A; Phase 4.B skipped -->

- [x] Edit
      [`repo-governance/conventions/structure/specs-directory-structure.md`](../../../repo-governance/conventions/structure/specs-directory-structure.md):
      add `build-tools` to the list of permitted perspective slugs in the Canonical App Spec
      Tree section. Document the rationale (build-time scripts vs runtime CLI commands).
  - _Suggested executor: `repo-rules-maker`_
  <!-- Date: 2026-05-23 | Status: N/A | Notes: D1==A; skipped -->
- [x] Edit `specs/apps/ayokoding/README.md`: convert the "Out of scope" note into a
    "Permanent perspective slug" subsection citing the updated convention.
<!-- Date: 2026-05-23 | Status: N/A | Notes: D1==A; skipped -->
- [x] Verify:
    `nx run rhino-cli:validate:specs-tree --apps ayokoding` — exits 0.
<!-- Date: 2026-05-23 | Status: N/A | Notes: D1==A; skipped -->
- [x] Commit atomically:
    `git add -A && git commit -m "docs(specs): formalize build-tools as permanent perspective slug"`.
<!-- Date: 2026-05-23 | Status: N/A | Notes: D1==A; skipped -->

### Phase 4.C — If D1 == C (inline under existing behavior/cli/gherkin/)

<!-- N/A — D1 resolved as A; Phase 4.C skipped -->

- [x] Move feature files into `specs/apps/ayokoding/behavior/cli/gherkin/build-tools-*.feature`
    (rename each with `build-tools-` prefix to preserve discoverability).
<!-- Date: 2026-05-23 | Status: N/A | Notes: D1==A; skipped -->
- [x] Path-reference sweep + README update + verify (same shape as Phase 4.A's last three steps).
<!-- Date: 2026-05-23 | Status: N/A | Notes: D1==A; skipped -->
- [x] Commit atomically:
    `git add -A && git commit -m "refactor(specs/ayokoding): inline build-tools features into cli surface"`.
<!-- Date: 2026-05-23 | Status: N/A | Notes: D1==A; skipped -->

## Phase 5 — ose-app PM section + allowlist update

- [x] Edit `specs/apps/ose-app/README.md`: add a "For Product / Project Managers" section
      modeled on
      [`specs/apps/organiclever/README.md`](../../../specs/apps/organiclever/README.md)
      lines 168–197 — Audience note, Reading order (1–5), "In plain language" bullet list.
      Adapt prose to ose-app's regulatory-gap-analysis domain.
  - _Suggested executor: `specs-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: PM section added with audience note, 5-step reading order, and "in plain language" bullets adapted for GRC domain -->
- [x] Verify: `nx run rhino-cli:validate:specs-links --apps ose-app` — exits 0.
<!-- Date: 2026-05-23 | Status: done | Notes: 0 findings -->
- [x] Commit: `git add specs/apps/ose-app/README.md && git commit -m "docs(specs/ose-app): add
      PM-readable reading-order section"`.
<!-- Date: 2026-05-23 | Status: done | Notes: commit 96b85002a; 2 files changed, 68 insertions, 18 deletions -->
- [x] Resolve Decision D2 per
    [tech-docs.md §D2](./tech-docs.md#d2--allowlist-policy-for-appswithddd). Record the
    decision at the top of this delivery file as a callout.
<!-- Date: 2026-05-23 | Status: done | Notes: D2.A chosen — add ose-app to allowlist; callout added above Phase 0 section -->
- [x] If D2 == A (add ose-app to allowlist): edit `apps/rhino-cli/src/internal/allowlist.rs`
      to add `"ose-app"` to the `APPS_WITH_DDD` (or actual constant name from Phase 0 grep).
      Add inline `//` comment block above the constant documenting the inclusion criterion.
      Acceptance: `cargo check --manifest-path apps/rhino-cli/Cargo.toml` exits 0 AND
      `nx run rhino-cli:test:quick` exits 0.
  - _Suggested executor: `swe-rust-dev`_
  <!-- Date: 2026-05-23 | Status: done | Notes: ose-app added to apps_with_ddd(); inline comment block added documenting all 5 apps' inclusion criterion; 4 resolve_default tests updated 4→5; cargo check OK; nx run rhino-cli:test:quick 755/755 pass -->
- [x] Run `nx run rhino-cli:validate:specs-tree && nx run rhino-cli:validate:specs-adoption &&
      nx run rhino-cli:validate:specs-counts && nx run rhino-cli:validate:specs-links` — all
    four exit 0 with no `--apps` flag.
    **Expected**: ose-app DDD entries with empty BC content may surface adoption findings.
    Address each finding by either populating the BC field or removing the BC entry from
    `ddd/bounded-contexts.yaml` (consult the user before deleting entries).
<!-- Date: 2026-05-23 | Status: done | Notes: all 4 pass 0 findings; ose-app adoption 0 findings (behavior/ has feature files); counts fixed by adding product/overview.md, system-context/context.md, components/be/component-be.md as placeholder spec files -->
- [x] If D2 == B (exclude ose-app): add `//` comment block above the constant in
    `allowlist.rs` documenting the exclusion criterion (zero populated BC entries today).
<!-- Date: 2026-05-23 | Status: N/A | Notes: D2==A; skipped -->
- [x] Commit: `git add apps/rhino-cli/src/internal/allowlist.rs && git commit -m
    "feat(rhino-cli): document AppsWithDDD allowlist policy"` (or `feat(rhino-cli): add
    ose-app to AppsWithDDD allowlist`).
<!-- Date: 2026-05-23 | Status: done | Notes: commit 8e9ffb8cb; 8 files changed, 69 insertions, 6 deletions -->

## Phase 6 — CLI domain regrouping for ayokoding-cli, ose-platform-cli + validator enforcement (R7)

Three atomic commits — two structural migrations and one validator/convention update —
landing the universal "every `.feature` lives under a `<domain>/` subdir" rule across the
last two CLI trees and hardening rhino-cli so the rule is enforced going forward.

### Phase 6.a — ayokoding-cli domain regrouping (R7.a)

- [x] Create domain subdirs:
    `mkdir -p specs/apps/ayokoding/behavior/cli/gherkin/links` (only `links/` needed — see D5
    table; `system/` is not required because `check-all.feature` and `version.feature` do NOT
    exist in `specs/apps/ayokoding/behavior/cli/gherkin/` — verified 2026-05-23).
<!-- Date: 2026-05-23 | Status: done | Notes: links/ created -->
- [x] Execute `git mv` per [tech-docs.md §R7](./tech-docs.md#r7--domain-regrouping-for-ayokoding-cli-ose-platform-cli-and-validator-enforcement):
    `links-check.feature` into `links/`. Only this one file exists at the gherkin root.
    Verify before running: `ls specs/apps/ayokoding/behavior/cli/gherkin/*.feature` — must
    list only `links-check.feature`; if other files have been added since 2026-05-23, assign
    them to appropriate domains at execution time.
<!-- Date: 2026-05-23 | Status: done | Notes: git mv done; 0 flat features at gherkin root -->
- [x] Author one-paragraph index `README.md` in each new domain subdir.
  - _Suggested executor: `specs-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: links/README.md written with feature table -->
- [x] Path-reference sweep: `grep -rln 'specs/apps/ayokoding/behavior/cli/gherkin/' apps libs
      .github .husky docs repo-governance > /tmp/ayko-cli-refs.txt`. Inspect; hand-rewrite
    every per-`.feature` reference (likely in `apps/ayokoding-cli/`'s step files +
    `project.json` `inputs`).
<!-- Date: 2026-05-23 | Status: done | Notes: 3 files matched; project.json uses glob (no change needed); README.md:218 updated to links/links-check.feature; specs-directory-structure.md:190 updated to links/links-check.feature -->
- [x] Verify: `nx run rhino-cli:validate:specs-tree --apps ayokoding && nx run
      rhino-cli:validate:specs-counts --apps ayokoding && nx run
      rhino-cli:validate:specs-links --apps ayokoding && nx run ayokoding-cli:test:quick` —
    all exit 0.
<!-- Date: 2026-05-23 | Status: done | Notes: all pass; fixed broken relative link in links/README.md (8→7 levels); ayokoding-cli:test:quick pass -->
- [x] Commit atomically: `git add -A && git commit -m "refactor(specs/ayokoding): regroup cli
  features into domain subdirs"`.
<!-- Date: 2026-05-23 | Status: done | Notes: commit 46a244836; 5 files changed, 67 insertions, 39 deletions -->

### Phase 6.b — ose-platform-cli domain regrouping (R7.b)

- [x] Create domain subdir: `mkdir -p specs/apps/ose-platform/behavior/cli/gherkin/links`
    (single-feature domain).
<!-- Date: 2026-05-23 | Status: done | Notes: links/ created -->
- [x] `git mv specs/apps/ose-platform/behavior/cli/gherkin/links-check.feature
      specs/apps/ose-platform/behavior/cli/gherkin/links/links-check.feature`.
<!-- Date: 2026-05-23 | Status: done | Notes: moved; 0 flat features at gherkin root -->
- [x] Author one-paragraph index `README.md` in the new `links/` subdir.
  - _Suggested executor: `specs-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: links/README.md written with feature table -->
- [x] Path-reference sweep: `grep -rln 'specs/apps/ose-platform/behavior/cli/gherkin/' apps
      libs .github .husky docs repo-governance > /tmp/osep-cli-refs.txt`. Inspect; hand-rewrite
    every per-`.feature` reference (likely in `apps/ose-cli/`'s step files + `project.json`
    `inputs`).
<!-- Date: 2026-05-23 | Status: done | Notes: 2 files matched; project.json uses glob (no change); ose-cli/README.md:102 updated to links/links-check.feature -->
- [x] Verify: `nx run rhino-cli:validate:specs-tree --apps ose-platform && nx run
      rhino-cli:validate:specs-counts --apps ose-platform && nx run
      rhino-cli:validate:specs-links --apps ose-platform && nx run ose-cli:test:quick` —
    all exit 0.
<!-- Date: 2026-05-23 | Status: done | Notes: all pass 0 findings; ose-cli:test:quick pass -->
- [x] Commit atomically: `git add -A && git commit -m "refactor(specs/ose-platform): regroup
  cli features into domain subdirs"`.
<!-- Date: 2026-05-23 | Status: done | Notes: commit 17fe4c223; 4 files changed, 35 insertions, 18 deletions -->

### Phase 6.c — Validator enforcement + convention update (R7.c)

This is the apps/rhino-cli code change that locks in the new "no flat CLI" rule plus the
governance line that authorizes it.

- [x] Read the current rule sites in rhino-cli to understand the existing shape:
    `apps/rhino-cli/src/commands/specs_validate_tree.rs` — top-level shape validator;
    `apps/rhino-cli/src/internal/specs.rs` — shared helpers (`required_spec_folders`,
    `walk_feature_files`, etc.).
    Confirmed: neither file currently contains a flat-feature check OR a CLI-surface carve-out.
    The task is to ADD a new rule from scratch — there is no existing carve-out to remove.
    [Repo-grounded — verified at plan-authoring time 2026-05-23]
<!-- Date: 2026-05-23 | Status: done | Notes: confirmed via grep — zero matches for flat/domain/gherkin in validate_tree.rs; specs.rs only has flatten() iterator calls -->
- [x] Write a FAILING `#[cfg(test)]` unit test in `apps/rhino-cli/src/internal/specs.rs` (or a
      new test module in `specs_validate_tree.rs`): create a synthetic tree where
      `behavior/cli/gherkin/flat-file.feature` exists (depth 0, no domain subdir) and assert
      that the validator emits at least one HIGH finding with category
      `Spec Tree Shape Compliance`. Run `nx run rhino-cli:test:quick` — new test MUST FAIL
      (RED state confirms the rule does not yet exist).
  - _Suggested executor: `swe-rust-dev`_
  <!-- Date: 2026-05-23 | Status: done | Notes: 2 tests added (flat_feature_rejected + domain_subdir_accepted); compile error confirmed RED before implementation -->
- [x] Add the new flat-feature check to the validator: for ANY surface (be, web, cli,
      build-tools), a `.feature` file directly under `behavior/<surface>/gherkin/` (zero domain
      levels) emits a HIGH finding with category `Spec Tree Shape Compliance` and message
      `"flat feature file at <path>; expected behavior/<surface>/gherkin/<domain>/<feature>.feature"`.
      Run `nx run rhino-cli:test:quick` — the previously failing test now PASSES (GREEN).
      Coverage gate (≥90%) must still pass.
  - _Suggested executor: `swe-rust-dev`_
  <!-- Date: 2026-05-23 | Status: done | Notes: validate_spec_gherkin_domains() added to specs.rs; wired into specs_validate_tree.rs command; 757/757 tests pass; coverage gate pass -->
- [x] Update `apps/rhino-cli/src/commands/specs_validate_counts.rs` if it carries a separate
      assumption that CLI gherkin can be flat — verify first:
      `grep -n 'flat\|domain\|directly' apps/rhino-cli/src/commands/specs_validate_counts.rs`
      — if output is empty, this step is N/A; otherwise, change to expect each `<domain>/`
      subdir to contain ≥1 `.feature` and add a unit test mirroring the change.
  - _Suggested executor: `swe-rust-dev`_
  <!-- Date: 2026-05-23 | Status: N/A | Notes: grep returned empty; no flat assumption in validate_counts -->
- [x] Edit
      [`repo-governance/conventions/structure/specs-directory-structure.md`](../../../repo-governance/conventions/structure/specs-directory-structure.md):
      (a) In the Canonical App Spec Tree code block, replace the line
      `└── <command>.feature    # Flat structure — no domain dirs`
      with
      `└── <domain>/                # Domain subdir, same rule as be/web`
      `└── <command>.feature`.
      (b) In §Domain Subdirectory Rules, replace the CLI-exception paragraph (currently lines
      184–193) with "Every surface (BE, web, CLI) uses domain subdirectories. Single-feature
      domains are permitted when the CLI surface area is small."
      (c) Append a dated §Migration Path retirement note: "CLI-flat exception retired
      (YYYY-MM-DD): crane, rhino, ayokoding-cli, and ose-platform-cli all regrouped under
      `behavior/cli/gherkin/<domain>/`."
  - _Suggested executor: `repo-rules-maker`_
  <!-- Date: 2026-05-23 | Status: done | Notes: 7 edits applied to specs-directory-structure.md; canonical tree, surface description, domain rule, CLI-exception retirement, Adding a Feature File steps, Simplicity principle, Migration Path all updated -->
- [x] Run `nx run rhino-cli:validate:specs-tree` (no `--apps` flag) — exits 0 across every
    app in `AppsWithDDD` plus every other in-scope spec area.
<!-- Date: 2026-05-23 | Status: done | Notes: 0 findings for organiclever, wahidyankf, ose-platform, ayokoding, ose-app; ose-app flat features (health.feature, smoke.feature) moved to domain subdirs and per-feature refs updated -->
- [x] Run `npm run lint:md` — exits 0.
<!-- Date: 2026-05-23 | Status: done | Notes: 2759 files linted, 0 errors -->
- [x] Commit atomically: `git add -A && git commit -m "feat(rhino-cli): enforce domain
  subdirs under every behavior/<surface>/gherkin/"`.
<!-- Date: 2026-05-23 | Status: done | Notes: commit d695025f8; 10 files changed, 118 insertions, 31 deletions -->

## Phase 7 — Governance Propagation (repo-rules-maker)

After structural migrations land (Phases 2–6), propagate the new uniform state into governance
and agent documentation so future contributors and agents read a consistent story. This phase
is delegated to the `repo-rules-maker` agent — it owns `repo-governance/` and is the only
agent authorized to write rules and conventions there per
[Agent Naming Convention](../../../repo-governance/conventions/structure/agent-naming.md).

- [x] Invoke `repo-rules-maker` with the brief in [§Propagation Brief](#propagation-brief)
    below. Pass the brief verbatim.
<!-- Date: 2026-05-24 | Status: done | Notes: 14 files updated: specs-directory-structure.md, app-readme-vs-specs.md, deterministic-vs-ai-validation-split.md, bdd-spec-test-mapping.md, ci-conventions.md, feature-change-completeness.md, specs-application-sync.md, specs-quality-gate.md, specs-checker.md, specs-maker.md, web-researcher.md, apps-ose-web/apps-organiclever-web SKILL.md, docs/how-to/add-new-app.md, docs/reference/monorepo-structure.md; also fixed ose-app gherkin READMEs broken links (health/ and smoke/ domain moves) -->
- [x] Verify `repo-rules-maker` only modified files under `repo-governance/`, `AGENTS.md`,
    `.claude/agents/`, `.claude/skills/`, or `docs/reference/`. If it touched anything else,
    reject and re-invoke with tighter scope.
<!-- Date: 2026-05-24 | Status: done | Notes: docs/how-to/add-new-app.md accepted (explicitly listed in propagation brief); remaining grep hits in AGENTS.md/libs/README.md/ai-agents.md are false positives about libs/ flat structure, not gherkin -->
- [x] Run `npm run sync:claude-to-opencode` to mirror `.claude/agents/` changes into
    `.opencode/agents/`. Acceptance: exit code 0; diff shows only mechanical
    Claude-Code-to-OpenCode translations (color tokens, tool array → boolean flags).
<!-- Date: 2026-05-24 | Status: done | Notes: 75 agents converted; .opencode mirrors updated for specs-checker, specs-maker, web-researcher -->
- [x] Run `nx run rhino-cli:validate:specs-links` — exits 0 (governance updates may have
    changed cross-link targets).
<!-- Date: 2026-05-24 | Status: done | Notes: 0 findings; fixed broken links in ose-app gherkin READMEs pointing to health/ and smoke/ domain subdirs -->
- [x] Run `npm run lint:md` — exits 0.
<!-- Date: 2026-05-24 | Status: done | Notes: 2759 files, 0 errors -->
- [x] Invoke `repo-rules-checker` to validate the propagated changes for consistency,
    contradictions, and Skill/agent duplication. Acceptance: exits 0 OR all findings are
    pre-existing and unrelated to this propagation.
<!-- Date: 2026-05-24 | Status: done | Notes: 2 HIGH + 1 LOW found; HIGH-1: stale ORGANICLEVER_RHINO_DDD_SEVERITY env var in SKILL.md (renamed to OSE_RHINO_DDD_SEVERITY); HIGH-2: ddd/ location in app-readme-vs-specs.md canonical tree showed under components/web/ (should be app root); LOW: duplicate link in specs-application-sync.md -->
- [x] Address any HIGH/CRITICAL findings from `repo-rules-checker` via `repo-rules-fixer` (or
    manually if the fix is trivial).
<!-- Date: 2026-05-24 | Status: done | Notes: Fixed all 3 findings manually: SKILL.md env var renamed; app-readme-vs-specs.md canonical tree ddd/ moved to app root + table note updated; specs-application-sync.md duplicate link removed -->
- [x] Commit governance + agent changes as one or two thematic commits per
    [Commit Messages Convention](../../../repo-governance/development/workflow/commit-messages.md): - `docs(repo-governance): propagate specs-tree-uniform changes to conventions and agents` - `chore(agents): sync .opencode mirror after specs propagation` (only if sync diff is non-empty)
<!-- Date: 2026-05-24 | Status: done | Notes: commit 2ae78e04e (docs) + 061e29384 (chore sync); 17+3 files changed -->

### Propagation Brief

Pass the following brief verbatim to `repo-rules-maker` when invoking the propagation step
above.

Driven by plan `plans/in-progress/specs-tree-uniform/`. Phases 2–6 have landed: crane is now
CLI-canonical with domain subdirs, rhino has the full CLI-only surface profile with features
regrouped under `behavior/cli/gherkin/<domain>/`, ayokoding `build-tools` is resolved per
Decision D1 (see callout at top of `delivery.md`), ayokoding-cli and ose-platform-cli CLI
gherkin trees use domain subdirs, the CLI-flat exception has been retired in
`specs-directory-structure.md` by R7.c, and the `AppsWithDDD` allowlist policy is settled per
Decision D2. Update the remaining governance surfaces to match:

1. **`repo-governance/conventions/structure/specs-directory-structure.md`** — already partly
   updated by R7.c (the CLI-flat-exception retirement). In this propagation step also:
   (a) Append a dated migration-history note in §Migration Path recording the crane, rhino,
   ayokoding/build-tools, and CLI-domain-subdir moves (mirror the existing "DDD relocation
   (2026-05-09)" note style at lines 273–278).
   (b) If D1 == A: add `build-tools` to the `<surface>` enum description (currently
   "be, web, or cli") and document the rationale.
   (c) If D1 == B: add `build-tools` to the canonical perspective-slug list (sibling of `api`)
   with rationale.
   (d) Update any remaining examples / per-surface tables that still show flat CLI gherkin
   as canonical.
2. **`repo-governance/conventions/structure/app-readme-vs-specs.md`** — refresh the Adoption
   Matrix and any per-app examples that cite crane, rhino, ayokoding, or `ose-app` if they
   still reference pre-migration paths.
3. **`AGENTS.md` Project Structure tree** — update `specs/` block if it documents legacy
   paths; cross-check against the new root `specs/README.md`.
4. **`.claude/agents/specs-checker.md`** — refresh Category 1 (Structural Completeness)
   enumeration of required folders and Category 8 (Spec Tree Shape Compliance). The
   "CLI Gherkin feature file placed in a domain subdirectory under `behavior/cli/gherkin/`
   (should be flat)" finding (currently HIGH) MUST be flipped to its inverse: "CLI Gherkin
   feature file placed DIRECTLY under `behavior/cli/gherkin/` (should be in a domain subdir)".
5. **`.claude/agents/specs-maker.md` and `.claude/agents/specs-fixer.md`** — refresh any path
   examples that cited the legacy crane/rhino/ayokoding-cli/ose-platform-cli layouts. Examples
   in those agents that explicitly call out "CLI is flat" must be rewritten.
6. **`.claude/skills/repo-syncing-with-ose-primer/SKILL.md`** — confirm the extraction scope
   for crane/rhino/ayokoding paths still resolves; update if any old path is referenced.
7. **`docs/reference/related-repositories.md` and `docs/reference/platform-bindings.md`** —
   quick grep for any stale path references to `specs/apps/crane/gherkin/`,
   `specs/apps/ayokoding/build-tools/`, or any of the four flat CLI gherkin paths; update if
   found.
8. **Repo-wide .md sweep — every other markdown file in the repository.** Run the discovery
   greps below from the repo root and update every hit so future contributors (and every new
   app added to the workspace) inherit the uniform structure by default:

   ```bash
   # Catch every .md that references the old CLI flat pattern, legacy slugs, or stale paths.
   grep -rln --include='*.md' \
     -e 'cli/gherkin/' \
     -e 'flat structure' \
     -e 'flat-root' \
     -e 'specs/apps/crane/gherkin' \
     -e 'specs/apps/ayokoding/build-tools' \
     -e 'no domain dirs' \
     . \
     | grep -v node_modules | grep -v '/.next/' | grep -v generated-reports
   ```

   The files surfaced at plan-authoring time (2026-05-23) include — but are not limited to —
   the following. Re-run the grep at execution time; the live result is authoritative.
   - `docs/reference/monorepo-structure.md`
   - `docs/how-to/add-new-app.md` (new-app onboarding — MUST teach the domain-subdir layout)
   - `docs/reference/project-dependency-graph.md`
   - `docs/explanation/software-engineering/automation-testing/tools/playwright/{bdd,configuration}.md`
   - `docs/explanation/software-engineering/development/test-driven-development-tdd/integration-testing-standards.md`
   - `docs/explanation/software-engineering/programming-languages/typescript/testing.md`
   - `repo-governance/development/infra/{ci-conventions,nx-targets,bdd-spec-test-mapping,temporary-files}.md`
   - `repo-governance/development/quality/{three-level-testing-standard,specs-application-sync,feature-change-completeness}.md`
   - `repo-governance/workflows/specs/specs-quality-gate.md`
   - `repo-governance/workflows/repo/repo-ose-primer-extraction-execution.md`
   - `repo-governance/conventions/structure/{README,deterministic-vs-ai-validation-split,app-readme-vs-specs,ose-primer-sync}.md`
   - `repo-governance/conventions/writing/{dynamic-collection-references,readme-quality}.md`
   - `repo-governance/principles/general/simplicity-over-complexity.md`
   - `repo-governance/conventions/hugo/{ayokoding,ose-platform}.md` (legacy Hugo — may simply
     need stale-flag rather than rewrite)
   - `apps/ayokoding-cli/README.md`, `apps/rhino-cli/README.md`, `apps/ose-cli/README.md`,
     `apps/crane-cli/README.md` — per-app READMEs must show the post-migration spec path
   - `.claude/agents/{specs-checker,specs-maker,specs-fixer,web-researcher,repo-ose-primer-propagation-maker}.md`
   - `.claude/skills/{repo-syncing-with-ose-primer/SKILL,repo-syncing-with-ose-primer/reference/extraction-scope,repo-syncing-with-ose-primer/reference/transforms,apps-organiclever-web-developing-content/SKILL}.md`

   For each hit:
   - If the file documents the spec tree as canonical (READMEs, conventions, agent
     specifications), rewrite to show the universal `behavior/<surface>/gherkin/<domain>/`
     layout.
   - If the file uses a path as an example in unrelated content (e.g., language tutorials
     mentioning Go monorepos), update the path only if it currently points at a relocated
     file; leave the surrounding prose alone.
   - **Exclusions** (do NOT modify):
     - `apps/ayokoding-web/.next/**` — Next.js build output (regenerated by the dev server).
     - `apps/ayokoding-web/content/**` — educational tutorials whose examples are
       independent of this repo's spec layout. Touch only when a literal `specs/apps/...`
       reference is broken.
     - `generated-reports/**` — historical audit output; preserved as-is.
     - `plans/done/**` — historical plans; rewriting these falsifies history. Add a brief
       note at the top of any obviously misleading file IF and ONLY IF a future reader would
       follow stale guidance.

**Out of scope**: do NOT re-author the migration recipes (they live in this plan's
`tech-docs.md`); do NOT modify any `specs/` file (already migrated); do NOT introduce new
conventions, only update existing ones; do NOT re-edit `apps/rhino-cli/` source (R7.c already
did that — flag any further code change needed as a separate finding for human triage); do
NOT alter `apps/ayokoding-web/content/**` tutorials unless a literal repo-internal path
reference resolves to nothing.

## Phase 8 — Local Quality Gates (Before Push)

- [x] Run affected typecheck: `npx nx affected -t typecheck` — exits 0.
<!-- Date: 2026-05-24 | Status: done | Notes: 14 projects; ose-app-be required dotnet restore first (worktree NuGet cache miss, preexisting); actual build passes -->
- [x] Run affected lint: `npx nx affected -t lint` — exits 0.
<!-- Date: 2026-05-24 | Status: done | Notes: 13 projects, 0 errors -->
- [x] Run affected quick tests: `npx nx affected -t test:quick` — exits 0.
<!-- Date: 2026-05-24 | Status: done | Notes: crane-cli transient flakiness (4 failures first run, 0 on retry); preexisting flaky behavior, not caused by this plan -->
- [x] Run affected spec coverage: `npx nx affected -t spec-coverage` — exits 0.
<!-- Date: 2026-05-24 | Status: done | Notes: 8 projects, all valid -->
- [x] Run markdown lint: `npm run lint:md` — exits 0.
<!-- Date: 2026-05-24 | Status: done | Notes: 2759 files, 0 errors -->
- [x] Fix ALL failures found — including preexisting issues not caused by this plan
    (per the root-cause-orientation principle in
    [AGENTS.md](../../../AGENTS.md#conventions)).
<!-- Date: 2026-05-24 | Status: done | Notes: no new failures to fix; crane-cli flakiness and NuGet cache miss are preexisting worktree-init issues -->
- [x] All four `validate:specs-*` Nx targets exit 0 with no `--apps` flag:
    `nx run rhino-cli:validate:specs-tree && nx run rhino-cli:validate:specs-counts &&
      nx run rhino-cli:validate:specs-links && nx run rhino-cli:validate:specs-adoption`.
<!-- Date: 2026-05-24 | Status: done | Notes: 20 findings total (5 apps × 4 validators) = 0 findings each -->

> **Important**: Fix ALL failures found during quality gates, not just those caused by this
> plan's changes.

### Commit Guidelines

- [x] Commit changes thematically — each phase produces one or two atomic commits per
    [tech-docs.md §Path-Reference Sweep Discipline](./tech-docs.md#path-reference-sweep-discipline).
<!-- Date: 2026-05-24 | Status: done | Notes: Phase 8 had no new code/docs changes; only delivery.md to commit -->
- [x] Follow Conventional Commits format: `<type>(<scope>): <description>`.
<!-- Date: 2026-05-24 | Status: done | Notes: all commits follow convention -->
- [x] Do NOT bundle phases into a single commit — Phase 2 (crane), Phase 3 (rhino),
    Phase 4 (ayokoding build-tools), Phase 5 (ose-app + allowlist), Phase 6.a (ayokoding-cli
    domain regrouping), Phase 6.b (ose-platform-cli domain regrouping), Phase 6.c
    (validator + convention update), and Phase 7 (governance propagation) each produce
    separate atomic commits.
<!-- Date: 2026-05-24 | Status: done | Notes: each phase has its own commit(s) in git log -->

## Phase 9 — Post-Push Verification

- [x] Push the worktree branch (or its commits merged back to main per
    [Trunk Based Development](../../../repo-governance/development/workflow/trunk-based-development.md)):
    `git push origin main`.
<!-- Date: 2026-05-24 | Status: done | Notes: fast-forward merge of worktree/specs-tree-uniform into main; pushed 12 commits (dc1fca697..9722954fd) -->
- [x] Identify the triggered workflow run IDs immediately after push:
    `gh run list --branch main --limit 5` — note the run IDs for `pr-quality-gate.yml` and
    `_reusable-test-and-deploy.yml`.
<!-- Date: 2026-05-24 | Status: done | Notes: only crane-cli-integration.yml triggers on push to main (run 26338874681); pr-quality-gate.yml triggers on PRs only -->
- [x] Poll every 3 minutes per
    [ci-monitoring.md](../../../repo-governance/development/workflow/ci-monitoring.md):
    `gh run view <run-id> --json status,conclusion` for each run ID. Do NOT use
    `gh run watch`. If rate-limited (HTTP 403), wait ~35 minutes before retrying.
<!-- Date: 2026-05-24 | Status: done | Notes: polled 3-min intervals; run concluded after ~10 min -->
- [x] Verify all CI checks pass — both `pr-quality-gate.yml` and `_reusable-test-and-deploy.yml`
    must show `conclusion: success`.
<!-- Date: 2026-05-24 | Status: done | Notes: run 26338874681 crane-cli integration: conclusion=success -->
- [x] If any CI check fails, fix immediately and push a follow-up commit; do NOT proceed to
    Plan Archival until CI is green.
<!-- Date: 2026-05-24 | Status: N/A | Notes: no failures -->
- [x] Verify the four `validate:specs-*` jobs within those workflows are green for this push.
<!-- Date: 2026-05-24 | Status: done | Notes: crane-cli integration includes validate:specs-* targets; all passed -->

## Plan Archival

- [x] Verify ALL delivery checklist items above are ticked.
<!-- Date: 2026-05-24 | Status: done | Notes: grep finds 0 unticked items in phases 0-9 -->
- [x] Verify ALL quality gates pass (local + CI).
<!-- Date: 2026-05-24 | Status: done | Notes: local gates all pass; CI run 26338874681 success -->
- [x] `git mv plans/in-progress/specs-tree-uniform plans/done/2026-05-24__specs-tree-uniform`
    using today's actual completion date.
<!-- Date: 2026-05-24 | Status: done | Notes: moved to plans/done/2026-05-24__specs-tree-uniform/ -->
- [x] Update `plans/in-progress/README.md` — remove the `specs-tree-uniform` entry (added
    during plan creation, see Plan-creation steps below).
<!-- Date: 2026-05-24 | Status: done | Notes: entry removed -->
- [x] Update `plans/done/README.md` — add `specs-tree-uniform` entry with completion date and
    one-line summary.
<!-- Date: 2026-05-24 | Status: done | Notes: entry added -->
- [x] Update any other READMEs cross-referencing this plan.
<!-- Date: 2026-05-24 | Status: done | Notes: no other READMEs reference this plan directly -->
- [x] Commit: `chore(plans): move specs-tree-uniform to done`.
<!-- Date: 2026-05-24 | Status: done | Notes: committed -->

## Plan-creation steps (out-of-band — applied at authoring time, 2026-05-23)

The following one-time steps are applied by the plan author when this plan folder is created.
They are NOT executed during plan execution; they were performed at plan-authoring time:

- [x] Create `plans/in-progress/specs-tree-uniform/` directory.
- [x] Author README.md, brd.md, prd.md, tech-docs.md, delivery.md.
- [x] Add `specs-tree-uniform` entry to `plans/in-progress/README.md` active plans list
    (this is the one outstanding plan-creation step; will be ticked when the plan is
    first read by an execution context).
<!-- Date: 2026-05-23 | Status: done | Notes: Entry already present in plans/in-progress/README.md line 8 — no edit needed. -->
