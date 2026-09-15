# Optimize Governance Markdown

## Context

This repository's governance surfaces have grown without a size ceiling. [Repo-grounded,
measured 2026-08-13, reproduced by this plan's own audit] Measured across the source
(non-generated) governance Markdown in both repos:

| Repo                | Governance `.md` | Over 500 words | Excess words   |
| ------------------- | ---------------- | -------------- | -------------- |
| `ose-public`        | 347              | **298**        | ~594,000       |
| The private sibling | 287              | **247**        | ~523,000       |
| **Total**           | **634**          | **545**        | **~1,117,000** |

**This table is deliberately scoped to source (non-generated) content only** —
`repo-governance/` + `.claude/`, excluding the `.cursor`/`.opencode`/`.amazonq` generated mirrors
and root `AGENTS.md`/`CLAUDE.md`. It answers "how much is our own authored content," not "how
many files will the gate flag." The `governance-word-budget` gate's actual **covered surface**
is broader (see §Scope Boundaries below and `prd.md` FR-1.3) and its current live baseline is
**464** for `ose-public` and **349** for the private sibling [Repo-grounded, re-derived 2026-08-13 via
`tech-docs.md` §7's census script]. `delivery.md`'s Phase 1/10 Gate acceptance criteria cite
these full-surface numbers, not the 298/247 above.

[Repo-grounded, verified byte-for-byte via `wc -w`] The median governance file is **1,451
words** — roughly three times the ceiling this plan introduces. The largest are far worse:

| File                                                 | Words      |
| ---------------------------------------------------- | ---------- |
| `repo-governance/development/agents/ai-agents.md`    | **14,720** |
| `repo-governance/workflows/plan/plan-execution.md`   | **14,326** |
| `repo-governance/conventions/structure/plans.md`     | **13,241** |
| `repo-governance/conventions/formatting/diagrams.md` | **11,816** |
| `.claude/agents/plan-checker.md`                     | **11,773** |
| `AGENTS.md`                                          | 3,001      |
| `CLAUDE.md`                                          | 907        |

Size is not the only defect. Two adjacent gaps compound it:

- **Reachability** [Repo-grounded]: 721 Markdown-bearing directories in `ose-public` have no
  `README.md`. Splitting large files without an index rule would convert one unreadable file
  into thirty unreachable ones.
- **Retrieval** [Repo-grounded]: `repo-governance/**/*.md` carries `title`, `description`,
  `category`, `subcategory`, `tags`, `created` — but nothing telling an agent _when_ to open the
  file. 214/214 files have frontmatter, 187/214 carry `description`, **0** carry `when_to_use`.

## What This Plan Changes

Four changes, delivered together because each is load-bearing for the others.

### 1. A 500-word ceiling on governance Markdown

Every `.md` file under the governance surfaces gets a hard word ceiling. Over it, the sole
sanctioned remediation is
[Progressive Disclosure](../../../repo-governance/principles/content/progressive-disclosure.md):
split into an index parent plus capped children — never delete the rule, never dense-compress,
never move bytes into another auto-loaded file.

- **≤ 400 words** — OK
- **401–500 words** — warn (gate exits 0)
- **> 500 words** — fail (gate exits 1)

Counting is **raw whole-file word count**: YAML frontmatter, fenced code blocks, Mermaid
blocks, tables, and link URLs all count. No exemptions, no allowlist, no waiver mechanism.

**Size is new; reachability extends what's already live.** `governance-word-budget` has no
predecessor. `governance readme-index validate` is a **rename-and-extend** of the already-armed
`rhino-cli md readme-index validate` (gate id `md-readme-index`) — it already runs on every push
and PR today, detecting `orphan`/`ghost` findings. This plan renames it in place (no enforcement
gap) and adds two new finding kinds, `missing` and `unannotated`, via a second gate id that is
dark-launched like `governance-word-budget`. Three gate ids in total, one per enforcement
posture:

| Gate                             | Command                                      | Finding kinds            | Fires when                                                                                                                          |
| -------------------------------- | -------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `governance-word-budget`         | `rhino-cli governance word-budget validate`  | size                     | a governance surface, `AGENTS.md`, `CLAUDE.md`, or `repo-config.yml` changed — path-gated, dark-launched Phase 1 → armed Phase 9/16 |
| `governance-readme-index`        | `rhino-cli governance readme-index validate` | `orphan`, `ghost`        | unconditionally (`all-file-type`) — continuously armed since before this plan, renamed in place at Phase 1, no gap                  |
| `governance-readme-completeness` | `rhino-cli governance readme-index validate` | `missing`, `unannotated` | a covered tree (no mirrors, no `plans/`) or `repo-config.yml` changed — path-gated, dark-launched Phase 1 → armed Phase 9/16        |

`governance-readme-index` and `governance-readme-completeness` invoke the same binary; the split
exists so the already-working orphan/ghost check never regresses to path-gated (and briefly
weaker) coverage while the genuinely new checks go through the same safe dark-launch sequencing
FR-4's frontmatter change uses. See `prd.md` §FR-3 "Repurpose, do not rebuild" and `tech-docs.md`
§1.1/§4 for the full decision record.

### 2. The byte budget is replaced

`repo-governance/conventions/structure/instruction-file-size-budget.md` and the
`instruction-size:` block in `repo-config.yml` are **replaced**, not supplemented. The word
cap becomes the sole per-file size gate. The one thing a per-file cap cannot express — the
**resolved-tree** aggregate (`CLAUDE.md` plus its `@`-imports) — is **ported from bytes to
words** rather than dropped.

### 3. `README.md` must index its siblings (extends an already-live gate)

In the covered trees, a directory's `README.md` must link **every `*.md` directly beside it**
(excluding itself) **plus every immediate subdirectory's `README.md`**. This is the
machine-checkable reachability guarantee that makes change 1 safe: without it, ~1,800 new
child files become orphans. This is **not built from scratch** — `md readme-index validate`
already checks orphan/broken links today, unconditionally, on every push and PR; this plan
renames it to `governance readme-index validate` and adds the `missing`-README and
annotation-drift checks below as new, dark-launched capabilities.

Entries are **annotated, not bare links** — each carries a one-line summary and a trigger:

```markdown
- [Governance Conventions](conventions/README.md) — shared standards for repository content
  and practices. Use them when creating or reviewing work covered by a convention.
```

The annotation is **derived from the target file's own frontmatter** (`description` +
`when_to_use`, change 4), so indexes are machine-generatable and cannot drift from what they
describe. `rhino-cli governance readme-index generate` writes them; `validate` verifies them.

### 4. `when_to_use` frontmatter

Every `repo-governance/**/*.md` gains a required `when_to_use:` key — the retrieval trigger,
the same job `.claude/skills/*/SKILL.md` frontmatter already performs for skill auto-loading.
The 27 files missing `description:` are backfilled at the same time, and `description`'s
_severity_ is also upgraded from WARN to FAIL for governance docs (an earlier draft of this plan
assumed it already was FAIL; verified false against `frontmatter.rs`). Both severity flips land
dark-launched at WARN in Phase 1 and are armed to FAIL only in Phase 9/16, once the backfill is
complete — see `prd.md` §FR-4 "Dark-launch sequencing."

## Decisions and Rationale

Every decision below was resolved with the user before this plan was written — the "Choice"
column is [Judgment call] throughout (user-approved design preference, not a checkable fact);
the "Why" column's numeric callouts (545, 658/721, 87%) are [Repo-grounded], reproduced in the
census above and in `brd.md` §Success Metrics.

| Decision               | Choice                                                                                                                                                          | Why                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Word metric            | Raw whole-file count                                                                                                                                            | Ungameable; no arguing about what is "prose"                                                                                        |
| Thresholds             | 400 warn / 500 fail, zero exemptions                                                                                                                            | Matches the three-tier classification the repo already uses                                                                         |
| Remediation shape      | Full — all 545 files fixed in this plan, hard gate flipped last                                                                                                 | An allowlist deferred past a plan boundary becomes permanent                                                                        |
| vs. byte budget        | Word cap **replaces** it; resolved-tree ported to words                                                                                                         | Two overlapping size gates on the same files is worse than one                                                                      |
| Gate implementation    | Repurpose `instruction_size.rs` in place                                                                                                                        | Globbing, three-tier classification, reporting, and all four enforcement points already exist                                       |
| README-index gate      | Repurpose `readme_index_audit.rs`/`md_validate_readme_index.rs` in place; rename `md-readme-index` gate id to `governance-readme-index` with no enforcement gap | It already detects orphan/ghost links today, armed unconditionally; a from-scratch rebuild would leave two overlapping gates active |
| Command name           | `rhino-cli governance word-budget validate`                                                                                                                     | Scope is governance surfaces, not just harness instruction files                                                                    |
| Convention doc         | `git mv` to `governance-word-budget.md`, rewrite every inbound link (discovered live, not hardcoded — see `tech-docs.md` §6)                                    | Name must not lie about its unit or its scope                                                                                       |
| Split pattern          | Index parent + sibling directory (`X.md` + `X/NN-slug.md`)                                                                                                      | Preserves every existing inbound link to `X.md`; `md links validate` gates hundreds of them                                         |
| Agent bodies           | Bulk moves to `.claude/skills/<name>/reference/*.md`                                                                                                            | Agent `.md` bodies load **verbatim** — they are not `@`-import resolved                                                             |
| README index authority | Parent `X.md` is the index; split dirs exempt from the README rule                                                                                              | One list to maintain, not two kept in sync by a gate                                                                                |
| README rule scope      | Source governance surfaces + `docs/` + `specs/`                                                                                                                 | Excludes `apps/` (658 of 721 missing READMEs are content trees), `plans/`, and generated mirrors                                    |
| Frontmatter            | Add `when_to_use` only; keep `description`                                                                                                                      | `description` is already required and 87% populated — it _is_ the tldr                                                              |
| Repos                  | `ose-public` first, then the private sibling                                                                                                                    | Private never inherits a pattern that later changes under it                                                                        |
| `ose-primer`           | **Deferred**                                                                                                                                                    | See "Accepted divergence" below                                                                                                     |
| Concurrency            | N=3 background agents                                                                                                                                           | Repo default; the splits are judgment-heavy content work, not mechanical                                                            |

## Top Risks

### `AGENTS.md` at 500 words is a real behavioural change

[Repo-grounded — eight Tier-1 harnesses per `docs/reference/platform-bindings.md`] `AGENTS.md`
is 3,001 words and is read **natively** by Cursor, Windsurf, JetBrains Junie, GitHub Copilot,
OpenAI Codex CLI, Google Antigravity CLI, Pi, and OpenCode. At 500 words it becomes close to a
pure directive index. Harnesses that do not eagerly follow links will hold fewer rules in
context than they do today.

**Mitigation**: `AGENTS.md` is rewritten as a directive index whose opening instruction
requires reading the linked surfaces before acting, and the ported resolved-tree word budget
keeps the `CLAUDE.md` → `AGENTS.md` chain measurable. This risk is **accepted, not
eliminated**, and is called out here rather than buried.

### Agent quality may degrade before it improves

Moving `plan-checker.md` (11,773 words) into `.claude/skills/.../reference/*.md` converts
prompt content the harness loads for free into content the agent must `Read` at runtime.
Agents that fail to read their reference modules will behave as if the rules are gone.

**Mitigation**: every migrated agent keeps a mandatory, unconditional "read all reference
modules before acting" instruction in its ≤500-word charter, and Phase 6 verifies behaviour
on a real invocation before the PR merges.

### File-count explosion

~1,117,000 excess words become an estimated **1,400–2,200 new files** across both repos.
Every one is subject to Prettier, markdownlint, `md links validate`,
`md heading-hierarchy validate`, and `md frontmatter validate`. CI wall-clock on the markdown
gate group will grow measurably.

### Accepted divergence: `ose-primer`

`apps/rhino-cli` is byte-identical across `ose-public`, `ose-primer`, and the private sibling
(659 files pinned in `apps/rhino-cli/parity-manifest.sha256`). This plan changes rhino-cli in
two repos only.

**Verified consequence**: `parity manifest validate` reads _its own repo's_ committed manifest
against _its own repo's_ tracked boundary
(`apps/rhino-cli/src/application/parity.rs::validate_at_root`). It never fetches siblings.
**No gate turns red in any repo.** The real cost is silent divergence — `ose-primer`'s
rhino-cli forks from `ose-public`'s until a follow-up sync plan lands. Content parity
(`ose-public` ↔ `ose-primer`) likewise accrues a debt across `repo-governance/`.

This is a deliberate, user-approved deferral. A follow-up plan must close it.

### `plans/` considered and excluded from the README rule scope

`plans/` was considered for the README-index scope and excluded — see §Scope Boundaries below
and `brd.md` §Out of Scope for the final decision and rationale (184 of 195 `plans/done/**`
folders that would qualify under FR-3.1's own applicability rule — a sibling `*.md` besides
`README.md`, or a subdirectory containing a `README.md` — already carry a README; retrofitting
the remaining 11 archival folders was judged not worth the churn of editing completed plan
history for no reader). [Repo-grounded, verified 2026-08-13 — counted with a `os.walk("plans/done")`
sweep applying FR-3.1's applicability predicate per directory, excluding the `plans/done` root
itself; reproducible via the equivalent shell form: for each directory under `plans/done`, it
qualifies if `find <dir> -maxdepth 1 -name '*.md' ! -name README.md | grep -q .` or any immediate
subdirectory contains a `README.md`, then check `test -e <dir>/README.md`]

## Scope Boundaries

**In scope** (word budget): `repo-governance/**/*.md`, `.claude/**/*.md`, `.cursor/**/*.md`,
`.codex/**/*.md`, `.opencode/**/*.md`, `.pi/**/*.md`, `.amazonq/**/*.md`, root `AGENTS.md`,
root `CLAUDE.md` — **including generated mirrors** — plus a separate, blanket `**/README.md`
surface (700/900/900-word thresholds) that matches every `README.md` in the repo regardless of
tree, including `apps/**` and `libs/**` — see the "Out of scope" note below for the trees this
surface is explicitly excluded from via `args.exclude`.

**In scope** (README index, `orphan`/`ghost` — `governance-readme-index`): the gate's current
`DEFAULT_PATHS`, unchanged through the Phase 1 rename: `repo-governance/`, `.claude/agents/`,
`.claude/skills/`, `docs/explanation/software-engineering/`.

**In scope** (README completeness, `missing`/`unannotated` — `governance-readme-completeness`,
armed Phase 9): `repo-governance/`, `.claude/`, `.codex/`, `.pi/` — a 4-entry list. FR-3.7
originally scoped this wider, also adding `docs/` and `specs/`; narrowed to this list at the
Phase 9 (`ose-public`) / Phase 16 (the private sibling) arming step by user decision (word/readme-budget
gates exist to optimize agent context, not to police human-facing documentation — see `prd.md`
FR-3.7 and `delivery.md`'s Phase 9 execution log). **Not** the generated mirror trees — a
94-entry annotated index [Repo-grounded, verified 2026-08-13] fits no defensible ceiling, and
nobody navigates `.opencode/agents/` by README. Mirrors stay fully inside the word budget.

**In scope** (frontmatter `when_to_use`): `repo-governance/**/*.md` only.

**Out of scope** (README index/completeness and frontmatter, all three): `plans/**`, `apps/**`,
`libs/**`, `CONTRIBUTING.md`/`LICENSING-NOTICE.md`, `ose-primer`, and the plan documents in this
folder. **`apps/**`, `libs/**`, and root `README.md` are not out of scope for the word budget** —
its blanket `**/README.md` surface (declared above) matches every `README.md` in the repo,
including `apps/**/README.md`, `libs/**/README.md`, and root `README.md` itself (currently 856
words, WARN band). This PR's own `apps/rhino-cli/README.md` trim (1041 → 884 words) exists to
satisfy that surface. `plans/**`, `docs/`, `specs/`, `.fvm/`, and `.fvm-cache/` are excluded from
the word budget via `governance-word-budget`'s `args.exclude` (`repo-config.yml`); `CONTRIBUTING.md`
and `LICENSING-NOTICE.md` are excluded by construction — neither is named `README.md`, so no
covered surface glob matches either.

A generated mirror that violates the word budget is **never hand-edited** — the fix belongs in
`.claude/` source or in the binding generator.

## Repos and Delivery

| Repo                | Worktree                           | Plan docs         | PRs                                |
| ------------------- | ---------------------------------- | ----------------- | ---------------------------------- |
| `ose-public`        | `worktrees/optimize-governance-md` | **Authoritative** | 10 (2 executable, 8 markdown-only) |
| The private sibling | `worktrees/optimize-governance-md` | none (uses this)  | 7 (2 executable, 5 markdown-only)  |

**17 PRs total, 4 executable.** Phase 0 opens none; the earliest PR is Phase 1 — see
`delivery.md` §PR Map and §Delivery Boundaries for the full phase-to-PR mapping, including PR17
(Phase 17's knowledge-capture and archival PR, added per Finding 9 of the 2026-08-13 plan audit).

**Exactly one worktree named `optimize-governance-md` per repository** — the
[one-worktree-per-repo-per-plan HARD RULE](../../../repo-governance/conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
The name matches the plan-folder identifier per the Worktree Specification's name-matching
requirement — no exception needed (see `brd.md` §Constraints for the note on the `ose-public`
worktree's mid-session rename from its original provisioning name).

**Delivery mode**: `worktree-to-pr` in both repos. Markdown-only PRs are **noneligible static
work** — they merge on a green `.github/workflows/pr-quality-gate.yml` run with no PR review
cycle. Only the two rhino-cli PRs per repo carry changed executable behaviour and run the
review cycle.

## Documents

- [brd.md](./brd.md) — business goal and impact
- [prd.md](./prd.md) — requirements and Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — gate design, split pattern, migration mechanics
- [delivery.md](./delivery.md) — phased delivery checklist

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
