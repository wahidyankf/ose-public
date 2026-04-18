# Product Requirements — ose-primer Separation

## Product Overview

This plan delivers five product outcomes inside `ose-public`:

1. **Awareness layer** — cross-references so humans and AI agents discover the `ose-primer` template from within `ose-public`.
2. **Governance doc** — `governance/conventions/structure/ose-primer-sync.md`: the authoritative classifier mapping every top-level path to one of `{propagate, adopt, bidirectional, neither}`, plus safety rules and access patterns.
3. **Shared skill** — `.claude/skills/repo-syncing-with-ose-primer/` containing the operational knowledge (classifier lookup, clone management, report format, noise-suppression rules) that both sync agents consume.
4. **Two maker agents**:
   - `repo-ose-primer-adoption-maker` — reads the local primer clone; proposes changes to pull into `ose-public`.
   - `repo-ose-primer-propagation-maker` — reads `ose-public`; proposes changes to push to the primer clone and optionally opens a draft PR against `wahidyankf/ose-primer:main`. Also operates in **parity-check mode** to verify primer-side demo state before extraction.
5. **One-time extraction** — removal of the `a-demo-*` polyglot showcase from `ose-public`: 17 app directories under `apps/`, the `specs/apps/a-demo/` spec area, 14 `test-a-demo-*.yml` workflows, the `docs/reference/demo-apps-ci-coverage.md` reference page, all inbound references in `README.md` / `CLAUDE.md` / `AGENTS.md` / `ROADMAP.md` / governance docs, and the demo entries in `codecov.yml`, `go.work`, `open-sharia-enterprise.sln`. Product apps (OrganicLever, AyoKoding, OSE Platform), `rhino-cli`, and generic libraries remain.
6. **Two workflow orchestrations** under `governance/workflows/repo/`:
   - `repo-ose-primer-sync-execution.md` — ongoing sync cycle; parameterised by `direction` (adopt|propagate) and `mode` (dry-run|apply); invokes the relevant agent; optional PR creation in apply+propagate mode.
   - `repo-ose-primer-extraction-execution.md` — one-time extraction orchestrator; gates on parity-check; runs catch-up loop on failure; executes the eight extraction commits; runs post-extraction verification.
     Both workflows are `type: execution` per the [Workflow Naming Convention](../../../governance/conventions/structure/workflow-naming.md) and follow the [repo-defining-workflows](../../../.claude/skills/repo-defining-workflows/SKILL.md) pattern.
7. **Agents configured for Opus** — `model: opus` in the frontmatter of both agents. See `tech-docs.md` §Model Choice for rationale.

No production code changes to retained apps. No new Nx project. No new npm script. The new artifacts are all in `docs/`, `governance/`, `.claude/`, and `.opencode/` (the latter via the existing sync pipeline). The extraction is pure deletion plus reference pruning; no replacement code is authored.

## Personas

Solo-maintainer framing per the [Plans Organization Convention](../../../governance/conventions/structure/plans.md): personas here are **content-placement containers**, not external stakeholder roles. Each persona is either a hat the maintainer wears or an agent that consumes the artifact.

### P1 — Maintainer in propagation mode

The maintainer has just finished a batch of `ose-public` work and wants to push the generic portions to the template without manually replaying every change. Expects:

- One command to invoke the propagation-maker.
- A readable report grouped by classifier bucket and significance.
- An optional "open a PR" final step that the maintainer explicitly approves.
- Zero findings for any path tagged `neither` in the classifier, regardless of how much that path changed.

### P2 — Maintainer in adoption mode

The maintainer has touched the primer independently (wording cleanup during a template refresh, a new generic convention extracted while removing product context) and wants to surface those improvements back to `ose-public`. Expects:

- One command to invoke the adoption-maker.
- A readable report identifying diffs originating in the primer that affect `adopt`-tagged or `bidirectional`-tagged paths.
- A "gap" section flagging paths the classifier does not know how to route (neither repo is canonical, or the classifier entry is missing).

### P3 — AI agent in an `ose-public` session

A Claude Code or OpenCode agent starts inside `ose-public`. A user asks "how do I bootstrap a new OSE-style monorepo?" or "what's the relationship between this repo and the template?" Expects:

- `CLAUDE.md` and `AGENTS.md` both surface `ose-primer` explicitly and link to the reference doc.
- The reference doc answers the question without requiring the agent to fetch external content.

### P4 — External reader landing on `ose-public` via GitHub

A developer finds `ose-public` and is curious whether a reusable template exists. Expects:

- `README.md` prominently mentions `ose-primer` with an outbound link.
- `docs/reference/related-repositories.md` provides a longer explanation with license difference and relationship direction.

### P5 — `repo-rules-checker` on a normal audit pass

The governance checker runs its standard pass. Expects:

- The new convention doc to parse, to have all required frontmatter, and to pass the normal governance-doc validation (single H1, Diátaxis-compatible placement, internal cross-links resolve).
- The classifier table to have no orphan paths (every top-level `ose-public` path appears in the table).
- Both new agents to conform to the [Agent Naming Convention](../../../governance/conventions/structure/agent-naming.md) (regex `<scope>(-<qualifier>)*-<role>` with role in `{maker, checker, fixer, dev, deployer, manager}`).
- The shared skill's `SKILL.md` to conform to the skills convention (frontmatter, `context` mode, referenced skills exist).

### P6 — `docs-link-checker` on a normal audit pass

Expects all cross-references added by this plan to resolve, and the external `https://github.com/wahidyankf/ose-primer` link to be reachable. Post-extraction, expects zero inbound links to `apps/a-demo-*/` or `docs/reference/demo-apps-ci-coverage.md`.

### P7 — Maintainer in extraction mode

The maintainer is ready to execute the one-time demo removal. Expects:

- A primer-parity report (Phase 7 output) confirming `ose-primer` carries every demo at byte-equivalent or strictly newer state before any `ose-public` delete commit lands.
- An explicit, granular delivery checklist for the removal (directory-by-directory, workflow-by-workflow, config-by-config) so each delete is a separately reviewable change.
- A post-extraction grep sweep that returns zero dangling references (outside archived plans and the classifier table).
- Product-app CI and E2E suites remain green after extraction.
- A single `ROADMAP.md` or README changelog entry recording the extraction date, motivation, and pointer to `ose-primer`.

### P8 — `repo-ose-primer-propagation-maker` in parity-check mode

Invoked once, as a Phase 7 gate. Expects:

- A dedicated parity-report format (different from the standard propagation report) enumerating every `apps/a-demo-*` and `specs/apps/a-demo/` path in `ose-public`.
- For each path, a byte-level comparison against the corresponding path in the primer clone.
- A final verdict of "parity verified: ose-public may safely remove" or "parity NOT verified: catch-up propagation required for paths [list]".
- Verdict archived in `generated-reports/` before the extraction begins.

### P9 — External contributor landing on `ose-public` post-extraction

A visitor (who may have seen `ose-public` pre-extraction with the demos present) arrives after extraction. Expects:

- The root README's "Related Repositories" section and the `docs/reference/related-repositories.md` page to explain the move in one or two paragraphs.
- `ROADMAP.md` or a changelog-style note to record the extraction date.
- No 404s when clicking links in the current README.

## User Stories

### US-1 — Propagation proposal

**As the** maintainer in propagation mode (P1),
**I want** to invoke `repo-ose-primer-propagation-maker` and receive a report listing concrete changes to mirror into the primer,
**So that** I don't have to manually replay my `ose-public` commits to figure out what the template now lags on.

### US-2 — Adoption proposal

**As the** maintainer in adoption mode (P2),
**I want** to invoke `repo-ose-primer-adoption-maker` and receive a report listing concrete improvements to pull into `ose-public`,
**So that** template-side wording clean-ups and extracted abstractions do not stagnate in the downstream.

### US-3 — Safe propagation

**As the** maintainer (P1),
**I want** the propagation-maker to refuse to emit proposals for paths tagged `neither` (product apps, FSL specs, product-specific plans),
**So that** a classifier mistake or a momentary inattention cannot leak FSL-licensed or private material to the public primer.

### US-4 — Draft PR convenience

**As the** maintainer (P1),
**I want** an optional step in the propagation workflow that creates a branch in the primer clone, commits the proposal, pushes, and opens a draft PR against `main`,
**So that** routine propagation sprees take seconds to execute once the proposal has been reviewed, rather than minutes of manual branch-commit-push-PR plumbing.

### US-5 — Awareness discovery (agent)

**As an** AI agent in an `ose-public` session (P3),
**I want** `CLAUDE.md` and `AGENTS.md` to name `ose-primer` and state the sync direction,
**So that** when asked "how do I start a new OSE-style monorepo?" I can cite the template instead of improvising from training data.

### US-6 — Awareness discovery (human)

**As an** external reader on GitHub (P4),
**I want** the `ose-public` README to link to `ose-primer`,
**So that** I discover the template option without having to search for it.

### US-7 — Reference depth

**As an** external reader or AI agent (P3/P4),
**I want** `docs/reference/related-repositories.md` to explain the template's purpose, the sync direction, the license difference (MIT vs FSL-1.1-MIT), and what is out of scope,
**So that** I can make an informed choice without reading `ose-primer`'s own docs first.

### US-8 — Classifier audit

**As** `repo-rules-checker` (P5),
**I want** the classifier in `governance/conventions/structure/ose-primer-sync.md` to list every top-level `ose-public` path explicitly,
**So that** orphan paths (present in the repo, absent from the classifier) raise a governance finding and cannot silently become propagation hazards.

### US-9 — Report reproducibility

**As the** maintainer (P1 or P2),
**I want** every sync report to live in `generated-reports/` with a UUID chain and a UTC+7 timestamp in the filename,
**So that** reports are reproducible, searchable, and correlatable with later commits.

### US-10 — Smoke-test confidence

**As the** maintainer,
**I want** a first-pass dry-run of both agents against the current state of both repos before declaring the plan done,
**So that** I have concrete evidence the classifier is correct and the reports are readable before I start applying findings.

### US-11 — Primer-parity verification before extraction

**As the** maintainer in extraction mode (P7),
**I want** to invoke the propagation-maker in parity-check mode and receive a report confirming every `apps/a-demo-*` and `specs/apps/a-demo/` path in `ose-public` is byte-equivalent to or strictly older than the corresponding path in `ose-primer`,
**So that** I can execute the extraction knowing no demo-side improvement is being silently dropped.

### US-12 — Granular extraction delivery

**As the** maintainer in extraction mode (P7),
**I want** the extraction delivered as separately reviewable commits (one per app family, one for specs, one for workflows, one for configs, one for reference docs, one for README/CLAUDE.md/AGENTS.md updates, one for governance/doc cross-reference pruning),
**So that** a review-time concern about any one category can be addressed without reverting the entire extraction.

### US-13 — Dangling-reference grep sweep

**As the** maintainer in extraction mode (P7),
**I want** a final close-out step where `grep -rnI 'a-demo' ose-public/` across all content-bearing file types must return matches only from allowed paths (archived plans, this plan, classifier row in the sync convention),
**So that** no inbound link, import path, CI callback, or doc example is left dangling.

### US-14 — Product-app health post-extraction

**As the** maintainer in extraction mode (P7),
**I want** `nx affected -t typecheck lint test:quick spec-coverage` and the full product E2E suite to pass after the extraction commits,
**So that** I have positive evidence that the extraction did not incidentally break OrganicLever, AyoKoding, OSE Platform, or `rhino-cli`.

### US-15 — Extraction changelog entry

**As an** external contributor (P9),
**I want** a dated note in `ROADMAP.md` or the root `README.md` recording the extraction event and pointing at `ose-primer` as the new home of the polyglot showcase,
**So that** if I had bookmarked or linked to a demo path I can trace its new location.

### US-16 — Adoption proposal post-extraction

**As the** maintainer in adoption mode (P2),
**I want** the adoption-maker to honour the post-extraction classifier — `apps/a-demo-*` and `specs/apps/a-demo/` are `neither`, so the adoption-maker does NOT surface demo changes from the primer as adoption candidates for `ose-public`,
**So that** the extraction is truly one-way: no demo ever drifts back into `ose-public` by way of an adoption run.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: ose-primer awareness inside ose-public

  Scenario: Root README mentions ose-primer
    Given the ose-public repository at HEAD on main after this plan completes
    When a reader opens "ose-public/README.md"
    Then they see a "Related Repositories" section or equivalent
    And that section links to "https://github.com/wahidyankf/ose-primer"
    And the link text identifies it as a "template repository"

  Scenario: CLAUDE.md surfaces ose-primer to Claude Code agents
    Given an AI agent loading "ose-public/CLAUDE.md" at session start
    When the agent reads the file top to bottom
    Then it encounters a statement that "ose-primer" is a downstream template repo
    And the direction of source-of-truth flow ("ose-public is upstream; ose-primer is derived") is explicit
    And a link to "https://github.com/wahidyankf/ose-primer" is present
    And a pointer to "docs/reference/related-repositories.md" is present
    And a pointer to the new "governance/conventions/structure/ose-primer-sync.md" convention is present

  Scenario: AGENTS.md mirrors the same awareness for OpenCode
    Given an OpenCode agent loading "ose-public/AGENTS.md" at session start
    When the agent reads the file top to bottom
    Then it sees the same ose-primer reference and the same direction statement as CLAUDE.md
    And it sees the same pointer to the reference doc and the sync convention

  Scenario: Reference doc exists and is discoverable
    Given the ose-public repository at HEAD on main after this plan completes
    When a reader opens "docs/reference/README.md"
    Then they see a link to "related-repositories.md"
    And opening "docs/reference/related-repositories.md" yields a page that
      describes what ose-primer is,
      names its relationship to ose-public (upstream, source of truth),
      identifies the license difference (MIT vs FSL-1.1-MIT for product apps),
      states what is out of scope of this doc (sync automation, release cadence),
      links to "governance/conventions/structure/ose-primer-sync.md",
      and is dated 2026-04-18.

Feature: ose-primer sync convention (classifier)

  Scenario: Classifier convention exists and parses
    Given "governance/conventions/structure/ose-primer-sync.md" at HEAD on main
    When a reader opens the file
    Then frontmatter includes title, description, category, subcategory, tags, created, updated
    And the file contains a classifier table
    And the table has columns "Path pattern", "Direction", "Rationale"
    And every row's "Direction" value is one of "propagate", "adopt", "bidirectional", or "neither"

  Scenario: Classifier has no orphan paths
    Given the classifier table at HEAD on main
    When the classifier is compared against the actual top-level structure of ose-public
    Then every directory directly under "apps/", "libs/", "specs/apps/", "governance/", "docs/", ".claude/agents/", ".claude/skills/" is either matched by at least one classifier row
    Or explicitly covered by a wildcard pattern in the classifier

  Scenario: FSL-licensed paths are tagged neither
    Given the classifier table
    When the reader inspects rows for "apps/organiclever-*", "apps/ayokoding-*", "apps/oseplatform-*", "apps/*-e2e"
    Then the "Direction" for each such row is "neither"
    And the "Rationale" cites FSL-1.1-MIT licensing or product-specificity

  Scenario: Generic demo apps are tagged propagate
    Given the classifier table
    When the reader inspects the row for "apps/a-demo-*" (excluding e2e)
    Then the "Direction" is "propagate"
    And the "Rationale" cites the template's need for scaffolding demos

Feature: Shared sync skill

  Scenario: Shared skill exists in both harnesses
    Given the ose-public repository at HEAD on main after this plan completes
    When the reader lists ".claude/skills/repo-syncing-with-ose-primer/"
    Then "SKILL.md" is present
    And ".opencode/skill/repo-syncing-with-ose-primer/SKILL.md" is present as its mirror
    And the skill's frontmatter declares context (inline or fork), name, description, version

  Scenario: Skill documents the primer clone path
    Given ".claude/skills/repo-syncing-with-ose-primer/SKILL.md"
    When a reader searches for the phrase "$OSE_PRIMER_CLONE"
    Then the phrase is present as the canonical clone path
    And adjacent text describes the expected clean-tree-on-main precondition

  Scenario: Skill documents report format
    Given ".claude/skills/repo-syncing-with-ose-primer/SKILL.md"
    When a reader searches for the report format section
    Then the skill specifies a filename pattern including UUID chain and UTC+7 timestamp
    And the skill specifies a mandatory set of sections (frontmatter, summary, classifier coverage, findings grouped by significance, next-step recommendation)

Feature: Adoption agent (repo-ose-primer-adoption-maker)

  Scenario: Adoption-maker agent exists in both harnesses
    Given the ose-public repository at HEAD on main after Phase 4 completes
    When the reader lists ".claude/agents/"
    Then "repo-ose-primer-adoption-maker.md" is present
    And ".opencode/agent/repo-ose-primer-adoption-maker.md" is present
    And the filename conforms to the Agent Naming Convention (regex check passes)

  Scenario: Adoption-maker produces a report
    Given a valid primer clone at "$OSE_PRIMER_CLONE/"
    And the maintainer invokes "repo-ose-primer-adoption-maker" in dry-run mode
    When the agent completes
    Then a report is written to "generated-reports/" with filename matching "repo-ose-primer-adoption-maker__<uuid-chain>__<utc+7-timestamp>__report.md"
    And the report contains sections for summary, classifier coverage, findings, and recommendations
    And the report does NOT modify any file in "ose-public" or in the primer clone

Feature: Propagation agent (repo-ose-primer-propagation-maker)

  Scenario: Propagation-maker agent exists in both harnesses
    Given the ose-public repository at HEAD on main after Phase 5 completes
    When the reader lists ".claude/agents/"
    Then "repo-ose-primer-propagation-maker.md" is present
    And ".opencode/agent/repo-ose-primer-propagation-maker.md" is present

  Scenario: Propagation-maker produces a report in dry-run
    Given a valid primer clone
    And the maintainer invokes "repo-ose-primer-propagation-maker" in dry-run mode
    When the agent completes
    Then a report is written to "generated-reports/" with the correct filename pattern
    And the report does NOT push any branch and does NOT open any PR
    And the report groups findings by classifier direction ("propagate" only; "neither" paths are excluded or listed in an audit appendix)

  Scenario: Propagation-maker refuses to emit changes for "neither" paths
    Given a change in "ose-public/apps/organiclever-fe/" (classifier: neither)
    When the maintainer runs the propagation-maker in dry-run mode
    Then the main findings list contains no entry for any path under "apps/organiclever-fe/"
    And if a classifier-coverage appendix is included, the appendix may list the path as "skipped: neither" with no diff content

  Scenario: Propagation-maker can optionally open a draft PR
    Given the maintainer has reviewed a propagation proposal and invoked the apply flow
    When the agent runs in apply mode with maintainer approval
    Then a git worktree is created at "$OSE_PRIMER_CLONE/.claude/worktrees/sync-<timestamp>-<short-uuid>/" tracking "origin/main" on a new branch "sync/<timestamp>-<short-uuid>"
    And the main clone's working tree is NOT mutated (still on main, still clean)
    And proposed changes are written INSIDE the worktree, not into the main clone
    And the branch is pushed to "origin/sync/<timestamp>-<short-uuid>"
    And a draft PR is opened against "wahidyankf/ose-primer:main"
    And the PR description links back to the propagation report in "generated-reports/"

  Scenario: Worktree is preserved on success for maintainer cleanup
    Given an apply-mode invocation that successfully opened a draft PR
    When the agent exits successfully
    Then the worktree at "$OSE_PRIMER_CLONE/.claude/worktrees/sync-<timestamp>-<short-uuid>/" still exists
    And the agent's report documents the worktree path and the recommended cleanup command (`git -C "$OSE_PRIMER_CLONE" worktree remove <path>` after PR merge)

  Scenario: Worktree is preserved on failure for debugging
    Given an apply-mode invocation that failed at any step after worktree creation (commit, push, or PR creation)
    When the agent exits with a failure status
    Then the worktree at "$OSE_PRIMER_CLONE/.claude/worktrees/sync-<timestamp>-<short-uuid>/" still exists
    And the agent's failure message includes the worktree path for inspection

  Scenario: Pre-flight warns on stale worktrees
    Given the primer clone has accumulated 3 worktrees under ".claude/worktrees/" older than 7 days
    When any sync agent is invoked
    Then pre-flight emits a non-blocking warning listing each stale worktree path
    And the agent continues normally

  Scenario: Pre-flight blocks when stale worktrees exceed threshold
    Given the primer clone has accumulated more than 5 stale worktrees under ".claude/worktrees/"
    When apply mode is invoked
    Then pre-flight refuses to create a new worktree
    And emits a remediation message instructing the maintainer to run "git -C \"$OSE_PRIMER_CLONE\" worktree list" and clean up

Feature: Safety and dry-run default

  Scenario: Dry-run is the default for both agents
    Given the maintainer invokes either sync agent without explicit mode flag
    When the agent runs
    Then no file outside "generated-reports/" is written
    And no git branch is created
    And no git push occurs

  Scenario: Clone precondition check
    Given the primer clone is dirty (uncommitted changes or on a non-main branch not tracking origin/main)
    When either sync agent is invoked without "--use-clone-as-is"
    Then the agent refuses to proceed
    And emits a clear remediation message instructing "git status" in the clone

Feature: No regressions (pre-extraction, Phases 1-7)

  Scenario: Lint and format are clean
    Given the awareness, convention, skill, and agent artifacts are in place
    When "npm run lint:md" runs
    Then it exits zero with zero violations
    And "npm run format:md:check" exits zero

  Scenario: nx affected is green before extraction
    Given Phases 1-7 complete but extraction has not yet executed
    When "nx affected -t typecheck lint test:quick spec-coverage" runs
    Then it passes (existing a-demo projects remain green; new docs/skills/agents don't affect source)

  Scenario: Link validation passes
    Given Phases 1-7 complete
    When the standard markdown link-checker runs
    Then every relative link added by this plan resolves to an existing file
    And the external link to "https://github.com/wahidyankf/ose-primer" is present and well-formed

Feature: Primer-parity verification (Phase 7 gate)

  Scenario: Parity verification succeeds before extraction
    Given a valid primer clone at "$OSE_PRIMER_CLONE/" on main, clean tree
    And the maintainer invokes the propagation-maker in parity-check mode
    When the agent completes
    Then a report is written to "generated-reports/parity__<uuid>__<timestamp>__report.md"
    And the report enumerates every "apps/a-demo-*" and "specs/apps/a-demo/" path present in ose-public
    And for each such path the report asserts byte-equivalence with or strict age over the ose-primer counterpart
    And the report's final verdict line reads "parity verified: ose-public may safely remove"
    And the report does NOT modify any file

  Scenario: Parity verification fails and blocks extraction
    Given a primer clone whose "apps/a-demo-be-python-fastapi" is older than ose-public's copy
    When the maintainer invokes the parity-check
    Then the report's final verdict line reads "parity NOT verified: catch-up propagation required"
    And the report lists "apps/a-demo-be-python-fastapi" with the divergence details
    And Phase 8 (extraction) MUST NOT proceed until a catch-up propagation run brings the primer into parity

Feature: Demo extraction (Phase 8)

  Scenario: All a-demo app directories are removed
    Given Phase 7 parity is verified
    And the maintainer executes the Phase 8 delivery checklist
    When the extraction commits land on ose-public main
    Then "ls ose-public/apps/ | grep '^a-demo-'" returns empty
    And the 17 directories previously present under "apps/a-demo-*" no longer exist in the working tree

  Scenario: Demo specs are removed
    Given extraction has executed
    When a reader inspects "ose-public/specs/apps/"
    Then the directory "a-demo/" is absent
    And the remaining subdirectories are "ayokoding/", "organiclever/", "oseplatform/", "rhino/"

  Scenario: Demo CI workflows are removed
    Given extraction has executed
    When a reader lists "ose-public/.github/workflows/"
    Then no file matches the pattern "test-a-demo-*.yml"
    And the remaining workflows are: "_reusable-*.yml" (those still used by product apps), "codecov-upload.yml", "pr-quality-gate.yml", "pr-validate-links.yml", "test-and-deploy-ayokoding-web.yml", "test-and-deploy-organiclever.yml", "test-and-deploy-oseplatform-web.yml"

  Scenario: Demo-only reference doc is removed
    Given extraction has executed
    When a reader opens "ose-public/docs/reference/"
    Then "demo-apps-ci-coverage.md" is absent
    And "docs/reference/README.md" no longer links to it

  Scenario: Root configs are cleaned
    Given extraction has executed
    When a reader inspects "go.work"
    Then no "use" directive names any "apps/a-demo-*" path
    When a reader inspects "open-sharia-enterprise.sln"
    Then no project reference names any "apps/a-demo-*" path
    When a reader inspects "codecov.yml"
    Then no flag named after any "a-demo-*" project exists

  Scenario: README / CLAUDE.md / AGENTS.md / ROADMAP.md references are updated
    Given extraction has executed
    When a reader greps these files for "a-demo"
    Then the only remaining matches (if any) are narrative statements about the extraction event itself (e.g., "formerly hosted 17 demo apps, now maintained in ose-primer")
    And no live link, listing, or CI-badge row references any a-demo project

  Scenario: Classifier is updated to reflect post-extraction state
    Given extraction has executed
    When a reader opens "governance/conventions/structure/ose-primer-sync.md"
    Then the rows for "apps/a-demo-*" and "specs/apps/a-demo/" show Direction="neither"
    And the Rationale column reads "extracted YYYY-MM-DD; ose-primer is authoritative"

Feature: Post-extraction health (Phase 9)

  Scenario: Affected target set is green
    Given extraction has executed and Phase 9 close-out begins
    When "nx affected -t typecheck lint test:quick spec-coverage" runs
    Then every affected project passes
    And no project matching "a-demo-*" appears in the affected list because they no longer exist

  Scenario: Product app E2E remains green
    Given extraction has executed
    When the maintainer runs "nx run ayokoding-web-be-e2e:test:e2e", "nx run ayokoding-web-fe-e2e:test:e2e", "nx run organiclever-fe-e2e:test:e2e", "nx run organiclever-be-e2e:test:e2e", "nx run oseplatform-web-be-e2e:test:e2e", "nx run oseplatform-web-fe-e2e:test:e2e"
    Then each suite passes

  Scenario: Nx graph has no a-demo projects
    Given extraction has executed
    When "nx graph --file=graph.json" is generated
    Then no project name in the graph starts with "a-demo-"

  Scenario: Dangling-reference grep sweep is clean
    Given extraction has executed
    When the close-out grep command runs
    Then the only matches are in "plans/done/" (archived historical plans), "plans/in-progress/2026-04-18__ose-primer-separation/" (this plan), and the single classifier row inside "governance/conventions/structure/ose-primer-sync.md"

  Scenario: Link checker passes post-extraction
    Given extraction has executed
    When "docs-link-checker" runs
    Then no inbound link resolves to any path under "apps/a-demo-*", "specs/apps/a-demo/", or "docs/reference/demo-apps-ci-coverage.md"
    And external links are reachable as before

Feature: One-way extraction (adoption-maker post-extraction)

  Scenario: Adoption-maker does not surface demo changes as adoption candidates
    Given extraction has executed and the classifier tags "apps/a-demo-*" as "neither"
    And the primer's demos evolve (e.g., a bug fix lands in "apps/a-demo-be-rust-axum")
    When the maintainer invokes the adoption-maker
    Then no finding for any "apps/a-demo-*" path appears in the adoption report's main findings list
    And the classifier-coverage appendix may list the path as "skipped: neither (authoritative in ose-primer)"

Feature: Agent model configuration (Opus)

  Scenario: Adoption-maker frontmatter declares Opus
    Given the file ".claude/agents/repo-ose-primer-adoption-maker.md"
    When a reader inspects its YAML frontmatter
    Then the "model" field equals "opus"

  Scenario: Propagation-maker frontmatter declares Opus
    Given the file ".claude/agents/repo-ose-primer-propagation-maker.md"
    When a reader inspects its YAML frontmatter
    Then the "model" field equals "opus"

  Scenario: OpenCode mirrors reflect the model field per the sync pipeline's rules
    Given the .opencode/agent/ mirrors exist for both agents
    When a reader inspects the mirrors' frontmatter
    Then the "model" field is present (exact token may differ per the sync pipeline's model-mapping rule documented in CLAUDE.md "Format Differences")

Feature: Sync workflow (repo-ose-primer-sync-execution)

  Scenario: Workflow document exists and is naming-convention compliant
    Given the ose-public repository at HEAD on main after Phase 3.5 completes
    When the reader lists "governance/workflows/repo/"
    Then "repo-ose-primer-sync-execution.md" is present
    And its basename parses against the Workflow Naming Convention as scope=repo, qualifier=ose-primer-sync, type=execution
    And its frontmatter declares name, goal, termination, inputs (direction, mode, clone-path), outputs (report-file, pr-url)

  Scenario: Workflow invokes the adoption agent when direction=adopt
    Given the sync workflow is invoked with direction=adopt, mode=dry-run
    When the workflow executes
    Then it invokes "repo-ose-primer-adoption-maker" exactly once
    And it does NOT invoke "repo-ose-primer-propagation-maker"
    And its output "report-file" matches "generated-reports/repo-ose-primer-adoption-maker__*__report.md"

  Scenario: Workflow invokes the propagation agent when direction=propagate
    Given the sync workflow is invoked with direction=propagate, mode=dry-run
    When the workflow executes
    Then it invokes "repo-ose-primer-propagation-maker" exactly once
    And its output "report-file" matches "generated-reports/repo-ose-primer-propagation-maker__*__report.md"
    And no branch is created and no PR is opened

  Scenario: Workflow creates a draft PR via worktree when direction=propagate and mode=apply
    Given the sync workflow is invoked with direction=propagate, mode=apply
    And the maintainer has approved the upstream dry-run proposal
    When the workflow executes
    Then a git worktree is created at "$OSE_PRIMER_CLONE/.claude/worktrees/sync-<timestamp>-<short-uuid>/" tracking "origin/main" on branch "sync/<timestamp>-<short-uuid>"
    And the main clone stays on main with a clean working tree
    And proposed changes are committed INSIDE the worktree
    And the branch is pushed to origin
    And a draft PR is opened against "wahidyankf/ose-primer:main"
    And the output "pr-url" contains the PR URL

  Scenario: Workflow aborts on dirty clone
    Given the primer clone has uncommitted changes
    When the sync workflow is invoked without "--use-clone-as-is"
    Then the workflow aborts in the pre-flight phase
    And no agent is invoked
    And no file is modified

Feature: Extraction workflow (repo-ose-primer-extraction-execution)

  Scenario: Extraction workflow document exists and is naming-convention compliant
    Given the ose-public repository at HEAD on main after Phase 3.5 completes
    When the reader lists "governance/workflows/repo/"
    Then "repo-ose-primer-extraction-execution.md" is present
    And its basename parses as scope=repo, qualifier=ose-primer-extraction, type=execution
    And its frontmatter declares name, goal, termination, inputs (extraction-scope, clone-path, max-catch-up-iterations), outputs (parity-report, extraction-commits, final-status)

  Scenario: Extraction workflow runs the parity gate first
    Given the extraction workflow is invoked with default extraction scope
    When the workflow executes
    Then the parity-check phase produces a report at "generated-reports/parity__*__report.md" BEFORE any extraction commit is created
    And the parity report's verdict line is read before Phase 4 begins

  Scenario: Extraction blocks and runs catch-up when parity fails
    Given a primer clone where at least one a-demo path is older than ose-public's
    When the extraction workflow is invoked
    Then the workflow enters the catch-up loop (Phase 3)
    And invokes the sync workflow with direction=propagate, mode=apply, scoped to the blocking path
    And waits for the catch-up PR to merge and origin/main to advance
    And re-runs parity-check
    And does NOT proceed to Phase 4 until parity verdict = verified

  Scenario: Extraction emits blocked-at-parity on exhausted catch-up budget
    Given the catch-up loop has run max-catch-up-iterations times without parity verification
    When the workflow's catch-up phase exits
    Then the workflow's final-status is "blocked-at-parity"
    And no extraction commit has been made
    And the workflow halts for human intervention

  Scenario: Extraction emits aborted on post-extraction verification failure
    Given the eight extraction commits have landed
    And the post-extraction verification phase detects a failure (nx affected red, grep sweep finds dangling references, link checker reports broken links, or markdown lint fails)
    When the workflow's post-verification phase evaluates
    Then the workflow's final-status is "aborted"
    And the maintainer is prompted to remediate (the extraction commits are NOT auto-reverted)

  Scenario: Extraction emits complete on green post-verification
    Given all eight extraction commits land
    And all post-extraction gates pass
    When the workflow's close-out phase runs
    Then the workflow's final-status is "complete"
    And the output "extraction-commits" contains exactly eight SHAs
```

## Product Scope

### In scope (product)

**Phase 1–6: Sync infrastructure (additive)** — includes the awareness layer (Phase 1), full classifier (Phase 2), shared skill (Phase 3), workflow documents (Phase 3.5), adoption agent (Phase 4), propagation agent (Phase 5), smoke-test dry runs (Phase 6).

- Existing markdown files edited: `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/reference/README.md`, `governance/conventions/structure/README.md`, `plans/in-progress/README.md`.
- One new reference doc: `docs/reference/related-repositories.md`.
- One new governance convention: `governance/conventions/structure/ose-primer-sync.md` containing the classifier table and sync policy.
- One new shared skill directory: `.claude/skills/repo-syncing-with-ose-primer/` with `SKILL.md` and reference modules.
- Two new agent definitions: `.claude/agents/repo-ose-primer-adoption-maker.md` and `.claude/agents/repo-ose-primer-propagation-maker.md`, plus their `.opencode/agent/` mirrors produced by the existing sync pipeline.
- Updates to `.claude/agents/README.md` and `.opencode/agent/README.md` to catalogue the two new agents.
- Dry-run reports in `generated-reports/` (Phase 6).

**Phase 7: Parity verification (reporting only)**

- Primer-parity report committed to `generated-reports/` (Phase 7).

**Phase 8: Demo extraction (subtractive)**

- Deletion of 17 app directories: `apps/a-demo-be-clojure-pedestal/`, `apps/a-demo-be-csharp-aspnetcore/`, `apps/a-demo-be-e2e/`, `apps/a-demo-be-elixir-phoenix/`, `apps/a-demo-be-fsharp-giraffe/`, `apps/a-demo-be-golang-gin/`, `apps/a-demo-be-java-springboot/`, `apps/a-demo-be-java-vertx/`, `apps/a-demo-be-kotlin-ktor/`, `apps/a-demo-be-python-fastapi/`, `apps/a-demo-be-rust-axum/`, `apps/a-demo-be-ts-effect/`, `apps/a-demo-fe-dart-flutterweb/`, `apps/a-demo-fe-e2e/`, `apps/a-demo-fe-ts-nextjs/`, `apps/a-demo-fe-ts-tanstack-start/`, `apps/a-demo-fs-ts-nextjs/`.
- Deletion of `specs/apps/a-demo/` (entire spec area).
- Deletion of 14 GitHub Actions workflows under `.github/workflows/test-a-demo-*.yml`.
- Deletion of `docs/reference/demo-apps-ci-coverage.md`.
- Edits to remove demo references from: `README.md` (demo-app summary; coverage badges table), `CLAUDE.md` (apps list; tech-stack commentary; three-level-testing examples where demo paths are used), `AGENTS.md` (mirror of CLAUDE.md), `ROADMAP.md` (phase-complete narrative if it cites demos).
- Edits to remove demo projects from: `codecov.yml` (demo flags), `go.work` (demo `use` directives), `open-sharia-enterprise.sln` (demo project entries).
- Edits to `_reusable-backend-*.yml` files ONLY if they list demo projects explicitly; otherwise untouched.
- Edits to governance docs that cite demo paths as examples: `governance/development/quality/three-level-testing-standard.md`, `governance/development/infra/nx-targets.md`, `docs/reference/monorepo-structure.md`, `docs/reference/nx-configuration.md`, `docs/reference/project-dependency-graph.md`, `docs/how-to/add-new-app.md`, `docs/how-to/add-new-lib.md`. Mechanical edits only — update or remove path references; DO NOT rewrite the principle content.

**Phase 9: Post-extraction cleanup (close-out)**

- `nx graph` regeneration and verification.
- `go work sync` / `dotnet sln list` / `codecov.yml` validation.
- Grep sweep for dangling references.
- Link-check pass.
- Lint pass.
- Product-app E2E runs.
- Classifier table updated to reflect extraction date in the rationale column.

**Phase 10–11: First real sync runs (optional evidence)**

- One real propagation PR against `wahidyankf/ose-primer` (Phase 10), produced by the propagation-maker in apply mode. Content: the new awareness docs, the new convention, and any generic governance updates from Phases 1–9 that the template lacks.
- One real adoption evaluation (Phase 11). If the adoption-maker surfaces actionable findings, they are applied via commit on `ose-public/main`. If not, the report is filed as evidence of full classifier coverage.

### Out of scope (product)

- Any production code change to retained product apps (OrganicLever, AyoKoding, OSE Platform, `rhino-cli`, libs).
- New Nx project or npm workspace in `ose-public`.
- Any authoring work in `ose-primer` beyond what the first propagation PR (Phase 10) carries.
- Scheduling / automation of the sync agents.
- A checker/fixer triad for the sync pair.
- `ose-infra` or `ose-projects` cross-references.
- Rewriting product-flavoured prose in `ose-public` into generic prose for the template (propagator reports gaps, does not author replacements).
- Substantive rewriting of governance examples that cited demo paths — only mechanical path substitution or removal; deeper rewrite is a docs-quality follow-up.
- Trimming `scripts/doctor/` toolchain coverage — logical follow-up, separate plan.
- License changes to retained product apps — the FSL-1.1-MIT / MIT split under `governance/conventions/structure/licensing.md` is unchanged.
- Re-introducing any demo app into `ose-public` — the extraction is one-way, enforced by the classifier.

## Product-Level Risks

### PR-1 — Classifier ambiguity

**Risk**: Several paths (e.g., `CLAUDE.md`, `AGENTS.md`, the `.claude/settings.json`) have genuinely mixed content — part generic, part product-specific. Tagging the entire file `propagate` leaks product content; tagging `neither` strands generic content.

**Mitigation**: Classifier supports a `bidirectional` tag with a `transform` note naming the filter ("strip product sections before propagating"). Agents apply the filter or refuse to propagate if the filter is not implementable. In this plan, the only transform is "strip sections matching the product-app names" applied to `CLAUDE.md`, `AGENTS.md`, `README.md` when propagating.

### PR-2 — Over-eager adoption

**Risk**: The adoption-maker surfaces a template-side wording improvement that sounds cleaner but quietly drops a product-relevant nuance.

**Mitigation**: Every adoption finding is maintainer-reviewed. The report format requires a "rationale" column explaining why the change is proposed, so the maintainer can quickly judge whether the nuance is actually lost.

### PR-3 — UX of invoking agents

**Risk**: Invoking an agent with the full pre-flight (clone freshness check, classifier parse, diff, report write) is verbose. If the invocation UX is bad, the agents get used rarely.

**Mitigation**: Skill documents a single natural-language invocation form ("run the propagation-maker in dry-run mode against the primer"). The agents' frontmatter descriptions are explicit about modes and defaults.

### PR-4 — Report bloat

**Risk**: Early runs produce enormous reports because the primer and source have diverged. Maintainer struggles to triage.

**Mitigation**: Reports group by significance (structural / substantive / trivial). First-pass workflow is: review structural + substantive; skim trivial; defer or auto-accept trivial wording changes in a future run.

### PR-5 — Mirror drift in `.opencode/`

**Risk**: The existing `.claude/` → `.opencode/` sync pipeline fails for a new agent type and the OpenCode mirror silently lacks a twin.

**Mitigation**: Delivery checklist explicitly verifies mirror presence after each new agent or skill is added. `repo-rules-checker` catches asymmetry on the next pass regardless.

### PR-6 — Parity mode treated as optional

**Risk**: The propagation-maker has two modes: normal propagation and parity-check. If the maintainer skips Phase 7's parity-check and jumps to Phase 8, a demo-side improvement that drifted from `ose-public` into the primer unidirectionally could be clobbered, OR a demo-side-only change in `ose-public` that never made it to the primer is permanently lost from the public surface.

**Mitigation**: Delivery checklist makes Phase 7 a hard gate. Phase 8 commits reference the parity report by filename. Any Phase 8 commit without a valid parity-report reference is flagged by the maintainer on self-review.

### PR-7 — Governance docs with demo examples degrade silently

**Risk**: `governance/development/quality/three-level-testing-standard.md` and similar docs quote demo-be paths as examples. Mechanically removing the paths leaves hanging sentences or breaks the docs' pedagogy.

**Mitigation**: Phase 8 governance-doc edits are scoped to either (a) replace the demo path with a product-app path of equivalent language, or (b) delete the bullet entirely when no product-app equivalent exists. Rewriting the docs substantively is explicitly a **follow-up plan**, not this plan.

### PR-8 — External blog / AI training links 404

**Risk**: External references to `github.com/wahidyankf/ose-public/tree/main/apps/a-demo-*` break after extraction.

**Mitigation**: This plan does not control external content, but the new reference doc and README Related Repositories section surface the move, and `ROADMAP.md` / README records an extraction changelog entry so future readers can trace the move.

### PR-9 — Reusable workflow accidentally pruned

**Risk**: During workflow cleanup, a `_reusable-*.yml` called by product apps is removed because it was also called by a demo.

**Mitigation**: Phase 8 workflow-cleanup step operates in two sub-steps: (i) delete only files matching `test-a-demo-*.yml`; (ii) edit `_reusable-*.yml` ONLY to remove demo-scoped conditionals or inputs, never the whole file. Any reusable kept in the tree is re-verified by the post-extraction green-run in Phase 9.

## Related Documents

- [brd.md](./brd.md) — Business perspective: goal, rationale, impact, business-level risks.
- [tech-docs.md](./tech-docs.md) — Technical perspective: architecture, agent specs, classifier.
- [delivery.md](./delivery.md) — Sequential checklist.
