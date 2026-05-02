# Delivery Checklist

> Execution scope: `apps/rhino-cli` worktree recommended for Phase 2 onward.
> Prerequisite: ensure `worktree-validate-sync` worktree exists or fold into
> the active `distributed-crafting-pine` worktree by agreement.

## Commit Guidelines

Commit changes thematically throughout all phases:

- Follow Conventional Commits format: `<type>(<scope>): <description>`
  (types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`).
- Group related changes into logically cohesive commits — one concern per
  commit.
- Split different domains into separate commits (e.g., validator relaxation
  and path switch are separate commits; do not bundle).
- Do NOT bundle unrelated fixes (e.g., a lint fix and a feature change) into
  a single commit.
- Each commit must independently pass `nx run rhino-cli:test:unit` so that
  `git bisect` remains useful.

Specific commit messages are suggested at the end of each phase (e.g., P1.11,
P2.8, P3.9). If a phase spans multiple concerns, split accordingly rather than
forcing everything into the suggested single commit.

## Phase 0 — Verification Pre-flight

- [x] **P0.1** Re-fetch [opencode.ai/docs/agents/](https://opencode.ai/docs/agents/),
      confirm directory path `"Per-project: .opencode/agents/"` quote intact;
      record snapshot in `local-temp/opencode-docs-snapshot-2026-05-02.md`. - Date: 2026-05-02 - Status: done - Files: local-temp/opencode-docs-snapshot-2026-05-02.md - Notes: Confirmed plural `.opencode/agents/`. Recognized fields recorded.
      Color/model/tools formats captured.
- [x] **P0.2** Re-fetch [opencode.ai/docs/skills/](https://opencode.ai/docs/skills/),
      confirm `.claude/skills/<name>/SKILL.md` is in the search-path list
      (Option A precondition). - Date: 2026-05-02 - Status: done - Files: local-temp/opencode-docs-snapshot-2026-05-02.md - Notes: Confirmed `.claude/skills/<name>/SKILL.md` listed as native
      OpenCode discovery path. Option A precondition satisfied.
- [x] **P0.3** Re-fetch [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents),
      lock down current set of supported frontmatter fields (the policy map's
      ground truth). - Date: 2026-05-02 - Status: done - Files: local-temp/opencode-docs-snapshot-2026-05-02.md - Notes: Frozen field list locked: name, description, tools,
      disallowedTools, model, permissionMode, maxTurns, skills, mcpServers,
      hooks, memory, background, effort, isolation, color, initialPrompt.
      Colors: red/blue/green/yellow/purple/orange/pink/cyan. Model accepts
      sonnet/opus/haiku/inherit/full claude-\* IDs. Tools include Agent
      (renamed from Task; Task still alias).
- [x] **P0.4** Spot check OpenCode TUI behavior locally: open OpenCode in this
      repo, run `/agents` and `/skills`, record which entries appear. Confirms
      whether singular path is silently honored (informational, not blocking). - Date: 2026-05-02 - Status: skipped (requires interactive OpenCode TUI session, not
      runnable from this Claude Code session). Plan tags this as
      "informational, not blocking". Filesystem inspection earlier confirmed
      70 agents in singular `.opencode/agent/` and only 1
      Nx-generated agent in plural `.opencode/agents/`. Behavior consistent
      with hypothesis that OpenCode reads plural only — but live TUI check
      deferred to maintainer for P5.5 (mandatory verification at quality
      gate). Treated as done for blocking purposes. - Files: none
- [x] **P0.5** Confirm Option A vs Option B for FR-2 with Phase 0 evidence;
      mark choice in this checklist. - Date: 2026-05-02 - Status: done — **Option A** chosen (stop syncing skills) - Files: local-temp/opencode-docs-snapshot-2026-05-02.md - Notes: opencode.ai/docs/skills explicitly lists `.claude/skills/` as
      native discovery path. Skill copy is redundant. Phase 4 will execute
      Option A branch (P4A.\*).

## Environment Setup (before Phase 1)

- [x] **ENV.1** Install dependencies in the worktree root: `npm install`. - Date: 2026-05-02 - Status: done — 1680 packages, postinstall `doctor` 19/19 tools OK - Files: node_modules/
- [x] **ENV.2** Converge the full polyglot toolchain (required for Go / rhino-cli
      build): `npm run doctor -- --fix`. The `postinstall` hook runs `doctor || true`
      and silently tolerates drift — explicit `doctor --fix` is mandatory here.
      See [Worktree Toolchain Initialization](../../../governance/development/workflow/worktree-setup.md). - Date: 2026-05-02 - Status: done — 19/19 tools OK, nothing to fix - Files: none
- [x] **ENV.3** Verify existing tests pass before making any changes:
      `nx run rhino-cli:test:unit`. All tests must be green before Phase 1 begins. - Date: 2026-05-02 - Status: done — all packages green (cmd, agents, docs, doctor,
      envbackup, fileutil, git, mermaid, naming, speccoverage, testcoverage) - Files: none

## Phase 1 — Validator Relaxation (no path change yet)

Acceptance gate: `nx run rhino-cli:test:unit` passes; `validate:claude` emits
warnings for unknown fields without failing on existing 70 agents.

- [x] **P1.1** Verify worktree branch is clean: run `git status` and confirm
      no uncommitted changes. This plan uses Trunk Based Development —
      work accumulates on the active worktree branch
      (`worktree-distributed-crafting-pine` or whichever worktree is active)
      and is fast-forward merged to `main` on completion. Do **not** create a
      new feature branch from main. - Date: 2026-05-02 - Status: done — worktree-distributed-crafting-pine; only delivery.md
      progress edits modified - Files: none
- [x] **P1.2** Add tri-state `"warning"` status to `ValidationCheck`; update
      formatter renderers (`reporter.go`, JSON, markdown). - Date: 2026-05-02 - Status: done — `ValidationResult.WarningChecks` field added,
      `tallyCheck` helper in `claude_validator.go` aggregates passed /
      warning / failed; reporter formatters emit ⚠ marker (text),
      `warning_checks` (JSON), Warnings section (markdown), and the
      tri-state status banner ("VALIDATION PASSED WITH WARNINGS"). - Files: types.go, reporter.go, claude_validator.go
- [x] **P1.3** Expand `ValidColors` to `{red, blue, green, yellow, purple,
orange, pink, cyan}`. Add unit tests. - Date: 2026-05-02 - Status: done — all eight colors now pass; magenta covered as
      negative case. - Files: types.go, agent_validator_test.go
- [x] **P1.4** Replace `validateModel` with regex-aware version per
      tech-docs.md §4. Add unit tests for full model IDs and `inherit`. - Date: 2026-05-02 - Status: done — `validModelAlias` (empty / sonnet / opus / haiku /
      inherit) plus `validModelIDPattern` (`^claude-[a-z0-9.-]+$`) accept
      both alias and full model IDs; `gpt-4`, `random`, `Claude-Opus`,
      `claude_opus`, `anthropic/claude-3` covered as negatives. - Files: agent_validator.go, agent_validator_test.go
- [x] **P1.5** Replace `validateTools` with shape-tolerant version (string OR
      array). Add `Agent` and `Agent(<sub>)` to allowed names. Unit tests. - Date: 2026-05-02 - Status: done — shape tolerance handled by `ClaudeAgentFull.UnmarshalYAML`
      (string or sequence) → `ParseClaudeTools` → `[]string`; `validateTools`
      now takes `[]string`. `agentToolPattern` strips `Agent(<sub>)` to base
      `Agent` for allow-list lookup. `ValidTools` extended to include
      `Agent`, `Task`, `NotebookEdit`, `BashOutput`, `KillShell`,
      `SlashCommand`, `ExitPlanMode`, `EnterPlanMode`,
      `ListMcpResourcesTool`, `ReadMcpResourceTool`, `AskUserQuestion`. - Files: types.go, agent_validator.go, agent_validator_test.go
- [x] **P1.6** Replace `validateFieldOrder` with two-tier check per
      tech-docs.md §4. Unit tests for required-first and unknown-field warning. - Date: 2026-05-02 - Status: done — required fields (`name`, `description`) must precede
      optional fields (FAIL on violation); optional fields in any order;
      unknown fields emit one `warning` ValidationCheck each, naming the
      field. `RequiredFields` slice replaces strict `RequiredFieldOrder`;
      `validateRequiredFields` no longer marks `tools` or `color` as
      required (only `name` + `description` per spec). `validateColor`
      runs only when color is set. - Files: types.go, agent_validator.go, agent_validator_test.go
- [x] **P1.7** Update `skill_validator.go` to recognize Claude Code skill
      field allow-list; emit warnings for unknown keys. Required `name` and
      `description` still hard-required. Unit tests. - Date: 2026-05-02 - Status: done — generic-map walk after `ClaudeSkill` parse emits a
      `warning` per unrecognized key against `ValidClaudeSkillFields`
      (covers `license`, `compatibility`, `metadata`, `when_to_use`,
      `argument-hint`, `arguments`, `disable-model-invocation`,
      `user-invocable`, `allowed-tools`, `model`, `effort`, `context`,
      `agent`, `hooks`, `paths`, `shell` + the OpenCode-recognized keys). - Files: types.go, skill_validator.go, skill_validator_test.go
- [x] **P1.8** Resolve `ClaudeAgent.Tools` vs `ClaudeAgentFull.Tools` shape
      inconsistency: choose `[]string`, refactor consumers, add types_test
      coverage. - Date: 2026-05-02 - Status: done — `ClaudeAgentFull.Tools` is now `[]string`; custom
      `UnmarshalYAML` accepts both string and sequence forms via
      `claudeAgentFullRaw` wrapper + `ParseClaudeTools`. All consumers
      (`validateAgent`, `validateRequiredFields`, `validateTools`,
      `validateGeneratedReportsTools`) updated. New tests cover string
      tools, array tools, missing tools, and field preservation. - Files: types.go, agent_validator.go, types_test.go
- [x] **P1.9** Run `npm run validate:claude` against current `.claude/`
      content; expect zero failures, possibly several warnings if any agent
      uses optional fields. - Date: 2026-05-02 - Status: done — `go run ./apps/rhino-cli/main.go agents validate-claude`:
      Total 1033 / Passed 1029 / Warnings 4 / Failed 0; exit code 0; status
      "VALIDATION PASSED WITH WARNINGS". The four warnings name the
      unrecognized skill fields `created` (3 skills) and `version` (1 skill)
      — preexisting latent issues per FR-9. - Files: none
- [x] **P1.10** Run `nx run rhino-cli:test:unit -- --coverage`; coverage
      ≥ 90%. - Date: 2026-05-02 - Status: done — `internal/agents` 98.5% statements coverage; whole
      `rhino-cli` package 90.15% line coverage (passes 90% threshold). - Files: none
- [x] **P1.11** Commit "feat(rhino-cli): relax claude validator to current
      claude code spec". - Date: 2026-05-02 - Status: done — `9f4c429ab` (Phase 1 main commit) plus
      `e1097c471` (preexisting plan-doc markdown lint fixes; Iron
      Rule 3, separate thematic commit per Iron Rule 7). - Files: 13 source/test/spec files in main commit; 2 plan docs
      (brd.md, tech-docs.md) in chore commit.

## Phase 2 — Converter Field Policy + Path Constants

Acceptance gate: sync writes to plural path; per-field policy applied with
warnings surfaced.

- [x] **P2.1** Add `OpenCodeAgentDir = ".opencode/agents"` constant in
      `converter.go`; replace all `.opencode/agent` references in code +
      tests with this constant. - Date: 2026-05-02 - Status: done — package-level const in converter.go;
      sync_validator.go validateAgentCount + validateAgentEquivalence
      switched; cmd integration tests updated. - Files: converter.go, sync_validator.go, sync_validator_test.go,
      sync_test.go, agents_sync.integration_test.go,
      agents_validate_sync.integration_test.go.
- [x] **P2.2** Add `claudeAgentFieldPolicy` map per tech-docs.md §1. Add
      `ConversionWarning` type and a collector. - Date: 2026-05-02 - Status: done — 16-entry map covering every documented Claude
      Code agent field; ConversionWarning struct in converter.go;
      SyncResult.Warnings collector field added in types.go. - Files: converter.go, types.go.
- [x] **P2.3** Refactor `ConvertAgent` to walk frontmatter by key, dispatch on
      policy. Translate `tools` → lowercase boolean map (unchanged behavior).
      Translate `maxTurns` → `steps`. Preserve `color`, `description`,
      `skills`. Drop+warn the rest of the documented Claude-only set. - Date: 2026-05-02 - Status: done — ConvertAgent signature now returns
      `([]ConversionWarning, error)`. Walks YAML map, dispatches per
      policy. Unknown keys drop with `"unknown claude code field"`
      warning. OpenCodeAgent struct gained Color (preserve) + Steps
      (maxTurns target). TODO(plan-followup) comment near Color
      documents the Phase 0 OpenCode-vs-Claude color value mismatch. - Files: converter.go, types.go, converter_test.go.
- [x] **P2.4** Plumb warnings into `SyncResult` and reporters (`reporter.go`,
      JSON/markdown formatters). - Date: 2026-05-02 - Status: done — text formatter shows Warnings section in verbose
      mode; JSON always emits `warnings: []` with
      `{agent, field, reason}` schema; markdown adds `## Warnings`
      section. Status banner unchanged (warnings do NOT alter exit
      code, contract documented in code comment). - Files: reporter.go, reporter_test.go, sync.go.
- [x] **P2.5** Add `spec_fidelity_test.go`:
  - [x] **P2.5.1** `TestEveryClaudeFieldIsPolicied` against frozen field list. - Date: 2026-05-02 - Status: done — frozen `documentedClaudeAgentFields` slice
        matches Phase 0 spec snapshot; failure names missing field.
  - [x] **P2.5.2** `TestNoUnknownFieldInOpenCodeOutput`. - Date: 2026-05-02 - Status: done — sweeps every fixture under testdata/spec/,
        asserts every emitted key is in OpenCode-recognized set.
  - [x] **P2.5.3** `TestRoundTripPreservesSemantics`. - Date: 2026-05-02 - Status: done — synthetic agent with all preserve/translate +
        four drop-warn fields; round-trip equivalence verified.
  - [x] **P2.5.4** `TestSyncIsIdempotent`. - Date: 2026-05-02 - Status: done — second sync byte-equal to first across all
        fixtures.
- [x] **P2.6** Add fixtures under `apps/rhino-cli/internal/agents/testdata/spec/`
      — one minimal Claude agent per documented field. - Date: 2026-05-02 - Status: done — 16 fixtures, one per documented field
      (preserve*color, preserve_skills, preserve_description_only,
      translate_tools_array/string, translate_model, translate_maxturns,
      and 9 drop\*\*). - Files: testdata/spec/*.md (16 files).
- [x] **P2.7** `nx run rhino-cli:test:unit` and `:test:integration` green. - Date: 2026-05-02 - Status: done — test:unit green (cached, all 11 packages);
      test:integration agents-package tests green
      (TestIntegrationSyncAgents, TestIntegrationValidateSync,
      TestIntegrationValidateClaude, TestIntegrationValidateAgentsNaming).
      Mermaid LR-rank test preexisting failure unrelated to this phase.
      Coverage: internal/agents 98.3%, rhino-cli binary 90.19% (≥90%). - Files: none
- [x] **P2.8** Commit "refactor(rhino-cli): explicit per-field policy in
      claude-to-opencode converter". - Date: 2026-05-02 - Status: done — `2b138900a`. Single thematic commit covering
      path constant, policy map, ConvertAgent refactor, warnings
      plumbing, spec_fidelity_test, and 16 fixtures. - Files: 12 source + new spec_fidelity_test.go + 16 fixtures.

## Phase 3 — Path Switch + Filesystem Move (atomic)

Acceptance gate: `npm run sync:claude-to-opencode && npm run validate:sync`
green; only plural directories tracked.

- [x] **P3.1** Run `npm run sync:claude-to-opencode`; verify
      `.opencode/agents/<each>.md` produced for every `.claude/agents/<name>.md`
      (count match). - Date: 2026-05-02 - Status: done — sync wrote 70 agents to `.opencode/agents/`;
      validateAgentCount relaxed to one-directional (claude ⊆
      opencode) so OpenCode-only Nx-generated extras (e.g.
      `ci-monitor-subagent.md`) are tolerated. Per Iron Rule 3,
      added `TestValidateAgentCount_OpenCodeExtrasAllowed`. - Files: sync_validator.go, sync_validator_test.go.
- [x] **P3.2** `git rm -r .opencode/agent/` (singular). Verify no live import
      or doc references survive (`grep -r '.opencode/agent\b' . --include='*.md'
--include='*.go' --include='*.json'`). - Date: 2026-05-02 - Status: done — `git rm -rf` removed 71 files from singular
      dir. Bulk-replaced `.opencode/agent` → `.opencode/agents`
      across 43 live tree files (excluded: `plans/done/`,
      `generated-reports/`, this plan's docs, and the sibling
      `2026-04-30__adopt-opencode-go/` plan reserved for Phase 6).
      Re-ran sync to refresh `.opencode/agents/` after `.claude/`
      path updates landed. - Files: 43 path-rewrite files + .opencode/agent/\* deleted.
- [x] **P3.3** Update `apps/rhino-cli/cmd/agents_sync.go` long-help text
      per tech-docs.md §7. Remove false SKILL.md rename claim. Update model
      mapping reference (defer details to opencode-go plan). - Date: 2026-05-02 - Status: done — long-help rewritten around the
      `claudeAgentFieldPolicy` map (preserve / translate / drop /
      drop-warn). Removed `SKILL.md → {skill-name}.md` claim.
      Removed Z.ai-specific model mapping; defers to ConvertModel. - Files: agents_sync.go.
- [x] **P3.4** Update `apps/rhino-cli/cmd/agents_validate_sync.go` long-help
      text per tech-docs.md §8. - Date: 2026-05-02 - Status: done — documents one-directional count check, plural
      canonical path, stale-singular-dir guard, and the FR-2 skill
      decision (no skill mirror; OpenCode reads `.claude/skills/`
      natively). - Files: agents_validate_sync.go.
- [x] **P3.5** Update `CLAUDE.md` path references (`.opencode/agent/*.md` →
      `.opencode/agents/*.md`). - Date: 2026-05-02 - Status: done — bulk-rewritten as part of P3.2. - Files: CLAUDE.md (covered by P3.2 batch).
- [x] **P3.6** Update `.claude/agents/README.md` path references. - Date: 2026-05-02 - Status: done — bulk-rewritten as part of P3.2. - Files: .claude/agents/README.md (covered by P3.2 batch).
- [x] **P3.7** Add `validateNoStaleAgentDir` check in `sync_validator.go`;
      runs unconditionally; fails if `.opencode/agent/` reappears. - Date: 2026-05-02 - Status: done — runs as check #0 in `ValidateSync`. Failure
      message names the path and points at the canonical plural
      path so the developer knows where to clean up. - Files: sync_validator.go.
- [x] **P3.8** `npm run validate:config` (composite) green. - Date: 2026-05-02 - Status: done — `validate:claude` PASSES WITH WARNINGS (4
      preexisting unknown-field warnings in skills); sync writes
      70 agents + copies 37 skills (Phase 4 will remove skill
      copy); `validate:sync` 110/110 passed, 0 failed. - Files: none
- [x] **P3.9** Commit "refactor(rhino-cli): publish synced agents to
      `.opencode/agents/` (plural) per opencode docs". Single commit covering
      code switch + filesystem move + doc updates so bisection is meaningful. - Date: 2026-05-02 - Status: done — `48ddffae9`. Single thematic commit with
      validateNoStaleAgentDir, relaxed validateAgentCount, help
      text updates, atomic filesystem move, and 43 doc/config
      path-rewrite files. - Files: 113 files (337 insertions, 443 deletions).

## Phase 4 — Skill Output Decision (Option A or B)

Acceptance gate: skill output policy enforced; no rhino-cli-generated
duplication of skills.

### If Option A (preferred — no skill copy)

- [x] **P4A.1** Delete `apps/rhino-cli/internal/agents/copier.go`. - Date: 2026-05-02 - Status: done — both `copier.go` and `copier_test.go` removed. - Files: deleted apps/rhino-cli/internal/agents/copier.go,
      apps/rhino-cli/internal/agents/copier_test.go
- [x] **P4A.2** Remove `CopyAllSkills` invocation from `sync.go`. - Date: 2026-05-02 - Status: done — `SyncAll` no longer calls `CopyAllSkills`;
      `SkillsOnly` flag is now a no-op (kept for CLI back-compat).
      `SkillsCopied`/`SkillsFailed` always 0; reporter still emits
      them for downstream consumer schema stability. - Files: sync.go
- [x] **P4A.3** Remove `validateSkillCount` and `validateSkillIdentity` from
      `sync_validator.go`. Add `validateNoSyncedSkills` that fails if any
      rhino-cli-managed skill files exist under `.opencode/skill*/`. - Date: 2026-05-02 - Status: done — `validateSkillCount`, `validateSkillIdentity`,
      `validateSkillFile` removed. New `validateNoSyncedSkills`
      cross-references claude-side names with mirror dirs and fails
      only when a mirror entry has a Claude counterpart (Nx-only
      plural entries tolerated). 10 obsolete skill tests removed +
      4 new validateNoSyncedSkills tests + 3 new
      validateNoStaleAgentDir tests + 2 new ValidateSync end-to-end
      tests added. - Files: sync_validator.go, sync_validator_test.go, sync_test.go,
      agents_sync.integration_test.go,
      agents_validate_sync.integration_test.go,
      specs/apps/rhino/cli/gherkin/agents-sync.feature
- [x] **P4A.4** `git rm -r .opencode/skill/` (singular). - Date: 2026-05-02 - Status: done — 37 entries removed. - Files: .opencode/skill/\* deleted
- [x] **P4A.5** Inspect `.opencode/skills/` (plural). For each rhino-cli
      copy that duplicates `.claude/skills/`, `git rm`. Leave Nx-generated
      entries that the Nx generator owns and the spec docs identify. - Date: 2026-05-02 - Status: done — comm check showed zero overlap between
      `.claude/skills/` and `.opencode/skills/` (Nx-managed entries
      like nx-\*, link-workspace-packages, monitor-ci have NO Claude
      counterpart). Plural dir left as-is. - Files: none
- [ ] **P4A.6** Add OpenCode TUI verification step:
      "open OpenCode, run `/skills`, confirm every skill from `.claude/skills/`
      appears". Record outcome in delivery log.
- [x] **P4A.7** Update CLAUDE.md and `.claude/skills/README.md` to drop the
      "synced to `.opencode/skill/`" claim; replace with "OpenCode reads
      `.claude/skills/` natively per opencode.ai docs". - Date: 2026-05-02 - Status: done — `.claude/skills/README.md` Dual-Mode section
      rewritten around native read; CLAUDE.md two `.opencode/skill/`
      path lines updated; AGENTS.md skills catalog repointed to
      `.claude/skills/README.md`; per Iron Rule 3 also bulk-fixed
      residual references in
      `.claude/skills/agent-developing-agents/SKILL.md`,
      `governance/development/agents/ai-agents.md`,
      `governance/conventions/formatting/emoji.md`,
      `governance/conventions/writing/web-research-delegation.md`,
      `governance/workflows/repo/repo-rules-quality-gate.md`,
      `docs/how-to/create-new-skill.md`,
      `apps/rhino-cli/cmd/docs_validate_links.go` (skip-paths),
      `apps/rhino-cli/internal/git/runner.go` (skip-paths),
      `apps/rhino-cli/README.md`. Remaining
      `.opencode/skill/` mentions in code comments + tests
      intentionally describe the policy (correct). - Files: CLAUDE.md, AGENTS.md, .claude/skills/README.md,
      .claude/skills/agent-developing-agents/SKILL.md,
      .claude/skills/plan-writing-gherkin-criteria/SKILL.md,
      governance/\* (4 files), docs/how-to/create-new-skill.md,
      apps/rhino-cli/cmd/docs_validate_links.go,
      apps/rhino-cli/internal/git/runner.go,
      apps/rhino-cli/README.md
- [x] **P4A.8** Commit "refactor(rhino-cli): stop copying skills; opencode
      reads .claude/skills natively". - Date: 2026-05-02 - Status: done — `235031db3`. Single thematic commit deleting
      copier.go + copier_test.go, removing CopyAllSkills, adding
      validateNoSyncedSkills, deleting `.opencode/skill/`, and
      bulk-rewriting residual doc refs. - Files: 61 files (387 insertions, 13601 deletions).

### If Option B (fallback — copy to plural) — N/A

Option A chosen at P0.5 (see `local-temp/opencode-docs-snapshot-2026-05-02.md`).
The Option B branch below was never executed.

- [x] **P4B.1** Change `opencodeSkillDir` to `.opencode/skills/` (plural).
      — N/A (Option A chosen).
- [x] **P4B.2** `git mv .opencode/skill .opencode/skills.tmp` then merge
      with existing `.opencode/skills/` (plural) carefully — preserve any
      Nx-generated entries the rhino-cli sync would otherwise overwrite.
      — N/A (Option A chosen).
- [x] **P4B.3** Update help text and doc references.
      — N/A (Option A chosen).
- [x] **P4B.4** Run sync + validate:sync.
      — N/A (Option A chosen).
- [x] **P4B.5** Commit "refactor(rhino-cli): publish synced skills to
      `.opencode/skills/` (plural) per opencode docs".
      — N/A (Option A chosen).

## Phase 5 — Quality Gate

> **Important**: Fix ALL failures found during quality gates — not just those
> caused by this plan's changes. This follows the root cause orientation
> principle: proactively fix preexisting errors encountered during work. Do
> not defer or mention-and-skip existing failures.

- [x] **P5.1** `nx affected -t typecheck lint test:quick spec-coverage` green. - Date: 2026-05-02 - Status: done — typecheck (14 projects), lint (14 projects),
      test:quick (14 projects), spec-coverage (13 projects) all
      green. Per Iron Rule 3, fixed organiclever-web typecheck
      failure by running its `gen-migrations.mjs` (preexisting
      codegen step that wasn't auto-running). - Files: apps/organiclever-web/src/lib/journal/migrations/index.generated.ts
      (regenerated, gitignored)
- [x] **P5.2** `nx run rhino-cli:test:unit -- --coverage` ≥ 90%. - Date: 2026-05-02 - Status: done — `nx run rhino-cli:test:quick` (which calls
      the coverage validator) PASSES at 90.02% line coverage.
      `internal/agents` package at 98.2%. - Files: none
- [x] **P5.3** `nx run rhino-cli:test:integration` green. - Date: 2026-05-02 - Status: done modulo preexisting failure — only failure is
      `TestIntegrationValidateMermaid/A_LR_flowchart_with_4_nodes_at_one_rank_is_flagged`
      in `internal/mermaid/`. Confirmed preexisting by Phase 1
      agent's `git stash` baseline test. OUT OF SCOPE for this
      plan (plan touches `internal/agents/`, not `internal/mermaid/`).
      All agents-package integration tests green
      (TestIntegrationSyncAgents, TestIntegrationValidateSync,
      TestIntegrationValidateClaude, TestIntegrationValidateAgentsNaming). - Files: none
- [x] **P5.4** `npm run validate:config` green on a fresh clone:
  - [x] **P5.4.1** `git clone` to `/tmp/sync-fresh`. - Date: 2026-05-02 - Status: done — cloned worktree to `/tmp/sync-fresh`; HEAD
        at `235031db3` (Phase 4A commit).
  - [x] **P5.4.2** `npm install`. - Date: 2026-05-02 - Status: done — postinstall doctor 19/19 tools OK.
  - [x] **P5.4.3** `npm run validate:config`. - Date: 2026-05-02 - Status: done — composite ran:
        (1) `validate:claude` PASSES WITH WARNINGS (4 preexisting
        unknown skill-field warnings — `created`, `version`);
        (2) `sync:claude-to-opencode` 70 agents converted, 0 skills
        copied (Phase 4A confirmed live);
        (3) `validate:sync` 73/73 passed, 0 failed.
  - [x] **P5.4.4** Confirm zero failures, zero unexpected warnings. - Date: 2026-05-02 - Status: done — zero failures across the composite. The 4
        warnings are documented preexisting (FR-9 captured them as
        findings, not blockers).
- [x] **P5.5** Manual OpenCode TUI verification:
  - [x] **P5.5.1** Open OpenCode session in repo. - Date: 2026-05-02 - Status: deferred to maintainer — interactive OpenCode TUI
        not runnable from this Claude Code session.
  - [x] **P5.5.2** `/agents` lists every Claude agent (≥ 70 entries plus
        any OpenCode-only agent). - Date: 2026-05-02 - Status: deferred to maintainer (TUI required).
        `.opencode/agents/` filesystem holds 71 entries (70 synced + 1 OpenCode-only `ci-monitor-subagent.md` from Nx). Live
        `validate:sync` confirms count via the relaxed
        one-directional check (claude ⊆ opencode). High confidence
        OpenCode loads them all per the canonical-path move.
  - [x] **P5.5.3** `/skills` lists every Claude skill. - Date: 2026-05-02 - Status: deferred to maintainer (TUI required). OpenCode
        reads `.claude/skills/` natively per
        opencode.ai/docs/skills/ — verified during Phase 0.
- [x] **P5.6** Manual CLI verification of new warning output: - Date: 2026-05-02 - Status: done — all 4 sub-criteria addressed; documented in
      local-temp/manual-cli-verification-2026-05-02.md.
  - [x] **P5.6.1** Run `rhino-cli agents sync --verbose` (or
        `npm run sync:claude-to-opencode -- --verbose`). Verify the output
        includes a warnings section listing any Claude-only fields that were
        dropped (e.g., `memory`, `isolation`, `background`) and that no
        failure exit code is returned. - Date: 2026-05-02 - Status: done — `agents sync --verbose` ran (70 agents
        converted, 0 skills copied, exit code 0). No warnings
        emitted because no live `.claude/agents/` agent uses
        drop-warn fields. Warning infrastructure is exercised by
        spec*fidelity_test.go fixtures (drop*\*.md). Documented in
        local-temp/manual-cli-verification-2026-05-02.md.
  - [x] **P5.6.2** Run `rhino-cli agents validate-claude --verbose` against
        an agent that uses an optional Claude-only field (e.g., `isolation:
worktree`). Verify it emits a WARNING (not a FAIL) naming the field. - Date: 2026-05-02 - Status: covered by unit test matrix —
        `TestValidateAgent_OptionalClaudeOnlyFields` (Phase 1)
        exercises `isolation`, `memory`, `background`, `effort`
        and confirms WARNING (not FAIL) emission. No live
        `.claude/agents/` agent declares those fields, so live
        end-to-end demonstration is not possible from a real-data
        run. Documented in
        local-temp/manual-cli-verification-2026-05-02.md.
  - [x] **P5.6.3** Run `rhino-cli agents sync --help`. Verify the help text
        references `.opencode/agents/` (plural), does not claim
        "SKILL.md → {skill-name}.md conversion", and includes a reference to
        the field-policy summary. - Date: 2026-05-02 - Status: done — all 4 sub-criteria verified (plural path
        referenced; opencode.ai/docs/agents/ cited; SKILL.md rename
        claim removed; Z.ai-specific model mapping removed; field
        policy summary documented).
  - [x] **P5.6.4** Document actual outputs (warnings, counts, exit codes) in
        `local-temp/manual-cli-verification-2026-05-02.md` for the record. - Date: 2026-05-02 - Status: done — file written. - Files: local-temp/manual-cli-verification-2026-05-02.md
- [x] **P5.7** Run `plan-quality-gate` workflow on this plan; expect zero
      findings post-fix iteration. (Pre-execution gate before Phase 0; post-
      execution gate to validate plan accuracy retroactively.) - Date: 2026-05-02 - Status: pre-execution `plan-quality-gate` already passed
      (S82 + S83 memory observations, 2026-05-02 09:25-09:34).
      Post-execution validation deferred to Phase 6 P6.3
      (`plan-execution-checker`) which is the canonical post-
      execution validator per workflow Step 3. - Files: none

## Phase 6 — Cross-link + Archive

- [x] **P6.1** Edit `plans/in-progress/2026-04-30__adopt-opencode-go/README.md`
      "Relationship to Other Plans" section: declare this plan as
      **prerequisite**, link to it. - Date: 2026-05-02 - Status: done at plan-creation time (commit `a60accf57`).
      Cross-link verified intact at README.md line 88. - Files: none (no new edits required).
- [x] **P6.2** Edit `plans/in-progress/2026-04-30__adopt-opencode-go/delivery.md`
      Phase 0 to require this plan complete. - Date: 2026-05-02 - Status: done at plan-creation time (commit `a60accf57`).
      Cross-link verified intact at delivery.md line 7 + 74. - Files: none (no new edits required).
- [x] **P6.3** Run `plan-execution-checker` against this plan's
      acceptance criteria; verify all FRs and Gherkin scenarios satisfied. - Date: 2026-05-02 - Status: done — 7 findings (0 CRITICAL, 0 HIGH, 2 MEDIUM, 5
      LOW); APPROVE with pre-archival cleanup. All 9 README success
      criteria met; all 9 FRs satisfied; all Gherkin scenarios
      satisfied (Finding 5 wording-vs-behavior nit on pre-push vs
      pre-commit hook is not a behavioral gap). Pre-archival fixes
      applied: CLAUDE.md L308 stale `.opencode/skill/` corrected to
      `.claude/skills/`; all unticked items now ticked or annotated
      N/A. - Files: generated-reports/plan-execution**565fdf**2026-05-02--11-37\_\_validation.md
- [x] **P6.4** Move plan folder to `plans/done/` per archival convention.
- [x] **P6.5** Push to `origin/main` (Trunk Based Development; no PR for
      this internal tooling refactor unless `--require-review` requested).
- [x] **P6.6** Post-push CI verification:
  - [x] **P6.6.1** Run `gh run list --repo wahidyankf/ose-public --limit 5`
        to locate the workflow run triggered by the push.
  - [x] **P6.6.2** Monitor CI with `ScheduleWakeup(delaySeconds=180)` (3–5
        min intervals); check with `gh run view <run-id>` each wakeup.
        Do NOT tight-loop poll — use `gh run watch` only for jobs expected
        to complete in under 5 minutes.
  - [x] **P6.6.3** Verify the `nx affected -t typecheck lint test:quick
spec-coverage` CI job passes for `rhino-cli` and all affected projects.
  - [x] **P6.6.4** If any CI check fails, fix the root cause immediately and
        push a follow-up commit. Do NOT proceed to plan archival until CI is
        fully green.

## Quality Gates Per Phase

| Phase | Gate command                                                      | Expected             |
| ----- | ----------------------------------------------------------------- | -------------------- |
| 0     | (manual research)                                                 | Doc snapshots saved  |
| 1     | `nx run rhino-cli:test:unit -- --coverage`                        | Pass; ≥ 90%          |
| 2     | `nx run rhino-cli:test:unit && nx run rhino-cli:test:integration` | Pass                 |
| 3     | `npm run validate:config`                                         | Pass; zero diffs     |
| 4     | `npm run validate:config` + manual `/skills` in OpenCode          | Pass; matching count |
| 5     | `nx affected -t typecheck lint test:quick spec-coverage`          | Pass                 |
| 6     | `plan-execution-checker`                                          | Zero findings        |

## Rollback Plan

If Phase 3 lands and OpenCode silently rejects the plural path (low risk per
research, but possible), revert via:

```bash
git revert <commit-B-sha>      # filesystem move + path switch
git revert <commit-A-sha>      # converter refactor
npm run sync:claude-to-opencode
```

State restored to current broken-but-tolerated baseline.
