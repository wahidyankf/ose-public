# 🧹 Repo Rules Sweep

## Context

A standing sweep over the repository's **repo rules** — every normative surface, not one directory:
`repo-governance/`, `AGENTS.md`, `CLAUDE.md`, `.claude/` and its mirrors, `repo-config.yml`, and the
enforcement machinery in `apps/rhino-cli` (see
[glossary.md](../../../repo-governance/glossary.md)).

Rules here accreted through many separate plans. Some contradict each other, some describe a practice
the tree stopped following, some are stated in six drifted-apart places, and some enforce nothing
worth enforcing. This plan corrects them one workstream at a time, each with a real delivery unit,
gate, and propagation sweep across the maker/checker/fixer triad.

**Structural rule**: a workstream is not executable until fully specified here. Phase 0 is shared;
each workstream adds phases before Knowledge Capture, which stays terminal with Archival.

## Workstreams

| ID   | Workstream                                  | Phases   | Status                       |
| ---- | ------------------------------------------- | -------- | ---------------------------- |
| WS-A | Ordinal filename prefixes in governed trees | 1–2, 4–5 | Specified                    |
| WS-C | Realign rules whose enforcement misfires    | 3        | Specified                    |
| WS-B | File Naming Convention rework               | —        | **Declared, not executable** |

### WS-A — Ordinal filename prefixes

`repo-governance/` prefixes **2092 of 2494** markdown files across **176 numbered directories**;
`ose-private` prefixes **1704 of 2131**, plus 217 under `.claude/`. That numbering was never an
ordering decision — it is residue from progressive-disclosure sharding under the
[Governance Word-Budget Convention](../../../repo-governance/conventions/structure/governance-word-budget.md).
`docs/` (0 of 211) and `specs/` (0 of 290) navigate fine without it: the annotated `README.md` index
carries the order.

Three defects show the numbering has stopped paying for itself:

- **Insert pressure produced a letter escape.** `conventions/tutorials/swe-by-example/` holds 32
  shards whose highest ordinal is 27, because inserts landed as `01b-`, `03b-`, `05b-`. Seven such
  files exist repo-wide.
- **Where order is genuinely semantic, the prefix contradicts it.**
  `workflows/infra/development-environment-setup/` runs `04-phase-1-system-package-manager.md` …
  `13-phase-11-repository-bootstrap.md` — two numbering systems in one basename, offset, drifting,
  with phase 5 skipped.
- **The governing convention already forbids the practice.**
  [File Naming Convention](../../../repo-governance/conventions/structure/file-naming.md) justifies
  itself as "no prefixes, abbreviations, or hierarchical encoding" while 84% of the tree it governs
  carries a prefix.

### WS-C — Realign rules whose enforcement misfires

Two of the five mechanically-enforced filename rules here check nothing but a basename's **last
token** against a closed vocabulary:

- **Agent role suffix** — `harness naming validate` requires every `.claude/agents/` file (and every
  mirror) to end in `maker`, `checker`, `fixer`, `dev`, `deployer`, `manager`, `tester`, or
  `researcher`.
- **Workflow type suffix** — `repo-governance workflows naming validate` requires every file under
  `repo-governance/workflows/` to end in `quality-gate`, `execution`, `setup`, `planning`, or
  `grooming`.

Neither prevents a defect. Both inspect one token, ignore the rest, and never read the file. What
they reliably do is obstruct: a new kind of agent or workflow either takes a misleading suffix or
forces a vocabulary amendment before it can be committed. Both rules and all their tooling are
withdrawn — including the **scope vocabulary** each declares for the _first_ token, which no
validator has ever read.

**Existing filenames do not change.** `repo-rules-checker.md` keeps its name — it stops being
mandatory. WS-C runs before the sweep because these two convention trees hold thirteen numbered
shards the sweep would otherwise rename first and delete second.

Third, **evidence placement**. The Evidence Capture Convention already requires file-based evidence
to live in the plan's own `evidence/` subfolder, and 24 files landed in a repo-root `evidence/`
anyway. The directory is deleted and a root-anchored `/evidence/` `.gitignore` entry now blocks the
root case; WS-C makes the convention state the rule that guard implements.

Fourth, the **word budget on plan READMEs**, which already does not apply: the
`governance-word-budget` gate excludes `plans/`, `docs/`, and `specs/` by path prefix, but
`governance-word-budget.md` publishes the 700/900/900 README row as universal and never says so. The
rule is fine; its documentation causes authors to trim plan READMEs against a budget nothing
measures. WS-C documents the exclude list as part of the published rule.

### WS-B — File Naming Convention rework

WS-A touches `file-naming.md` only enough to remove the contradiction it creates. The broader
rework — what that convention should say once prefixes are settled and the two suffix rules are
gone — is separate, **specified only after WS-A's Knowledge Capture records what is still wrong**.

## Scope

**Repositories**: `ose-public` and `ose-private`, both swept, in that order.

**Trees in scope**: `repo-governance/`, `.claude/` (with `.opencode/`, `.cursor/`, `.amazonq/`
regenerated), `repo-config.yml` for the gate registry, and `apps/rhino-cli` for the index tooling
and the command deletions.

**Out of scope**: `plans/` (127 numbered files, all immutable `done/` archives), `docs/` and `specs/`
(already unnumbered), `apps/` fixtures and content (public URL contract).

## The Rule (WS-A)

A filename carries a leading ordinal **only when the file is a real step in an ordered sequence and
the ordinal is that step's own number**; everything else takes a plain kebab-case name and the
parent index carries the order. A basename never carries two numbering systems. The keep side is
real: `repo-governance/workflows/**/*-quality-gate/` holds genuine ordered step sequences, and files
like `04-step-4-fixer.md` already have an ordinal equal to the step's own number — they fail today
only on the redundant `step-N` token the rule strips, becoming `04-fixer.md` (see `tech-docs.md`
§2's worked cases). The sweep preserves those ordinals.

The rule is **prose only**: no gate, no `rhino-cli` detector, no audit category. `repo-rules-checker`
judges it as an AI-only category and `repo-rules-fixer` repairs it.

## Approach Summary

1. **Publish the rule and propagate it** through the `repo-rules-*` triad, their skills, and the
   `repo-rules-quality-gate` workflow.
2. **Make the index generator order-preserving** and add a rename-aware `rewrite-paths` mode.
3. **Withdraw the obstructive rules** — delete both suffix conventions, their `rhino-cli` commands,
   shared modules, specs, fixtures, and gate entries, after confirming the already-declared
   `harness-bindings` gate keeps `.opencode/` and `.cursor/` mirror-drift covered; and document the
   word-budget exclude list.
4. **Sweep `ose-public`** — rename every non-qualifying file, rework continuation-shard boundaries
   into self-standing topics, re-split anything that busts the word budget on a topic seam.
5. **Sweep `ose-private`** the same way, applying the same withdrawal, with the tooling
   byte-identical.

## Documents

- [brd.md](./brd.md) — goal, impact, success metrics, non-goals, risks.
- [prd.md](./prd.md) — personas, user stories, Gherkin acceptance criteria, scope.
- [tech-docs.md](./tech-docs.md) — decisions, file-impact analysis, diagrams, rollback.
- [delivery.md](./delivery.md) — phased, tagged, gated checklist.
- [learnings.md](./learnings.md) — running log drained by Knowledge Capture.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
