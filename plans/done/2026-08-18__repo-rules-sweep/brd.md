# 🧭 Business Requirements: Repo Rules Sweep

> **Workstream scope** — this document states the business case for **WS-A (ordinal filename
> prefixes)** only. WS-B (File Naming Convention rework) is declared in `README.md` and adds its own
> section here before it becomes executable.

## Business Goal

Stop paying maintenance cost for a filename convention that no longer carries the information it
appears to carry, and make the governance trees of both repositories say one thing about naming.

Numeric prefixes in `repo-governance/` encode a position in a document that word-budget sharding
dissolved. Every insert now forces a choice between renumbering a directory and lying about the
order — and the repository has already chosen "lie", twice, in two different ways. The rule that
governs these filenames states the opposite of what the tree does.

## Business Impact

**Pain points, each verifiable on demand:**

- **Insert cost is routed around, not paid.** Seven files carry a letter-suffix escape (`01b-`,
  `02a-`, `20b-`). Verify: `find . -name '*.md' | grep -E '/[0-9]{2}[a-z]-'`.
- **Ordinal drift is silent.** `repo-governance/conventions/tutorials/swe-by-example/` has 32
  numbered files with a maximum ordinal of 27; `development-environment-setup/` skips phase 5
  entirely. Nothing detects either.
- **Two numbering systems compete where order is real.** Every `workflows/**` directory whose shards
  are phases carries both a shard serial and a phase number, disagreeing.
- **The governing convention contradicts the governed tree.** `file-naming.md` claims "no prefixes …
  or hierarchical encoding" as its rationale, while 2092 of 2494 files under `repo-governance/`
  carry a prefix — and 1704 of 2131 in the private sibling.
- **Continuation shards are held together only by their numbers.** Files titled "rules 1-2", "rule
  3", "rules 4-5" are fragments of one topic whose only cohesion signal is the ordinal.
- **Two enforced filename rules check one token and nothing else.** `harness naming validate` accepts
  any agent filename ending in one of eight role words; `repo-governance workflows naming validate`
  accepts any workflow filename ending in one of five type words. Neither reads the file. Verify:
  both reject `.claude/agents/repo/repo-rules-frobnicator.md` while accepting a file whose body is
  empty.
- **Those rules obstruct rather than protect.** A genuinely new kind of agent or workflow cannot be
  committed until its role or type word is added to a closed vocabulary in `rhino-cli` source and
  the binary is rebuilt — a code change to name a document.

**Expected benefits:**

- A number in a filename can be trusted, because it will only appear where it is a real step number.
- Governance content is named for what it contains, so a reader landing mid-tree knows what they
  have without reconstructing a dissolved parent document.
- Both repositories' governance trees follow one rule, so cross-repo rule work stops needing a
  per-repo naming translation.
- Naming a new agent or workflow no longer requires a `rhino-cli` code change, so the enforcement
  surface shrinks to rules that catch real defects.

## Affected Roles

The maintainer wears four hats: **governance author** (writes the rule, reworks shard boundaries,
and retires two conventions), **Rust developer** (changes the `rhino-cli` index tooling and deletes
two commands with their shared modules), **rules-machinery owner**
(updates the `repo-rules-*` triad, their skills, and the quality-gate workflow), and **release
operator** (lands the matching sweep in the private sibling). The consuming agents are `repo-rules-maker` /
`repo-rules-checker` / `repo-rules-fixer`, `repo-workflow-maker`, `docs-file-manager`, and every
agent whose definition links a renamed path.

## Business-Level Success Metrics

1. **Observable fact** — after the sweep,
   `find repo-governance .claude -name '*.md' | grep -E '/[0-9]{2}-'` returns only files that are
   real steps in an ordered sequence, and every returned file's ordinal equals its own step number.
   Baseline: 2092 + 232 in `ose-public`, 1704 + 217 in the private sibling, essentially none of which
   qualify.
2. **Observable fact** — `find . -name '*.md' -not -path './node_modules/*' | grep -E '/[0-9]{2}[a-z]-'`
   returns zero matches in both repositories. Baseline: 7 in `ose-public`.
3. **Observable fact** — no basename anywhere under `repo-governance/` carries both a leading ordinal
   and a second `phase-<n>` or `step-<n>` token. Baseline: at least four directories do.
4. **Observable fact** — `file-naming.md` and the new ordinal-prefix convention state one reconciled
   rule, cross-linked; neither asserts a prohibition the other permits.
5. **Observable fact** — `rhino governance word-budget validate` and
   `rhino governance readme-index validate` both exit 0 after the sweep in both repositories, so no
   merged file busts the budget and no index lost a child.
6. **Observable fact** — every file returned by the filename-rule discovery sweep and classified
   `states-the-rule` carries a recorded disposition of `updated` or `no-change-needed`. Baseline:
   251 files match and none carries a verdict.
7. **Observable fact** — `grep -F 'harness naming validate' repo-config.yml` and
   `grep -F 'workflows naming validate' repo-config.yml` each return zero matches in both
   repositories, while `grep -F 'md naming validate' repo-config.yml` still returns one. Baseline:
   one match each for all three.
8. **Observable fact** — a probe agent file `.claude/agents/repo/repo-rules-frobnicator.md` passes
   `rhino gate run --surface=pre-push` in both repositories. Baseline: it fails on `role-suffix` in
   both.
9. **Observable fact** — deleting one `.opencode/agents/*.md` file makes `rhino harness bindings
validate` (already declared as `harness-bindings` in `repo-config.yml`) exit non-zero in both
   repositories, confirming mirror-drift coverage survives the withdrawal of `harness naming
validate` without a new gate. Baseline: true today — `harness-bindings` already exercises this
   check, independent of `harness naming validate`.
10. **Observable fact** — `grep -F 'plans/' repo-governance/conventions/structure/governance-word-budget.md`
    returns at least one match, and a 1200-word plan README produces no word-budget finding.
    Baseline: zero matches; the exclusion works but is undocumented.
11. **Judgment call** — we expect fewer "which shard does this belong in" round-trips when authoring
    governance content; no baseline round-trip count has been measured.

## Business-Scope Non-Goals

- **Not** a mechanized rule. No gate, no `rhino-cli` detector, no audit category, no exit code. The
  rule is prose, judged by `repo-rules-checker` as an AI-only category.
- **Not** a change to word-budget thresholds. The budget wins every collision; merged files that bust
  it are re-split on a topic seam.
- **Not** a change to `docs/`, `specs/`, `apps/`, or `plans/done/`.
- **Not** a rename of existing agents or workflows. `repo-rules-checker.md` and
  `pr-review-quality-gate.md` keep their names; WS-C withdraws the obligation, not the habit.
- **Not** a withdrawal of `md naming validate`. Lowercase-kebab-case stays gated; only the two
  suffix rules go.
- **Not** the WS-B file-naming rework, which is declared and deliberately unspecified.

## Business Risks and Mitigations

| Risk                                                                                                                                                                                            | Mitigation                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A single atomic PR of ~2092 renames plus editorial boundary rework is not reviewable as a whole.                                                                                                | Accepted deliberately at the maintainer's direction and recorded as a stated deviation in `tech-docs.md` §10, so `plan-checker` reads it as a decision rather than a defect. Mechanical correctness is carried by gates (`md links validate`, `readme-index validate`, `word-budget validate`, `validate:sync`) rather than by human diff-reading.                                                   |
| Boundary rework is editorial judgment across 176 directories and can silently change meaning.                                                                                                   | Rework is confined to merging or re-splitting existing text on topic seams; no rule text is rewritten. Any file whose content would change meaning is left split and merely renamed, with the decision recorded per directory.                                                                                                                                                                       |
| De-numbering reorders every generated index to alphabetical.                                                                                                                                    | The generator is changed first to be order-preserving, and a rename-aware `rewrite-paths` mode updates link targets without touching entry order. No rename happens before that lands.                                                                                                                                                                                                               |
| The two repositories fall out of step mid-sweep.                                                                                                                                                | The private sibling is swept in the same plan, with the `rhino-cli` change byte-identical and the `parity-manifest` gate as its acceptance check.                                                                                                                                                                                                                                                    |
| `harness naming validate`'s own mirror-drift check for `.opencode/` (and partially `.amazonq/`) looked like the only gated coverage, risking an undetected gap if deleted without verification. | Re-verified against the live gate registry: the already-declared `harness-bindings` gate independently runs `validate_sync` (`.opencode/`) and `validate_cursor_sync` (`.cursor/`) on `pre-push` and unconditionally in `ci`. Phase 3 proves this by deleting a mirror file in a scratch copy and confirming `harness bindings validate` fails, then passes after restore — no new gate is declared. |
| Withdrawing a rule leaves future readers unable to find the decision, only the absence.                                                                                                         | The withdrawal is recorded in `file-naming.md` naming both rules and the reason, and in this plan's Knowledge Capture.                                                                                                                                                                                                                                                                               |
| A prose-only rule decays exactly as `file-naming.md` did.                                                                                                                                       | `repo-rules-checker` carries it as an AI-only validation category and `repo-rules-fixer` carries a rename-and-relink recipe, so drift is surfaced by the same machinery as every other repo rule.                                                                                                                                                                                                    |
