# Four rhino-cli governance tools that exit 0 while doing less than the caller believes

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: the vendor audit mis-pairs an inline code span across a line wrap, `harness adapters validate`
hard-codes `.claude/agents` instead of reading the `harness:` registry, `readme-index rewrite-paths`
matches by basename and reads only markdown, and `readme-index validate` prints `AUDIT FAILED` above a
deliberately-green gate — four shapes of one failure: the report and the behaviour disagree.

> Provenance: demoted from the full `backlog/` plan `rhino-governance-tooling-defects/` to a
> two-pager on 2026-08-21. Filed 2026-08-18 by
> [`repo-rules-sweep`](../../done/2026-08-18__repo-rules-sweep/README.md)'s Knowledge Capture phase
> (entries 2-5); the fourth defect was added from
> [`repository-onboarding-readme-refresh`](../../done/2026-08-21__repository-onboarding-readme-refresh/README.md)
> Phase 0.

## Problem / context

Each defect was observed, not theorised, and each cost something concrete:

- **Vendor audit, wrapped code spans.** `repo-governance vendor validate` strips inline code spans
  _per line_. When a span straddles a wrap, the next line's pairing starts from the span's closing
  backtick and mis-pairs onward. Reflowing a paragraph so that `` `harness adapters generate` ``
  wrapped made the audit report `.claude/` on a line containing no `.claude/` at all; rejoining the
  span cleared it with no wording change. The false positive is the visible half — the same reset can
  also **swallow** a genuine violation by treating real prose as if it were inside a span. Cost: a
  wrong-cause investigation, and a workaround (don't wrap) that no document states.
- **`bindings validate` ignores the registry.** `repo-config.yml` carries a `harness:` registry
  naming every agent-bearing harness and its tier, but the command reads `.claude/agents` literally.
  Against a synthetic repo whose source tier sits at `.custom-src/agents` it fails outright. Adding a
  twelfth harness therefore needs a Rust edit in four repos rather than a one-line config edit —
  exactly the coupling the registry exists to remove. Cost: a spec had to be narrowed, so the repo
  now proves less than it did.
- **`rewrite-paths` matches basenames and only reads `.md`.** It splits a link target at its last `/`
  and looks up the final segment, so a full-path map matches **nothing** and reports `0 file(s) updated`,
  exit 0 — indistinguishable from "nothing needed changing". Directory renames are unreachable in
  principle, because the changed segment isn't the last one. Separately, after a "clean sweep" was
  reported, hand-scanning all 12,666 tracked non-markdown files in `ose-public` found two real stale
  governance paths — one in `.gitignore`, one in `repo-config.yml` — because every gate that could
  catch them walks markdown only. Cost: a false clean sweep that a human `grep` caught by luck.
- **`readme-index validate`'s verdict line ignores `--fail-kinds`.** Run as `repo-config.yml`
  registers it, it prints `README INDEX AUDIT FAILED: 425 finding(s)`, lists all 425, and exits **0**.
  The exit code is correct — all 425 are kind `unannotated`, deliberately dark-launched (163 in
  `docs/`, 262 in `specs/`; `repo-governance/` and `.claude/` contribute none). The verdict line
  counts every finding without consulting the filter that decides the exit code. Cost: a misread in
  both directions during baselining, settled only by reading the Rust.

## Why now

All four are live today and all four are the kind of defect that gets _built on_. A crash gets fixed
the same afternoon; a silent under-run accumulates trust it hasn't earned. This repo's governance is
enforced rather than merely written — every convention is backed by a gate, and a gate that passes
vacuously converts a real guarantee into a decorative one with nothing signalling the downgrade.
Two of the four have already caused a wrong verdict to be acted on.

## Prior art / precedents

- [`repo-rules-sweep`](../../done/2026-08-18__repo-rules-sweep/README.md) — where the first three
  surfaced, with the observations recorded in its `learnings.md`.
- [Code-Routing Downstream Rule](../../../repo-governance/development/quality/knowledge-capture/the-code-routing-downstream-rule.md)
  — why none was fixed inline: all four touch `apps/rhino-cli`, so a separate plan is mandatory.
- [markdownlint-ci-gate-lints-zero-files](./markdownlint-ci-gate-lints-zero-files.md) and
  [mermaid-validator-does-not-check-syntax](./mermaid-validator-does-not-check-syntax.md) — the same
  family, in other tools: a gate whose green means less than its name implies.
- [Related Repositories reference](../../../docs/reference/related-repositories.md) — the four-repo
  parity-manifest obligation every `apps/rhino-cli` edit inherits.
- **CommonMark's code-span rule** — backtick pairing is defined over the whole document, not per line;
  the vendor audit's per-line strip is a deviation from the spec every other markdown tool follows.

## Proposed direction (sketch)

- **Pair code spans at document level, guarded by a golden master.** Capture the audit's full current
  finding set across the corpus _before_ the fix, diff after, and review every delta. The fix is
  small; the blast radius across a governance corpus is not.
- **Derive the agent-directory set from the `harness:` registry**, and nothing more. Scope is the
  directory set only — any other registry coupling found along the way is captured, not fixed here.
- **Make "matched nothing" loud, and give rename propagation non-markdown reach.** Path-keyed matching
  makes directory renames reachable; a non-zero exit on a zero-match map makes a typo in the map
  impossible to mistake for a completed sweep. This is the one behaviour change with existing callers,
  so enumerate them before changing the exit code.
- **Fix the report, not the behaviour, for the fourth.** Its verdict line should count only findings
  that can fail the run. Inverting the usual direction is the point: three fixes make behaviour match
  the report; this one makes the report match behaviour that is already correct.

## Rough scope & non-goals

In scope: `apps/rhino-cli/src/` and `tests/`, companion Gherkin under `specs/apps/rhino`, and the
parity checksum manifest — in `ose-public` and the private sibling, with the four-repo parity obligation.

Out of scope (for now):

- Re-opening the withdrawal of the two naming validators. That decision stands; the registry fix
  repairs a survivor, it does not restore a casualty.
- Reformatting or re-wrapping the governance corpus to accommodate the audit. If the audit is fixed,
  the corpus needs no accommodation.
- Broadening `md links validate` into a general non-markdown link checker — the non-markdown reach
  here is scoped to **rename propagation**, not link health at large.
- The `file-naming.md` rework — that is [file-naming-convention-rework](./file-naming-convention-rework.md).

## Risks & open questions

- **How large is the document-level-pairing delta on the real corpus?** Unknown until the golden
  master is captured; if it is large, the fix stops being small and may need its own delivery unit.
  This is the single biggest unknown. (open)
- **Which callers depend on `rewrite-paths` exiting 0 on a no-op run?** The gate registry, the hooks,
  the CI matrix, and ad-hoc plan scripts all invoke it; the set has not been enumerated. (open)
- **Are these one delivery unit or four?** They share a failure shape, not a code path, and each is
  independently shippable. Bundling risks one workstream's golden-master surprise stalling three
  clean fixes. (open)
- **Is `unannotated` still worth dark-launching at 425?** Fixing the verdict line makes a permanently
  quiet 425 easier to ignore, not harder. Whether that kind should eventually gate is a separate
  decision this brief deliberately does not make. (open)
- Parity drift: any `apps/rhino-cli` edit desynchronizes the four-repo manifest unless regenerated and
  staged in the same commit.

## What success looks like + promotion signal

Success, stated as five checks that cannot all hold today: a synthetic repo whose agent tier lives
outside `.claude/` validates with no source edit; a rename map matching zero targets exits non-zero
with a named reason; a governance path referenced from a tracked non-markdown file is reported by a
gate rather than by a human running `grep` afterwards; deliberately wrapping an inline code span
across a line break in a fixture changes **no** vendor-audit finding; and
`gate run --surface=pre-push` exits 0 while printing no `AUDIT FAILED` line, with all 425
informational findings still listed.

Promotion signal: the golden-master delta is measured. Capturing the current vendor-audit finding set
and diffing it against a document-level-pairing prototype is a contained experiment that answers both
the largest open risk and the one-plan-or-four question at once. Promote when that diff exists.
