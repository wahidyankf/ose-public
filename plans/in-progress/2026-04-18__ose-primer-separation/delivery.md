# Delivery Checklist — ose-primer Separation

**One checkbox = one concrete, independently verifiable action.** Phases MUST execute in order because later phases depend on earlier artifacts. Phase 8 (extraction) is gated by Phase 7 (primer parity) — Phase 8 MUST NOT start until the Phase 7 parity report's verdict reads `parity verified: ose-public may safely remove`.

Legend: **[P]** = checkpoint; **[C]** = commit boundary; **[G]** = gate that blocks further phases.

## Phase 1 — Foundation: Awareness layer + governance convention stub

Goal: ground the plan's anchor docs before any agent is authored. Produces enough context for human readers + AI agents to understand the sync story.

### 1.1 — Reference doc

- [ ] Create `docs/reference/related-repositories.md` with Diátaxis `reference` frontmatter (category: reference; subcategory: ecosystem; tags: reference, ose-primer, ecosystem; created/updated: 2026-04-18).
- [ ] Write the doc body: one paragraph on what `ose-primer` is; one paragraph on the `ose-public` → `ose-primer` upstream-downstream relationship; one paragraph on license difference (FSL-1.1-MIT product apps vs MIT template); an explicit "Non-Goals" section ("this doc does not describe sync automation or release cadence"); one paragraph pointing at `governance/conventions/structure/ose-primer-sync.md` for the classifier.
- [ ] Add a dated "As of" marker in the doc body ("As of 2026-04-18 …").
- [ ] Verify with `markdownlint-cli2 docs/reference/related-repositories.md` — zero findings.

### 1.2 — Reference index

- [ ] Edit `docs/reference/README.md`: add a link to `related-repositories.md` under an appropriate heading ("Ecosystem" — create the heading if absent).
- [ ] Bump the `updated:` field in the reference index frontmatter to 2026-04-18.

### 1.3 — Governance convention stub

- [ ] Create `governance/conventions/structure/ose-primer-sync.md` with frontmatter (title, description, category: explanation, subcategory: conventions, tags: conventions, structure, ose-primer, sync, cross-repo; created/updated: 2026-04-18).
- [ ] Write the convention's Purpose, Principles Implemented/Respected (Explicit Over Implicit, Simplicity Over Complexity, Automation Over Manual), and Scope sections.
- [ ] Write the "The two repositories" section naming `ose-public` and `ose-primer` with URLs and license notes.
- [ ] Write the "Sync directions" section defining `propagate`, `adopt`, `bidirectional`, `neither`.
- [ ] Write the "Transforms" section defining `identity` and `strip-product-sections`.
- [ ] Write the "Classifier table" section with the authoritative table (transcribe from `tech-docs.md` §Classifier Specification; tag `apps/a-demo-*` and `specs/apps/a-demo/**` as `propagate` initially — Phase 8 Commit H flips them to `neither`).
- [ ] Write the "Orphan-path rule" section (paths unmatched default to `neither` but new top-level paths SHOULD be added explicitly).
- [ ] Write the "Audit rule" section (`repo-rules-checker` validates classifier coverage and stale rows; include the whitelist for intentionally zero-matching extraction rows, to be activated in Phase 8 Commit H).
- [ ] Write the "Agents that consume this convention" section naming the adoption-maker, propagation-maker, and `repo-rules-checker`.
- [ ] Write the "Clone management" section documenting `$OSE_PRIMER_CLONE/` and the pre-flight steps (pointer to the skill for implementation detail).
- [ ] Write the "Safety invariants" section summarising the hard rules (no `neither` propagation, dry-run default, clean-tree precondition, transform-gap abstention).
- [ ] Write the "Relationship to other conventions" section cross-linking Licensing, File Naming, Agent Naming, Plans Organization.
- [ ] Verify the doc passes `markdownlint-cli2 governance/conventions/structure/ose-primer-sync.md` with zero findings.

### 1.4 — Conventions index

- [ ] Edit `governance/conventions/structure/README.md`: add a link to `ose-primer-sync.md` under the conventions listing.
- [ ] Bump `updated:` to 2026-04-18.

### 1.5 — Root README awareness

- [ ] Edit `README.md`: add a "## Related Repositories" section (placed after "Documentation" and before "Motivation") with a single sub-heading for `ose-primer` including: one-line description, link to `https://github.com/wahidyankf/ose-primer`, link to `docs/reference/related-repositories.md`, link to `governance/conventions/structure/ose-primer-sync.md`.

### 1.6 — CLAUDE.md awareness

- [ ] Edit `CLAUDE.md`: add a "## Related Repositories" section (placed near the bottom, before "General Guidelines for working with Nx") with prose establishing: `ose-primer` is a downstream template derived from `ose-public`; `ose-public` is the upstream source of truth; MIT-licensed template vs FSL-1.1-MIT product apps; link to GitHub URL, reference doc, and sync convention.

### 1.7 — AGENTS.md awareness

- [ ] Edit `AGENTS.md`: add an equivalent "## Related Repositories" section mirroring the CLAUDE.md addition (adapt tone/structure to match AGENTS.md conventions).

### 1.8 — Plan index

- [ ] Edit `plans/in-progress/README.md`: add this plan (`2026-04-18__ose-primer-separation`) to the active-plans list with a one-line description.

### 1.9 — Commit Phase 1

- [ ] Stage the 1.1–1.8 files explicitly (no `git add .`).
- [ ] Commit with message: `docs(repo): surface ose-primer as downstream template and add sync convention stub`.
- [ ] **[C]** Verify `git log -1 --stat` shows only the expected files.

## Phase 2 — Classifier table finalisation

Goal: extend Phase 1's stub classifier table to cover every `ose-public` top-level path so the audit rule is effective.

### 2.1 — Exhaustive path enumeration

- [ ] Run `ls -1 ose-public/ | sort` and record every top-level entry.
- [ ] Run `ls -1 ose-public/apps/ | sort` and record every app directory.
- [ ] Run `ls -1 ose-public/libs/ | sort` and record every lib.
- [ ] Run `ls -1 ose-public/specs/apps/ | sort` and record every spec area.
- [ ] Run `ls -1 ose-public/.claude/agents/*.md | sort` and record every agent.
- [ ] Run `ls -1 ose-public/.claude/skills/ | sort` and record every skill.
- [ ] Run `ls -1 ose-public/docs/ | sort`, then `ls -1 ose-public/docs/*/ | sort` and record the docs tree one level deep.
- [ ] Run `ls -1 ose-public/governance/ | sort`, then `ls -1 ose-public/governance/*/ | sort`.

### 2.2 — Classifier coverage

- [ ] For each enumerated path, verify at least one row in `governance/conventions/structure/ose-primer-sync.md`'s classifier table matches (literal or glob).
- [ ] For every path NOT matched, add a row (direction + transform + rationale) to the classifier table.
- [ ] Verify no classifier row matches zero actual paths at this point (exception: the `apps/a-demo-*` and `specs/apps/a-demo/**` rows WILL match paths pre-Phase-8 and will intentionally match nothing post-Phase-8 — that whitelist is documented in the audit-rule section).

### 2.3 — Commit Phase 2

- [ ] Commit with message: `docs(governance): complete classifier coverage for ose-primer sync convention`.
- [ ] **[C]** Verify only `governance/conventions/structure/ose-primer-sync.md` changed.

## Phase 3 — Shared skill authoring

Goal: author the skill that both sync agents consume. Skill encapsulates classifier parsing, clone management, report schema, transforms, and the extraction-scope list.

### 3.1 — Skill directory + `SKILL.md`

- [ ] Create directory `.claude/skills/repo-syncing-with-ose-primer/`.
- [ ] Create `.claude/skills/repo-syncing-with-ose-primer/SKILL.md` with frontmatter (name, description, context: inline, version: 1.0.0).
- [ ] Write the skill body with sections: Classifier lookup, Clone management summary (pointer to reference module), Transform implementations summary (pointer to reference module), Noise-suppression rules, Significance classification, Report format summary (pointer to reference module), Extraction scope summary (pointer to reference module), Invocation patterns for each agent mode.

### 3.2 — Reference modules

- [ ] Create `.claude/skills/repo-syncing-with-ose-primer/reference/classifier-parsing.md` specifying: how to locate `governance/conventions/structure/ose-primer-sync.md`, how to parse the classifier table (H3 "Classifier table" → next markdown table, one row per entry), how to resolve glob patterns, how to handle the orphan-path default.
- [ ] Create `.claude/skills/repo-syncing-with-ose-primer/reference/clone-management.md` specifying:
  - **Clone path**: resolved from `OSE_PRIMER_CLONE` env var; convention default `~/ose-projects/ose-primer`; no absolute-path leakage in committed docs.
  - **First-time setup**: `export OSE_PRIMER_CLONE="$HOME/ose-projects/ose-primer"` + `git clone` command.
  - **Pre-flight steps**: env-var-set check, `.git` presence, origin remote URL check, `fetch --prune`, clean-tree check, main-branch check; `--use-clone-as-is` escape hatch.
  - **Apply-mode mechanics via git worktrees** (NOT branch-in-place): worktree path `$OSE_PRIMER_CLONE/.claude/worktrees/sync-<utc-timestamp>-<short-uuid>/`; branch naming rule (`sync/<utc-timestamp>-<short-uuid>`); rationale (parallel safety, clean main state, cleaner failure recovery, `.gitignore` coverage inherited from `ose-public`-derived `.gitignore`).
  - **Worktree lifecycle**: creation via `git worktree add -b <branch> <path> origin/main`; work performed inside worktree; commit/push/PR from worktree; success leaves worktree in place for maintainer cleanup after PR merge; failure leaves worktree for debugging with path reported.
  - **Worktree hygiene rules**: pre-flight warns on stale worktrees (> 7 days); refuses new creation when stale count > 5.
  - **Cleanup commands**: `git worktree list` / `git worktree remove <path>` / `git worktree prune`.
- [ ] Create `.claude/skills/repo-syncing-with-ose-primer/reference/report-schema.md` specifying: filename pattern (`<agent-name>__<uuid-chain>__<utc+7-timestamp>__report.md`), frontmatter fields (agent, mode, invoked-at, ose-public-sha, ose-primer-sha, classifier-sha, report-uuid-chain), mandatory body sections (Summary, Classifier coverage, Findings grouped by direction+significance, Excluded paths appendix, Next steps), the **distinct parity-report schema** (filename `parity__*`, body: per-path equal/newer/missing table, verdict line).
- [ ] Create `.claude/skills/repo-syncing-with-ose-primer/reference/transforms.md` specifying: `identity` pass-through; `strip-product-sections` algorithm (remove H2/H3 sections whose heading or body references `OrganicLever`, `AyoKoding`, `OSE Platform`, or paths `apps/(organiclever|ayokoding|oseplatform)-*/`; for coverage-table rows, remove rows naming product apps); failure mode ("transform-gap") when boundaries are unclear.
- [ ] Create `.claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md` specifying the exact path list that the propagation-maker's parity-check mode enumerates: all 17 `apps/a-demo-*` directories (list each by name) plus `specs/apps/a-demo/`. Note that this scope is **frozen at Phase 7**; future extractions add new scope documents rather than editing this one.

### 3.3 — Sync skill to OpenCode

- [ ] Run `npm run sync:claude-to-opencode`.
- [ ] Verify `.opencode/skill/repo-syncing-with-ose-primer/SKILL.md` exists and mirrors the `.claude/` version.
- [ ] Verify `.opencode/skill/repo-syncing-with-ose-primer/reference/*.md` mirrors (all five modules).

### 3.4 — Lint the skill

- [ ] Run `markdownlint-cli2 '.claude/skills/repo-syncing-with-ose-primer/**/*.md'` — zero findings.
- [ ] Run `markdownlint-cli2 '.opencode/skill/repo-syncing-with-ose-primer/**/*.md'` — zero findings.

### 3.5 — Commit Phase 3

- [ ] Commit with message: `feat(skills): add repo-syncing-with-ose-primer shared skill`.
- [ ] **[C]** Verify only `.claude/skills/repo-syncing-with-ose-primer/**` and `.opencode/skill/repo-syncing-with-ose-primer/**` changed.

## Phase 3.5 — Workflow authoring

Goal: author two workflow orchestration documents under `governance/workflows/repo/` — the ongoing sync workflow and the one-time extraction workflow. Both conform to the [Workflow Naming Convention](../../../governance/conventions/structure/workflow-naming.md) and the [repo-defining-workflows](../../../.claude/skills/repo-defining-workflows/SKILL.md) pattern.

### 3.5a — Sync workflow document

- [ ] Create `governance/workflows/repo/repo-ose-primer-sync-execution.md` with YAML frontmatter per `tech-docs.md` §Workflow Specifications (name, goal, termination, inputs: direction/mode/clone-path, outputs: report-file/pr-url).
- [ ] Write the workflow body with sections: Purpose; Phases (pre-flight, agent invocation, report finalisation, optional apply, post-flight); Agent coordination (which agent is invoked per direction); Gherkin success criteria (adopt dry-run, propagate apply, dirty-clone abort).
- [ ] Cross-link the shared skill and both agent definitions.
- [ ] Verify basename `repo-ose-primer-sync-execution` parses against the Workflow Naming Convention regex as scope=`repo`, qualifier=`ose-primer-sync`, type=`execution`.

### 3.5b — Extraction workflow document

- [ ] Create `governance/workflows/repo/repo-ose-primer-extraction-execution.md` with YAML frontmatter per `tech-docs.md` §Workflow Specifications (name, goal, termination, inputs: extraction-scope/clone-path/max-catch-up-iterations, outputs: parity-report/extraction-commits/final-status).
- [ ] Write the workflow body with sections: Purpose (one-time orchestration; pattern reusable if a future extraction plan emerges); Phases (pre-flight, parity-check gate, catch-up loop, extraction commits A-H, post-extraction verification, classifier flip, close-out); Gherkin success criteria (parity success, parity failure with catch-up, catch-up exhausted, post-verification failure, complete).
- [ ] Cross-link the propagation agent (parity-check + apply modes), the sync workflow (invoked during catch-up), the shared skill's `extraction-scope.md` reference module, and the tech-docs Demo Extraction section.
- [ ] Verify basename `repo-ose-primer-extraction-execution` parses as scope=`repo`, qualifier=`ose-primer-extraction`, type=`execution`.

### 3.5c — Workflows index update

- [ ] Edit `governance/workflows/repo/README.md` (create if absent): add links to the two new workflows with one-line descriptions.
- [ ] Edit `governance/workflows/README.md` (top-level): add entries under the `repo` scope section if the top-level index enumerates individual workflows.

### 3.5d — Naming + markdown validation

- [ ] Run the Workflow Naming Convention audit: both new filenames match `-(quality-gate|execution|setup)$`.
- [ ] Run `markdownlint-cli2 'governance/workflows/repo/repo-ose-primer-*.md' governance/workflows/repo/README.md` — zero findings.
- [ ] Confirm the `governance/workflows/README.md` top-level index still lints clean.

### 3.5e — Repo-rules-checker dry run

- [ ] Invoke `repo-rules-checker` (dry-run, no auto-fix) scoped to workflow governance.
- [ ] Confirm zero new findings.

### 3.5f — Commit Phase 3.5

- [ ] Stage the two workflow files + index updates explicitly.
- [ ] Commit with message: `feat(workflows): add repo-ose-primer-sync-execution and extraction-execution workflows`.
- [ ] **[C]** Verify commit scope is only `governance/workflows/repo/` files.

## Phase 4 — Adoption agent authoring

Goal: author `repo-ose-primer-adoption-maker`.

### 4.1 — Agent definition

- [ ] Create `.claude/agents/repo-ose-primer-adoption-maker.md` with frontmatter (name, description spanning one paragraph, **model: opus**, color: blue, tools: Read/Glob/Grep/Bash/Write, skills: repo-syncing-with-ose-primer). See `tech-docs.md` §Model Choice for rationale.
- [ ] Write the agent prompt body with: responsibilities (pre-flight, classifier parse, diff, significance bucketing, report write), non-responsibilities (no writes to `ose-public` outside `generated-reports/`; no writes to primer clone; no branches; no PRs), safety rules (dry-run default, clean-tree precondition), report invocation conventions, skill reference.

### 4.2 — Catalogue update (`.claude/agents/README.md`)

- [ ] Edit `.claude/agents/README.md`: add an entry for `repo-ose-primer-adoption-maker` under the Content Creation (Makers) section with a one-line description.

### 4.3 — Sync to OpenCode

- [ ] Run `npm run sync:claude-to-opencode`.
- [ ] Verify `.opencode/agent/repo-ose-primer-adoption-maker.md` exists and mirrors.
- [ ] Verify the `.opencode/agent/README.md` was updated with the new entry.

### 4.4 — Naming convention check

- [ ] Run the Agent Naming Convention regex audit against `.claude/agents/repo-ose-primer-adoption-maker.md`: filename basename `repo-ose-primer-adoption-maker` parses as scope=`repo`, qualifier=`ose-primer-adoption`, role=`maker`. Confirm the role suffix matches the Role Vocabulary.
- [ ] Same audit against `.opencode/agent/repo-ose-primer-adoption-maker.md`.

### 4.5 — Lint

- [ ] Run `markdownlint-cli2 .claude/agents/repo-ose-primer-adoption-maker.md .opencode/agent/repo-ose-primer-adoption-maker.md .claude/agents/README.md .opencode/agent/README.md` — zero findings.

### 4.6 — Commit Phase 4

- [ ] Commit with message: `feat(agents): add repo-ose-primer-adoption-maker`.
- [ ] **[C]** Verify only agent files and catalogue files changed.

## Phase 5 — Propagation agent authoring (with parity-check mode)

Goal: author `repo-ose-primer-propagation-maker` supporting dry-run / apply / parity-check modes.

### 5.1 — Agent definition

- [ ] Create `.claude/agents/repo-ose-primer-propagation-maker.md` with frontmatter (name, description spanning one paragraph that names all three modes, **model: opus**, color: blue, tools: Read/Glob/Grep/Bash/Write/Edit, skills: repo-syncing-with-ose-primer). See `tech-docs.md` §Model Choice for rationale.
- [ ] Write the agent prompt body with: the three modes table, per-mode responsibilities, non-responsibilities (no `ose-public` writes outside `generated-reports/`; never commit to primer's `main`; never mutate the main clone's working tree in any mode), safety invariants (listing every `neither`-tagged path prefix that MUST NEVER appear in a proposal), **apply-mode worktree mechanics** (worktree path `$OSE_PRIMER_CLONE/.claude/worktrees/sync-<ts>-<uuid>/`; branch `sync/<ts>-<uuid>`; all writes inside the worktree; PR opened via `gh pr create --draft`; worktree preserved on success and failure), report invocation conventions including the distinct parity report schema, skill reference.

### 5.2 — Catalogue update

- [ ] Edit `.claude/agents/README.md`: add an entry for `repo-ose-primer-propagation-maker` under the Content Creation (Makers) section.

### 5.3 — Sync to OpenCode

- [ ] Run `npm run sync:claude-to-opencode`.
- [ ] Verify both files mirror to `.opencode/`.

### 5.4 — Naming convention check

- [ ] Run the Agent Naming Convention regex audit: `repo-ose-primer-propagation-maker` parses as scope=`repo`, qualifier=`ose-primer-propagation`, role=`maker`.

### 5.5 — Lint

- [ ] Run `markdownlint-cli2` on all four affected files — zero findings.

### 5.6 — Commit Phase 5

- [ ] Commit with message: `feat(agents): add repo-ose-primer-propagation-maker with parity-check mode`.
- [ ] **[C]** Verify scope.

## Phase 6 — Smoke-test dry runs

Goal: invoke both agents in their safest modes against the real state of both repositories and confirm the classifier, skill, and report format produce readable output.

### 6.1 — Primer clone setup

- [ ] Ensure the `OSE_PRIMER_CLONE` environment variable is set (default convention: `~/ose-projects/ose-primer`, a sibling of the `ose-public` checkout). If unset, export it: `export OSE_PRIMER_CLONE="$HOME/ose-projects/ose-primer"` (or override with your preferred location).
- [ ] If `$OSE_PRIMER_CLONE` does not exist, run `mkdir -p "$(dirname "$OSE_PRIMER_CLONE")" && git clone https://github.com/wahidyankf/ose-primer.git "$OSE_PRIMER_CLONE"`.
- [ ] Run `git -C $OSE_PRIMER_CLONE fetch --prune`.
- [ ] Run `git -C $OSE_PRIMER_CLONE checkout main`.
- [ ] Run `git -C $OSE_PRIMER_CLONE reset --hard origin/main`.
- [ ] Run `git -C $OSE_PRIMER_CLONE status --porcelain` — must be empty.

### 6.2 — Adoption-maker dry run

- [ ] Invoke `repo-ose-primer-adoption-maker` in dry-run mode (via Agent tool or natural-language instruction).
- [ ] Verify exactly one new file appears at `generated-reports/repo-ose-primer-adoption-maker__<uuid-chain>__<timestamp>__report.md`.
- [ ] Verify the report's frontmatter contains every mandatory field (agent, mode=dry-run, invoked-at, ose-public-sha, ose-primer-sha, classifier-sha, report-uuid-chain).
- [ ] Verify the report's body contains Summary, Classifier coverage, Findings (grouped by direction+significance), Excluded paths appendix, Next steps.
- [ ] Verify no file in `ose-public` outside `generated-reports/` was modified (`git status --porcelain ose-public/ | grep -v '^?? generated-reports/'` should be empty).
- [ ] Verify no file in `$OSE_PRIMER_CLONE/` was modified.

### 6.3 — Propagation-maker dry run

- [ ] Invoke `repo-ose-primer-propagation-maker` in dry-run mode.
- [ ] Verify exactly one new file appears at `generated-reports/repo-ose-primer-propagation-maker__*__report.md`.
- [ ] Verify the report's body has the same section set, with findings grouped under `propagate` and `bidirectional` only; `neither` paths excluded from findings.
- [ ] Verify no file in `ose-public` outside `generated-reports/` was modified.
- [ ] Verify no file in the primer clone was modified.

### 6.4 — Report review

- [ ] Skim both reports. Confirm findings read intelligibly, path references are correct, significance bucketing is non-trivial.
- [ ] If either report reveals a classifier coverage gap or a transform-gap, file a classifier amendment into `governance/conventions/structure/ose-primer-sync.md` and re-run Phase 6 (back to 6.2).

### 6.5 — Commit Phase 6 artifacts

- [ ] Stage the two report files explicitly.
- [ ] Commit with message: `chore(reports): record Phase 6 smoke-test dry runs for ose-primer sync agents`.
- [ ] **[C]** Verify only the two report files changed.

## Phase 7 — Primer-parity verification (extraction gate) **[G]**

Goal: confirm `ose-primer` carries every `a-demo-*` path at byte-equivalent or strictly newer state than `ose-public` before any demo-removal commit lands. This is a **hard gate**: Phase 8 MUST NOT start until this verdict is `parity verified: ose-public may safely remove`.

### 7.1 — Parity-check mode invocation

- [ ] Ensure the primer clone is on `main`, clean, up-to-date (repeat 6.1 pre-flight).
- [ ] Invoke `repo-ose-primer-propagation-maker` in **parity-check** mode.
- [ ] Verify a new file appears at `generated-reports/parity__<uuid-chain>__<timestamp>__report.md`.
- [ ] Open the report. Confirm frontmatter, per-path comparison table, verdict line.

### 7.2 — Branching on verdict

- [ ] **If verdict is `parity verified`**: proceed to 7.3.
- [ ] **If verdict is `parity NOT verified`**:
  - [ ] Read the blocker list (paths where `ose-public` is newer than the primer).
  - [ ] Invoke `repo-ose-primer-propagation-maker` in apply mode scoped to the blocker paths.
  - [ ] Review the apply-mode report; confirm the proposed changes cover every blocker.
  - [ ] Approve the apply flow; the agent creates a branch, commits, pushes, opens a draft PR against `wahidyankf/ose-primer:main`.
  - [ ] Review and merge the catch-up PR.
  - [ ] Re-run 6.1 (primer clone refresh).
  - [ ] Re-run 7.1 (parity-check).
  - [ ] Loop until verdict is `parity verified`.

### 7.3 — Commit parity report

- [ ] Stage the verified parity report file.
- [ ] Commit with message: `chore(reports): record Phase 7 primer-parity verification (extraction gate)`.
- [ ] **[C] [G]** Verify the commit contains ONLY the parity report file. This commit's SHA is referenced from every Phase 8 commit.

## Phase 8 — Demo extraction

Goal: execute the one-time removal of demo apps, specs, workflows, and associated references. Granular commits (A → H) for reviewable atomicity. Every commit references the Phase 7 parity report SHA in its message.

### 8.A — Commit A: Delete demo CI workflows

- [ ] `git rm .github/workflows/test-a-demo-be-clojure-pedestal.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-csharp-aspnetcore.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-elixir-phoenix.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-fsharp-giraffe.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-golang-gin.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-java-springboot.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-java-vertx.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-kotlin-ktor.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-python-fastapi.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-rust-axum.yml`
- [ ] `git rm .github/workflows/test-a-demo-be-ts-effect.yml`
- [ ] `git rm .github/workflows/test-a-demo-fe-dart-flutterweb.yml`
- [ ] `git rm .github/workflows/test-a-demo-fe-ts-nextjs.yml`
- [ ] `git rm .github/workflows/test-a-demo-fe-ts-tanstack-start.yml`
- [ ] Run `ls .github/workflows/test-a-demo-*.yml 2>/dev/null` — must return nothing.
- [ ] Commit with message: `chore(ci): delete a-demo workflows (Phase 8 Commit A, parity verified per <parity-report-sha>)`.
- [ ] **[C]** Verify commit scope is only `.github/workflows/`.

### 8.B — Commit B: Delete demo app directories

- [ ] `git rm -r apps/a-demo-be-clojure-pedestal`
- [ ] `git rm -r apps/a-demo-be-csharp-aspnetcore`
- [ ] `git rm -r apps/a-demo-be-e2e`
- [ ] `git rm -r apps/a-demo-be-elixir-phoenix`
- [ ] `git rm -r apps/a-demo-be-fsharp-giraffe`
- [ ] `git rm -r apps/a-demo-be-golang-gin`
- [ ] `git rm -r apps/a-demo-be-java-springboot`
- [ ] `git rm -r apps/a-demo-be-java-vertx`
- [ ] `git rm -r apps/a-demo-be-kotlin-ktor`
- [ ] `git rm -r apps/a-demo-be-python-fastapi`
- [ ] `git rm -r apps/a-demo-be-rust-axum`
- [ ] `git rm -r apps/a-demo-be-ts-effect`
- [ ] `git rm -r apps/a-demo-fe-dart-flutterweb`
- [ ] `git rm -r apps/a-demo-fe-e2e`
- [ ] `git rm -r apps/a-demo-fe-ts-nextjs`
- [ ] `git rm -r apps/a-demo-fe-ts-tanstack-start`
- [ ] `git rm -r apps/a-demo-fs-ts-nextjs`
- [ ] Run `ls apps/ | grep '^a-demo-' || echo NONE` — must print `NONE`.
- [ ] Commit with message: `chore(apps): delete a-demo app directories (Phase 8 Commit B, parity verified per <parity-report-sha>)`.
- [ ] **[C]** Verify commit scope is only `apps/a-demo-*`.

### 8.C — Commit C: Delete demo spec area

- [ ] `git rm -r specs/apps/a-demo`
- [ ] Run `ls specs/apps/ | grep '^a-demo' || echo NONE` — must print `NONE`.
- [ ] Commit with message: `chore(specs): delete a-demo spec area (Phase 8 Commit C, parity verified per <parity-report-sha>)`.
- [ ] **[C]** Verify commit scope is only `specs/apps/a-demo/`.

### 8.D — Commit D: Delete demo-specific reference doc

- [ ] `git rm docs/reference/demo-apps-ci-coverage.md`
- [ ] Commit with message: `docs(reference): delete demo-apps-ci-coverage.md (Phase 8 Commit D)`.
- [ ] **[C]** Verify commit scope is only the single file.

### 8.E — Commit E: Prune root configs

- [ ] Edit `codecov.yml`: remove every flag keyed on a demo project name. Confirm remaining flags are for product apps + `rhino-cli` + generic libs only.
- [ ] Edit `go.work`: remove every `use` directive under `apps/a-demo-be-*` (Go backends: `golang-gin`, and any others). Run `go work sync` and confirm no error.
- [ ] Edit `open-sharia-enterprise.sln`: remove project reference blocks for `apps/a-demo-be-csharp-aspnetcore`. Run `dotnet sln list` and confirm the remaining project list is product-only.
- [ ] For each file in `.github/workflows/_reusable-*.yml`, grep for `a-demo` references; if a reusable enumerates demo projects in a matrix or conditional, prune those entries; DO NOT delete the reusable file itself.
- [ ] For each file in `scripts/`, grep for `a-demo` references; prune demo names from any project-enumerating list; leave script structure intact.
- [ ] Run `grep -rnI 'a-demo' codecov.yml go.work open-sharia-enterprise.sln .github/workflows/_reusable-*.yml scripts/` — must return no matches.
- [ ] Commit with message: `chore(config): prune a-demo references from codecov/go.work/sln/reusables/scripts (Phase 8 Commit E)`.
- [ ] **[C]** Verify commit scope.

### 8.F — Commit F: Prune root prose references

- [ ] Edit `README.md`:
  - [ ] Remove the "Demo apps: 11 backend implementations …" bullet under Applications.
  - [ ] Remove any coverage-badge row whose flag names a demo project.
  - [ ] Remove any link to the deleted `demo-apps-ci-coverage.md`.
  - [ ] Add (or expand) a "Related Repositories" mention of `ose-primer` as now-authoritative for demo apps if not already present from Phase 1.
  - [ ] Optionally add a changelog-style note: "2026-04-18 — polyglot demo apps extracted to `ose-primer`".
- [ ] Edit `CLAUDE.md`:
  - [ ] Remove every bullet under "Current Apps" whose name starts with `a-demo-`.
  - [ ] Remove the coverage-threshold table rows naming demo projects; keep rows for product apps, libs, `rhino-cli`.
  - [ ] Remove or replace demo-path examples in the three-level-testing-standard prose; where a product-app equivalent exists, substitute; otherwise delete the example.
  - [ ] Remove the "Mandatory Nx targets for demo apps" bullet and the "Contract enforcement" bullet that names demo apps; retain the OrganicLever contract-enforcement bullet.
- [ ] Edit `AGENTS.md`: mirror every CLAUDE.md edit above.
- [ ] Edit `ROADMAP.md`: prune phase narratives that reference demos; add a dated note recording the extraction.
- [ ] Run `grep -rnI 'a-demo' README.md CLAUDE.md AGENTS.md ROADMAP.md` — must return zero matches (or only narrative changelog mentions of the extraction event).
- [ ] Commit with message: `docs(root): prune a-demo references from README/CLAUDE/AGENTS/ROADMAP (Phase 8 Commit F)`.
- [ ] **[C]** Verify scope.

### 8.G — Commit G: Prune governance / docs prose references

- [ ] Edit `governance/development/quality/three-level-testing-standard.md`: replace demo-be examples with product-be references (organiclever-be for F#, or note "see ose-primer for polyglot examples"); remove bullets that cannot be usefully substituted.
- [ ] Edit `governance/development/infra/nx-targets.md`: same pattern.
- [ ] Edit `docs/reference/monorepo-structure.md`: remove the demo-app inventory rows; reframe any "polyglot showcase" prose to point at `ose-primer`.
- [ ] Edit `docs/reference/nx-configuration.md`: prune demo-specific target configuration examples.
- [ ] Edit `docs/reference/project-dependency-graph.md`: regenerate the Mermaid graph from the current Nx graph (via `nx graph --file` or equivalent) to drop demo nodes; update any demo-referencing dependency table row.
- [ ] Edit `docs/reference/README.md`: remove the link to the deleted `demo-apps-ci-coverage.md` (if not already removed in Phase 1).
- [ ] Edit `docs/how-to/add-new-app.md`: replace demo-path examples with product-app paths.
- [ ] Edit `docs/how-to/add-new-lib.md`: same.
- [ ] Run `grep -rnI 'a-demo' governance/ docs/ --include='*.md'` — remaining matches MUST be limited to: narrative changelog mentions, the classifier row in `governance/conventions/structure/ose-primer-sync.md` (untouched in this commit), and archived plans under `plans/done/`.
- [ ] Commit with message: `docs(governance,docs): prune a-demo references from docs and governance examples (Phase 8 Commit G)`.
- [ ] **[C]** Verify scope.

### 8.H — Commit H: Update classifier to reflect extraction

- [ ] Edit `governance/conventions/structure/ose-primer-sync.md`:
  - [ ] Flip `apps/a-demo-*` row: Direction `propagate` → `neither (post-extraction)`; Transform `identity` → `—`; Rationale → `extracted 2026-04-XX (actual date); ose-primer is authoritative; path no longer exists in ose-public`.
  - [ ] Add or update `apps/a-demo-*-e2e` row similarly.
  - [ ] Flip `specs/apps/a-demo/**` row: Direction `propagate` → `neither (post-extraction)`; same Rationale pattern.
  - [ ] In the audit-rule section, confirm the whitelist entries allowing these three rows to match zero paths post-extraction.
  - [ ] Bump the convention's `updated:` frontmatter to today.
- [ ] Commit with message: `docs(governance): flip a-demo classifier rows to neither (Phase 8 Commit H, extraction complete)`.
- [ ] **[C]** Verify scope is only the convention file.

### 8.Z — Checkpoint after all 8 commits

- [ ] **[P]** Run `git log -8 --oneline` and confirm the sequence A → B → C → D → E → F → G → H with the expected commit subjects.
- [ ] **[P]** Run `ls apps/ | grep '^a-demo-' || echo NONE` — must print NONE.
- [ ] **[P]** Run `ls .github/workflows/test-a-demo-*.yml 2>/dev/null` — empty.
- [ ] **[P]** Run `ls specs/apps/a-demo 2>/dev/null` — no such directory.
- [ ] **[P]** Run `ls docs/reference/demo-apps-ci-coverage.md 2>/dev/null` — no such file.

## Phase 9 — Post-extraction cleanup & verification

Goal: verify `ose-public` is healthy after extraction; catch any dangling reference; confirm product apps still pass.

### 9.1 — Nx graph regeneration

- [ ] Run `nx graph --file=graph.json` (or `nx graph` interactively).
- [ ] Run `jq '.graph.nodes | keys[]' graph.json | grep '^a-demo-' || echo NONE` — must print NONE.
- [ ] Run `jq '.graph.nodes | keys[]' graph.json` and confirm the remaining project set is product apps + e2e + CLIs + libs only.

### 9.2 — Affected-projects green run

- [ ] Run `npm install` (in case package-lock shifted from removed apps).
- [ ] Run `nx affected -t typecheck lint test:quick spec-coverage` from `main` (or a just-created branch). Must pass.
- [ ] Run `nx run-many -t typecheck lint test:quick spec-coverage --projects='ayokoding-web,oseplatform-web,organiclever-fe,organiclever-be,rhino-cli,oseplatform-cli,ayokoding-cli,golang-commons'` — must pass (explicit product + retained infrastructure).

### 9.3 — Product E2E green run

- [ ] Run `nx run ayokoding-web-be-e2e:test:e2e` — pass.
- [ ] Run `nx run ayokoding-web-fe-e2e:test:e2e` — pass.
- [ ] Run `nx run organiclever-fe-e2e:test:e2e` — pass.
- [ ] Run `nx run organiclever-be-e2e:test:e2e` — pass.
- [ ] Run `nx run oseplatform-web-be-e2e:test:e2e` — pass.
- [ ] Run `nx run oseplatform-web-fe-e2e:test:e2e` — pass.

### 9.4 — Dangling-reference grep sweep

- [ ] Run the sweep: `grep -rnI 'a-demo' ose-public/ --include='*.md' --include='*.yml' --include='*.yaml' --include='*.json' --include='*.toml' --include='Brewfile' --include='*.sln' --include='go.work' 2>/dev/null | grep -v '^plans/done/' | grep -v '^plans/in-progress/2026-04-18__ose-primer-separation/' | grep -v 'governance/conventions/structure/ose-primer-sync.md'`.
- [ ] The command MUST return zero lines. Any line is a dangling reference; resolve it (Commit I or an amendment to the relevant Phase 8 commit) before proceeding.

### 9.5 — Link validation

- [ ] Run `docs-link-checker` (or equivalent link-check tool) on the full `ose-public/` tree.
- [ ] Confirm zero broken links point at `apps/a-demo-*`, `specs/apps/a-demo/`, or `docs/reference/demo-apps-ci-coverage.md`.
- [ ] Confirm the external link `https://github.com/wahidyankf/ose-primer` is reachable.

### 9.6 — Markdown lint / format

- [ ] Run `npm run lint:md` — zero violations.
- [ ] Run `npm run format:md:check` — Prettier-clean.

### 9.7 — Workspace doctor

- [ ] Run `npm run doctor` — retained toolchains still verified. (Doctor may still enforce polyglot toolchains for deleted-demo languages; that is intentional out-of-scope per `brd.md` Non-Goals — do not edit `scripts/doctor/` here.)

### 9.8 — OpenCode mirror sanity

- [ ] Run `npm run sync:claude-to-opencode`.
- [ ] Run `git status --porcelain .opencode/` — confirm either no changes or only expected mirror updates.
- [ ] If changes, stage and commit with message `chore(opencode): sync mirrors after extraction`.

### 9.9 — Repo-rules-checker audit

- [ ] Invoke `repo-rules-checker` (dry-run / no auto-fix).
- [ ] Confirm zero new findings beyond what the checker reported pre-extraction (delta should be zero or reduced).

### 9.10 — Commit Phase 9 artifacts (if any)

- [ ] If Phase 9 surfaced any residual fixes (dangling references, link fixes, formatting tweaks), commit them with message: `chore(cleanup): post-extraction close-out fixes (Phase 9)`.
- [ ] **[C] [P]** Final `git log` review of Phase 8 + 9 commits; confirm narrative coherence.

## Phase 10 — First real propagation (apply mode)

Goal: produce one real propagation PR against `wahidyankf/ose-primer:main`, validating the apply-mode end-to-end. Content: the Phase 1–9 generic artifacts (the new sync convention itself is `neither`, but any governance edits in Commit G that apply equally to the primer SHOULD propagate).

### 10.1 — Dry run first

- [ ] Refresh primer clone (repeat 6.1 pre-flight).
- [ ] Invoke `repo-ose-primer-propagation-maker` in dry-run mode.
- [ ] Review the resulting report. Confirm findings are limited to generic governance updates; no `neither` leakage.

### 10.2 — Apply mode invocation

- [ ] Approve the dry-run proposal explicitly.
- [ ] Invoke `repo-ose-primer-propagation-maker` in apply mode.
- [ ] Watch for **git worktree creation** at `$OSE_PRIMER_CLONE/.claude/worktrees/sync-<utc-timestamp>-<short-uuid>/` on branch `sync/<utc-timestamp>-<short-uuid>` tracking `origin/main`. Verify with `git -C "$OSE_PRIMER_CLONE" worktree list` — the worktree appears; main clone is still on `main`.
- [ ] Confirm the main clone's working tree is unchanged (`git -C "$OSE_PRIMER_CLONE" status --porcelain` returns empty; `git -C "$OSE_PRIMER_CLONE" rev-parse --abbrev-ref HEAD` returns `main`).
- [ ] Watch for push to `origin/<branch-name>`.
- [ ] Watch for draft PR creation against `wahidyankf/ose-primer:main`.
- [ ] Record the PR URL.

### 10.3 — PR review and merge

- [ ] Review the PR in GitHub.
- [ ] Confirm PR description links back to the propagation report.
- [ ] Merge the PR (or leave as draft if the content needs primer-side adjustment first).
- [ ] After merge, run `git -C "$OSE_PRIMER_CLONE" fetch --prune && git -C "$OSE_PRIMER_CLONE" pull origin main` (main clone stays on `main` throughout; no checkout needed).
- [ ] Remove the worktree: `git -C "$OSE_PRIMER_CLONE" worktree remove "$OSE_PRIMER_CLONE/.claude/worktrees/sync-<ts>-<uuid>"`.
- [ ] Verify cleanup: `git -C "$OSE_PRIMER_CLONE" worktree list` shows only the main worktree.

### 10.4 — Record the report

- [ ] Stage `generated-reports/repo-ose-primer-propagation-maker__*__report.md` (apply-mode output).
- [ ] Commit with message: `chore(reports): record Phase 10 first real propagation (PR <url>)`.
- [ ] **[C]** Verify scope.

## Phase 11 — First real adoption evaluation

Goal: invoke the adoption-maker and act on findings (or file "no actionable findings" evidence).

### 11.1 — Dry run

- [ ] Refresh primer clone.
- [ ] Invoke `repo-ose-primer-adoption-maker` in dry-run mode.
- [ ] Review the report.

### 11.2 — Apply findings (if actionable)

- [ ] If the report has actionable findings (excluding `neither` and trivial noise), for each finding:
  - [ ] Review the proposed change against the current `ose-public` file.
  - [ ] Apply the change manually (Edit tool) or via a fixer agent.
  - [ ] Stage and commit with message `docs(<scope>): adopt from ose-primer — <brief description> (Phase 11 from <report-uuid>)`.
- [ ] If the report has no actionable findings (or all findings are trivial and the maintainer declines to act on them), commit the report as evidence: `chore(reports): Phase 11 adoption evaluation — no actionable findings`.

### 11.3 — Record

- [ ] **[C] [P]** Final Phase 11 commit logged.

## Phase 12 — Archive plan

Goal: close out and archive.

### 12.1 — Final acceptance walk-through

- [ ] Open `README.md` (plan) → confirm every Risk-at-a-Glance row has a landed mitigation.
- [ ] Open `prd.md` → walk each Gherkin scenario against the current state; each MUST pass.
- [ ] Open `brd.md` → confirm every success-metric observable fact is now observable (i.e., the command described returns the expected result).
- [ ] Open `tech-docs.md` § Demo Extraction → confirm every listed path is present or absent as expected.

### 12.2 — Move plan folder

- [ ] `git mv plans/in-progress/2026-04-18__ose-primer-separation plans/done/2026-04-18__ose-primer-separation` (optionally updating the date prefix to completion date per the [Plans Organization Convention](../../../governance/conventions/structure/plans.md)).

### 12.3 — Update indices

- [ ] Edit `plans/in-progress/README.md`: remove this plan from the active list.
- [ ] Edit `plans/done/README.md`: add this plan with a one-line description and completion date.

### 12.4 — Commit the archive move

- [ ] Commit with message: `chore(plans): archive ose-primer-separation plan (completed YYYY-MM-DD)`.
- [ ] **[C] [P]** Final archive commit landed.

## Summary Gate Checklist

| Gate                                                         | Evidence                                                                                                                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **G1** — Classifier covers every `ose-public` top-level path | Phase 2 complete; `repo-rules-checker` reports zero orphan paths.                                                                                                       |
| **G1.5** — Both workflows present and naming-compliant       | Phase 3.5 complete; `repo-ose-primer-sync-execution.md` and `repo-ose-primer-extraction-execution.md` under `governance/workflows/repo/`; workflow-naming regex passes. |
| **G2** — Both agents present and naming-compliant            | Phase 4 & 5 complete; regex audit passes for both; frontmatter declares `model: opus`.                                                                                  |
| **G3** — Skill present in both harnesses                     | Phase 3 complete; `.claude/skills/` and `.opencode/skill/` mirror.                                                                                                      |
| **G4** — Smoke-test reports readable                         | Phase 6 complete; two reports committed.                                                                                                                                |
| **G5** — Primer parity verified — **hard gate for Phase 8**  | Phase 7 complete; parity report verdict is `parity verified`.                                                                                                           |
| **G6** — Demo paths absent from `ose-public`                 | Phase 8 Z-checkpoint all green.                                                                                                                                         |
| **G7** — Product apps still pass                             | Phase 9 `nx affected` and E2E green.                                                                                                                                    |
| **G8** — Grep sweep clean                                    | Phase 9.4 returns zero dangling references.                                                                                                                             |
| **G9** — Links clean                                         | Phase 9.5 returns zero broken links.                                                                                                                                    |
| **G10** — First propagation PR exists or merged              | Phase 10 complete; PR URL recorded.                                                                                                                                     |
| **G11** — Adoption evaluated                                 | Phase 11 complete; either applied changes or filed "no actionable findings" report.                                                                                     |
| **G12** — Plan archived                                      | Phase 12 complete; folder moved to `plans/done/`; indices updated.                                                                                                      |

## Related Documents

- [README.md](./README.md) — plan overview.
- [brd.md](./brd.md) — business requirements and risks.
- [prd.md](./prd.md) — product requirements and acceptance criteria.
- [tech-docs.md](./tech-docs.md) — technical specifications.
