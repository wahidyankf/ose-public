# Technical Documentation: Optimize Governance Markdown

## 1. Gate Design

### 1.1 Repurpose, do not rebuild

`apps/rhino-cli/src/application/repo_governance/instruction_size.rs` already provides
everything this plan needs except the metric:

- glob-driven surface matching against repo-relative paths
- a three-tier `Severity` enum (`Ok` / `Warn` / `Fail`) with `severity_label`
- deserialized per-surface thresholds (`Surface { glob, target, warn, fail }`)
- transitive `@`-import resolution with depth limit and cycle guard (`ResolvedTree`)
- a `Finding` type and reporter already wired into four enforcement points

The change is therefore narrow: swap the measured quantity from bytes to words, widen the
globs, and rename the module and its command surface. The `Fs` port abstraction stays, so the
existing unit tests keep their fixture style.

**Overlap-precedence gap — new selection logic, not a config-only change** [Repo-grounded — read
`check_instruction_sizes` in full, `apps/rhino-cli/src/application/repo_governance/
instruction_size.rs:273-318`]: today's `check_instruction_sizes` iterates every configured
surface in declaration order and, for each one, evaluates **every matching file independently
against that surface's own thresholds**, pushing a `Finding` per surface a file matches (skipping
only that surface's own `Ok` verdicts — a file within one surface's thresholds simply produces no
candidate from that surface, while a different surface matching the same file can still push its
own candidate). There is no deduplication and no "later-declared-surface-wins" logic — a file
matched by two surfaces (e.g. a `README.md` matched by both the general
`repo-governance/**/*.md` surface and the new `**/README.md` surface) can produce **two
independent findings** today, one per surface, whenever both surfaces independently classify it
non-`Ok`. The caller, `convention_validate_instruction_size.rs::run_for_root`, computes
`has_fail = findings.iter().any(|f| f.severity == Severity::Fail)`, so the less-specific
surface's `Fail` trips the gate even when the more-specific surface classifies the same file
`Warn` — or, in the common case where the more-specific surface classifies the file `Ok`, even
when the more-specific surface has nothing to say about the file at all.

§1.3's "later globs win on overlap" and FR-1.6/FR-3.15's precedence rule are therefore **genuinely
new selection logic this plan adds during the port**. The design is **select the winning surface
per path first, then classify once against only that surface's thresholds** — not "classify
against every surface, then filter/compare the resulting findings." The second shape is
insufficient: because `Ok` verdicts never produce a candidate finding, a design that only compares
already-produced candidates has nothing to compare against when the winning (more specific)
surface's own verdict is `Ok` — the earlier-declared, less-specific surface's stray `Fail`/`Warn`
candidate then survives unfiltered, exactly the bug this section exists to close, just triggered
by the surface that was supposed to fix it. The select-then-classify order removes this failure
mode structurally: an earlier-declared surface's `classify()` call is never made at all for a path
a later-declared surface also matches, so it can never contribute a stray candidate in the first
place. See §1.3 below and `delivery.md` Phase 1a/1b for the RED/GREEN steps that add it.

**Registry-merge scope decision** [Repo-grounded — `merged_budget_config()`]: today's
`instruction_size.rs` also merges every `harness:` registry entry's `instruction:` glob list
into the budget, applying default byte thresholds to any glob not already covered by an
explicit surface. This behaviour is **not ported**. The `harness.instruction` registry field
this merge reads has no consumer besides `merged_budget_config` (verified by grep) — but
`merged_budget_config` the _function_ has a second call site:
`application/repo_governance/audit_orchestrator.rs::audit_instruction_size` calls it directly
and consumes its registry-merged output for the `repo-governance audit --category=instruction-size`
command. Dropping the merge is still the right call (FR-1.3's explicit glob list already
supersedes every registry-declared `.md`-extension surface that resolves to an existing file
today), but `audit_orchestrator.rs` is a real, functionally-coupled call site this plan touches,
not an unaffected bystander — its rename is tracked in the File-Impact Analysis tree below. The
six surfaces the merge would otherwise auto-cover (`.cursor/rules/*.mdc`, `.windsurf/rules/*.md`,
`.junie/guidelines.md`, `.github/copilot-instructions.md`, `GEMINI.md`, `CONVENTIONS.md`) do not
exist in either repo today (verified via `ls`). See `prd.md` FR-1.15 for the full decision
record.

**The same principle applies to FR-3's README-index gate — it is not exempt.**
[Repo-grounded, verified 2026-08-13] `apps/rhino-cli/src/application/repo_governance/
readme_index_audit.rs` already provides the walk-and-audit mechanic FR-3.1–FR-3.4 need:
recursive `README.md` discovery, sibling `.md`/subdirectory-`README.md` computation, and
`orphan`/`ghost` finding emission. It is wired to the CLI via
`apps/rhino-cli/src/commands/md_validate_readme_index.rs` as `md readme-index validate`, and
registered in `repo-config.yml` as gate id `md-readme-index`, **already armed** at
`surfaces: { pre-push: { scope: all-file-type }, ci: { scope: all-file-type } }` — it runs on
every push and every PR today, unconditionally, and currently passes with zero findings.

The change is a **rename-and-extend**, mirroring word-budget's pattern exactly:
`git mv` the module to `application/governance/readme_index.rs` and the command file to
`commands/governance_validate_readme_index.rs`; rename the CLI surface from `md readme-index` to
`governance readme-index`; and add two genuinely new finding kinds (`missing` — FR-3.1's
README-must-exist rule, which the current implementation cannot check because it only audits
READMEs that already exist — and `unannotated` — FR-3.10/FR-3.11/FR-3.14's annotation-derivation
requirement, which the current implementation does not check at all) plus a `generate`
subcommand (FR-3.12; `md readme-index` has no generator today). `DEFAULT_PATHS` for the
continuity-preserving gate stays at its current 4-entry list — see below for why the scope
widening to FR-3.7's scope (the new gate's own 4-entry `--paths`, narrowed from an originally
wider 6-entry design at the Phase 9/16 arming step) is deferred, not immediate.

**The rename must not disarm what is already enforced, and a new capability must not arm itself
against a currently-noncompliant repo.** These are two separate risks, handled two separate ways:

1. **No enforcement gap** — because `md-readme-index` is armed today, the `repo-config.yml`
   entry is renamed **in place** to `governance-readme-index` within the same Phase 1 commit
   that performs the `git mv`. It is never removed and re-registered later, which would open an
   enforcement gap FR-1's own byte→word transition explicitly accepts (§6.2) but FR-3's rename
   does not need to. `governance-readme-index` keeps its current `orphan`/`ghost` behavior, its
   current `DEFAULT_PATHS`, and its current `scope: all-file-type` surfaces — unchanged.
2. **No day-one breakage from new capabilities** — `missing` (a directory lacking a required
   `README.md`) and `unannotated` (a link lacking the derived-annotation format) are both
   genuinely new checks against a repo that is not compliant with either today (`README.md`
   §Context: 721 Markdown-bearing directories in `ose-public` lack a `README.md`; zero files
   carry `when_to_use` yet). Arming either unconditionally at Phase 1 would fail CI immediately,
   for reasons this plan's own Phases 2–8 exist to fix. Both therefore follow the **same
   register-then-arm dark-launch sequencing FR-4 already uses** for `when_to_use`/`description`
   (§5 below): registered but not enforced at Phase 1, via a **second**, separately-registered,
   `path-gated` gate id, `governance-readme-completeness`, scoped to FR-3.7's covered-tree list
   (the scope widening lives here, not in the continuity gate — narrowed to a 4-entry list at
   the Phase 9/16 arming step; see `prd.md` FR-3.7) — armed once
   Phases 2–8 (`ose-public`) / 11–15 (the private sibling) have populated the missing indexes and
   annotations. See `prd.md` FR-3.19/FR-3.20 and §4 below for the full design.

### 1.2 Word counting

Word count is **raw and whole-file**, defined as the number of whitespace-separated tokens in
the file's full UTF-8 contents — identical to `wc -w`. Frontmatter, fenced code, Mermaid,
tables, and URLs all count.

This definition is chosen because it is unarguable. Any "prose-only" definition requires a
Markdown parser, invites per-file disputes about what counts, and can be gamed by moving
content into a fenced block.

```rust
fn word_count(contents: &str) -> u64 {
    contents.split_whitespace().count() as u64
}
```

The counter must be byte-safe for non-ASCII content (Arabic, Indonesian) — `split_whitespace`
operates on `char` boundaries and satisfies this without extra handling.

### 1.3 Configuration

`repo-config.yml` gains a `governance-word-budget:` block and loses `instruction-size:`.

```yaml
governance-word-budget:
  surfaces:
    - glob: "repo-governance/**/*.md"
      target: 400
      warn: 500
      fail: 500
    - glob: ".claude/**/*.md"
      target: 400
      warn: 500
      fail: 500
    # ... .cursor, .codex, .opencode, .pi, .amazonq
    - glob: "AGENTS.md"
      target: 400
      warn: 500
      fail: 500
    - glob: "CLAUDE.md"
      target: 400
      warn: 500
      fail: 500
    - glob: "**/README.md"
      target: 700
      warn: 900
      fail: 900
  resolved-tree:
    root: "CLAUDE.md"
    target: 1200
    warn: 1500
    fail: 1500
```

**Schema constraints** (enforced by the existing `repo-config-schema` gate):

- No `exempt`, `allow`, `ignore`, `waiver`, or `override` key is permitted anywhere in the
  block. The schema must reject them explicitly so a future contributor cannot quietly add one.
- `warn` and `fail` are equal on every surface. The three-tier machinery is retained so the
  `Warn` band is expressible, but `Warn` here means `target < words ≤ fail`. A file at 450
  words warns; a file at 501 fails.
- Later globs win on overlap: when a file matches more than one surface,
  `word_budget.rs`'s ported `check_instruction_sizes` first determines, per matched path, the
  **last-declared matching surface**, then calls `classify()` exactly once for that path using
  only that surface's own `target`/`warn`/`fail` — an earlier-declared surface matching the same
  path is never classified at all, so it can never contribute a finding, regardless of whether
  the winning surface's own verdict is `Ok`, `Warn`, or `Fail`. This is new per-path
  select-then-classify logic added during the port (see §1.1 above and `delivery.md` Phase
  1a/1b), not merely a YAML-ordering convention, and not a "compare the more severe of two
  candidate findings" step — the latter shape silently fails whenever the winning surface's own
  verdict is `Ok`, because an `Ok` verdict produces no candidate to compare. Declaration order in
  this block is therefore load-bearing: a more specific glob (for example `**/README.md`) must be
  declared **after** the general one it overlaps.

### 1.4 Naming map

| Artifact       | Before                                                  | After                                             |
| -------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Command        | `rhino-cli harness instruction-size validate`           | `rhino-cli governance word-budget validate`       |
| Module         | `application/repo_governance/instruction_size.rs`       | `application/governance/word_budget.rs`           |
| Command file   | `commands/harness_validate_instruction_size.rs`         | `commands/governance_validate_word_budget.rs`     |
| Config block   | `instruction-size:`                                     | `governance-word-budget:`                         |
| Gate id        | `instruction-size`                                      | `governance-word-budget`                          |
| Nx target      | `rhino-cli:instruction-size:validation`                 | `rhino-cli:governance-word-budget:validation`     |
| Convention doc | `conventions/structure/instruction-file-size-budget.md` | `conventions/structure/governance-word-budget.md` |
| Audit category | `instruction-size` (category 4)                         | `governance-word-budget`                          |

**Command file merge note** [Repo-grounded, verified by reading both files]:
`commands/harness_validate_instruction_size.rs` is a thin wrapper — its doc comment states it
delegates to `convention_validate_instruction_size::run_for_root`, and its `run()` body is a
single delegating call. The real implementation (the `SCHEMA` const, `run_for_root`, finding
construction, and all text/JSON/markdown formatters) lives in the separate, pre-existing
`commands/convention_validate_instruction_size.rs`, whose module is used nowhere else in the
codebase (`grep -rn convention_validate_instruction_size apps/rhino-cli/src` shows only the
`commands.rs` mod declaration and this one wrapper's `use`). The "Command file" row above is
therefore a **two-source merge, not a single rename**: both
`harness_validate_instruction_size.rs` and `convention_validate_instruction_size.rs` are deleted,
and `commands/governance_validate_word_budget.rs` is created as their merged replacement —
`convention_validate_instruction_size.rs`'s body becomes the new file's implementation, and
`harness_validate_instruction_size.rs`'s CLI-arg-parsing entry point (`ValidateInstructionSizeArgs`
→ renamed args struct, `run()`) is folded in directly, removing the delegation indirection. See
the File-Impact Analysis tree below and §6's Migration and Removal Map for the full destination
statement.

A second command, `rhino-cli governance readme-index validate`, is a **rename-and-extend**, not
a new command from scratch — see §1.1 above and §4 below for the full decision record. It splits
across two gate ids: `governance-readme-index` (continuity-preserving rename of the already-armed
`md-readme-index`) and `governance-readme-completeness` (new capabilities, dark-launched).

| Artifact (readme-index) | Before                                              | After                                                                                   |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Command                 | `rhino-cli md readme-index validate`                | `rhino-cli governance readme-index validate`                                            |
| Module                  | `application/repo_governance/readme_index_audit.rs` | `application/governance/readme_index.rs`                                                |
| Command file            | `commands/md_validate_readme_index.rs`              | `commands/governance_validate_readme_index.rs`                                          |
| Gate id                 | `md-readme-index`                                   | `governance-readme-index` (unchanged behavior) + `governance-readme-completeness` (new) |

### 1.5 Enforcement points

Three enforcement points — declared in the `gates:` registry in `repo-config.yml`, never
hand-written into `.husky/` hooks, which are registry shims:

| Gate                             | Pre-push                                                          | CI                              | Audit category |
| -------------------------------- | ----------------------------------------------------------------- | ------------------------------- | -------------- |
| `governance-word-budget`         | `path-gated`, 10 triggers                                         | `path-gated`, same 10 triggers  | yes            |
| `governance-readme-index`        | `all-file-type` (unconditional, unchanged from `md-readme-index`) | `all-file-type` (unconditional) | no             |
| `governance-readme-completeness` | `path-gated`, 7 triggers                                          | `path-gated`, same 7 triggers   | no             |

Trigger lists are in `prd.md` §FR-1.10 and §FR-1.11. None of the three declares a `pre-commit`
surface — a whole-tree scan on every commit adds cost without adding coverage.

**`path-gated` on `ci` is already supported**, verified by reading the runner rather than
assumed. Three facts settle it:

- `commands/gate/run.rs::candidate_scope` maps `ScopeKind::PathGated → CandidateScope::PathTriggers`
  with no surface condition.
- `candidate_paths` computes changed paths whenever any selected gate resolves to
  `StagedFiles` **or** `PathTriggers`, so `changed_paths` is `Some(..)` on CI — important,
  because the skip predicate treats `None` as "no match" and would otherwise skip silently.
- `changed_paths` handles `GateSurface::Ci` explicitly: `RHINO_GATE_CHANGED_BASE` when set,
  otherwise `git merge-base origin/main HEAD`.

[Repo-grounded, verified via `grep -c "scope: path-gated"` and surface inspection] Today there
are six `path-gated` declarations in `repo-config.yml` and **all six are on `pre-push`** — these
gates are the first to use it on `ci`. Phase 1 proves it with a live run rather than trusting the
code read.

`repo_config_validate.rs` already enforces the schema invariants both ways: `trigger` is
rejected on a non-`path-gated` scope, and a `path-gated` scope with an empty `trigger` list is
rejected.

Verify wiring with `apps/rhino-cli/scripts/rhino-bin.sh gate validate`, never by reading the
hook files.

---

## File-Impact Analysis

[Repo-grounded] Root-relative tree of concrete, enumerable targets this plan touches directly,
plus bounded glob patterns for the bulk content splits. Counts are re-derived from the current
commit (2026-08-13); the private sibling paths are a byte-for-byte mirror of the `ose-public` rhino-cli
boundary, landed separately in Phase 10.

```text
apps/rhino-cli/src/
├── application/repo_governance/instruction_size.rs        [D] git mv -> governance/word_budget.rs (Phase 1)
├── application/governance/word_budget.rs                  [N] byte metric -> raw word metric (Phase 1)
├── application/repo_governance/readme_index_audit.rs      [D] git mv -> governance/readme_index.rs (Phase 1)
├── application/governance/readme_index.rs                 [N] git-mv destination of readme_index_audit.rs
│                                                                (orphan/ghost logic carried forward unchanged);
│                                                                extended with `missing` + `unannotated` finding
│                                                                kinds and a `generate` path — NOT built from
│                                                                scratch; see tech-docs.md §1.1/§4 (Phase 1)
├── application/docs/frontmatter.rs                        [E] add KIND_MISSING_WHEN_TO_USE at WARN
│                                                                (dark-launched; armed Phase 9/16) (Phase 1)
├── application/repo_governance/mod.rs                      [E] remove `pub mod instruction_size;` —
│                                                                module moves to a new parent (Phase 1)
├── application/repo_governance/audit_orchestrator.rs       [E] rename "instruction-size" category name,
│                                                                command mapping, match arm, and 5 unit
│                                                                test assertions to "governance-word-budget"
│                                                                (Phase 1)
├── application/repo_config/mod.rs                          [E] rename the `#[serde(rename =
│                                                                "instruction-size")] instruction_size:
│                                                                Option<BudgetConfig>` struct field to
│                                                                `governance-word-budget`; repoint its
│                                                                `use` of `BudgetConfig` (Phase 1)
├── application/mod.rs                                      [E] add `pub mod governance;` — the
│                                                                `application/governance/` directory does
│                                                                not exist yet (Phase 1)
├── commands/harness_validate_instruction_size.rs           [D] merged into governance_validate_word_budget.rs
│                                                                (Phase 1)
├── commands/convention_validate_instruction_size.rs         [D] merged into governance_validate_word_budget.rs —
│                                                                this file (not the thin harness_validate_instruction_size.rs
│                                                                wrapper) holds the real implementation (SCHEMA, run_for_root,
│                                                                formatters); it becomes the new file's body (Phase 1)
├── commands/governance_validate_word_budget.rs              [N] merged command file: absorbs
│                                                                convention_validate_instruction_size.rs's implementation
│                                                                plus harness_validate_instruction_size.rs's CLI arg-parsing
│                                                                entry point; the delegation wrapper is removed (Phase 1)
├── commands/md_validate_readme_index.rs                     [D] git mv -> governance_validate_readme_index.rs
│                                                                (Phase 1)
├── commands/governance_validate_readme_index.rs             [N] git-mv destination of
│                                                                md_validate_readme_index.rs; add `missing` +
│                                                                `unannotated` finding kinds and a `generate`
│                                                                verb (FR-3.12) (Phase 1)
├── commands/harness_audit.rs                                [E] rename the separate
│                                                                "validate-instruction-size" member, match
│                                                                arm, and unit test
│                                                                (`MEMBERS.contains(&"validate-instruction-size")`)
│                                                                (Phase 1)
├── commands.rs                                              [E] remove `pub mod
│                                                                convention_validate_instruction_size;` entirely
│                                                                (its file is merged away); rename `pub mod
│                                                                harness_validate_instruction_size;` to `pub mod
│                                                                governance_validate_word_budget;`; rename `pub mod
│                                                                md_validate_readme_index;` to `pub mod
│                                                                governance_validate_readme_index;` (Phase 1)
└── cli.rs                                                   [E] rewrite the `#[command(name =
                                                                 "instruction-size", subcommand)]` tree and
                                                                 dispatch; rewrite the 2 unit tests asserting
                                                                 the OLD command structure —
                                                                 `verb_last_harness_instruction_size_validate_parses`,
                                                                 `verb_middle_convention_validate_instruction_size_no_longer_parses`;
                                                                 remove `ReadmeIndex(MdReadmeIndexCommands)` from
                                                                 `MdCommands` and add it under a new
                                                                 `#[command(name = "governance", subcommand)]`
                                                                 tree alongside `word-budget` (Phase 1)

apps/rhino-cli/project.json                                 [E] add governance-word-budget + governance-readme-index Nx targets (Phase 1)
apps/rhino-cli/tests/golden-master/*instruction-size*        [D] 12 fixtures deleted, regenerated under new gate ids (Phase 1)
apps/rhino-cli/tests/golden-master/*readme-index*            [D] 9 fixtures (`md-readme-index*`,
                                                                   `md-validate-readme-index*` —
                                                                   `.exit`/`.stderr`/`.stdout` triples) deleted,
                                                                   regenerated under `governance-readme-index`
                                                                   naming (Phase 1)
apps/rhino-cli/tests/golden-master/{harness-help,convention-validate,
  harness-validate}.stderr, manifest.json                    [E] content references "instruction-size"
                                                                   without being named for it; regenerated
                                                                   once the command is renamed (Phase 1)

specs/apps/rhino/behavior/rhino-cli/gherkin/
├── harness/repo-governance-instruction-size.feature          [D] git mv -> governance/ (Phase 1)
├── harness/repo-governance-instruction-size-governance.feature [E] rewritten in place — 3
│                                                               scenarios reference the deterministic
│                                                               "instruction-size" gate name, the
│                                                               Step 0.5 preflight category, and the
│                                                               skip-set category by name; all 3
│                                                               rewritten to "governance-word-budget"
│                                                               (Phase 1)
├── harness/repo-governance-instruction-size-pre-push.feature [E] rewritten in place — scenarios
│                                                               assert "the instruction-size gate
│                                                               runs" / "the instruction-size
│                                                               validation target" by name; both
│                                                               rewritten to the renamed gate/Nx
│                                                               target (Phase 1)
├── harness/repo-governance-agents-md-size.feature            [E] rewritten for word metric (Phase 1)
└── governance/*.feature                                      [N] new word-budget + readme-index scenarios (Phase 1)

repo-config.yml                                               [E] instruction-size: removed; governance-word-budget: added,
                                                                    unarmed at registration (Phase 1), armed (Phase 9);
                                                                    md-readme-index: renamed in place to
                                                                    governance-readme-index, scope/surfaces unchanged,
                                                                    continuously armed (Phase 1 — no gap);
                                                                    governance-readme-completeness: added, unarmed at
                                                                    registration (Phase 1), armed (Phase 9)

repo-governance/conventions/structure/
├── instruction-file-size-budget.md                            [D] git mv -> governance-word-budget.md (Phase 1)
└── governance-word-budget.md                                  [N] renamed, rewritten, split to fit its own ceiling (Phase 1)

<inbound links to the renamed convention doc>                  [E] discovered via
    `grep -rl "instruction-size\|instruction-file-size-budget" repo-governance .claude docs AGENTS.md`
    at Phase-1 execution time — never a hardcoded file list (see §6 below and Finding 4 of the
    2026-08-13 plan audit)

<specs/ scenario files referencing the old gate name>          [E] discovered separately via
    `grep -rl "instruction-size" specs` at Phase-1 execution time (a distinct sweep from the
    inbound-link grep above — it targets Gherkin scenario/README text naming the gate, not markdown
    links to the convention doc, and is intentionally not merged into that grep's file count). As
    of 2026-08-13 this returns 9 files: the 3 `harness/repo-governance-instruction-size*.feature`
    files and 1 `harness/repo-governance-agents-md-size.feature` file already tracked above, plus 5
    not otherwise tracked in this tree — 3 index READMEs (`gherkin/README.md`,
    `gherkin/harness/README.md`, `gherkin/repo-governance/README.md`) and 2 unrelated-domain feature
    files that name the old command in passing (`gherkin/specs/harness-registry-driven.feature`,
    `gherkin/specs/harness-bindings.feature`) — never a hardcoded list; rewrite whatever the live
    grep returns (Finding 1 of the 2026-08-13 plan audit)

repo-governance/**/*.md                                        [E] [G] 188 files over 500 words in
    `ose-public` (Phases 2–5) — the `repo-governance/`-only slice of the 298 combined
    `repo-governance/` + `.claude/` "source (non-generated)" total in `README.md` §Context
    (`.claude/`'s 110 are handled separately below); each becomes an index parent + capped
    sibling directory, gains `when_to_use` frontmatter, and a README index entry
.claude/agents/**/*.md                                          [E] [G] 78 of 94 files over 500 words;
    migrated to a ≤500-word charter + `.claude/skills/<name>/reference/*.md` (Phase 6)
.claude/skills/**/SKILL.md                                      [E] [G] 29 of 32 files over 500 words,
    split into `SKILL.md` + `reference/NN-*.md` (Phase 7)
.opencode/, .cursor/, .amazonq/                                 [G] regenerated via
    `npm run generate:bindings` after every `.claude/` edit — never hand-edited (Phases 1, 6–8)
AGENTS.md                                                        [E] rewritten as a directive index,
    3,001 → ≤500 words (Phase 8)
CLAUDE.md                                                         [E] rewritten, 907 → ≤500 words (Phase 8)
repo-governance/README.md + every top-level index                [E] updated to reflect splits (Phase 8)

<private-sibling>/ (mirrored root; Phases 10–16)
├── apps/rhino-cli/                                             [E] byte-for-byte copy of the ose-public
│                                                                     rhino-cli boundary (Phase 10)
├── repo-config.yml                                              [E] equivalent changes, adjusted for
│                                                                     private's surfaces — no `.pi/`,
│                                                                     one `.amazonq/` file (Phase 10)
├── repo-governance/conventions/structure/instruction-file-size-budget.md [D] git mv + rewrite (Phase 10)
├── repo-governance/**/*.md                                       [E] [G] 176 files over 500 words split
│                                                                     (Phases 11–13) — the
│                                                                     `repo-governance/`-only slice of the
│                                                                     247 combined `repo-governance/` +
│                                                                     `.claude/` "source (non-generated)"
│                                                                     total in `README.md` §Context
│                                                                     (`.claude/`'s 71 handled in Phase 14)
├── .claude/agents/**/*.md, .claude/skills/**/SKILL.md            [E] [G] split + migrate (Phase 14)
└── AGENTS.md, CLAUDE.md, mirrors                                 [E] [G] rewritten (Phase 15)

plans/backlog/<ose-primer-sync-slug>/                             [N] follow-up plan: rhino-cli boundary
                                                                        sync + content parity for
                                                                        `ose-primer` (Phase 17)
plans/done/YYYY-MM-DD__optimize-governance-md/                     [N] this plan folder, archived
                                                                        (Phase 17)
```

`[E]` edited, `[N]` new, `[D]` deleted (git mv counts as delete-plus-new at its old path), `[G]`
generated (never hand-edited; regenerated).

### More Detail

The full per-artifact action table, cross-repo parity mechanics, and rollback positions live in
§6 "Migration and Removal Map" below — this tree is the scannable index; §6 is the narrative.
The inbound-link count is deliberately not restated as a number here: see §6 and Finding 4 of the
2026-08-13 audit for why a hardcoded count drifted from the live repo state.

---

## 2. Split Pattern

### 2.1 Shape

A file `X.md` over the ceiling becomes an index parent plus a sibling directory:

```text
repo-governance/development/agents/
  ai-agents.md              <= 500 words — index, links every child
  ai-agents/
    01-agent-catalog.md     <= 500 words
    02-naming.md            <= 500 words
    ...
```

**Why the parent keeps its path**: `ai-agents.md` is linked from `AGENTS.md` and from many
governance documents. `rhino-cli md links validate` gates every one of them. Moving the parent
to `ai-agents/README.md` would break all inbound links; keeping it preserves them at zero cost.

**Consequence for FR-3**: `ai-agents/` is a _split directory_ — it has a sibling file named
`ai-agents.md` — and is therefore exempt from the README-index rule. The parent is the index.
This exemption is **structural and machine-decidable**: `is_split_dir(X) := exists(X + ".md")`.
It is not a waiver list.

### 2.2 Child naming and ordering

- Kebab-case, `NN-` numeric prefix for reading order: `01-agent-catalog.md`
- The prefix defines narrative sequence, not category — no lookup table to memorize, per the
  [File Naming Convention](../../../repo-governance/conventions/structure/file-naming.md)
- Each child is self-contained: a complete section, never a mid-sentence continuation
- Each child carries full frontmatter, including `when_to_use` (FR-4)

### 2.3 Heading hierarchy

`rhino-cli md heading-hierarchy validate` requires a single `H1` and correct nesting. Each
child therefore gets its own `H1` matching its title; the parent's `H2` sections become child
`H1`s, and their `H3`s promote to `H2`. Promotion is mechanical but must be applied — a child
that keeps `H2` as its top heading fails the gate.

### 2.4 Content integrity

The split relocates content. It does not rewrite rules. A phase is not complete unless:

- every rule present before the split is present after it, verbatim or with only heading-level
  changes
- every inbound link still resolves (`md links validate` exits 0)
- the parent index links every child (FR-3.6)

---

## 3. Agent-to-Skill Migration

### 3.1 The constraint

A `.claude/agents/<name>.md` body **becomes the subagent's system prompt verbatim**.
[Web-cited, accessed 2026-08-13, `https://code.claude.com/docs/en/sub-agents`]: "The frontmatter
defines the subagent's metadata and configuration. The body becomes the system prompt that
guides the subagent's behavior. Subagents receive only this system prompt plus basic environment
details like the working directory, not the full Claude Code system prompt."

There is no `@`-import resolution inside an agent body. Splitting an agent into linked modules
does not make the harness load them — the agent must `Read` them at runtime. Content moved out
of the body is content the agent will not have unless it is instructed to fetch it.

### 3.2 Target shape

```text
.claude/agents/plan-checker.md          <= 500 words
  frontmatter: name, description, tools, model, color
  body: charter, non-negotiables, and a MANDATORY read directive

.claude/skills/plan-checking/
  SKILL.md                              <= 500 words — procedure skeleton
  reference/
    01-requirements-completeness.md     <= 500 words
    02-delivery-executability.md        <= 500 words
    ...
```

### 3.3 The mandatory read directive

Every migrated agent body ends with an unconditional instruction — not a suggestion, not
conditional on task type:

```markdown
## Required Reading

Before taking any action, read every file in
`.claude/skills/plan-checking/reference/`. These modules carry rules this
charter does not restate. Do not begin work until you have read them.
```

### 3.4 Verification

Phase 6 does not merge on a green gate alone. For each migrated agent, invoke it on a real
task and confirm it reads its reference modules and applies at least one rule that lives only
in a module. An agent that passes the word budget but silently lost its rules is a regression,
not a delivery.

### 3.5 Binding regeneration

`.claude/agents/` is the only hand-authored surface. After every agent edit:

```bash
npm run generate:bindings
npm run validate:sync
```

The regenerated `.opencode/`, `.cursor/`, and `.amazonq/` mirrors go on the file-touch ledger
and land in the **same commit** as their `.claude/` source. Never a follow-up sync commit,
never a hand-edit.

Because mirrors are gated (FR-1.4), a mirror over the ceiling means either the source is too
large or the generator adds too much boilerplate. Both fixes are upstream of the mirror.

---

## 4. README Index Gate

This gate is a **rename-and-extend** of the pre-existing, already-armed `md readme-index
validate` command (gate id `md-readme-index`) — see §1.1 above for the full repurpose-vs-rebuild
decision record. It splits into two `repo-config.yml` registrations sharing one implementation
(`application/governance/readme_index.rs`, `commands/governance_validate_readme_index.rs`):

| Gate id                          | Finding kinds            | Scope                                                                                                                                               | Arming                                                                                |
| -------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `governance-readme-index`        | `orphan`, `ghost`        | `all-file-type`, current `DEFAULT_PATHS` (4 entries, unwidened)                                                                                     | Continuously armed — renamed in place at Phase 1, no gap                              |
| `governance-readme-completeness` | `missing`, `unannotated` | `path-gated`, FR-1.11's 5-entry trigger list, FR-3.7's 4-entry covered-tree scope (narrowed from an originally-wider 6-entry design at arming time) | Dark-launched Phase 1 → armed Phase 9 (`ose-public`) / Phase 16 (the private sibling) |

**The mechanism** [Repo-grounded — `apps/rhino-cli/src/application/repo_config/mod.rs::fixed_arguments`]:
one binary, two `repo-config.yml` registrations, differentiated entirely by each entry's `args:`
block — the same pattern `md-mermaid` and `md-links` already use for `args: { exclude: [...] }}`
(`repo-config.yml:743`, `:914`). `fixed_arguments()` turns every `args:` key into repeated
`--<key> <value>` flags, so two new repeatable flags on `ReadmeIndexAuditArgs` carry the split:

- **`--paths <path>`** overrides `DEFAULT_PATHS` for this invocation.
  `governance-readme-index` passes none, so it keeps scanning the original, unwidened 4-entry
  list unchanged. `governance-readme-completeness` passes FR-3.7's scope (the narrowed 4-entry
  list as of Phase 9/16 — see `prd.md` FR-3.7).
- **`--fail-kinds <kind>`** restricts which discovered finding kinds contribute to the nonzero
  exit code; every kind is still discovered and printed regardless. `governance-readme-index`
  sets `orphan`/`ghost` only, so a `missing`/`unannotated` finding surfacing inside its unchanged
  scope (`repo-governance/` is inside both gates' scope) is reported but never fails the build —
  this is how FR-3.19's continuity guarantee survives the two scopes overlapping.
  `governance-readme-completeness` sets `missing`/`unannotated` only.

See `prd.md` FR-1.10/FR-1.11 for the full `args:` YAML for both registrations and FR-5.8 for the
requirement statement.

### 4.1 Entry format

Each index entry is a Markdown list item with a link and an annotation:

```markdown
- [Governance Conventions](conventions/README.md) — shared standards for repository
  content and practices. Use them when creating or reviewing work covered by a convention.
```

Formally: `- [<title>](<path>) — <description> <when_to_use>`

### 4.2 Derivation

The annotation is **derived from the target file's frontmatter**, not hand-written:

| Entry part      | Source                                 |
| --------------- | -------------------------------------- |
| `<title>`       | target's `title` frontmatter key       |
| `<path>`        | relative path from the index file      |
| `<description>` | target's `description` frontmatter key |
| `<when_to_use>` | target's `when_to_use` frontmatter key |

This makes indexes **generatable and drift-proof**: the gate reads the target's frontmatter and
asserts the index entry matches. `rhino-cli governance readme-index generate` writes them;
`validate` verifies them.

**Known gap**: FR-4 requires `when_to_use` on `repo-governance/**` only. Index entries in
`docs/`, `specs/`, `plans/`, and `.claude/` therefore have no `when_to_use` to derive from.
Resolution: for targets outside `repo-governance/`, the gate requires the `— <description>`
half and treats the when-to-use half as optional until those trees adopt the key. This is
recorded as a deliberate, documented asymmetry, not an oversight.

### 4.3 Traversal rule

For each covered directory `D`:

- **Applicability**: `D` needs an index if it contains at least one `*.md` other than
  `README.md`, or at least one immediate subdirectory containing a `README.md`
- **Exemption**: if a file `D + ".md"` exists beside `D`, then `D` is a split directory —
  its parent is the index and `D` needs no `README.md`
- **Required links**: every `*.md` directly in `D` except `README.md`, plus every immediate
  subdirectory's `README.md`
- **Not recursive**: an index never references a grandchild

**Finding kinds** — four total, split across the two gate ids in the table above:

- `orphan` **[existing]** — a sibling `.md` or subdirectory `README.md` exists on disk but is
  not linked from `D`'s `README.md`
- `ghost` **[existing]** — `D`'s `README.md` links a `.md` target that does not exist
- `missing` **[new]** — `D` satisfies the Applicability rule above but has no `README.md` at
  all; the existing implementation cannot detect this because it only audits READMEs that
  already exist
- `unannotated` **[new]** — a link exists and its target exists, but the entry lacks the
  derived-annotation format (§4.1/§4.2) or the annotation text has drifted from the target's
  frontmatter (FR-3.14)

### 4.4 Interaction with the word budget

[Repo-grounded, verified 2026-08-13] An annotated index costs roughly 25–35 words per entry.
Measured worst cases (entry counts are the indexable `*.md` files, excluding each directory's
own `README.md`):

| Directory                              | Entries | Estimated index size |
| -------------------------------------- | ------- | -------------------- |
| `.claude/agents/`                      | 94      | ~2,650 words         |
| `.opencode/agents/` (mirror)           | 94      | ~2,650 words         |
| `.cursor/agents/` (mirror)             | 94      | ~2,650 words         |
| `plans/done/`                          | 185     | ~5,200 words         |
| `repo-governance/development/quality/` | 23      | ~670 words           |

Every one of these exceeds the 500-word ceiling. The resolution is recorded in [prd.md](./prd.md)
§FR-3.15 — **both** mechanisms apply, and neither is an exemption: a dedicated `**/README.md`
glob threshold (700 target / 900 fail, the entry §1.3's config sample above declares last so it
wins on overlap per the "later globs win" rule) covers `repo-governance/development/quality/`
(~670 words, under the 900-word grouping trigger), and grouping into subfolders with per-group
indexes covers directories that still overflow the 900-word glob ceiling
(`.claude/agents/` at ~2,650 words — see §3 "Split Pattern" for the grouping mechanics; the
mirror trees and `plans/done/` are excluded from this gate entirely, FR-3.8/FR-3.17).

**Research status — RESOLVED 2026-08-13.** See `prd.md` §FR-3.16–FR-3.18 for the full
citations. Summary of what the harnesses actually do:

| Harness     | Subfolder discovery in its agent dir   | Effect on this plan                                              |
| ----------- | -------------------------------------- | ---------------------------------------------------------------- |
| Claude Code | **Yes** (documented)                   | `.claude/agents/` may be grouped; identity is frontmatter `name` |
| OpenCode    | **No** — declined "not planned"        | `.opencode/agents/` **must stay flat**; generator flattens       |
| Cursor      | **Undocumented**                       | Treated as flat until a smoke test proves otherwise              |
| Amazon Q    | N/A — JSON bridge, not an agent mirror | Unaffected                                                       |
| Codex       | N/A — agents live in `config.toml`     | Unaffected                                                       |

Two consequences the design must carry:

1. **`harness bindings generate` must flatten.** A grouped `.claude/agents/checkers/docs-checker.md`
   still emits `.opencode/agents/docs-checker.md` and `.cursor/agents/docs-checker.md` at the
   top level, filename derived from the `name` frontmatter key. This is a rhino-cli behaviour
   change and lands in **Phase 1**, before Phase 6 groups the source. Grouping first would
   break OpenCode discovery for 94 agents between merges.
2. **Mirror trees are excluded from the README-index gate** (FR-3.17) but stay inside the word
   budget. A 94-entry annotated index cannot fit any defensible ceiling, and nobody navigates a
   generated tree by README. If a mirror `README.md` is emitted at all, it is a pointer to the
   `.claude/` source index.

Skills are architecturally safer than agents here: OpenCode reads
`.claude/skills/<name>/SKILL.md` natively, and `reference/*.md` modules are fetched on demand by
the agent's own file tools rather than by any directory-scanning logic — so nested `reference/`
folders are not exposed to the recursion question at all.

---

## 5. Frontmatter Extension

`when_to_use` is added to the existing schema in
`apps/rhino-cli/src/application/docs/frontmatter.rs`, which already defines
`KIND_MISSING_TITLE`, `KIND_MISSING_DESCRIPTION`, `KIND_MISSING_CATEGORY`,
`KIND_MISSING_SUBCATEGORY`, and `KIND_MISSING_TAGS`. A new `KIND_MISSING_WHEN_TO_USE` follows
the same pattern and reports through the same gate (`md-frontmatter`).

The requirement is scoped to `repo-governance/**/*.md`. `docs/` retains the lighter schema
described in that module's header comment.

**Description severity correction** [Repo-grounded —
`validate_governance_schema`/`validate_software_schema`]: `validate_governance_schema` today
builds its `description` finding via a plain `SEVERITY_WARN` construction, not `mk_fail()` —
missing `description` on a governance doc is a WARN, not a FAIL. This is inconsistent with the
new `when_to_use` requirement being FAIL from day one, so `description`'s construction in
`validate_governance_schema` is changed to `mk_fail()` alongside it, scoped to
`GOVERNANCE_DOC_PREFIXES` only. `title` is unaffected (already `mk_fail()`).
`validate_software_schema` is untouched — it already builds `description` via `mk_fail()`, so
software-engineering docs see no severity change. See `prd.md` FR-4.2/FR-4.8 and "Description
severity correction" for the full decision record.

**Dark-launch sequencing (register-then-arm)** [Repo-grounded — `repo-config.yml:774-781` scopes
`md-frontmatter`'s `ci` surface as `{ scope: all-file-type }`, resolved by
`ScopeKind::AllFileType => CandidateScope::TrackedFiles` in
`apps/rhino-cli/src/commands/gate/run.rs:441`]: this gate scans every tracked `.md` file on
every CI run, unconditionally, unlike the two brand-new `governance-word-budget`/
`governance-readme-index` gates that Phase 1 registers in `gates:` without arming (an
unregistered gate id runs nowhere, so "register but don't arm" is free for a new gate). Because
`md-frontmatter` is already armed and already running repo-wide, FR-4's two FAIL-severity checks
cannot land as FAIL in the same PR that adds them — doing so would fail CI for every contributor
the moment PR1 merges, since 0/214 `repo-governance/**/*.md` files currently carry `when_to_use`
and the backfill only completes across Phases 2–5 (`ose-public`) / 11–13 (the private sibling).

FR-4 therefore follows the same register-then-arm shape as FR-1/FR-3, adapted to an
already-active gate:

1. **Phase 1 (register)**: `KIND_MISSING_WHEN_TO_USE` lands using the same `SEVERITY_WARN`
   construction `description` already uses — the check exists, is tested, and reports, but does
   not fail the gate. `description`'s construction is left unchanged (it is already
   `SEVERITY_WARN`; FR-4.2's `mk_fail()` upgrade is deferred, not implemented, in Phase 1).
2. **Phase 9 / Phase 16 (arm)**: after confirming via a `md frontmatter validate` run that every
   file in the repo's covered surface already carries both `when_to_use` and `description`, both
   `KIND_MISSING_WHEN_TO_USE` and `description`'s finding in `validate_governance_schema` are
   switched to `mk_fail()` in the same commit — mirroring Phase 9/16's existing "arm the gates"
   GREEN step for `governance-word-budget`/`governance-readme-index` exactly.

This keeps NFR-5 ("No commit in the plan leaves `main` with a red gate in either repo") satisfied
for `md-frontmatter`, the same way Phase 1's "register, but do not arm" step already satisfies it
for the two brand-new gates. See `prd.md` §FR-4 "Dark-launch sequencing" for the requirement-level
record.

**Content rule**: `when_to_use` states a trigger, not a summary. `"Use when adding or editing
any Markdown link."` is correct; `"About markdown linking."` is a restatement of `description`
and fails review even though it passes the gate.

**Budget interaction** [Judgment call — the 20–30-word-per-file estimate is not independently
measured]: two frontmatter lines cost roughly 20–30 words per file across the 214
`repo-governance/**/*.md` files [Repo-grounded, matches the frontmatter census in `brd.md`]. This
is counted, not exempted, and is accounted for when sizing splits.

---

## 6. Migration and Removal Map

Everything removed in Phase 1, per repo:

| Artifact                                                                        | Action                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/application/repo_governance/instruction_size.rs`                           | `git mv` + rewrite metric                                                                                                                                                                                        |
| `src/commands/harness_validate_instruction_size.rs`                             | deleted; merged into `commands/governance_validate_word_budget.rs` (new)                                                                                                                                         |
| `src/commands/convention_validate_instruction_size.rs`                          | deleted; its implementation body becomes `commands/governance_validate_word_budget.rs` (new)                                                                                                                     |
| `instruction-size:` block in `repo-config.yml`                                  | delete                                                                                                                                                                                                           |
| `instruction-size` entry in `gates:`                                            | replace                                                                                                                                                                                                          |
| 12 `tests/golden-master/*instruction-size*` fixtures                            | delete, regenerate under new id                                                                                                                                                                                  |
| `specs/.../gherkin/harness/repo-governance-instruction-size.feature`            | `git mv` + rewrite                                                                                                                                                                                               |
| `specs/.../gherkin/harness/repo-governance-instruction-size-governance.feature` | rewrite in place — 3 scenarios asserting the "instruction-size" gate name/category/skip-set by name, renamed to `governance-word-budget`                                                                         |
| `specs/.../gherkin/harness/repo-governance-instruction-size-pre-push.feature`   | rewrite in place — 2 scenarios asserting the "instruction-size gate"/validation target by name, renamed to the new gate/Nx target                                                                                |
| `specs/.../gherkin/harness/repo-governance-agents-md-size.feature`              | rewrite for words                                                                                                                                                                                                |
| `conventions/structure/instruction-file-size-budget.md`                         | `git mv` + rewrite                                                                                                                                                                                               |
| Every inbound link to the old convention path                                   | rewrite — discovered live, not a hardcoded list (below)                                                                                                                                                          |
| `src/application/repo_governance/readme_index_audit.rs`                         | `git mv` -> `application/governance/readme_index.rs`; extend with `missing`/`unannotated` + `generate`                                                                                                           |
| `src/commands/md_validate_readme_index.rs`                                      | `git mv` -> `commands/governance_validate_readme_index.rs`                                                                                                                                                       |
| `md-readme-index` entry in `gates:`                                             | **renamed in place** to `governance-readme-index` — never deleted-then-re-added; scope/surfaces unchanged (FR-3.19); `governance-readme-completeness` is a **new**, additional entry for `missing`/`unannotated` |
| 9 `tests/golden-master/*readme-index*` fixtures                                 | delete, regenerate under `governance-readme-index` naming                                                                                                                                                        |
| `cli.rs`'s `MdCommands::ReadmeIndex` variant                                    | removed from the `md` group; re-added under a new `governance` top-level command group                                                                                                                           |

[Repo-grounded, verified 2026-08-13] The inbound-link count is **not hardcoded** in this plan.
An earlier draft named 8 files; live verification found that list wrong in both directions — two
named files (`code.md`, `ci-conventions.md`) contain zero actual references, and two real
referrers (`docs/reference/rhino-cli-command-triage.md`, `docs/reference/sdlc-gate-standard.md`)
were omitted. The true count is 10 files, excluding the convention doc itself. Phase 1 discovers
the set live instead of trusting a list written into the plan text:

```bash
grep -rl "instruction-size\|instruction-file-size-budget" repo-governance .claude docs AGENTS.md
```

Rewrite whatever this command returns.

The renamed convention doc must itself satisfy the 500-word ceiling — it becomes an index
parent with a `governance-word-budget/` child directory. This is the plan's own dogfooding
check.

### 6.1 Cross-repo parity

`apps/rhino-cli/src`, `tests`, `Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`, and
`specs/apps/rhino/behavior/rhino-cli/gherkin` are byte-identical across repos. In the private sibling
the rhino-cli change is a **byte-for-byte copy** of the `ose-public` change, not a
reimplementation. After copying:

```bash
rhino-cli parity manifest generate
git add apps/rhino-cli/parity-manifest.sha256
rhino-cli parity manifest validate
```

The manifest must be staged before validation — `validate_at_root` compares the working-tree
manifest against the Git index and errors if they differ.

`ose-primer` is deliberately excluded. Its parity gate stays green because
`validate_at_root` only ever compares a repo against its own committed manifest; it never
fetches siblings. The debt is divergence, not breakage.

### 6.2 Rollback

Each PR is independently revertible.

- Reverting a content PR restores the pre-split files; the gate is not yet blocking during
  Phases 2–8, so nothing else breaks.
- Reverting the Phase 1 gate PR restores the byte budget wholesale.
- Reverting the Phase 9 flip PR disarms enforcement while leaving all split content in place —
  the safe partial-rollback position.

**Enforcement gap, stated plainly**: between Phase 1 (byte budget removed) and Phase 9 (word
budget wired as a blocking gate), **no per-file size gate is active**. This is accepted: the
word cap is strictly tighter than every byte threshold it replaces, so no file can pass Phase 9
while violating what the byte budget would have caught.

---

## 7. Verification Commands

```bash
# Word budget, both new gates
npx nx run rhino-cli:governance-word-budget:validation
npx nx run rhino-cli:governance-readme-index:validation

# Full markdown gate group
npm run lint:md
apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push

# Binding sync after any .claude/ edit
npm run generate:bindings && npm run validate:sync

# Cross-repo parity after any rhino-cli edit
rhino-cli parity manifest generate && git add apps/rhino-cli/parity-manifest.sha256
rhino-cli parity manifest validate

# Ad-hoc violation census (matches the gate's raw whole-file metric, full FR-1.3 covered surface
# — repo-governance/.claude/.cursor/.codex/.opencode/.pi/.amazonq plus root AGENTS.md/CLAUDE.md;
# this is the number the Phase 1/10 Gate acceptance criteria cite, not the narrower
# "source (non-generated)" repo-governance+.claude-only figure in README.md §Context)
{ find repo-governance .claude .cursor .codex .opencode .pi .amazonq -name '*.md' -type f \
    -print0; printf '%s\0' AGENTS.md CLAUDE.md; } \
  | xargs -0 wc -w | grep -v ' total$' | awk '$1 > 500' | sort -rn
```
