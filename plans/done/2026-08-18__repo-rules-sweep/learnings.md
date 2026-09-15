# 🧠 Learnings — Repo Rules Sweep

> Running log. Append in the moment; never reconstruct afterwards. Drained by the Phase 6 Knowledge
> Capture phase before archival. Never the system of record.

## Triage Status

All nine entries below are triaged. Each carries a **Litmus**, both **Safety gate** verdicts, and a
terminal **Routing** state. Two backlog plans were filed:

| Backlog plan                                                                                           | Entries routed there |
| ------------------------------------------------------------------------------------------------------ | -------------------- |
| [`rhino-cli-governance-tooling-defects`](../../backlog/rhino-cli-governance-tooling-defects/README.md) | 2, 3, 4, 5           |
| [`file-naming-convention-rework`](../../backlog/file-naming-convention-rework/README.md)               | 6, 7, 8              |

Entry 1 was fixed inline under the Iron Rule 3 blocker carve-out. Entry 9 routed inline to this
plan's own commits.

## Entries

## 1. `governance-readme-index` crashes intermittently in pre-push

Observed twice during Phases 0 and 1 (2026-08-18). `git push` failed with
`Error: gate governance-readme-index failed`, once accompanied by a Rust panic
(`run with RUST_BACKTRACE=1`). Both times the identical gate passed when re-run
standalone (`rhino gate run --surface=pre-push` → exit 0) and the push succeeded
on retry with no code change in between.

Why it matters: the gate's 439 findings are all `unannotated`, which is NOT in its
declared `fail-kinds` (`missing`, `orphan`, `ghost`), so it should never fail. A
non-deterministic crash in a pre-push gate is indistinguishable from a real
governance violation at the moment it fires, and the same gate runs in CI — where a
retry is far more expensive.

Do not diagnose this from the banner text: the command prints
`README INDEX AUDIT FAILED: 439 finding(s)` even when it exits 0, so the banner is
not evidence of failure. Assert the exit code.

**Root cause (found, not deferred)**: git runs hooks with whatever descriptor flags it inherited.
When stdout carries `O_NONBLOCK`, a long report fills the pipe buffer and the next write returns
`EAGAIN`, which `println!` escalates to a panic. It looked intermittent because it depends on report
length crossing the buffer, and never reproduces outside a hook.

**Litmus**: pass — the fix is a durable code change; the failure cannot recur unnoticed.
**Safety gates**: secret/sensitivity — pass, no credential or hostname; repo-relevance — both repos,
this is public-governance tooling.
**Routing**: **fixed inline** in `7958ae19d`, under the Iron Rule 3 blocker carve-out — it blocked
this plan's own pushes, so it is ordinary Root Cause Orientation, not deferred future work. The fix
clears the flag once at startup rather than patching 160+ print sites. Not filed as backlog.

## 2. A wrapped inline code span defeats the vendor audit's backtick pairing

`repo-governance vendor validate` strips inline code spans per line (`strip_non_prose` →
`inline_code_re`). When a code span straddles a line wrap, the pairing on the following line starts
from the span's closing backtick and mis-pairs from there, so a later genuinely-fenced term is left
looking like bare prose.

Concretely, reflowing a paragraph to

```text
... sit outside both gates: `harness bindings
generate` emits them from `.claude/`, so any index ...
```

made the audit report `.claude/` → `"primary binding directory"` on a line that contains no
`.claude/` at all. Keeping `` `harness bindings generate` `` on one line cleared it with no wording
change.

**Rule of thumb**: never let an inline code span cross a line break in `repo-governance/` prose.
Prettier will not do this to you — it only happens when a human or agent hand-wraps.

**Litmus**: pass — a document-level pairing pass would catch the whole class automatically.
**Safety gates**: secret/sensitivity — pass; repo-relevance — both repos, the scanner is parity-covered.
**Routing**: **filed** as WS-1 of
[`plans/backlog/rhino-cli-governance-tooling-defects/`](../../backlog/rhino-cli-governance-tooling-defects/README.md).
Code home, so backlog is mandatory — the audit should carry an open-span state across lines instead
of resetting per line.

## 3. `harness bindings validate` is not registry-driven for agent dirs (Phase 3)

Deleting `harness naming validate` stranded `harness-registry-driven.feature`, whose scenario
claimed two harness commands derive their target sets from `repo-config.yml`. The obvious repair —
repoint the claim at `harness bindings validate` — **failed the test**: against a synthetic repo
whose source tier lives at `.custom-src/agents`, the validator reported
`Failed to read Claude agents directory: .../.claude/agents ... No such file or directory`. It
hard-codes the path.

This does not undo the Phase 3 probe (P3.1), which proved `bindings validate` detects mirror drift
in **this** repository's real layout, in both directions. It does mean the withdrawal lost a
property nothing else carries: no surviving command derives an agent-dir set from the registry, so
adding a twelfth agent-bearing harness now needs a source edit, not just a config edit. The scenario
was narrowed to `harness duplication validate` — the one command the fixture still proves
registry-driven — rather than left asserting something false.

**The general defect**: a spec scenario named two commands and asserted one property of "each". When
one command died, the surviving half of the sentence looked like a safe place to re-point it. It was
not — the property was never true of the replacement. Repointing a spec at a different subject is a
new claim and needs a new test run, not a rename.

**Litmus**: pass — making the dirs registry-driven turns a source edit into a config edit, verifiable
by the same synthetic-repo fixture that exposed it.
**Safety gates**: secret/sensitivity — pass; repo-relevance — both repos, plus a four-repo
parity-manifest obligation on any `apps/rhino-cli` edit.
**Routing**: **filed** as WS-2 of
[`plans/backlog/rhino-cli-governance-tooling-defects/`](../../backlog/rhino-cli-governance-tooling-defects/README.md).

## 4. `readme-index rewrite-paths` is basename-keyed, so it cannot repoint a directory rename

The command this plan built in Phase 2 takes a TSV rename map, but `rewrite_one_target` splits a link
target at its **last** `/` and looks up only the final segment. The map is therefore keyed by
basename, not by repo-relative path.

Two consequences, both hit in execution:

- Feeding it the natural artifact — `renames-public.tsv`, full old/new paths — matched **nothing**.
  A basename-only map (`renames-public-basenames.tsv`) had to be derived, after separately proving
  0 conflicting targets and 0 basename collisions outside the swept tree. Neither proof is something
  the command asks for or checks.
- The 8 **directory** renames in the private sibling were unreachable by design: the changed segment is
  not the last one. They needed a hand-written path-level pass over every tracked `.md`.

The failure is silent. A map that matches nothing reports `0 file(s) updated` and exits 0, which is
indistinguishable from "nothing needed changing".

**Litmus**: pass — path-keyed matching plus a loud "map matched no target" signal would prevent the
whole class.
**Safety gates**: secret/sensitivity — pass; repo-relevance — both repos.
**Routing**: **filed** as WS-3 of
[`plans/backlog/rhino-cli-governance-tooling-defects/`](../../backlog/rhino-cli-governance-tooling-defects/README.md).

## 5. `rewrite-paths` only reads `.md`, so non-markdown references survive a rename sweep

After Phase 4 reported a clean sweep, a manual scan of all 12,666 tracked non-markdown files in
`ose-public` found three references to renamed paths: two synthetic test fixtures (correctly
unchanged) and two real stale comments — one in `.gitignore`, one in `repo-config.yml`. Both were
fixed by hand in `3848fa050`.

Nothing reported them. Every gate that could have — `md links validate`, `readme-index validate` —
walks markdown only, so a governance path quoted in a config comment, a shell script, or a CI
workflow is outside every automated check the repository has.

**Litmus**: pass — extending the rewriter (or a companion audit) to tracked non-markdown text files
closes a gap no current gate covers.
**Safety gates**: secret/sensitivity — pass; repo-relevance — both repos.
**Routing**: **filed** as WS-3 of
[`plans/backlog/rhino-cli-governance-tooling-defects/`](../../backlog/rhino-cli-governance-tooling-defects/README.md),
alongside entry 4 — same command, same commit, one TDD cycle.

## 6. WS-B specification input: what `file-naming.md` still gets wrong

WS-A touched `file-naming.md` only enough to remove the contradiction it created. Executing the
sweep exposed four defects that WS-B must fix. Each was derived from the enforcing code
(`apps/rhino-cli/src/application/docs/naming.rs`) and the gate registry, not from reading the
convention alone.

**(a) The exemption list understates the enforced one by nine to two.** `md naming validate`
hard-codes **nine** exempt basenames — `README.md`, `SKILL.md`, `AGENTS.md`, `CLAUDE.md`,
`_index.md`, `CONTRIBUTING.md`, `LICENSING-NOTICE.md`, `ROADMAP.md`, `SECURITY.md` — and the gate
registry adds two more globs, `*__linkedin__*.md` and `CONTRIBUTING.md` (already hard-coded, so
stated twice). `file-naming.md` names **two**: `README.md` and `SKILL.md`. `AGENTS.md` and
`CLAUDE.md` are among the most-edited files in the repository and appear in no exception clause.

**(b) `_index.md` contradicts the stated rule outright.** The rule says "no underscores in the
basename". `_index.md` is exempt in code — Hugo requires it — and the convention never says so. A
reader following the convention would conclude that every `apps/*-www` content section is in
violation.

**(c) The stated scope is unfalsifiable and the code knows it.** The convention governs
"`docs/`, `repo-governance/`, and similar locations". `naming.rs`'s own doc comment **quotes that
phrase back** as the justification for its exemptions. The gate's real scope is every tracked `.md`
minus the exempt list. A convention whose scope clause cannot be evaluated cannot be checked against
its gate.

**(d) Four of the six governed extensions are unenforced.** The rule lists `.md`, `.png`, `.svg`,
`.mmd`, `.excalidraw`, `.drawio`. The validator's first act is `if !base.ends_with(".md") { continue }`.
The other five extensions are aspiration, and the convention does not distinguish them from the one
that is enforced.

**A fifth, structural point for WS-B to decide**: the normative pointer to
[Ordinal Filename Prefixes](../../../repo-governance/conventions/structure/ordinal-filename-prefixes.md)
currently lives in a Principles-Implemented bullet. Normative content in a rationale section is easy
to miss; it belongs in The Rule or in Exceptions.

**Litmus**: pass — WS-B is exactly the durable surface that fixes this.
**Safety gates**: secret/sensitivity — pass; repo-relevance — both repos.
**Routing**: **filed** as WS-B of
[`plans/backlog/file-naming-convention-rework/`](../../backlog/file-naming-convention-rework/README.md).

## 7. The ordinal convention's own worked-cases table contradicts its normative sentence

`ordinal-filename-prefixes.md` states that a basename keeps its ordinal only when "the ordinal is
that step's own number". Its own worked-cases table then routes
`02-step-1-and-2-maker-and-checker.md` → `02-maker-and-checker.md`, "keeping the ordinal because the
file _is_ a step" — while the row's own verdict text says the two numbering systems **disagree**.
Ordinal 02 labels steps 1–2. By the rule as written this file fails question 2 and should shed its
ordinal entirely.

The range clause immediately below ("for a step range, the ordinal equals the first step") is the
intended reconciliation, but it is stated after the table and never applied to that row, so the
document reads as self-contradicting at the exact point a reader checks a hard case.

This is not academic: the private-sibling sweep hit 18 collision groups where the ordinal is the only
disambiguator, and the convention gave no answer for them either (entry 8).

**Litmus**: pass — a convention that contradicts itself in its worked example will keep producing
inconsistent sweeps.
**Safety gates**: secret/sensitivity — pass; repo-relevance — both repos; the same file was created
in each during this plan.
**Routing**: **filed** as WS-B of
[`plans/backlog/file-naming-convention-rework/`](../../backlog/file-naming-convention-rework/README.md) —
WS-B owns both filename conventions, and fixing one row without re-deriving the rule would be the
site-fixing anti-pattern Iron Rule 3 forbids.

## 8. Fixed-width truncated shard basenames make an ordinal load-bearing

The private sibling carries 18 groups (40 files) whose basenames were truncated to a fixed width by an
earlier word-budget split, leaving pairs like
`04-anti-pattern-10-…-tha.md` and `05-anti-pattern-10-…-tha.md` that differ **only** by their
ordinal. Stripping the ordinal collides.

The convention has no verdict for them: they are not steps (so the keep-clause does not apply), yet
the ordinal is the only thing making the name unique (so the strip-clause cannot be applied either).
`ose-public` has no instance, which is why WS-A never saw the case.

Inventing distinct names is authoring, not sweeping, so those 40 files kept their ordinals — the
sole documented deviation between the two repositories' sweep outcomes (46 numbered paths remaining
there against 8 here).

**Litmus**: pass — the real defect is upstream: the split tool truncates to a fixed width instead of
producing distinct names, so the same collision will recur at the next split.
**Safety gates**: secret/sensitivity — pass, no infra content: the affected files are governance
shards, and only the collision shape is described here, not private paths; repo-relevance — the
instances are in the private sibling, but the **rule gap** is public-governance content and belongs in
both.
**Routing**: **filed** as WS-B of
[`plans/backlog/file-naming-convention-rework/`](../../backlog/file-naming-convention-rework/README.md),
which must state a verdict for the collision case and decide whether the remediation tool may emit
truncated names at all.

## 9. A gate's `args` are part of the published rule, not an implementation detail

`governance-word-budget` excludes seven path prefixes via `args.exclude`. `governance-word-budget.md`
published the 700/900 README row as universal and never mentioned them, so authors trimmed plan
READMEs against a budget that measures nothing. WS-C fixed that one.

**The class is wider than the instance.** Six gates in `repo-config.yml` carry `args`:

| Gate                             | `args`                                             | Documented?                                       |
| -------------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| `governance-readme-index`        | `paths`, `fail-kinds: missing, orphan, ghost`      | ✅ `governance-readme-completeness.md`, table row |
| `governance-readme-completeness` | `paths`, `fail-kinds: missing, unannotated`        | ✅ same table                                     |
| `governance-word-budget`         | `exclude` × 7                                      | ✅ as of WS-C                                     |
| `md-mermaid`                     | `exclude` × 3                                      | ✅ `markdown-quality-gates.md` §1                 |
| `md-links`                       | `exclude: plans/done`                              | ✅ `markdown-quality-gates.md` §2                 |
| **`md-naming`**                  | **`exempt: *__linkedin__*.md`, `CONTRIBUTING.md`** | ❌ **nowhere** — see below                        |

**The named instance**: `md-naming`'s `exempt` globs are undocumented. `markdown-quality-gates.md`
opens by naming seven `ci-group: markdown` gates and then documents only three, stopping after
heading-hierarchy; `md-naming`, `md-frontmatter`, and `governance-readme-index` have no section.
`file-naming.md` does not mention either glob. So `*__linkedin__*.md` — a double-underscore basename
that the convention's "no underscores" clause explicitly forbids — is silently allowed by registry
config that no prose states.

Two sub-lessons worth keeping separate:

- **A partial reference page is worse than none.** The page enumerates seven gates in its opening
  sentence, which reads as a completeness claim; the missing four look documented until you count.
- **`fail-kinds` inverts a gate's apparent meaning.** `governance-readme-index` prints
  `README INDEX AUDIT FAILED: 439 finding(s)` and exits **0**, because every finding is
  `unannotated` and that kind is not in its `fail-kinds`. Anyone reading the banner instead of the
  exit code concludes the opposite of the truth.

**Litmus**: pass — documenting `args` alongside surfaces makes the published rule match the enforced
one, and the gap is mechanically checkable.
**Safety gates**: secret/sensitivity — pass; repo-relevance — both repos, though each repository's
`args` values differ and must be re-derived, never copied (proven in P5.9: six prefixes there,
seven here).
**Routing**: **routed inline** to this plan's own commits — WS-C already landed the word-budget half
in `governance-word-budget.md` and, in the private sibling, the new
`governance-word-budget/excluded-prefixes.md` shard. The remaining `md-naming` half is folded into
WS-B's scope (entry 6a names the same exemption drift), not filed separately.

## Withdrawal criterion audit (WS-C)

WS-C withdrew two rules. The criterion it applied, stated so it can be reused:

> Withdraw a filename rule when it (1) inspects a **single token** of the basename against a
> **closed vocabulary**, (2) **never reads the file** it is judging, and (3) **forces a source
> change to name a new kind of document** — because such a rule cannot distinguish a correct name
> from a plausible one, and its only observable effect is a rename tax on new categories.

All three conditions must hold. The three surviving gated filename rules, audited against it:

| Rule                                      | (1) single token, closed vocabulary?                                                            | (2) never reads the file?                                        | (3) forces a source change?                                                  | Verdict                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------- |
| `md naming` (kebab-case charset)          | **No** — judges the whole basename against an open charset rule, not a token against a list     | Yes                                                              | **No** — any new name passes if lowercase kebab; new categories cost nothing | **KEEP** — fails (1) and (3)      |
| `harness bindings validate` (mirror sync) | **No** — compares generated mirrors against their `.claude/` source                             | **No** — reads and diffs both files' contents                    | **No**                                                                       | **KEEP** — fails (1), (2) and (3) |
| `specs coverage` (spec-to-project map)    | **No** — the mapping is an explicit `coverage.projects[].specs` glob registry, not name-derived | **No** — parses scenarios and `@covers` markers inside the files | **No** — adding a project is a `repo-config.yml` edit                        | **KEEP** — fails all three        |

None of the three meets the criterion, so none is withdrawn. The audit is not vacuous: `md naming`
looked like the closest call, and the reason it survives is precise — its rule is **generative**
(any name satisfying a charset passes) where the withdrawn rules were **enumerative** (only names
ending in a listed token passed). That distinction, not "filename rules are bad", is what WS-C
actually established.

`harness bindings validate` carries a separate known defect (entry 3) — it hard-codes `.claude/agents`
instead of reading the harness registry. That is a reason to **fix** it, not to withdraw it: the
property it checks is real and nothing else checks it.
