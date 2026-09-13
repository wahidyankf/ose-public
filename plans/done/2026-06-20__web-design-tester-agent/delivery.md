# Delivery Checklist — Web Design Tester Agent

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (the safe-to-stop state and the single command to resume). A phase is
> not complete until its gate is green; do not start phase N+1 while any gate check fails.
>
> **Multi-repo note** — Phases 0–5 run in **ose-public**, Phase 6 in **ose-primer**, Phase 7 in
> **ose-infra**. **All work happens directly on each repo's `main` branch in its primary checkout —
> no worktrees are created.** ose-infra is edited in its existing `main` checkout at
> `~/ose-projects/ose-infra` (no per-plan worktree). Each repo is committed, pushed, and CI-green
> before the next repo starts.
>
> **Doc-shaped, not TDD** — this plan ships no production code, so delivery steps are doc-shaped
> (direct action + acceptance criterion), not RED/GREEN/REFACTOR. The Specs & Gherkin two-path rule
> does not apply (no `apps/`/`libs/`/`specs/` source changes — see `tech-docs.md` §Specs & Gherkin
> Exemption). No `specs:coverage` steps are emitted.

## Branch Strategy — Direct on `main`, No Worktrees

Per the maintainer directive for this plan, **every phase runs directly on the `main` branch of each
repo's primary checkout**. No `git worktree` is created for any repo (this overrides the usual
plan-execution worktree default). Trunk-Based Development applies: stage explicit paths, commit
thematically, and `git push origin HEAD:main` from each repo's checkout. ose-infra is edited in place
at `~/ose-projects/ose-infra` on `main` — confirm `git status` works there before committing.

---

## Phase 0: Environment Setup and Baseline (ose-public)

> _Executor: repo-setup-manager_

- [x] [AI] Confirm the ose-public primary checkout is on `main` and synced with `origin/main`
      (`git -C ~/ose-projects/ose-public rev-parse --abbrev-ref HEAD` = `main`; `git fetch`
      then fast-forward if behind) — acceptance: on `main`, up to date, no worktree created
- [x] [AI] Install dependencies: `npm install` — acceptance: exits 0, `node_modules/` synchronized
- [x] [AI] Converge the toolchain: `npm run doctor -- --fix` — acceptance: exits
      0 with no unresolved drift
- [x] [AI] Establish the binding/markdown baseline: `npm run validate:sync` and
      `npm run harness:bindings-validation` and `npm run lint:md` — acceptance: each exits 0;
      record any preexisting failure
- [x] [AI] Resolve all preexisting failures before proceeding — acceptance: no preexisting failures
      remain unresolved

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift
- [x] [AI] `npm run validate:sync`, `npm run harness:bindings-validation`, and `npm run lint:md`
      baseline recorded and every preexisting failure resolved (zero unresolved)

> **Pause Safety**: only the local toolchain and binding/markdown baseline were verified — no agent
> work exists yet. Safe to stop indefinitely. To resume: re-run
> `npm run validate:sync && npm run harness:bindings-validation && npm run lint:md` and confirm clean.

---

## Phase 1: Author the `web-design-tester` Agent (ose-public)

> _Suggested executor: `agent-maker`_

- [x] [AI] Re-read the two sibling tester agent files as structural templates:
      `.claude/agents/web-exploratory-tester.md` and `.claude/agents/web-usability-tester.md`
      — acceptance: structure (frontmatter, Metadata, Why This Exists, Inputs, Relationship,
      Non-Destructive, Methodology, Dimensions, Ground Truth, Output, Procedure, Quality, Constraints,
      Governance, References) noted for mirroring
- [x] [AI] Create `.claude/agents/web-design-tester.md` with frontmatter: `name: web-design-tester`,
      `description:` (design-team-advocate lens; live mockup/token fidelity + design practice;
      distinct from exploratory correctness and usability; files `DWT-###` backlog plan; names the
      `swe-ui-checker` boundary), `tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch`,
      `model: sonnet`, `color: green`, and `skills:` list
      (`plan-creating-project-plans`, `plan-writing-gherkin-criteria`, `docs-applying-content-quality`)
      — acceptance: `grep -E "^(name|model|color): " .claude/agents/web-design-tester.md` shows
      `web-design-tester` / `sonnet` / `green`
- [x] [AI] Write the **Why This Agent Exists** + **mental model** sections: design-team advocate
      answering "does the live site match the design + follow good design practice?", distinct from
      "is it correct?" (exploratory) and "is it usable?" (usability)
      — acceptance: all three lens questions appear verbatim
- [x] [AI] Write the **`swe-ui-checker` boundary** section (HARD): web-design-tester = live
      mockup/token fidelity + design practice on a RUNNING page; swe-ui-checker = static source
      token/a11y compliance; no overlap; design-tester does not audit source
      — acceptance: `grep -c "swe-ui-checker" .claude/agents/web-design-tester.md` ≥ 1 and the
      "RUNNING page" vs "static" phrasing present
- [x] [AI] Write the **five ground-truth sources** section: (1) committed plan-folder mockup assets
      per the UI-mockup convention; (2) design tokens/theme at RUNTIME (runtime counterpart to
      swe-ui-checker's static check, must NOT duplicate it); (3) design-system primitives — flag
      reinvented UI, naming `libs/web-ui` for ose-public and noting `libs/ts-ui` for primer/infra;
      (4) optional external design source (Figma link / mockup URL) fetched when provided;
      (5) general design best-practice / visual consistency / information density ("not cramped")
      grounded by delegating to `web-researcher`
      — acceptance: each of the five sources has its own labelled subsection; `grep -c "libs/web-ui"`
      ≥ 1 and `grep -ci "not cramped"` ≥ 1
- [x] [AI] Write the **locale + evidence** section: test ALL supported locales (discovered from app
      i18n config) per breakpoint 375/768/1280; cited screenshots to the plan's `evidence/` subfolder
      named `phase-N-<description>-<locale>-<breakpoint>px.png`; Playwright MCP for rendering,
      `web-researcher` for grounding
      — acceptance: `grep -E "375|768|1280" .claude/agents/web-design-tester.md` matches and
      `evidence/` naming pattern present
- [x] [AI] Write the **Output** section modelled on the siblings: backlog plan at
      `plans/backlog/<YYYY-MM-DD>__<slug>/` with `README.md`, `brd.md`, `prd.md`, `findings.md`,
      `spec-gaps.md`, `evidence/`; findings prefixed `DWT-###`, severity-rated, with steps-to-reproduce
      and cited ground truth; does NOT author `tech-docs.md`/`delivery.md`
      — acceptance: `grep -c "DWT-" .claude/agents/web-design-tester.md` ≥ 1; all five doc names present
- [x] [AI] Write **Non-Destructive Constraint**, **Relationship to Other Agents** (feeds `plan-maker`,
      distinct from `swe-ui-checker`, delegates to `web-researcher`, sibling of the two testers),
      **Governance Alignment**, and **References** sections mirroring the siblings
      — acceptance: sections present; references include the UI-mockup, evidence-capture, and
      web-research-delegation conventions
- [x] [AI] Run markdown gate on the new file: `npm run lint:md` — acceptance: exits 0

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `test -f .claude/agents/web-design-tester.md` — expected: file exists
- [x] [AI] `grep -Eq "^name: web-design-tester$" .claude/agents/web-design-tester.md && grep -Eq "^model: sonnet$" .claude/agents/web-design-tester.md && grep -Eq "^color: green$" .claude/agents/web-design-tester.md`
      — expected: exit 0 (metadata correct)
- [x] [AI] `grep -q "swe-ui-checker" .claude/agents/web-design-tester.md` — expected: boundary pinned
- [x] [AI] `grep -q "libs/web-ui" .claude/agents/web-design-tester.md && grep -qi "not cramped" .claude/agents/web-design-tester.md && grep -q "DWT-" .claude/agents/web-design-tester.md`
      — expected: exit 0 (ground-truth + density + findings prefix present)
- [x] [AI] `npm run lint:md` — expected: exits 0

> **Pause Safety**: the agent definition exists and passes markdown gates but is **not yet
> registered** anywhere and bindings are **not yet synced** — the agent is inert (no catalog lists it),
> so the repo is coherent. Safe to stop. To resume: re-run the Phase 1 gate greps.

---

## Phase 1b: Make the Three Testers Reciprocally Complement (ose-public)

> _Suggested executor: `agent-maker`_ — the new agent names its siblings, but the triad is only
> truly mutually-aware once the **two existing testers also name the design lens**. This phase closes
> the loop so all three agent definitions cross-reference each other and pin their non-overlapping
> boundaries (correctness ≠ usability ≠ design; all three ≠ `swe-ui-checker`'s static-source audit).

- [x] [AI] Edit `.claude/agents/web-exploratory-tester.md`: in its **Relationship to Other Agents**
      (or equivalent "distinct from" / sibling) section, add `web-design-tester` as the third tester
      lens with a one-line boundary (it owns runtime design fidelity; exploratory owns spec-aware
      correctness) — acceptance: `grep -c "web-design-tester" .claude/agents/web-exploratory-tester.md`
      ≥ 1
- [x] [AI] Edit `.claude/agents/web-usability-tester.md`: in its relationship/"distinct from" section,
      add `web-design-tester` as the third lens with a one-line boundary (it owns design-aware
      fidelity against mockups/tokens; usability owns spec-blind first-time-user comprehension)
      — acceptance: `grep -c "web-design-tester" .claude/agents/web-usability-tester.md` ≥ 1
- [x] [AI] Confirm `web-design-tester.md` reciprocally names BOTH siblings in its own relationship
      section (already authored in Phase 1) — acceptance:
      `grep -q "web-exploratory-tester" .claude/agents/web-design-tester.md && grep -q "web-usability-tester" .claude/agents/web-design-tester.md`
- [x] [AI] Run markdown gate: `npm run lint:md` — acceptance: exits 0

### Phase 1b Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] Each of the three tester agent files names the other two (mutual cross-reference):
      `for a in web-exploratory-tester web-usability-tester web-design-tester; do for b in web-exploratory-tester web-usability-tester web-design-tester; do [ "$a" = "$b" ] || grep -q "$b" .claude/agents/$a.md || echo "MISSING $b in $a"; done; done`
      — expected: no `MISSING` output
- [x] [AI] `npm run lint:md` — expected: exits 0

> **Pause Safety**: all three tester definitions now reciprocally reference each other and pin their
> boundaries, but nothing is registered in catalogs or bindings yet — repo still coherent. Safe to
> stop. To resume: re-run the Phase 1b gate loop.

---

## Phase 2: Register Across Governance Surfaces (ose-public)

> _Suggested executor: `repo-rules-maker` (agent-naming + AGENTS.md), `repo-workflow-maker` (workflow)_

- [x] [AI] Edit `repo-governance/conventions/structure/agent-naming.md`: add `web-design-tester` to
      the `tester` Role Vocabulary table row example AND to the §Examples `tester` bullet (alongside
      `web-exploratory-tester`, `web-usability-tester`)
      — acceptance: `grep -c "web-design-tester" repo-governance/conventions/structure/agent-naming.md`
      ≥ 2
- [x] [AI] Edit `.claude/agents/README.md`: add a `web-design-tester` bullet to the `### 🧪 Testing`
      section (after the usability bullet) describing the design lens + five ground-truth sources +
      `DWT-###` filing + the `swe-ui-checker` boundary; add it to the `tester` role-table example cell
      — acceptance: `grep -c "web-design-tester" .claude/agents/README.md` ≥ 2
- [x] [AI] Edit `AGENTS.md`: add a **Testing** line to the agent catalog block (the
      Content Creation / Validation / … list near line 391) naming all three testers
      (`web-exploratory-tester, web-usability-tester, web-design-tester`); verify the exact insertion
      point first since AGENTS.md currently has no Testing catalog line
      — acceptance: `grep -c "web-design-tester" AGENTS.md` ≥ 1 and a "Testing" catalog line exists
- [x] [AI] Rename the workflow file to seat the design lens:
      `git mv repo-governance/workflows/web/web-exploratory-and-usability-test-fixing-planning.md repo-governance/workflows/web/web-ux-test-fixing-planning.md`
      — acceptance: `test -f repo-governance/workflows/web/web-ux-test-fixing-planning.md`
- [x] [AI] Edit the renamed workflow file: update frontmatter `name`/`title`/`goal`/`termination` to
      the three-tester form; update the intro, the Phases (add a third sequential "Design Pass +
      Integrate" phase delegating to `web-design-tester`, producing `DWT-###`), keep findings
      attributed (`EWT-###`/`UWT-###`/`DWT-###`), update the Gherkin success criteria, the Related
      Documents (add the design tester), and the Workflow Naming Convention note
      — acceptance: `grep -c "web-design-tester" <renamed file>` ≥ 3 and `grep -c "DWT-" <renamed file>`
      ≥ 2
- [x] [AI] Edit `repo-governance/workflows/README.md`: update the workflow table row label + cell and
      the intro bullet (line ~198 area) to the three-tester name and agent list (add
      `web-design-tester`)
      — acceptance: `grep -c "web-design-tester" repo-governance/workflows/README.md` ≥ 1 and the row
      reads three testers
- [x] [AI] Edit `repo-governance/workflows/web/README.md`: update the Purpose, Scope, and Workflows
      entries to reference three testers and the renamed workflow file
      — acceptance: `grep -c "web-design-tester" repo-governance/workflows/web/README.md` ≥ 1 and the
      workflow link points at the renamed file
- [x] [AI] Fix any internal links that referenced the old workflow filename:
      `grep -rn "web-exploratory-and-usability-test-fixing-planning" repo-governance/ .claude/ AGENTS.md`
      and update each hit to the new filename
      — acceptance: that grep returns no stale references
- [x] [AI] Run markdown + link gates: `npm run lint:md` and
      `npx nx run rhino-cli:links:validation` — acceptance: both exit 0

### Phase 2 Gate

> All checks below must pass before starting Phase 2c.

- [x] [AI] `grep -rl "web-design-tester" repo-governance/conventions/structure/agent-naming.md .claude/agents/README.md AGENTS.md repo-governance/workflows/README.md repo-governance/workflows/web/README.md`
      — expected: all five files listed (every surface registers the agent)
- [x] [AI] `test -f repo-governance/workflows/web/web-ux-test-fixing-planning.md && ! test -f repo-governance/workflows/web/web-exploratory-and-usability-test-fixing-planning.md`
      — expected: exit 0 (rename complete, old file gone)
- [x] [AI] `grep -rn "web-exploratory-and-usability-test-fixing-planning" repo-governance/ .claude/ AGENTS.md`
      — expected: no output (no stale references)
- [x] [AI] `npm run lint:md` and `npx nx run rhino-cli:links:validation` — expected: both exit 0

> **Pause Safety** (acknowledged binding-intermediate — locally stable, NOT push-safe): the agent is
> registered in every `.claude/`/`AGENTS.md`/governance surface and the workflow is renamed, but the
> secondary bindings (`.opencode`/`.amazonq`/`.codex`) are **not yet regenerated**, so `validate:sync`
> will intentionally report drift until Phase 3. Nothing is pushed and nothing is half-written — the
> tree is locally coherent — but **do NOT push from here**. To resume: proceed to Phase 2c then Phase 3
> (`npm run validate:sync` is expected to report drift until Phase 3 regenerates bindings).

---

## Phase 2c: Web-UI-Feature-Change 3-Tester Governance Rule (ose-public)

> _Suggested executor: `repo-rules-maker`._ Expand the existing **Rule 15** of the
> [User-Facing Delivery Hardening Convention](../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
> from a single `web-exploratory-tester` near-end retest into the **full three-tester triad** (the
> renamed `web-ux-test-fixing-planning` workflow). A web-UI **feature-change** plan must, near the end
> of delivery, run all three live-site testers to iron out rough edges and inconsistencies, record
> every finding in `delivery.md` as an unchecked task-list checkbox (source-attributed
> `EWT-###`/`UWT-###`/`DWT-###`), and **fix them within the same plan-execution run** before archival.

- [x] [AI] Edit `repo-governance/development/quality/user-facing-delivery-hardening.md` Rule 15: change
      the single `web-exploratory-tester` round into a **three-tester** round (exploratory + usability +
      design, i.e. the `web-ux-test-fixing-planning` workflow); keep the "ALL supported locales" and
      "record each finding as an unchecked `delivery.md` checkbox, fix in the same execution, archival
      blocked until ticked-or-deferred" semantics; attribute findings `EWT-###`/`UWT-###`/`DWT-###`
      — acceptance: `grep -c "web-design-tester" user-facing-delivery-hardening.md` ≥ 1 and Rule 15
      names all three testers
- [x] [AI] Update the same file's **Examples** (PASS line), **Tools and Automation** bullets (add
      `web-usability-tester` and `web-design-tester` alongside `web-exploratory-tester`; reference the
      `web-ux-test-fixing-planning` workflow), and the `plan-maker`/`plan-checker`/
      `plan-execution-checker` description bullets to the three-tester form; update the intro/count
      prose (lines ~25–26, ~78) so "fifteenth rule" wording still reads correctly
      — acceptance: the three tester names all appear in Tools and Automation
- [x] [AI] Edit `AGENTS.md`: update the hardening bullet that currently names a "near-end
      `web-exploratory-tester` retest round" to name the **three live-site testers** / the
      `web-ux-test-fixing-planning` workflow — acceptance:
      `grep -q "web-ux-test-fixing-planning\|three live-site testers" AGENTS.md`
- [x] [AI] Edit `repo-governance/workflows/plan/plan-execution.md`: at the near-end / finalization gate
      where the Rule-15 exploratory round is described, change it to the three-tester round
      (`web-ux-test-fixing-planning`), keeping the per-locale × per-breakpoint loop and the
      "append findings to `delivery.md`, fix in same execution" semantics
      — acceptance: `grep -q "web-design-tester\|web-ux-test-fixing-planning" repo-governance/workflows/plan/plan-execution.md`
- [x] [AI] Edit `.claude/agents/plan-maker.md`: where it emits the Rule-15 near-end retest step for
      web-UI plans, change it to emit the **three-tester** round (scaffold the
      `EWT/UWT/DWT follow-ups` section + locale-coverage note) — acceptance:
      `grep -q "web-design-tester\|three-tester\|web-ux-test-fixing-planning" .claude/agents/plan-maker.md`
- [x] [AI] Edit `.claude/agents/plan-checker.md`: where it flags a missing/single-locale Rule-15
      retest on web-UI plans, change it to flag a missing **three-tester** near-end round
      — acceptance: `grep -q "web-design-tester\|three-tester\|web-ux-test-fixing-planning" .claude/agents/plan-checker.md`
- [x] [AI] Edit `.claude/agents/plan-execution-checker.md`: where it verifies the Rule-15 round ran
      across all locales with findings resolved-or-deferred before archival, change it to verify the
      **three-tester** round (`EWT/UWT/DWT`) — acceptance:
      `grep -q "web-design-tester\|three-tester\|web-ux-test-fixing-planning" .claude/agents/plan-execution-checker.md`
- [x] [AI] Scope clarification: the rule binds web-UI **feature-change** plans (browser-rendered apps),
      not CLI/text output and not pure-governance/agent-def plans like THIS one — state this explicitly
      in the Rule 15 text — acceptance: Rule 15 says "feature-change" and excludes CLI/text + governance
- [x] [AI] Run markdown + link gates: `npm run lint:md` and `npx nx run rhino-cli:links:validation`
      — acceptance: both exit 0

### Phase 2c Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] All three tester names appear in Rule 15 + Tools and Automation of
      `user-facing-delivery-hardening.md`:
      `grep -q "web-exploratory-tester" repo-governance/development/quality/user-facing-delivery-hardening.md && grep -q "web-usability-tester" repo-governance/development/quality/user-facing-delivery-hardening.md && grep -q "web-design-tester" repo-governance/development/quality/user-facing-delivery-hardening.md`
      — expected: exit 0
- [x] [AI] `grep -rl "web-design-tester\|web-ux-test-fixing-planning" AGENTS.md repo-governance/workflows/plan/plan-execution.md .claude/agents/plan-maker.md .claude/agents/plan-checker.md .claude/agents/plan-execution-checker.md`
      — expected: all five files listed
- [x] [AI] `npm run lint:md` and `npx nx run rhino-cli:links:validation` — expected: both exit 0

> **Pause Safety** (acknowledged binding-intermediate — locally stable, NOT push-safe): the governance
> rule now binds web-UI feature-change plans to the three-tester near-end round, consistent across the
> hardening convention, `AGENTS.md`, `plan-execution`, `plan-maker`, `plan-checker`, and
> `plan-execution-checker`. Bindings still un-regenerated (`validate:sync` will report drift until
> Phase 3) — nothing pushed, tree locally coherent — **do NOT push**. To resume: Phase 3.

---

## Phase 3: Re-sync Bindings and Validate (ose-public)

- [x] [AI] Regenerate all secondary bindings: `npm run generate:bindings`
      — acceptance: exits 0 and `.opencode/agents/web-design-tester.md` now exists
      (`test -f .opencode/agents/web-design-tester.md`)
- [x] [AI] Validate sync parity: `npm run validate:sync` — acceptance: exits 0 (no mirror drift)
- [x] [AI] Validate harness bindings: `npm run harness:bindings-validation` — acceptance: exits 0
- [x] [AI] Re-run markdown gate after generation: `npm run lint:md` — acceptance: exits 0

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] `test -f .opencode/agents/web-design-tester.md` — expected: OpenCode mirror generated
- [x] [AI] `npm run validate:sync` — expected: exits 0
- [x] [AI] `npm run harness:bindings-validation` — expected: exits 0
- [x] [AI] `npm run lint:md` — expected: exits 0

> **Pause Safety**: agent authored, registered, and all bindings synced + validating clean — the
> ose-public tree is fully coherent and self-consistent. Safe to stop indefinitely. To resume: re-run
> `npm run validate:sync && npm run harness:bindings-validation`.

---

## Phase 4: Local Quality Gates + Commit + Push (ose-public)

### Local Quality Gates (Before Push)

- [x] [AI] Run affected checks: `npx nx affected -t typecheck lint test:quick`
      — acceptance: exits 0 (rhino-cli may be affected via binding generation)
- [x] [AI] Run binding + markdown + link gates:
      `npm run validate:sync && npm run harness:bindings-validation && npm run lint:md && npx nx run rhino-cli:links:validation`
      — acceptance: all exit 0
- [x] [AI] Fix ALL failures found — including preexisting issues not caused by this change (root-cause
      orientation). Commit preexisting fixes separately. — acceptance: zero failures remain

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes.
> This follows the root cause orientation principle — proactively fix preexisting errors encountered
> during work. Commit preexisting fixes separately with appropriate conventional commit messages.

### Commit Guidelines

- [x] [AI] Stage explicit paths only (never `git add -A` — sibling repos carry WIP):
      `git add .claude/agents/web-design-tester.md .opencode/agents/web-design-tester.md repo-governance/ .claude/agents/README.md AGENTS.md`
      plus any `.amazonq`/`.codex` generated artifacts — acceptance: `git status` shows only intended paths staged
- [x] [AI] Commit thematically with Conventional Commits, e.g.
      `feat(agents): add web-design-tester completing the live-site advocate triad`
      — acceptance: commit created
- [x] [AI] Commit and push to origin main: `git push origin HEAD:main` (Trunk Based Development;
      direct push is the repo default) — acceptance: push succeeds

### Post-Push CI Verification

- [x] [AI] Monitor ALL GitHub Actions workflows triggered by the push (poll every ~3 min via
      `gh run view --json status,conclusion`; do NOT use `gh run watch`) — acceptance: all checks pass
- [x] [AI] If any CI check fails, investigate root cause, fix, and push a follow-up commit; repeat
      until green — acceptance: ALL GitHub Actions pass with zero failures

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] `git log --oneline -1` shows the web-design-tester commit on `main`
- [x] [AI] All triggered GitHub Actions are green (`gh run list --branch main --limit 5` shows
      success for the push) — expected: zero failing runs

> **Pause Safety**: ose-public carries the complete, CI-green capability on `main`. Safe to stop
> indefinitely. The two sibling repos do not yet have it (parity pending). To resume: begin Phase 6
> (ose-primer).

---

## Phase 5: ose-public Verification Summary

- [x] [AI] Confirm `prd.md` Gherkin scenarios for ose-public are satisfied: agent file + metadata,
      boundary pinned, five ground-truth sources, filing format, all registration surfaces, bindings
      validate, workflow runs three testers — acceptance: each scenario's verifying grep/command from
      `tech-docs.md` §Testing Strategy passes

### Phase 5 Gate

> All checks below must pass before starting Phase 6.

- [x] [AI] Re-run the full ose-public verification battery:
      `grep -rl "web-design-tester" .claude/agents/web-design-tester.md .opencode/agents/web-design-tester.md repo-governance/conventions/structure/agent-naming.md .claude/agents/README.md AGENTS.md repo-governance/workflows/README.md repo-governance/workflows/web/README.md repo-governance/workflows/web/web-ux-test-fixing-planning.md`
      — expected: all eight paths listed
- [x] [AI] `npm run validate:sync && npm run harness:bindings-validation` — expected: both exit 0

> **Pause Safety**: ose-public fully done and verified. Safe to stop. To resume: Phase 6.

---

## Phase 6: Propagate to ose-primer (topic-identical, localized)

> _Repo: `ose-primer` — work directly on `main` in its primary checkout (no worktree). Use its own
> script names. Localize per `tech-docs.md` §Three-Repo Localization Map: `libs/web-ui` →
> `libs/ts-ui`, `specs:coverage` → `spec-coverage`, app/lib names per repo._

- [x] [AI] In ose-primer on `main`, sync with `origin/main` and confirm clean baseline
      (`npm install && npm run doctor -- --fix`; the repo's `validate:sync` + `lint:md` equivalents)
      — acceptance: on `main`, baseline clean, no worktree created
- [x] [AI] Author `.claude/agents/web-design-tester.md` topic-identically to ose-public's, **localized**:
      ground-truth source #3 names `libs/ts-ui`; any app/lib examples use ose-primer's names
      — acceptance: `grep -c "libs/ts-ui" .claude/agents/web-design-tester.md` ≥ 1 and
      `grep -c "libs/web-ui" .claude/agents/web-design-tester.md` = 0
- [x] [AI] Apply the same registration surfaces (agent-naming convention, agents README, AGENTS.md,
      the renamed three-tester workflow + workflows README + web/README), verifying each file exists in
      ose-primer first and matching its local structure — acceptance: `grep -rl "web-design-tester"`
      lists all surfaces present in ose-primer
- [x] [AI] Regenerate bindings + validate using ose-primer's actual script names (confirm via its
      `package.json`) — acceptance: the OpenCode mirror exists and sync/harness validators exit 0
- [x] [AI] Run ose-primer local quality gates; fix all failures (incl. preexisting) — acceptance: zero
      failures
- [x] [AI] Stage explicit paths, commit (`feat(agents): add web-design-tester completing the live-site
advocate triad`), and push to ose-primer `origin main` — acceptance: push succeeds
- [x] [AI] Monitor ose-primer CI to green (poll ~3 min; no `gh run watch`) — acceptance: all checks pass

### Phase 6 Gate

> All checks below must pass before starting Phase 7.

- [x] [AI] In ose-primer: the design-tester commit is on `main` and all GitHub Actions are green
- [x] [AI] `grep -q "libs/ts-ui" .claude/agents/web-design-tester.md` and the OpenCode mirror exists
      and the repo's sync + harness validators exit 0 — expected: localized + synced

> **Pause Safety**: ose-public + ose-primer both carry the CI-green capability. ose-infra pending.
> Safe to stop. To resume: Phase 7.

---

## Phase 7: Propagate to ose-infra (topic-identical, localized; direct on `main`)

> _Repo: `ose-infra` — edit in its existing primary `main` checkout at `~/ose-projects/ose-infra`
> (no per-plan worktree is created). Confirm `git -C ~/ose-projects/ose-infra status` works there
> before committing. Localize as in Phase 6. Use ose-infra's own script names._

- [x] [AI] In the ose-infra `~/ose-projects/ose-infra` checkout on `main`, sync with `origin/main` and
      confirm `git status` works and the baseline is clean
      — acceptance: on `main`, `git status` succeeds, baseline clean, no worktree created
- [x] [AI] Author `.claude/agents/web-design-tester.md` topic-identically, **localized** (`libs/ts-ui`;
      ose-infra app/lib names) — acceptance: `grep -c "libs/ts-ui"` ≥ 1 and `libs/web-ui` absent
- [x] [AI] Apply the same registration surfaces present in ose-infra (verify each exists first); if a
      surface is absent in ose-infra, record it in this checklist rather than inventing it
      — acceptance: `grep -rl "web-design-tester"` lists all surfaces present in ose-infra
- [x] [AI] Regenerate bindings + validate using ose-infra's actual script names — acceptance: OpenCode
      mirror exists and validators exit 0
- [x] [AI] Run ose-infra local quality gates; fix all failures (incl. preexisting) — acceptance: zero
      failures
- [x] [AI] Stage explicit paths, commit (`feat(agents): add web-design-tester completing the live-site
advocate triad`), and push to ose-infra `origin main` from the `~/ose-projects/ose-infra` checkout
      — acceptance: push succeeds
- [x] [AI] Monitor ose-infra CI to green (poll ~3 min; no `gh run watch`) — acceptance: all checks pass

### Phase 7 Gate

> All checks below must pass before archival.

- [x] [AI] In ose-infra: the design-tester commit is on `main` and all GitHub Actions are green
- [x] [AI] `grep -q "libs/ts-ui" .claude/agents/web-design-tester.md` in the ose-infra checkout and its
      sync + harness validators exit 0 — expected: localized + synced

> **Pause Safety**: all three repos carry the CI-green, topic-identical capability. Three-repo parity
> achieved. Safe to stop. To resume: Phase 7b (repo-rules-maker sweep).

---

## Phase 7b: `repo-rules-maker` Consistency Sweep (all three repos)

> _Executor: `repo-rules-maker` (one run per repo)._ After the agent + the new governance rule have
> landed in all three repos, run `repo-rules-maker` in each to verify and weave the new rules
> consistently across every governance surface (registers, indexes, convention cross-references,
> agent/skill duplication, rules-governance contradictions) — catching any surface the surgical edits
> missed. Apply its fixes, then commit + push per repo.

- [x] [AI] Run `repo-rules-maker` in **ose-public**: scope it to the web-design-tester registration +
      the web-UI 3-tester governance rule; apply any consistency fixes it surfaces
      — acceptance: repo-rules-maker reports no unresolved consistency findings for the changed surfaces
- [x] [AI] Stage explicit paths, commit (`chore(governance): repo-rules-maker consistency sweep for
web-design-tester + 3-tester rule`), and push ose-public `origin main`; monitor CI green
      — acceptance: pushed, CI green (skip the commit if repo-rules-maker produced no changes)
- [x] [AI] Run `repo-rules-maker` in **ose-primer** (localized surfaces); apply fixes; commit + push
      `origin main`; CI green — acceptance: no unresolved findings; pushed; CI green (or no-op if clean)
- [x] [AI] Run `repo-rules-maker` in **ose-infra** (in `~/ose-projects/ose-infra` on `main`); apply
      fixes; commit + push `origin main`; CI green — acceptance: no unresolved findings; pushed; CI
      green (or no-op if clean)

### Phase 7b Gate

> All checks below must pass before archival.

- [x] [AI] `repo-rules-maker` reports zero unresolved consistency findings (for the changed surfaces)
      in all three repos
- [x] [AI] Each repo's `main` is pushed and CI-green after the sweep (or the sweep was a verified no-op
      that produced no diff)

> **Pause Safety**: governance consistency verified and any drift fixed across all three repos. Safe to
> stop. To resume: Phase 8 (archival).

---

## Phase 8: Final Verification and Plan Archival

### Final Verification

- [x] [AI] Confirm three-repo parity: each of ose-public, ose-primer, ose-infra has
      `.claude/agents/web-design-tester.md` (localized `libs/web-ui`/`libs/ts-ui`), the matching
      registration surfaces, a generated OpenCode mirror, the renamed three-tester workflow, and a
      green `main` — acceptance: all three repos verified
- [x] [AI] Confirm every `prd.md` Gherkin scenario is satisfied across the three repos — acceptance:
      each scenario's verifying command passes

### Plan Archival

- [x] [AI] Verify ALL delivery checklist items are ticked
- [x] [AI] Verify ALL quality gates pass (local + CI) in all three repos
- [x] [AI] Note: no manual UI/API behavioral assertions apply — this plan ships no UI/API code (it
      ships an agent definition + governance docs); the `evidence/` UI-screenshot requirement is the
      _runtime agent's_ obligation when it runs, not this plan's
- [x] [AI] Move and date-prefix the plan (use today's completion date, NOT the creation date):
      `git mv plans/in-progress/web-design-tester-agent plans/done/YYYY-MM-DD__web-design-tester-agent`
      — acceptance: folder now under `plans/done/` with completion-date prefix
- [x] [AI] Update `plans/in-progress/README.md` — remove the plan entry — acceptance: entry gone
- [x] [AI] Update `plans/done/README.md` — add the plan entry with completion date — acceptance: entry present
- [x] [AI] Update any other READMEs that reference this plan (e.g. `plans/README.md`,
      `plans/backlog/README.md`) — acceptance: no stale references
- [x] [AI] Commit the archival: `chore(plans): move web-design-tester-agent to done`
- [x] [AI] Commit and push to origin main: `git push origin HEAD:main` — acceptance: push succeeds

### Phase 8 Gate

> All checks below must complete successfully before closing the plan.

- [x] [AI] `test -d plans/done/*web-design-tester-agent` — expected: archived
- [x] [AI] `git log --oneline -1` shows the archival commit on `main` and CI is green

> **Pause Safety**: plan complete and archived across all three repos. Terminal state. All work was
> done directly on each repo's `main` — no worktree was created, so there is nothing to clean up.
