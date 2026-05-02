# Delivery Checklist

**Prerequisites**:

1. OpenCode Go subscription active; `OPENCODE_GO_API_KEY` available in the
   local environment.
2. **[validate-claude-opencode-sync-correctness](../../done/2026-05-02__validate-claude-opencode-sync-correctness/README.md)
   plan is complete and archived to `plans/done/`**. That plan switches the
   canonical sync output from `.opencode/agent/` (singular) to
   `.opencode/agents/` (plural), relaxes validators to accept current Claude
   Code spec, and removes the singular path from git. Without it, this plan
   would publish `opencode-go/*` IDs to a directory OpenCode does not load,
   silently no-opping the migration in every developer's OpenCode session.

This plan is independent of the two organiclever in-progress plans
(`2026-04-25__organiclever-web-app/`, `2026-04-28__organiclever-web-event-mechanism/`).

---

## Execution Context (Worktree)

This plan executes inside the `ose-public` subrepo worktree:

- Worktree path: `ose-public/.claude/worktrees/moonlit-twirling-kazoo/`
- To enter the worktree from the parent session: `cd ose-public && claude --worktree moonlit-twirling-kazoo`
- All commands below run from the worktree root unless otherwise noted.

---

## Environment Setup (Run First in Worktree Root)

- [ ] Install dependencies:

  ```bash
  npm install
  ```

- [ ] Converge the full polyglot toolchain (required — `postinstall` runs `doctor || true` and
      silently tolerates drift; see [Worktree Toolchain Initialization](../../../governance/development/workflow/worktree-setup.md)):

  ```bash
  npm run doctor -- --fix
  ```

- [ ] Verify the baseline rhino-cli test suite passes before making any changes:

  ```bash
  nx run rhino-cli:test:unit
  ```

  Expect: all green. If tests fail before changes, fix preexisting issues first.

---

## Commit Guidelines

- Conventional Commits format: `<type>(<scope>): <description>`
- Commit changes thematically — group related changes into logically cohesive commits
- Split different domains/concerns into separate commits (already reflected in the suggested commit sequence below)
- Do NOT bundle unrelated fixes into a single commit
- Suggested commits in order:
  - `feat(rhino-cli): switch ConvertModel to opencode-go provider IDs`
  - `test(rhino-cli): update model ID expectations to opencode-go`
  - `chore(opencode): switch to opencode-go provider; remove Z.ai MCPs`
  - `docs(model-selection): update OpenCode Go equivalents and web search docs`
- Do NOT amend; create a NEW commit if pre-commit / pre-push hooks fail.

---

## Phase 0 — Prerequisites, Slug Verification, and Exa Smoke-Test (Manual, No Code)

### Prerequisite plan gate

- [ ] Confirm the validate-claude-opencode-sync-correctness plan is in
      `plans/done/` (not `plans/in-progress/`):

  ```bash
  ls plans/done/ | grep validate-claude-opencode-sync-correctness
  ```

  Expect: one matching folder. If the plan is still in-progress, this plan
  must wait — do not start Phase 1 below until it lands.

- [ ] Confirm the canonical sync output directory is `.opencode/agents/`
      (plural) and the singular path is absent:

  ```bash
  test -d .opencode/agents && echo "plural OK"
  test ! -d .opencode/agent && echo "singular absent OK"
  ```

  Expect both messages. If either fails, the prerequisite plan did not
  complete its filesystem move; reopen it before proceeding.

### Model slug verification

- [ ] Confirm `OPENCODE_GO_API_KEY` is set in the local shell:

  ```bash
  echo $OPENCODE_GO_API_KEY   # must print a non-empty string
  ```

- [ ] Open the OpenCode TUI and run `/models` to see the full OpenCode Go model list
- [ ] Confirm the large model slug: verify `minimax-m2.7` appears exactly as listed
  - If the slug is different (e.g., `minimax-m2.7-pro`, `minimax-v2.7`), record
    the correct slug and use it throughout all phases below
- [ ] Confirm the small model slug: verify `glm-5` appears exactly as listed
  - If the slug is different, record the correct slug and use it throughout
- [ ] Note the verified slugs: large = `_______________`, small = `_______________`

### Exa web search smoke-test

- [ ] Set `OPENCODE_ENABLE_EXA=true` in the current shell:

  ```bash
  export OPENCODE_ENABLE_EXA=true
  ```

- [ ] Open an OpenCode session and ask the model to search the web for something
      simple (e.g., "search for the latest OpenCode release notes")
  - If the model invokes the `websearch` tool → Exa works with OpenCode Go ✓
  - If the model says web search is unavailable or returns an error → Exa is
    not confirmed with `opencode-go` models; Perplexity MCP is the fallback
- [ ] Record Exa status: works ☐ / not available ☐
- [ ] If Exa works: add to `~/.zshrc` or `~/.bashrc` for persistence:

  ```bash
  export OPENCODE_ENABLE_EXA=true
  ```

- [ ] Test Perplexity MCP fallback (optional but recommended):
  - Confirm `PERPLEXITY_API_KEY` is set: `echo $PERPLEXITY_API_KEY`
  - In the OpenCode session, ask the model to use Perplexity for a web search
  - Expect: the `perplexity` MCP server starts and returns results

---

## Phase 1 — rhino-cli Go Source Changes

### 1.1 Update `ConvertModel()` in converter.go

- [ ] Open `apps/rhino-cli/internal/agents/converter.go`
- [ ] Replace the `ConvertModel()` function body:
  - Remove: cases for `"sonnet"`, `"opus"` returning `"zai-coding-plan/glm-5.1"`
  - Remove: `default` returning `"zai-coding-plan/glm-5.1"`
  - Remove: case for `"haiku"` returning `"zai-coding-plan/glm-5-turbo"`
  - Add: case `"haiku"` returning `"opencode-go/glm-5"` (or verified slug)
  - Add: `default` returning `"opencode-go/minimax-m2.7"` (or verified slug)
- [ ] The `"sonnet"` and `"opus"` explicit cases can be removed (both fall into
      `default`) — keep the switch readable with just `"haiku"` and `default`

### 1.2 Update `OpenCodeAgent` struct comment in types.go

- [ ] Open `apps/rhino-cli/internal/agents/types.go`
- [ ] Line 23: change the inline comment from
      `// "zai-coding-plan/glm-5.1" | "zai-coding-plan/glm-5-turbo"` to
      `// "opencode-go/minimax-m2.7" | "opencode-go/glm-5"`

### 1.3 Update comment in agents_sync.go

- [ ] Open `apps/rhino-cli/cmd/agents_sync.go`
- [ ] Line 25: update the model-mapping comment to reference OpenCode Go IDs
      instead of `zai-coding-plan/*`

### 1.4 Update comment in agents_validate_sync.go

- [ ] Open `apps/rhino-cli/cmd/agents_validate_sync.go`
- [ ] Line 21: update the model-mapping comment to reference OpenCode Go IDs

### 1.5 Commit source changes

- [ ] Stage and commit:

  ```
  feat(rhino-cli): switch ConvertModel to opencode-go provider IDs
  ```

---

## Phase 2 — rhino-cli Test Changes

### 2.1 Update converter_test.go

- [ ] Open `apps/rhino-cli/internal/agents/converter_test.go`
- [ ] In `TestConvertModel`, update the 6 table test cases:
  - `"sonnet"` expected: `"opencode-go/minimax-m2.7"`
  - `"opus"` expected: `"opencode-go/minimax-m2.7"`
  - `"haiku"` expected: `"opencode-go/glm-5"`
  - `""` (empty) expected: `"opencode-go/minimax-m2.7"`
  - `"  "` (whitespace) expected: `"opencode-go/minimax-m2.7"`
  - `"unknown-model"` expected: `"opencode-go/minimax-m2.7"`
- [ ] Find assertions `agent.Model != "zai-coding-plan/glm-5.1"` (around lines 245
      and 345); update to `"opencode-go/minimax-m2.7"`

### 2.2 Update types_test.go

- [ ] Open `apps/rhino-cli/internal/agents/types_test.go`
- [ ] In `TestOpenCodeAgent`: update `Model: "zai-coding-plan/glm-5.1"` to
      `Model: "opencode-go/minimax-m2.7"`
- [ ] Update the assertion string `"zai-coding-plan/glm-5.1"` to
      `"opencode-go/minimax-m2.7"`

### 2.3 Update sync_validator_test.go

- [ ] Open `apps/rhino-cli/internal/agents/sync_validator_test.go`
- [ ] Find all occurrences of `"zai-coding-plan/glm-5.1"` in OpenCode fixture
      strings (at lines ~635, 709, 736, 763, 798, 929, 957); replace each with
      `"opencode-go/minimax-m2.7"`
- [ ] Update the comment at line ~675 from
      `// Claude uses "sonnet" → should convert to "zai-coding-plan/glm-5.1"` to
      `// Claude uses "sonnet" → should convert to "opencode-go/minimax-m2.7"`

### 2.4 Update steps_common_test.go

- [ ] Open `apps/rhino-cli/cmd/steps_common_test.go`
- [ ] Rename the constant at line 85:
  - Old: `stepCorrespondingOpenCodeAgentUsesZaiGlmModel`
  - New: `stepCorrespondingOpenCodeAgentUsesOpenCodeGoModel`
- [ ] Update the regex value from
      `"zai-coding-plan/glm-5\.1"` to `"opencode-go/minimax-m2\.7"`

### 2.5 Update agents_sync.integration_test.go

- [ ] Open `apps/rhino-cli/cmd/agents_sync.integration_test.go`
- [ ] Lines ~193–194: replace `"zai-coding-plan/glm-5.1"` with
      `"opencode-go/minimax-m2.7"` in the content assertion and error message
- [ ] Line ~217: replace `stepCorrespondingOpenCodeAgentUsesZaiGlmModel` with
      `stepCorrespondingOpenCodeAgentUsesOpenCodeGoModel`

### 2.6 Update agents_validate_sync.integration_test.go

- [ ] Open `apps/rhino-cli/cmd/agents_validate_sync.integration_test.go`
- [ ] Lines ~66, 117, 144: replace `"zai-coding-plan/glm-5.1"` with
      `"opencode-go/minimax-m2.7"` in OpenCode fixture strings

### 2.7 Update agents_validate_naming.integration_test.go

- [ ] Open `apps/rhino-cli/cmd/agents_validate_naming.integration_test.go`
- [ ] Line ~56: replace `"zai-coding-plan/glm-5.1"` with
      `"opencode-go/minimax-m2.7"` in the OpenCode fixture string

### 2.8 Verify rhino-cli tests pass

- [ ] Build rhino-cli:

  ```bash
  nx run rhino-cli:build
  ```

- [ ] Run type check:

  ```bash
  nx run rhino-cli:typecheck
  ```

  Expect: no type errors

- [ ] Run lint:

  ```bash
  nx run rhino-cli:lint
  ```

  Expect: no lint violations

- [ ] Run unit tests:

  ```bash
  nx run rhino-cli:test:unit
  ```

  Expect: all pass, ≥90% coverage

- [ ] Run integration tests:

  ```bash
  nx run rhino-cli:test:integration
  ```

  Expect: all pass

- [ ] Run full quick gate:

  ```bash
  nx run rhino-cli:test:quick
  ```

  Expect: green

### 2.9 Commit test changes

- [ ] Stage and commit:

  ```
  test(rhino-cli): update model ID expectations to opencode-go
  ```

---

## Phase 3 — Config and Documentation Changes

### 3.1 Update .opencode/opencode.json

- [ ] Open `.opencode/opencode.json`
- [ ] Change `"model"` from `"zai-coding-plan/glm-5.1"` to
      `"opencode-go/minimax-m2.7"` (or verified slug)
- [ ] Change `"small_model"` from `"zai-coding-plan/glm-5-turbo"` to
      `"opencode-go/glm-5"` (or verified slug)
- [ ] Add a `"provider"` block after `"small_model"`:

  ```json
  "provider": {
    "opencode-go": {
      "options": {
        "apiKey": "{env:OPENCODE_GO_API_KEY}"
      }
    }
  }
  ```

- [ ] In the `"mcp"` block, **remove** these four entries:
  - `"zai-mcp-server"`
  - `"web-search-prime"`
  - `"web-reader"`
  - `"zread"`
- [ ] Verify the remaining `"mcp"` block contains exactly:
      `"perplexity"`, `"nx-mcp"`, `"playwright"`
  - `perplexity` — retained as the configured web search fallback (used when
    `PERPLEXITY_API_KEY` is set and Exa is unavailable or insufficient)
  - `playwright` — retained for page reading/browser interaction
  - `nx-mcp` — unchanged; Nx workspace tooling
- [ ] Validate JSON syntax: `cat .opencode/opencode.json | python3 -m json.tool`

### 3.2 Regenerate .opencode/agents/ files

- [ ] Run the sync command:

  ```bash
  npm run sync:claude-to-opencode
  ```

  Expect: success with count of agents converted, 0 failures, output written
  to `.opencode/agents/` (plural — canonical path established by the
  prerequisite plan)

- [ ] Spot-check a few generated agent files to confirm no `zai-coding-plan` IDs:

  ```bash
  grep -r "zai-coding" .opencode/agents/ | head -5
  ```

  Expect: no output (zero matches)

- [ ] Spot-check haiku-tier agents contain the small model:

  ```bash
  grep "model:" .opencode/agents/apps-ayokoding-web-deployer.md
  ```

  Expect: `model: opencode-go/glm-5`

- [ ] Confirm the singular path remains absent (regression guard):

  ```bash
  test ! -d .opencode/agent && echo "singular still absent OK"
  ```

### 3.3 Validate config end-to-end

- [ ] Run the full config validation:

  ```bash
  npm run validate:config
  ```

  Expect: exits 0 (`validate:claude` ✓, `sync:claude-to-opencode` ✓,
  `validate:opencode` ✓)

### 3.4 Commit config and regenerated agent files

- [ ] Stage and commit:

  ```
  chore(opencode): switch to opencode-go provider; remove Z.ai MCPs
  ```

### 3.5 Update model-selection.md

- [ ] Open `governance/development/agents/model-selection.md`
- [ ] Find section `## OpenCode / GLM Equivalents` (near the end of the file)
- [ ] Replace the heading, the intro paragraph, the model ID mapping table, the
      "3-to-2 Tier Collapse" subsection, and "Why No Separate GLM Opus Tier"
      subsection with the replacement content from [tech-docs.md §13](./tech-docs.md)
- [ ] Verify the section heading is now `## OpenCode / OpenCode Go Equivalents`
- [ ] Ensure the table contains three rows: omit → `opencode-go/minimax-m2.7`,
      sonnet → `opencode-go/minimax-m2.7`, haiku → `opencode-go/glm-5`
- [ ] Confirm the "Web Search in OpenCode Sessions" subsection is present,
      documenting:
  - `OPENCODE_ENABLE_EXA=true` as the primary mechanism (no API key needed)
  - Perplexity MCP (in `opencode.json`) as the configured fallback
  - Brave Search MCP as the alternative for developers without a Perplexity key
- [ ] Run markdown linting:

  ```bash
  npm run lint:md
  ```

### 3.6 Commit documentation

- [ ] Stage and commit:

  ```
  docs(model-selection): update OpenCode Go equivalents table
  ```

---

## Phase 4 — Final Validation

### 4.1 Pre-push quality gate

- [ ] Run the affected targets to warm the cache:

  ```bash
  nx affected -t typecheck lint test:quick spec-coverage
  ```

  Expect: all green (rhino-cli, and any other affected projects)

  > **Important**: Fix ALL failures found, not just those caused by your changes.
  > This follows the root-cause orientation principle — proactively fix preexisting
  > errors encountered during work. Do not defer or mention-and-skip existing issues.

### 4.2 Push to origin main

- [ ] Push the commits:

  ```bash
  rtk git push origin main
  ```

  - Pre-push hook runs `nx affected -t typecheck lint test:quick spec-coverage`
    automatically
  - If the hook times out, re-run the affected targets manually first, then push

### 4.3 Confirm CI passes (post-push)

- [ ] Navigate to the GitHub Actions page for the `ose-public` repository
- [ ] Confirm the CI workflow triggered by the push passes all checks
- [ ] Per [ci-post-push-verification](../../../governance/development/workflow/ci-post-push-verification.md),
      do not declare the plan complete until CI is green

### 4.4 Smoke-test OpenCode session (optional, recommended)

- [ ] With `OPENCODE_GO_API_KEY` set, open an OpenCode session in the repo
- [ ] Verify the session connects to OpenCode Go (check the model displayed in
      the TUI status bar)
- [ ] Ask a simple coding question to confirm the model responds correctly

---

## Phase 5 — Color Field Translation (Opportunistic Followup, 2026-05-02)

**Trigger.** OpenCode `1.14.31` started rejecting Claude-named colors with
`Configuration is invalid ... Expected a string matching the RegExp ^#[0-9a-fA-F]{6}$, got "blue" color`.
The color-field policy in `apps/rhino-cli/internal/agents/converter.go` was set
to `preserve` per the `validate-claude-opencode-sync-correctness` plan's Phase 0
spec snapshot (which assumed "named values map 1:1"), and an in-code
`TODO(plan-followup)` flagged the assumption as incorrect. This phase resolves
the followup so OpenCode loads cleanly across all 70 mirrored agent files.

### 5.1 Add Claude→OpenCode color map and translate action

- [x] In `apps/rhino-cli/internal/agents/types.go`, add `ClaudeToOpenCodeColor`
      (8 → 7 mapping) and `ValidOpenCodeColorThemes`. Mapping rationale:
  - `blue → primary` (Maker)
  - `green → success` (Checker)
  - `yellow → warning` (Fixer)
  - `purple → secondary` (Implementor)
  - `red → error`, `orange → warning`, `pink → accent`, `cyan → info`
- [x] In `apps/rhino-cli/internal/agents/converter.go`, change the
      `claudeAgentFieldPolicy["color"]` entry from `{action: "preserve"}` to
      `{action: "translate", target: "color"}` and replace the `TODO` block with
      a comment that records the OpenCode 1.14.31 behaviour change.
- [x] Add `ConvertColor()` helper and a `case "color":` branch in
      `applyTranslate` that calls it. Hex codes and OpenCode theme tokens pass
      through unchanged.
- [x] Remove the now-dead `case "color":` branch from `applyPreserve` (policy
      table is the source of truth — keeping a dead branch invites silent
      regressions when the policy is rewritten).

### 5.2 Update tests for the new translate action

- [x] `internal/agents/converter_test.go`: replace `TestConvertAgent_PreserveColor`
      with table-driven `TestConvertAgent_TranslateColor` covering all 8 Claude
      names plus a hex passthrough and a theme-token passthrough.
- [x] `internal/agents/converter_test.go`: in `TestConvertAgent`, change the
      expected output color from `blue` to `primary`.
- [x] `internal/agents/spec_fidelity_test.go`: in `TestRoundTripPreservesSemantics`,
      change the expected color from `orange` to `warning` and update the
      comment to read "translated via ConvertColor (Claude name → OpenCode
      theme)".
- [x] `cmd/agents_validate_claude.go`: rewrite the `Long` description to reflect
      8 Claude colors and the OpenCode translation step.

### 5.3 Verify and resync

- [x] `go test ./...` from `apps/rhino-cli/` — all packages pass (1445 tests).
- [x] Rebuild the binary (`CGO_ENABLED=0 go build -o dist/rhino-cli .`) and
      run `./apps/rhino-cli/dist/rhino-cli agents sync`. Confirm
      `grep -h '^color:' .opencode/agents/*.md | sort -u` returns only
      `primary`, `secondary`, `success`, `warning` (zero raw Claude names).
- [x] Run `./apps/rhino-cli/dist/rhino-cli agents validate-sync` — 73/73 pass.
- [x] Run `opencode --pure run "say hi"` and confirm zero
      "Configuration is invalid" / color-related errors. (A subsequent
      "Model not found: zai-coding-plan/glm-5.1" error is unrelated to color
      schema — that is the OpenCode Go provider issue this plan's earlier
      phases address.)

### 5.4 Propagate the policy

- [ ] Invoke `repo-rules-maker` to publish the role-color convention covering
      both Claude (Maker=blue, Checker=green, Fixer=yellow, Implementor=purple)
      and OpenCode (Maker=primary, Checker=success, Fixer=warning,
      Implementor=secondary), pointing at `ClaudeToOpenCodeColor` as the single
      source of truth.

### 5.5 Commit Phase 5

- [ ] Stage the rhino-cli source + test edits and the regenerated
      `.opencode/agents/*.md`. Commit message:

  ```
  fix(rhino-cli): translate Claude color names to OpenCode theme tokens

  OpenCode 1.14.31 rejects Claude's named colors with a strict hex-or-theme
  regex. Add ClaudeToOpenCodeColor map, switch the color policy from preserve
  to translate, update tests, and resync .opencode/agents/.
  ```

---

## Archival

- [ ] After CI passes and optional smoke-test is complete, move the plan folder
      to `plans/done/`:

  ```bash
  rtk git mv plans/in-progress/2026-04-30__adopt-opencode-go \
             plans/done/2026-04-30__adopt-opencode-go
  ```

- [ ] Update `plans/in-progress/README.md` — remove this plan's entry
- [ ] Update `plans/done/README.md` — add this plan entry with completion date
- [ ] Commit the move and index updates together:

  ```
  chore(plans): archive adopt-opencode-go plan
  ```

- [ ] Push the archival commit

---

## Rollback Plan

If OpenCode Go proves unusable (service outage, incompatible provider block
schema, model slugs wrong):

1. Revert the three source commits (`feat`, `test`, `chore`) via `git revert`
2. Revert the doc commit
3. Run `npm run sync:claude-to-opencode` to regenerate `.opencode/agents/`
   (plural) with Z.ai IDs
4. Push the reverts

All changes are isolated to `rhino-cli`, `opencode.json`, and one doc file —
reverting is safe and does not touch app source code or Claude Code agents.
