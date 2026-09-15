# Three trees treated as uniform when they are not

One-line summary: OpenCode loads `.opencode/agents/README.md` as an agent named `README`,
`rhino-cli`'s generate smoke tests share one process working directory so adding a test flakes a
sibling, and 47 dangling anchors across 22 skill files sat unmeasured because a link exemption was
keyed on a literal path prefix rather than on what the tree is.

> Provenance: demoted from the full `backlog/` plan `harness-mirror-and-test-isolation-defects/` to a
> two-pager on 2026-08-21. Filed 2026-08-19 by
> [`update-harness-support`](../../done/2026-08-20__update-harness-support/README.md)'s Knowledge
> Capture phase.

## Problem / context

Each defect was observed while reducing the supported harness set to Claude Code, OpenCode, and Codex
CLI, and none was fixed inline — all three touch `apps/rhino-cli` or the `.claude/skills/` content
tree, so the
[Code-Routing Downstream Rule](../../../repo-governance/development/quality/knowledge-capture/the-code-routing-downstream-rule.md)
routes them to a plan rather than an inline patch.

- **The mirror's own index is loaded as an agent.** `opencode agent list` at the worktree root
  (OpenCode 1.18.7) returns 7 built-in agents plus **94** repository agents — 93 generated mirrors
  plus `README.md`, the annotated index the binding emitter writes into the same directory OpenCode
  globs. Nothing invokes the phantom, so no behaviour is currently wrong; the repo simply publishes a
  junk entry into every OpenCode user's agent picker, and the agent count it states about itself is
  wrong by one. Two rules meet here and nothing reconciles them: "every directory carries an annotated
  index" and "this directory is globbed by a third-party tool".
- **The test suite decides what may be tested.** `harness_generate_bindings.rs`'s `run(...)` smoke
  tests resolve the git root from the **process** working directory, and every test in a binary shares
  one process — so they are only as isolated as the whole binary. Adding two more made
  `harness_unknown_name_is_error` fail under the default parallel runner and pass under
  `--test-threads=1`. The two new tests were removed rather than left as a flake source, so the
  generate path is thinner than the checklist implies, and the cap is invisible: it surfaces as an
  unrelated red run, which invites the wrong fix (re-run, mark flaky, reduce parallelism).
- **47 dangling anchors hidden by a prefix-keyed exemption.** `docs/links.rs` exempted skill files
  from link validation keyed on the literal string `.claude/skills/`. When a byte-identical mirror
  appeared at `.agents/skills/`, the same bytes were reported broken in one tree and fine in the
  other. That inconsistency was fixed at root cause (the exemption is now a property of skill trees as
  a class) — **but the links were not**. 47 anchors across 22 files are genuinely dangling, several
  pointing at split-pattern parents that no longer carry the named heading. Repo-wide broken-link
  count sits at 312.

  The same exemption hides a second, structural shape of the defect, found on 2026-08-22 by the
  cycle-9 review of the PR-review rules PR. Four files under `.agents/skills/` carry
  `../../../agents/...` links copied byte-for-byte from `.claude/skills/`, where they resolve to
  `.claude/agents/`. Under `.agents/`, which has no sibling `agents/` directory, they resolve to
  nothing — and the private sibling carries the same four. These are not anchors that drifted: they are
  unresolvable the moment the mirror is written, for every such link, because the emitter copies
  bytes across trees of different depth without rewriting relative paths. Repointing the 47 anchors
  by hand leaves this class fully intact, so the emitter is the thing to change, not the link text.

## Why now

The exemption was written to stop the validator complaining about a tree; it also stopped anyone
learning the tree was wrong, for as long as it existed. Skills are instructions loaded into an
agent's context, so a stale anchor sends a reader — human or agent — to the wrong place on every load.
Separately, the CWD coupling is a live cap on coverage that will be inherited by the next person who
adds a test to that binary, which makes it cheapest to fix before any workstream that does.

## Prior art / precedents

- [`update-harness-support`](../../done/2026-08-20__update-harness-support/README.md) — where all
  three were observed; its Phase 5 and Phase 6 notes and `evidence/opencode-agent-list.txt` are the
  reproduction record.
- [rhino-cli-governance-tooling-defects](./rhino-cli-governance-tooling-defects.md) — the sibling
  family of `rhino-cli` tools that report success while under-running.
- [harness-binding-catalog-drift](../q2-not-urgent-important/harness-binding-catalog-drift.md) — the
  same emitter surface, drifting in a different dimension.
- [README Completeness convention](../../../repo-governance/conventions/structure/governance-readme-completeness.md)
  — the rule that puts an index inside the globbed directory in the first place; the collision is
  between two rules, not a bug in one.
- **`assert_fs` / `tempfile` fixture-root testing in the Rust ecosystem** — the standard answer to
  process-global CWD coupling: pass the root, never discover it, exactly as
  `repo_config::load(&root)` already does at every other call site here.

## Proposed direction (sketch)

- **Declare globbed-ness per harness, then enforce it.** Record in `repo-config.yml` whether a
  harness's agent directory is globbed by its vendor tool (Codex is not — it reads
  `.codex/agents/*.toml`, so a `.md` index there is inert). For a globbed directory, discharge the
  index requirement from the parent instead, and have `harness bindings validate` fail on any tracked
  file inside a globbed agent directory that lacks agent frontmatter. The point is an explicit
  reconciliation of the two rules, not a special case for one filename.
- **Give the command an explicit root parameter**, with the binary's entry point passing the
  discovered one and tests passing a fixture path. The two removed tests come back as part of the
  fix — their absence is the visible cost of the defect, so their return is the proof.
- **Repair the 47 anchors rather than re-exempting them.** Resolve each intended target and repoint;
  where the target no longer exists in any form, remove the reference and say what replaced it.

## Rough scope & non-goals

In scope: `apps/rhino-cli/src/application/agents/`, `src/commands/`, `tests/`, the companion Gherkin
under `specs/apps/rhino/`, and `.claude/skills/`. The first two workstreams touch the parity boundary
and must land in `ose-public` and the private sibling as a paired merge with the manifest regenerated on
both sides; the anchor repair is `ose-public` content only and carries no parity obligation.

Out of scope (for now):

- Changing which harnesses are supported, or redesigning the binding emitters.
- The `.agents/skills/` mirror layout — Codex reads it as a skill root and it carries no index file of
  the offending shape.
- The eight vendored plugin skill directories, which this repo neither authors nor regenerates.
- Removing the skill-tree link exemption permanently. Narrowing it temporarily to prove the repair is
  a step in the work, not the outcome.

## Risks & open questions

- **Where does a globbed directory's index live instead?** One level up with links inward, or the
  requirement discharged by the parent — the choice has to be made against what the
  README-completeness validator accepts without weakening it, and that has not been tested. (open)
- **Should the skill-tree exemption be narrowed permanently once the 47 are fixed?** Leaving it total
  lets the class hide again; narrowing it may reintroduce the unresolvable-reference noise it was
  written for. Unresolved, and deliberately not presumed. (open)
- **How many of the 47 have a recoverable target?** Several point at headings moved into child files
  by a progressive-disclosure split; some may have no target at all, which turns a repoint into a
  rewrite. Unknown until each is resolved. (open)
- Sequencing: the CWD fix must land before anything else adds tests to that binary, or the new tests
  inherit the flake.
- Parity: any `apps/rhino-cli/**` edit desynchronizes the manifest unless regenerated and staged in
  the same commit on both sides.

## What success looks like + promotion signal

Success, each stated in both directions so it can fail before the change: `opencode agent list` names
no agent called `README` (one such entry among 94 today); a non-agent file under a globbed agent
directory fails `harness bindings validate` naming the file (exits 0 today); the two generate smoke
tests coexist with `harness_unknown_name_is_error` across three consecutive parallel runs (a sibling
fails today); `md links validate` over `.claude/skills` with the exemption lifted reports zero
dangling anchors (47 across 22 files today); and the repo-wide broken-link count with registered
exclusions is no greater than the 312 baseline.

Promotion signal: the anchor triage is done — a single pass classifying the 47 as repoint / rewrite /
delete sizes the third workstream, which is the only one whose cost is currently unknown. The other
two are already specified tightly enough to execute. Promote when that classification exists, or
promote the first two on their own if the anchor repair proves large enough to want its own plan.
