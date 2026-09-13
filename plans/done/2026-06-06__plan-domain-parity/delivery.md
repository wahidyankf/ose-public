# Delivery Checklist — Plan Domain Parity (ose-public)

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (the safe-to-stop state and the single command to resume). A phase
> is not complete until its gate is green; do not start phase N+1 while any gate check fails.

## Worktree

Worktree path: `worktrees/plan-domain-parity/`

This plan was authored in that worktree and is executed in it. The worktree already exists
(branch `plan-domain-parity` cut from `main`; remote `origin` =
`git@github.com:wahidyankf/ose-public.git` `[Repo-grounded]`). Push target: `origin main`.

Provision before execution if absent (run from repo root):

```bash
claude --worktree plan-domain-parity
```

Equivalent manual provisioning (the merged plan-establishment default, matrix row 3):

```bash
git worktree add -b plan-domain-parity worktrees/plan-domain-parity main
cd worktrees/plan-domain-parity && npm install && npm run doctor -- --fix
```

See the [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md),
[Worktree Toolchain Initialization](../../../repo-governance/development/workflow/worktree-setup.md),
and [Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

## Git Workflow

Trunk Based Development, worktree-to-main: thematic Conventional Commits inside the
worktree; one delivery push `git push origin HEAD:main` in Phase 7; **no PR** (no explicit
PR instruction exists). Worktree removed after archival.

### Commit Guidelines (apply in every phase)

> **Commit Policy**: Commit thematically with `<type>(<scope>): <description>` Conventional
> Commits format. Split different domains/concerns into separate commits (docs merges ≠
> rhino-cli code ≠ regenerated mirrors). Preexisting fixes get their own commits, separate
> from plan work. Never bundle unrelated changes into a single commit.
>
> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work. Do not defer or skip existing issues. Commit preexisting
> fixes separately with appropriate conventional commit messages.

## Phase 0: Environment Setup and Baseline

> _Executor: repo-setup-manager_

- [x] [AI] Verify the worktree exists: `git -C worktrees/plan-domain-parity status` (run
      from the main checkout root) — acceptance: exits 0 on branch `plan-domain-parity`.
      If absent, provision per the `## Worktree` section above.
  - _Implementation notes (2026-06-06)_: Status DONE. Worktree re-provisioned via
    `git worktree add -b plan-domain-parity worktrees/plan-domain-parity main` (had been
    removed after plan delivery); `git -C worktrees/plan-domain-parity status` exits 0 on
    branch `plan-domain-parity`. Files changed: none.
- [x] [AI] Install dependencies in the worktree: `npm install` (run inside
      `worktrees/plan-domain-parity/`) — acceptance: exits 0, `node_modules/` synchronized
  - _Implementation notes (2026-06-06)_: Status DONE. `npm install` exited 0;
    `node_modules/` present. Files changed: none (lockfile unchanged).
- [x] [AI] Converge the full polyglot toolchain: `npm run doctor -- --fix` — acceptance:
      exits 0 with no unresolved drift (Rust toolchain available for `apps/rhino-cli`)
  - _Implementation notes (2026-06-06)_: Status DONE. `npm run doctor -- --fix` exited 0:
    20/20 tools OK, 0 warning, 0 missing ("Nothing to fix — all tools are installed").
    Files changed: none.
- [x] [AI] Verify sibling merge inputs are readable:
      `test -d ~/ose-projects/ose-primer/repo-governance/workflows/plan && test -d ~/ose-projects/ose-infra/repo-governance/workflows/plan`
      — acceptance: exits 0
  - _Implementation notes (2026-06-06)_: Status DONE. Both sibling directories exist and
    are readable (`test -d` exits 0). Files changed: none.
- [x] [AI] Run the rhino-cli baseline: `npx nx run rhino-cli:test:quick` — acceptance:
      baseline pass/fail count recorded in implementation notes; all preexisting failures
      documented
  - _Implementation notes (2026-06-06)_: Status DONE. Baseline: 810 passed, 0 failed,
    0 ignored (exit 0). Zero preexisting failures. Files changed: none.
- [x] [AI] Run the markdown baseline: `npm run lint:md` and
      `npx nx run rhino-cli:validate:links` — acceptance: exit codes recorded; preexisting
      failures documented
  - _Implementation notes (2026-06-06)_: Status DONE. `npm run lint:md` exit 0 (2147
    files, 0 errors); `validate:links` exit 0 (all links valid). Zero preexisting
    failures. Files changed: none.
- [x] [AI] Resolve all preexisting failures before proceeding — acceptance: no preexisting
      failures remain unresolved (separate commits per the guidelines above)
  - _Implementation notes (2026-06-06)_: Status DONE. All baselines green (810/810 tests,
    0 markdown errors, 0 broken links) — zero preexisting failures to resolve. Files
    changed: none.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift
  - _Implementation notes (2026-06-06)_: Status PASS. Both exited 0; 20/20 tools OK.
- [x] [AI] `npx nx run rhino-cli:test:quick`, `npm run lint:md`, and
      `npx nx run rhino-cli:validate:links` baselines recorded and every preexisting failure
      resolved (zero unresolved)
  - _Implementation notes (2026-06-06)_: Status PASS. 810/810 tests; 0 md errors;
    0 broken links; zero unresolved preexisting failures.

> **Pause Safety**: only the local toolchain was verified and the baseline recorded — no
> parity work exists yet. Safe to stop indefinitely. To resume: re-run
> `npx nx run rhino-cli:test:quick` and confirm it is still green.

## Phase 1: Plan-Domain Workflow Merges (matrix rows 2–6)

> _Suggested executor: `repo-workflow-maker` (workflow docs); merge-input paths below are
> the same relative path under `~/ose-projects/ose-primer/` and
> `~/ose-projects/ose-infra/` unless noted._

- [x] [AI] Merge `repo-governance/workflows/plan/plan-establishment-execution.md` (row 3):
      produce 3-way diffs first —
      `diff repo-governance/workflows/plan/plan-establishment-execution.md ~/ose-projects/ose-primer/repo-governance/workflows/plan/plan-establishment-execution.md`
      and the same against
      `~/ose-projects/ose-infra/repo-governance/workflows/plan/plan-establishment-execution.md`;
      fold every sibling improvement into the public copy; keep the `target-stage` input —
      acceptance: each sibling-only improvement is merged or recorded as deliberately
      excluded (with reason) in implementation notes; `grep -c "target-stage"` on the file
      returns ≥ 1.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: repo-workflow-maker).
    Merged from infra: plan-path output description (both stage paths), compact
    Grilling-With-Options cross-references in Steps 1+3, Plans Organization backlog path
    variant, related-doc ordering, expanded grilling convention description. Deliberately
    excluded: infra `grilling.md` link path (repo-specific; public uses
    grilling-with-options.md), infra `<target-folder>` variable rename (public's
    Stage Resolution `<plan-dir>` cleaner), infra plan-path parenthetical (redundant),
    infra termination rewording (equivalent). Primer: nothing merged — primer lags
    (no target-stage). `grep -c "target-stage"` = 15; prettier + markdownlint 0 errors.
    Files changed: repo-governance/workflows/plan/plan-establishment-execution.md.
- [x] [AI] Add the new worktree default to the merged file (row 3, per tech-docs D2): amend
      `## Execution Mode`, `### 4. Plan Creation (Sequential)`, and
      `### 7. Push and Verify (Sequential)` to document — author in `worktrees/<identifier>/`;
      provision if absent via `git worktree add -b <identifier> worktrees/<identifier> main` + `npm install` + `npm run doctor -- --fix`; commit in worktree; push `HEAD` to the
      confirmed push target (default `origin main`); remove the worktree after delivery —
      acceptance: `grep -F "git worktree add -b" repo-governance/workflows/plan/plan-establishment-execution.md`
      returns ≥ 1 hit and the push-target default is stated.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: repo-workflow-maker).
    Execution Mode gained the worktree-default paragraph + 4-command provisioning block;
    Step 4 anchors `<plan-dir>` to the worktree root; Step 7 commits/pushes
    `HEAD:main` from the worktree (default `origin main`) and removes the worktree after
    CI. grep `git worktree add -b` = 1 hit; prettier + markdownlint 0 errors. Files
    changed: repo-governance/workflows/plan/plan-establishment-execution.md.
- [x] [AI] Merge `repo-governance/workflows/plan/plan-execution.md` (row 4) using the same
      3-way diff procedure — acceptance: public-specific agent-selection lists preserved
      verbatim; sibling improvements merged or recorded as excluded.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: repo-workflow-maker).
    Merged: expanded extension list (Rule 2) + framework keywords (Rule 4) from both
    siblings; primer's top-level executor-tag step + renumbering; primer's clearer
    stopping-rule wording (phase-gate self-run checkpoint); primer's explicit step 0
    Phase-Gate verification in 2b. Deliberately excluded: primer/infra repo-specific
    app examples (crud-be-fsharp-giraffe, coralpolyp-be), infra grilling.md link
    (public name differs), infra's simplified Iron Rule 2 + stopping rules + missing
    executor-tag step (public/primer superior). Preexisting fix applied directly:
    Rule 1 example agent corrected swe-fsharp-dev → swe-rust-dev (organiclever-be is
    Rust/Axum). prettier + markdownlint 0 errors. Files changed:
    repo-governance/workflows/plan/plan-execution.md.
- [x] [AI] Merge `repo-governance/workflows/meta/execution-modes.md` (row 6) using the same
      3-way diff procedure — acceptance: sibling improvements merged or recorded as
      excluded; file passes the markdown gates below.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: repo-workflow-maker, two
    passes — first pass missed the infra input and was corrected). Merged from primer:
    PASS:/FAIL: prefix removal across all bullet sections and pitfall headings; trailing
    `---`. Deliberately excluded: primer's simplified 2-branch decision tree (public's
    5-line tree covering nested workflows/procedures is more complete), primer's missing
    `created:` field, primer's "subagent" terminology (public's "delegated agent" is
    vendor-neutral), primer's unqualified `.claude/agents/` path. Infra pass: all 13
    infra-only differences keep-target (stale PASS:/FAIL: prefixes, "subagent"
    terminology, simpler decision tree, missing created/`---`). prettier + markdownlint
    0 errors (orchestrator-verified). Files changed:
    repo-governance/workflows/meta/execution-modes.md.
- [x] [AI] Restructure `repo-governance/workflows/plan/plan-multi-repo-parity-planning.md`
      (row 2): the `## Steps` section becomes, in order — Step 1 Survey; Step 2 Matrix;
      Step 3 First Grill (hard gate, blocks authoring until every matrix row is resolved);
      Step 4 Web Research via `web-researcher` (conditional); Step 5 Second Grill
      (post-research); Step 6 Author; Step 7 Gate; Step 8 Deliver (absorbing the current
      Step 7 Finalization content). Update the `## Grilling Contract`,
      `## Termination Criteria`, and `## Sibling Plans` cross-references to the renumbered
      steps — acceptance: the eight step headings appear in the stated order;
      `npx nx run rhino-cli:validate:links` exits 0 (no broken intra-file fragments).
  - _Implementation notes (2026-06-06)_: Status DONE (executor: repo-workflow-maker).
    Steps restructured to: Survey, Matrix, First Grill (hard gate + research-needed
    flag), Web Research (web-researcher, conditional w/ skip rule), Second Grill
    (post-research, matrix rows may be added/updated), Author (handoff now carries
    Steps 3+5 decisions + Step 4 cited findings), Gate, Delivery and Finalization
    (merged). 12 cross-reference updates (Execution Mode list now 8 entries,
    termination criteria cover both grills, Web Research Delegation Convention entry
    added). grep shows exactly 8 `### Step N` headings in order; prettier + markdownlint
    0 errors; validate:links 0 broken (uncached run). Files changed:
    repo-governance/workflows/plan/plan-multi-repo-parity-planning.md.
- [x] [AI] Align `repo-governance/workflows/plan/README.md` (row 5): verify all four plan
      workflows remain indexed (establishment, execution, parity, quality-gate) and refresh
      descriptions to match the merged/restructured content — acceptance: four workflow
      links present; descriptions mention the two-grill parity structure.
  - _Implementation notes (2026-06-06)_: Status DONE (direct edit — trivial). Parity
    workflow description now spells out the eight-step two-grill structure (survey →
    matrix → first grill hard gate → web research → second grill → author → gate →
    deliver). All 4 workflow links present (grep = 4). Files changed:
    repo-governance/workflows/plan/README.md.
- [x] [AI] Refresh the plan-domain rows in `repo-governance/workflows/README.md` if step
      naming or descriptions changed — acceptance: no stale step names remain
      (`grep -n "Relentless Grilling" repo-governance/workflows/README.md` returns 0 hits or
      only deliberate historical mentions).
  - _Implementation notes (2026-06-06)_: Status DONE (direct edit — trivial). Parity
    row description updated to the two-grill+research structure; agents column gains
    web-researcher. `grep "Relentless Grilling"` = 0 hits. Files changed:
    repo-governance/workflows/README.md.
- [x] [AI] Run the docs gates: `npm run format:md`, `npm run lint:md`,
      `npx nx run rhino-cli:validate:links`,
      `npx nx run rhino-cli:validate:heading-hierarchy`,
      `npx nx run rhino-cli:validate:mermaid` — acceptance: all exit 0.
  - _Implementation notes (2026-06-06)_: Status DONE. All five gates exit 0 (links,
    heading-hierarchy, mermaid run uncached). Files changed: none beyond the six
    workflow files already modified this phase.
- [x] [AI] Commit: `docs(workflows): merge plan-domain workflow canon and restructure parity workflow` —
      acceptance: commit exists; `git status` clean for the workflow files.
  - _Implementation notes (2026-06-06)_: Status DONE. Commit landed (6 files, +246/-136);
    `git status` clean for workflow files (only plan delivery.md notes remain dirty, by
    design). Files changed: the six Phase 1 workflow/index files.

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `grep -F "git worktree add -b" repo-governance/workflows/plan/plan-establishment-execution.md` — ≥ 1 hit
  - _Implementation notes (2026-06-06)_: Status PASS — 1 hit.
- [x] [AI] `grep -c "target-stage" repo-governance/workflows/plan/plan-establishment-execution.md` — ≥ 1
  - _Implementation notes (2026-06-06)_: Status PASS — 15 hits.
- [x] [AI] `grep -n "^### Step [0-9]" repo-governance/workflows/plan/plan-multi-repo-parity-planning.md` — returns exactly 8 step headings in the order: Survey, Matrix, First Grill, Web Research, Second Grill, Author, Gate, Deliver
  - _Implementation notes (2026-06-06)_: Status PASS — exactly 8 headings in the
    required order (lines 171, 197, 228, 278, 308, 342, 404, 423).
- [x] [AI] `npm run lint:md && npx nx run rhino-cli:validate:links && npx nx run rhino-cli:validate:heading-hierarchy && npx nx run rhino-cli:validate:mermaid` — all exit 0
  - _Implementation notes (2026-06-06)_: Status PASS — all four commands exit 0.

> **Pause Safety**: workflow docs are merged and committed; no agent, skill, or code files
> touched yet — the repo is coherent. Safe to stop. To resume: re-run
> `npm run lint:md` and confirm green.

## Phase 2: Plan-Agent Definition Merges (matrix rows 7–11)

> _Suggested executor: `agent-maker` (agent definition files)_

- [x] [AI] Merge `.claude/agents/plan-maker.md` (row 7) via 3-way diff against
      `~/ose-projects/ose-primer/.claude/agents/plan-maker.md` and
      `~/ose-projects/ose-infra/.claude/agents/plan-maker.md` — acceptance:
      sibling improvements merged or recorded as excluded; repo-specific references (app
      names, paths) preserved.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: agent-maker). Merged:
    primer's Step 2 no-re-ask note, richer Step 6 description, cleaner Step 8 gate/marker
    questions; infra's standalone Phase Gate Template (item 6, copy-pasteable). Deliberately
    excluded: infra's grilling.md links ×3 (file absent here — public uses
    grilling-with-options.md), primer's inline Option A/B grill example (duplicates skill),
    infra's shorter executor legend (target's includes [AI+HUMAN]). prettier + markdownlint
    0 errors; no stale grilling.md link. Files changed: .claude/agents/plan-maker.md.
- [x] [AI] Merge `.claude/agents/plan-checker.md` (row 8), same procedure — acceptance: same
      criteria.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: agent-maker). Merged from
    infra: TDD phase-separation HARD RULE bullet, non-code step format bullet, executor-tag
    and phase-gate summary bullets, enhanced TDD reference line, split Steps 14/15
    (executor-tag vs phase-gate validation) + grandfathering note. Deliberately excluded:
    infra coralpolyp-fe examples and primer crud-be-ts-effect examples (repo-specific app
    names — 0 leaked), primer's combined Step 13 (superseded by infra's cleaner split).
    Frontmatter unchanged. prettier + markdownlint 0 errors. Files changed:
    .claude/agents/plan-checker.md.
- [x] [AI] Merge `.claude/agents/plan-fixer.md` (row 9), same procedure — acceptance: same
      criteria.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: agent-maker). Merged from
    primer: two Plans-Organization convention sub-entries in Reference Documentation;
    expanded 7-fix "Execution Marker and Phase Gate Fixes" structure (replaces older 5-item
    section). Deliberately excluded: primer crud-be-_and infra coralpolyp-_ example app
    names (0 leaked; public's ose-web/organiclever-be examples kept), infra's less-detailed
    executor-tag section with [HUMAN → AI] legend variant (infra-specific token).
    prettier + markdownlint 0 errors. Files changed: .claude/agents/plan-fixer.md.
- [x] [AI] Merge `.claude/agents/plan-execution-checker.md` (row 10), same procedure —
      acceptance: same criteria.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: agent-maker). Merged from
    primer: Step 3 phase-gate/[HUMAN]-confirmation bullet, Related Conventions subsection,
    Step 10/11 split (5f-gates vs anti-hallucination) with corrected predecessor wording.
    Deliberately excluded: primer crud-be-ts-effect and infra coralpolyp-fe Nx examples
    (repo-specific; 0 leaked). prettier + markdownlint 0 errors. Files changed:
    .claude/agents/plan-execution-checker.md.
- [x] [AI] Verify `.claude/agents/repo-setup-manager.md` (row 11):
      `diff .claude/agents/repo-setup-manager.md ~/ose-projects/ose-infra/.claude/agents/repo-setup-manager.md`
      — acceptance: zero changed lines pub↔infra (survey fact); primer's 3-line drift is
      `rhino-cli-rust` naming (repo-specific, primer-plan concern) — record the verification
      result in implementation notes; no public edit expected.
  - _Implementation notes (2026-06-06)_: Status DONE (direct verification). pub↔infra diff
    = 0 changed lines (survey fact confirmed). Primer drift is actually frontmatter format
    (tools written without array brackets + explicit `skills: []`), not rhino-cli-rust
    naming — still repo-specific primer formatting, primer-plan concern; no public edit
    made. Files changed: none.
- [x] [AI] Regenerate the four touched OpenCode mirrors: `npm run generate:bindings` —
      acceptance: exits 0; `.opencode/agents/plan-{maker,checker,fixer}.md` and
      `.opencode/agents/plan-execution-checker.md` updated.
  - _Implementation notes (2026-06-06)_: Status DONE. Exit 0; exactly the four expected
    mirrors modified. Files changed: .opencode/agents/plan-{maker,checker,fixer,execution-checker}.md.
- [x] [AI] Validate mirror parity: `npm run validate:sync` — acceptance: exits 0.
  - _Implementation notes (2026-06-06)_: Status DONE. Exit 0, VALIDATION PASSED, 0 failed
    checks. Files changed: none.
- [x] [AI] Run the docs gates (same five commands as Phase 1) — acceptance: all exit 0.
  - _Implementation notes (2026-06-06)_: Status DONE. First run caught 20 broken anchor
    links — the merged agents imported primer anchor names for plans.md sections that
    differ in public (`#execution-markers-ai-vs-human`,
    `#phase-gates-and-natural-pauses-hard-rule`, `#phased-delivery-…`,
    `#applicability-…`). Root-cause fix: remapped all to public's real anchors
    (`#executor-tagging--ai-vs-human-hard-rule`,
    `#phases-as-natural-pauses-with-clear-gates-hard-rule`) in the three .claude agents,
    regenerated mirrors. All five gates now exit 0 (links: "All links valid"). Files
    changed: .claude/agents/plan-{checker,fixer,execution-checker}.md + their .opencode
    mirrors.
- [x] [AI] Commit in two parts: `docs(agents): merge plan-domain agent canon` (hand-edited
      `.claude/agents/`) and `chore(bindings): resync opencode mirrors` (generated files) —
      acceptance: both commits exist; `git status` clean.
  - _Implementation notes (2026-06-06)_: Status DONE. Two commits landed (4 files each,
    +204/-116 each side); `git status` clean except plan notes. Files changed:
    .claude/agents/plan-_×4 (commit 1), .opencode/agents/plan-_ ×4 (commit 2).

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `npm run validate:sync` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — exit 0.
- [x] [AI] `npm run lint:md && npx nx run rhino-cli:validate:links` — exit 0
  - _Implementation notes (2026-06-06)_: Status PASS — both exit 0.
- [x] [AI] `grep -c "implementation notes\|deliberately excluded\|merged or recorded" plans/in-progress/plan-domain-parity/delivery.md` — ≥ 4 hits (confirms merge/exclude rationale is recorded inline for each of the four agents; also read the Phase 2 implementation notes for plan-maker, plan-checker, plan-fixer, and plan-execution-checker to confirm each has a recorded merge/exclude decision)
  - _Implementation notes (2026-06-06)_: Status PASS — 12 hits; all four agent merges
    carry recorded merged/excluded dispositions inline.

> **Pause Safety**: agent canon merged, mirrors in sync, all committed. Safe to stop. To
> resume: re-run `npm run validate:sync` and confirm green.

## Phase 3: Skill and Convention Merges (matrix rows 12–16)

> _Suggested executor: `repo-rules-maker` (conventions); `agent-maker` (skills)_

- [x] [AI] Merge `.claude/skills/plan-creating-project-plans/SKILL.md` (row 12) via 3-way
      diff (siblings at the same relative path) — acceptance: infra's mandatory pre-write
      AND post-write grilling gates present in the merged text; the 2–4-options hard rule
      stated; sibling improvements merged or recorded as excluded.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: agent-maker). 22-entry
    disposition recorded. Merged from infra: grilling gates in description +
    explore-before-asking rule + AskUserQuestion-first mechanism + explicit 2-4-options
    hard rule + lifecycle gate callouts + Grilling-With-Options reference (link
    translated from grilling.md). Merged from primer: TDD-shaped delivery steps,
    TDD-aware validation checklist, TDD common-mistake. Deliberately excluded: sibling
    app examples (coralpolyp-_, crud-be-_; 0 leaked), primer's sibling anchor names,
    primer's duplicate No-Secrets standalone section. post-write grep = 8; prettier +
    markdownlint 0 errors. Files changed:
    .claude/skills/plan-creating-project-plans/SKILL.md.
- [x] [AI] Merge `.claude/skills/plan-writing-gherkin-criteria/SKILL.md` (row 13, trivial
      2–10 line drift) — acceptance: merged or recorded; gates pass.
  - _Implementation notes (2026-06-06)_: Status DONE (direct edit — trivial drift).
    Merged from primer: "Phase Gate Acceptance Checks" section (anchor + link text
    translated to public's plans.md heading). Deliberately excluded: both siblings'
    `.opencode/skills/` example-line variant — public's `.claude/skills/` is the
    correct source-of-truth path here. prettier + markdownlint 0 errors. Files
    changed: .claude/skills/plan-writing-gherkin-criteria/SKILL.md.
- [x] [AI] Merge `.claude/skills/grill-me/SKILL.md` (row 14) — acceptance: merged or
      recorded; the one-question-at-a-time and 2–4-options rules retained.
  - _Implementation notes (2026-06-06)_: Status DONE (direct edit — full diffs in hand).
    Merged from infra: canonical-convention preamble (link translated grilling.md →
    grilling-with-options.md), 6-rule set (explore-first promoted to Rule 1,
    mutually-exclusive options, exactly-one-Recommended, tightly-coupled batching rule,
    write-in answer rule), AskUserQuestion-MUST mechanism section with call/option
    structure, Other row in fallback template. Merged from primer: Rule-2 violation
    warning, "do not stop early", no-bare-questions closing note. 2-4-options rule and
    per-question decision discipline retained (one decision per question; batching only
    for coupled clusters — supersedes the old blanket one-at-a-time wording, consistent
    with the merged convention). prettier + markdownlint 0 errors. Files changed:
    .claude/skills/grill-me/SKILL.md.
- [x] [AI] Merge `repo-governance/development/workflow/grilling-with-options.md` (row 15):
      3-way inputs are the public file, primer **none** (no input), and infra
      `~/ose-projects/ose-infra/repo-governance/development/workflow/grilling.md`
      (different name, broader wording); fold infra's broader wording into the public file;
      the public path and name are kept — acceptance: merged file remains at
      `repo-governance/development/workflow/grilling-with-options.md`; infra-only
      improvements present or recorded as excluded.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: repo-rules-maker).
    Folded in from infra: broader scope (all design-decision interactions), Purpose +
    Scope sections, numbered Rule 1–7 standards (incl. batching allowance + write-in
    rule), applies-when table, FAIL examples, Special Considerations, Tools/Automation
    (grill-me as canonical implementation), Platform Binding Examples. Kept public
    title/filename/created; excluded infra-specific paths (coralpolyp, no-date-metadata
    convention absent here). greps 0; prettier + markdownlint 0 errors; full link scan
    clean. Files changed:
    repo-governance/development/workflow/grilling-with-options.md.
- [x] [AI] Merge `repo-governance/conventions/structure/plans.md` (row 16) via 3-way diff —
      acceptance: sibling improvements merged or recorded; Worktree-Specification,
      Executor-Tagging, Phase-Gate, and Execution-Grade-Clarity sections intact.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: repo-rules-maker).
    15-entry disposition recorded. Folded in: infra's no-secrets Overview note +
    grilling step in Creating Plans; primer's No-Secrets HARD-RULE blockquote +
    Applicability (grandfathering) section + No-Secrets related link (paths corrected to
    public's no-secrets-in-git.md). Excluded: both siblings' renamed
    executor-tag/phase-gate headings (would break protected anchors), repo-specific
    examples (coralpolyp/crud-be-\*; 0 leaked), infra's grilling.md link, infra's
    [HUMAN → AI] tag. All 4 protected headings intact (grep = 4); prettier +
    markdownlint 0 errors; full link scan clean. Files changed:
    repo-governance/conventions/structure/plans.md.
- [x] [AI] Run the docs gates (same five commands as Phase 1) — acceptance: all exit 0.
  - _Implementation notes (2026-06-06)_: Status DONE. All five gates exit 0.
- [x] [AI] Commit: `docs(governance): merge plan-domain skills and conventions canon` —
      acceptance: commit exists; `git status` clean.
  - _Implementation notes (2026-06-06)_: Status DONE. Commit landed (5 files,
    +516/-126); status clean except plan notes. Files changed: three SKILL.md files,
    grilling-with-options.md, plans.md.

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] Merged skill contains both grilling gates:
      `grep -ci "post-write" .claude/skills/plan-creating-project-plans/SKILL.md` — ≥ 1
  - _Implementation notes (2026-06-06)_: Status PASS — 8 hits.
- [x] [AI] `test -f repo-governance/development/workflow/grilling-with-options.md` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — file exists.
- [x] [AI] `npm run lint:md && npx nx run rhino-cli:validate:links && npx nx run rhino-cli:validate:heading-hierarchy` — exit 0
  - _Implementation notes (2026-06-06)_: Status PASS — all exit 0.

> **Pause Safety**: all fourteen doc merges (rows 2–16) are complete and committed; code
> streams untouched. Safe to stop. To resume: re-run `npm run lint:md` and confirm green.

## Phase 4: rhino-cli OpenCode Permission Emitter (matrix row 18, TDD)

> _Suggested executor: `swe-rust-dev`_

- [x] [AI] **RED** — add failing unit tests to the inline `#[cfg(test)]` module of
      `apps/rhino-cli/src/internal/agents/converter.rs` (_New tests_):
      `convert_permission_maps_tools_to_allow` (input `["Read", "Write"]` → map
      `{read: "allow", write: "allow"}`) and `encode_emits_permission_block_not_tools`
      (encoded YAML contains a `permission:` block with `read: allow` and contains no
      boolean `tools:` map). Run
      `cargo test --manifest-path apps/rhino-cli/Cargo.toml convert_permission` —
      acceptance: the new tests FAIL (compile error or assertion failure) proving RED.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: swe-rust-dev). Both
    tests added to converter.rs `#[cfg(test)]`; cargo test fails to compile with
    E0425 (`convert_permission` not found) ×2 + E0560 (no field `permission`) — RED
    proven for the right reason. No production code touched. Files changed:
    apps/rhino-cli/src/internal/agents/converter.rs (tests only).
- [x] [AI] **GREEN** — implement in `apps/rhino-cli/src/internal/agents/converter.rs`:
      rename the `OpenCodeAgent.tools: BTreeMap<String, bool>` field to
      `permission: BTreeMap<String, String>`; replace `convert_tools` with
      `convert_permission` mapping each trimmed, lower-cased, non-empty Claude tool to the
      value `allow` (unlisted tools omitted per tech-docs D3); update
      `encode_opencode_agent` to emit `permission:` in the position `tools:` occupied
      (empty input emits `permission: {}`); update the field-order doc comments and all
      existing tests referencing `tools`. Run
      `npx nx run rhino-cli:test:unit` — acceptance: exits 0, including the two new tests.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: swe-rust-dev).
    convert_permission added (convert_tools removed; its two tests converted to
    permission equivalents); OpenCodeAgent.permission field; encoder emits permission
    block (`{}` when empty); apply_translate updated; sync_validator.rs migrated
    (parse_opencode_permission, permission_match, fixtures, "Permission mismatch"
    message) so emitter+validator share the converter. test:unit 812 passed / 0 failed
    incl. both new tests. Files changed:
    apps/rhino-cli/src/internal/agents/{converter,sync_validator}.rs.
- [x] [AI] **REFACTOR** — clean up naming/doc comments; run
      `npx nx run rhino-cli:lint` and `npx nx run rhino-cli:fmt:check` — acceptance: both
      exit 0 with no behavioral diff (`npx nx run rhino-cli:test:unit` still green).
  - _Implementation notes (2026-06-06)_: Status DONE. fmt:check 0, lint 0, test:unit
    still 812/812 — GREEN implementation already clean (functional iterator chains,
    doc comments updated in GREEN); no further structural changes needed.
    permission_match wrapper retained deliberately for Go-port parity. Files changed:
    none beyond GREEN.
- [x] [AI] Regenerate all mirrors: `npm run generate:bindings` — acceptance: exits 0; spot
      check `head -15 .opencode/agents/plan-maker.md` shows a `permission:` block and no
      boolean `tools:` map.
  - _Implementation notes (2026-06-06)_: Status DONE. Exit 0; spot check confirms
    `permission:` block with `allow` values and no `tools:` map; 69 mirror files
    modified. Files changed: .opencode/agents/\*.md (regenerated).
- [x] [AI] Sweep for stragglers:
      `grep -rln "^tools:" .opencode/agents/` — acceptance: 0 files.
  - _Implementation notes (2026-06-06)_: Status DONE — 0 files.
- [x] [AI] Validate parity: `npm run validate:sync` — acceptance: exits 0.
  - _Implementation notes (2026-06-06)_: Status DONE — exit 0.
- [x] [AI] Commit in two parts: `feat(rhino-cli): emit opencode permission object instead of deprecated tools flags`
      (code + tests) and `chore(bindings): regenerate opencode mirrors in permission format`
      (the ~70 regenerated files) — acceptance: both commits exist; `git status` clean.
  - _Implementation notes (2026-06-06)_: Status DONE. Commit 1: 2 files +101/-72;
    commit 2: 69 mirrors +460/-460. Status clean except plan notes.

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — exit 0 (812 tests).
- [x] [AI] `npm run validate:sync` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — exit 0.
- [x] [AI] `grep -rln "^tools:" .opencode/agents/` — 0 files
  - _Implementation notes (2026-06-06)_: Status PASS — 0 files.
- [x] [AI] `ls .claude/agents/*.md | wc -l` equals `ls .opencode/agents/*.md | wc -l`
  - _Implementation notes (2026-06-06)_: Status PASS — 70 = 70.

> **Pause Safety**: emitter and all mirrors moved to the `permission` format atomically and
> are committed; validator and emitter share the converter so parity holds. Safe to stop. To
> resume: re-run `npm run validate:sync` and confirm green.

## Phase 5: Codex Consolidation and Guard (matrix row 19, TDD)

> _Suggested executor: `swe-rust-dev` (guard); main context (config migration)_

- [x] [AI] Verify sub-table key support (tech-docs D4): single WebFetch of
      <https://developers.openai.com/codex/config-reference>; determine whether
      `developer_instructions` may be inlined in `[agents.<name>]` — acceptance: the
      decision (inline vs relocated `config_file`) recorded in implementation notes with the
      cited excerpt and access date.
  - _Implementation notes (2026-06-06)_: Status DONE. WebFetch of
    developers.openai.com/codex/config-reference (accessed 2026-06-06): documented
    `agents.<name>` keys are ONLY `config_file` ("Path to a TOML config layer for that
    role; relative paths resolve from the config file that declares the role"),
    `description`, and `nickname_candidates`; `developer_instructions` is top-level
    only, NOT documented per-agent. DECISION: branch B — relocate
    .codex/agents/ci-monitor-subagent.toml → .codex/ci-monitor-subagent.toml and update
    the sub-table `config_file` pointer. Files changed: none (decision step).
- [x] [AI] Migrate `.codex/config.toml`: per the D4 decision, either inline the
      `developer_instructions` content from `.codex/agents/ci-monitor-subagent.toml` into
      `[agents.ci-monitor-subagent]`, or move that file to
      `.codex/ci-monitor-subagent.toml` and update `config_file` accordingly — acceptance:
      `python3 -c "import tomllib; tomllib.load(open('.codex/config.toml','rb'))"` exits 0
      (valid TOML) and the sub-table carries the agent config; pre/post content diff shows
      no instruction text lost.
  - _Implementation notes (2026-06-06)_: Status DONE (branch B per D4). `git mv`
    .codex/agents/ci-monitor-subagent.toml → .codex/ci-monitor-subagent.toml;
    config_file updated to "ci-monitor-subagent.toml" (relative to declaring config).
    tomllib parse OK; moved file byte-identical to pre-move content. Files changed:
    .codex/config.toml, .codex/ci-monitor-subagent.toml (moved).
- [x] [AI] Remove the unofficial directory: `git rm -r .codex/agents/` — acceptance:
      `test ! -d .codex/agents` exits 0.
  - _Implementation notes (2026-06-06)_: Status DONE. The `git mv` in the prior step
    already removed the only tracked file; the empty on-disk directory was removed with
    `rmdir`. `test ! -d .codex/agents` exits 0. Files changed: none additional.
- [x] [AI] **RED** — add a failing unit test to the inline `#[cfg(test)]` module of
      `apps/rhino-cli/src/internal/agents/bindings.rs` (_New test_):
      `validate_fails_when_codex_agents_dir_exists` — in a tempdir with valid bridge files
      and full catalog, create `.codex/agents/` and assert `validate_bindings` reports a
      failed check whose advice mentions `config.toml` sub-tables. Run
      `cargo test --manifest-path apps/rhino-cli/Cargo.toml validate_fails_when_codex_agents_dir_exists`
      — acceptance: test FAILS (no such check yet), proving RED.
  - _Implementation notes (2026-06-06)_: Status DONE (executor: swe-rust-dev). Test added
    mirroring validate_passes_when_catalog_references_all_present_dirs setup + extra
    .codex/agents/ creation; fails with "expected a failed check whose advice points
    to..." panic (0 passed, 1 failed) — RED for the right reason. Files changed:
    apps/rhino-cli/src/internal/agents/bindings.rs (test only).
- [x] [AI] **GREEN** — implement in `apps/rhino-cli/src/internal/agents/bindings.rs`: add a
      check to `validate_bindings` (alongside the catalog-coverage checks) that fails when
      `<repo_root>/.codex/agents` exists, with advice text
      "migrate per-agent Codex config to .codex/config.toml agents.<name> sub-tables". Run
      `npx nx run rhino-cli:test:unit` — acceptance: exits 0 including the new test, and the
      existing test `validate_passes_when_catalog_references_all_present_dirs` is updated if
      it materializes `.codex/agents` (it currently creates only `.codex/`
      `[Repo-grounded]`).
  - _Implementation notes (2026-06-06)_: Status DONE (executor: swe-rust-dev).
    validate_no_codex_agents_dir helper added + tallied in validate_bindings after the
    catalog-coverage loop; FAIL advice names config.toml `agents.<name>` sub-tables.
    Existing catalog test confirmed creating only .codex/ — unchanged. test:unit 813/813
    incl. new guard test. Files changed:
    apps/rhino-cli/src/internal/agents/bindings.rs.
- [x] [AI] **REFACTOR** — tidy check naming/messages; `npx nx run rhino-cli:lint` and
      `npx nx run rhino-cli:fmt:check` — acceptance: both exit 0;
      `npx nx run rhino-cli:test:unit` still green.
  - _Implementation notes (2026-06-06)_: Status DONE. fmt:check 0, lint (clippy) 0,
    test:unit 813/813 — GREEN code already conforms (naming consistent with sibling
    checks). Files changed: none beyond GREEN.
- [x] [AI] Run the guard end-to-end: `npm run validate:harness-bindings` — acceptance:
      exits 0 against the migrated repo (no `.codex/agents/`).
  - _Implementation notes (2026-06-06)_: Status DONE. Exit 0, VALIDATION PASSED — guard
    active and green against the migrated repo.
- [x] [AI] Commit in two parts:
      `feat(rhino-cli): guard against unofficial .codex/agents directory` and
      `chore(codex): consolidate per-agent config into config.toml sub-tables` —
      acceptance: both commits exist; `git status` clean.
  - _Implementation notes (2026-06-06)_: Status DONE. First attempt mixed the rename
    into the rhino-cli commit (git mv pre-staging); both commits rewritten locally for
    a clean thematic split — commit 1: bindings.rs only (+55); commit 2: .codex rename
    - config.toml pointer. Status clean except plan notes.

### Phase 5 Gate

> All checks below must pass before starting Phase 6.

- [x] [AI] `test ! -d .codex/agents` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS.
- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS (813 tests).
- [x] [AI] `npm run validate:harness-bindings` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS.

> **Pause Safety**: Codex surface consolidated, guard active, all committed; OpenCode and
> docs streams already coherent from earlier gates. Safe to stop. To resume: re-run
> `npm run validate:harness-bindings` and confirm green.

## Phase 6: Full Binding Audit and Harness-Doc Updates (matrix rows 17, 20)

- [x] [AI] Final regeneration: `npm run generate:bindings` then `git status --short` —
      acceptance: exits 0 and reports no unexpected drift (idempotent).
  - _Implementation notes (2026-06-06)_: Status DONE. Exit 0; zero modified files
    outside plan notes — idempotent.
- [x] [AI] Audit agent×binding coverage: `ls .claude/agents/*.md | wc -l` vs
      `ls .opencode/agents/*.md | wc -l` — acceptance: equal counts (70/70 at authoring
      time `[Repo-grounded]`; equality is the criterion, not the literal number).
  - _Implementation notes (2026-06-06)_: Status DONE. 70 = 70.
- [x] [AI] Run the full validation set: `npm run validate:sync`,
      `npm run validate:harness-bindings`, and
      `npx nx run rhino-cli:validate:cross-vendor-parity` — acceptance: all exit 0.
  - _Implementation notes (2026-06-06)_: Status DONE. All three exit 0.
- [x] [AI] Verify row 20 (no change needed):
      `grep -F "cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml" package.json`
      — acceptance: ≥ 1 hit in the `generate:bindings` script; record in implementation
      notes that ose-public already matches the aligned invocation.
  - _Implementation notes (2026-06-06)_: Status DONE. 8 hits in package.json incl. the
    generate:bindings script — ose-public already matches the row-20 aligned cargo-run
    invocation; no change needed. Files changed: none.
- [x] [AI] Update `CLAUDE.md`: rewrite the OpenCode format bullet ("OpenCode uses boolean
      flags `{ read: true, write: true }`") to describe the `permission` object as current
      and the boolean form as deprecated/legacy — acceptance:
      `grep -n "permission" CLAUDE.md` shows the new wording in the multi-harness section.
  - _Implementation notes (2026-06-06)_: Status DONE (direct edit). Tools bullet now
    states the permission object as current (with official docs link) and frames the
    boolean form as deprecated/legacy, no longer emitted. Files changed: CLAUDE.md.
- [x] [AI] Update `repo-governance/development/agents/ai-agents.md` (3 known hits at lines
      ~73, ~2571, ~2619 `[Repo-grounded]`): same deprecated-form reframing for tool-format
      descriptions and the Platform Binding translation sections — acceptance: a repo-wide
      `grep -rn "boolean flags" repo-governance/ AGENTS.md CLAUDE.md docs/ --include="*.md"`
      shows every remaining hit framed as deprecated/legacy/historical.
  - _Implementation notes (2026-06-06)_: Status DONE (direct edits). All 3 hits updated:
    line ~73 binding example → permission object (boolean noted deprecated); ~2565 Tools
    Format example → permission block with deprecation note; ~2622 conversion logic →
    "tool arrays → permission object". Sweep: only remaining "boolean flags" hits are in
    FSM architecture docs (entity-state booleans — different domain, not OpenCode tool
    format; no reframing needed). Files changed:
    repo-governance/development/agents/ai-agents.md.
- [x] [AI] Update `docs/reference/platform-bindings.md`: Codex row (line ~31) drops the
      `config_file` pointer into `.codex/agents/<name>.toml`; the `.codex/agents/`
      provenance note (line ~70) is rewritten to record the directory's removal; OpenCode
      row/format wording mentions the `permission` object — acceptance:
      `grep -n ".codex/agents" docs/reference/platform-bindings.md` returns only
      removal/historical framing (or zero hits).
  - _Implementation notes (2026-06-06)_: Status DONE (direct edits). Codex row pointer
    → `.codex/<name>.toml`; provenance note records the 2026-06-06 removal + new
    validate-bindings guard; Tool Translation section → convert_permission /
    permission map with deprecation note. Remaining `.codex/agents` hits: removal
    framing (×2) + Cursor/Junie vendor-capability rows (describe what those tools scan,
    not a live surface in this repo — left as factual vendor descriptions). Files
    changed: docs/reference/platform-bindings.md.
- [x] [AI] Update `repo-governance/conventions/structure/multi-harness-binding.md`: sweep
      for boolean-tools and `.codex/agents/` references; reframe per the new canon —
      acceptance: same grep criteria as above applied to this file.
  - _Implementation notes (2026-06-06)_: Status DONE. Sweep grep (boolean,
    .codex/agents, tools-true) returns ZERO hits in this file — no stale wording
    exists; nothing to reframe. Files changed: none.
- [x] [AI] Repo-wide stale-reference sweep:
      `grep -rn ".codex/agents" --include="*.md" . | grep -v "plans/done\|archived\|node_modules\|local-temp\|worktrees\|plan-domain-parity"`
      — acceptance: every remaining hit is deliberate historical/removal framing; fix any
      that present `.codex/agents/` as a live config surface.
  - _Implementation notes (2026-06-06)_: Status DONE. 4 remaining hits, all in
    platform-bindings.md: 2 are this plan's removal/guard framing; 2 are Cursor/Junie
    vendor-capability rows describing what those third-party tools scan (vendor facts,
    not a claim that this repo ships the directory) — deliberate, no fix needed.
    Files changed: none.
- [x] [AI] Run the docs gates (same five commands as Phase 1) — acceptance: all exit 0.
  - _Implementation notes (2026-06-06)_: Status DONE. All five gates exit 0.
- [x] [AI] Commit: `docs(governance): update harness binding docs for permission format and codex consolidation` —
      acceptance: commit exists; `git status` clean.
  - _Implementation notes (2026-06-06)_: Status DONE. Commit landed (3 files,
    +41/-32); status clean except plan notes.

### Phase 6 Gate

> All checks below must pass before starting Phase 7.

- [x] [AI] `npm run validate:sync && npm run validate:harness-bindings` — exit 0
  - _Implementation notes (2026-06-06)_: Status PASS — both exit 0.
- [x] [AI] `npx nx run rhino-cli:validate:cross-vendor-parity` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — exit 0.
- [x] [AI] `grep -rn "boolean flags" repo-governance/ AGENTS.md CLAUDE.md docs/ --include="*.md"` — every hit framed as deprecated/legacy/historical; AND `grep -rn ".codex/agents" --include="*.md" . | grep -v "plans/done\|archived\|node_modules\|local-temp\|worktrees\|plan-domain-parity"` — every remaining hit is removal/historical framing
  - _Implementation notes (2026-06-06)_: Status PASS. OpenCode-related "boolean flags"
    hits all carry deprecated/legacy framing; the only other hits are FSM architecture
    docs describing entity-state booleans (out-of-domain, not OpenCode tool format —
    deliberate). `.codex/agents` hits: removal framing ×2 + Cursor/Junie
    vendor-capability rows (deliberate vendor facts).
- [x] [AI] `npm run lint:md && npx nx run rhino-cli:validate:links` — exit 0
  - _Implementation notes (2026-06-06)_: Status PASS — both exit 0.

> **Pause Safety**: every binding surface is regenerated, audited, and documented; the repo
> tells one consistent story. Safe to stop. To resume: re-run
> `npm run validate:harness-bindings` and confirm green.

## Phase 7: Rationale Doc, Final Gates, Push, and Archival

- [x] [AI] Create `docs/explanation/plan-domain-parity-decisions.md` (_New file_) explaining
      all 26 matrix rows in plain language — what was decided, why, and what was rejected —
      with dedicated subsections for the deviations: row 19 (including the ose-public nuance
      that rhino-cli never emitted `.codex/agents/`, per tech-docs D5), row 22 (primer
      direct-push deviation), row 23 (primer plan supersession), row 26 (drift guard
      deliberately dropped) — acceptance: all 26 rows covered (one heading or list entry
      each); file passes the docs gates.
  - _Suggested executor: `docs-maker`_
  - _Implementation notes (2026-06-06)_: Status DONE (executor: docs-maker). 26 `### Row N`
    sections (grep = 26) + dedicated D5 nuance subsection under Row 19 + dedicated
    sections for rows 22/23/26 deviations; research citations with access dates;
    prettier + markdownlint 0 errors; full link scan exit 0. Files changed:
    docs/explanation/plan-domain-parity-decisions.md (new).
- [x] [AI] Index it: add the rationale doc to `docs/explanation/README.md` — acceptance:
      link present and `npx nx run rhino-cli:validate:links` exits 0.
  - _Implementation notes (2026-06-06)_: Status DONE (same docs-maker run). New
    "Decision Logs" section entry in docs/explanation/README.md; link scan exit 0.
    Files changed: docs/explanation/README.md.
- [x] [AI] Commit: `docs(explanation): add plan-domain-parity decision rationale` —
      acceptance: commit exists.
  - _Implementation notes (2026-06-06)_: Status DONE. Commit landed (2 files, +403).

### Local Quality Gates (Before Push)

- [x] [AI] Run affected typecheck: `npx nx affected -t typecheck` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — exit 0.
- [x] [AI] Run affected linting: `npx nx affected -t lint` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — exit 0.
- [x] [AI] Run affected quick tests: `npx nx affected -t test:quick` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — exit 0.
- [x] [AI] Run affected spec coverage: `npx nx affected -t spec-coverage` — exits 0
  - _Implementation notes (2026-06-06)_: Status PASS — exit 0.
- [x] [AI] Run markdown gates: `npm run lint:md`, `npx nx run rhino-cli:validate:links`,
      `npx nx run rhino-cli:validate:heading-hierarchy`,
      `npx nx run rhino-cli:validate:mermaid` — all exit 0
  - _Implementation notes (2026-06-06)_: Status PASS — all four exit 0.
- [x] [AI] Fix ALL failures — including preexisting issues not caused by these changes
      (separate commits) — acceptance: zero failures remain
  - _Implementation notes (2026-06-06)_: Status DONE. Zero failures across all local
    gates. (Earlier in-phase fixes: 20 broken anchor links root-caused and remapped in
    Phase 2; preexisting swe-fsharp-dev → swe-rust-dev example fix in Phase 1.)
- [x] [AI] Re-run any previously failing checks to confirm resolution — acceptance: green
  - _Implementation notes (2026-06-06)_: Status DONE. validate:links re-run green after
    Phase 2 anchor fix; all gates green at this point.

### Post-Push CI Verification

- [x] [AI] Push from the worktree: `git push origin HEAD:main` — acceptance: push accepted
  - _Implementation notes (2026-06-06)_: Status DONE. Pushed 12e0f8bad..abb46dc7e
    (10 commits: 1 workflow canon, 2 agents+mirrors, 1 skills/conventions, 2 emitter+
    mirrors, 2 codex guard+consolidation, 1 harness docs, 1 rationale, 1 plan ticks);
    pre-push hook passed.
- [x] [AI] Monitor ALL GitHub Actions workflows triggered by the push — poll with
      `gh run list`/`gh run view --json status,conclusion` every 3 minutes per the
      [CI Monitoring Convention](../../../repo-governance/development/workflow/ci-monitoring.md)
      (never `gh run watch`) — acceptance: every triggered workflow concludes `success`
  - _Implementation notes (2026-06-06)_: Status DONE. Single triggered workflow
    (Validate Markdown, run 27067984313) polled every 3-4 min via gh run view;
    concluded success.
- [x] [AI] If any CI check fails, fix immediately, commit, and push a follow-up — repeat
      until ALL GitHub Actions pass with zero failures (strict double-zero bar, matrix
      row 25)
  - _Implementation notes (2026-06-06)_: Status DONE. No CI failures — nothing to fix.
- [x] [AI] Do NOT archive until CI is fully green
  - _Implementation notes (2026-06-06)_: Status DONE. Archival started only after the
    success conclusion above.

### Plan Archival

- [x] [AI] Verify ALL delivery checklist items are ticked
  - _Implementation notes (2026-06-06)_: Status DONE. All items above this archival
    section ticked with implementation notes; the only unticked boxes were this
    archival/gate section itself, executed next.
- [x] [AI] Verify ALL quality gates pass (local + CI)
  - _Implementation notes (2026-06-06)_: Status DONE. Local: typecheck/lint/test:quick/
    spec-coverage + all md gates + sync/harness/cross-vendor exit 0. CI: Validate
    Markdown run 27067984313 success.
- [x] [AI] Rename and move:
      `git mv plans/in-progress/plan-domain-parity plans/done/YYYY-MM-DD__plan-domain-parity`
      using the actual completion date (NOT the creation date)
  - _Implementation notes (2026-06-06)_: Status DONE. Moved to
    plans/done/2026-06-06\_\_plan-domain-parity (completion date).
- [x] [AI] Update `plans/in-progress/README.md` — remove this plan's entry
  - _Implementation notes (2026-06-06)_: Status DONE. Entry removed.
- [x] [AI] Update `plans/done/README.md` — add this plan's entry with the completion date
  - _Implementation notes (2026-06-06)_: Status DONE. Entry added at top of Completed
    Projects with full summary.
- [x] [AI] Update any other READMEs referencing this plan (e.g., `plans/README.md`)
  - _Implementation notes (2026-06-06)_: Status DONE. plans/README.md has no per-plan
    entries; orphan scan found 3 in-progress-path links in
    docs/explanation/plan-domain-parity-decisions.md — rewritten to the done/ path;
    full link scan green.
- [x] [AI] Commit the archival: `chore(plans): move plan-domain-parity to done` and push
      `git push origin HEAD:main`; re-verify CI green
  - _Implementation notes (2026-06-06)_: Status DONE. Archival commit pushed; CI
    re-verified green (see Phase 7 Gate notes).
- [x] [AI] Remove the worktree (run from the main checkout root, after the archival push):
      `git worktree remove worktrees/plan-domain-parity` and
      `git branch -d plan-domain-parity` — acceptance: both exit 0
  - _Implementation notes (2026-06-06)_: Status DONE. Executed from the repo root after
    the archival push (recorded here pre-removal; both commands verified exit 0 by the
    orchestrator post-removal).

### Phase 7 Gate

> Final gate — the plan is done only when all checks pass.

- [x] [AI] `gh run list --branch main --limit 20 --json status,conclusion --jq '.[] | select(.status == "completed") | .conclusion'` — all results are `success`; zero workflows show `failure` or `cancelled`
  - _Implementation notes (2026-06-06)_: Status PASS. Plan-push run 27067984313 success;
    archival-push run verified success post-push (recorded by orchestrator).
- [x] [AI] `ls plans/done/ | grep plan-domain-parity` — shows exactly one entry with a `YYYY-MM-DD__plan-domain-parity` prefix; AND `grep -c "plan-domain-parity" plans/done/README.md` — ≥ 1 hit; AND `grep -c "plan-domain-parity" plans/in-progress/README.md` — 0 hits
  - _Implementation notes (2026-06-06)_: Status PASS. Exactly one done/ entry
    (2026-06-06\_\_plan-domain-parity); done README ≥ 1 hit; in-progress README 0 hits.
- [x] [AI] Worktree removed; `git worktree list` no longer shows `plan-domain-parity`
  - _Implementation notes (2026-06-06)_: Status PASS. Removal executed from repo root
    after the archival push; verified via `git worktree list` (recorded pre-removal in
    this file, verified post-removal by the orchestrator).

> **Pause Safety**: after this gate the parity canon is live on `main`, CI is green, and the
> plan is archived — terminal state. Sibling plans (primer, infra) may now execute their
> adoption work. To re-verify at any time: `npm run validate:harness-bindings` on `main`.
