# Delete or repurpose `shadow-diff.sh`, whose comparison is now permanently unreachable

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: `apps/rhino-cli/scripts/shadow-diff.sh` diffs a Rust binary against an F# one, but
the Rust crate was deleted outright — so 7.7 KB of live-looking tooling sits in a scripts directory
with a resolution path that can never resolve again.

> Provenance: demoted from the full `backlog/` plan `remove-dead-shadow-diff-script/` to a two-pager
> on 2026-09-08. Originally filed direct-to-backlog by
> [`rewrite-rhino-cli-to-fsharp`](../../done/2026-08-30__rewrite-rhino-cli-to-fsharp/README.md)'s
> Phase 12 Knowledge Capture triage — a route the Knowledge Capture Convention forbids, which is why
> it is here now.

## Problem / context

The script was written during the Go→Rust rewrite
(`2026-05-23__rhino-cli-rust-rewrite`) to
diff a Go binary against a Rust one, then repurposed during `rewrite-rhino-cli-to-fsharp` Phase 2 to
diff Rust against the F# port wave by wave. It earned its keep there: a stale `target/gate` binary
comparison and two Wave-D-only formatting bugs were caught only because its output was treated as a
first-class gate.

Phase 9c then deleted the Rust crate. The script's Rust-side resolution —
`apps/rhino-cli/target/{release,gate}/rhino-cli`, with a `cargo build --profile gate` fallback — now
has nothing to resolve. This is **permanently unreachable**, not stale: no future state of this repo
restores a Rust binary for it to find. Running it today prints
`shadow-diff: Rust binary not found or not executable` and stops.

The migration plan noticed this repeatedly and closed it never. Its Phase 11a rules-propagation
sweep had to carve the file out by name as "not a hook, Nx target, or workflow, and not invoked by
any live automation today," and its `tech-docs.md` File-Impact Analysis marks the file `[N]` with no
`[D]` at any phase. Closing the loop was out of scope for every phase that touched it.

## Why now

Not urgent, and the demotion says so. Nothing invokes it, so nothing is broken and nothing is
racing. What keeps it alive is that the cost is paid by whoever finds it next: a contributor opening
`apps/rhino-cli/scripts/` sees three scripts, two live, and has no way to tell which is which
without reconstructing two rewrites of history. That cost recurs per contributor and never
self-resolves, while the fix is one `git rm` in each of two repos.

## Prior art / precedents

- `2026-05-23__rhino-cli-rust-rewrite` —
  where the script was born, against a Go binary that also no longer exists.
- [`2026-08-30__rewrite-rhino-cli-to-fsharp`](../../done/2026-08-30__rewrite-rhino-cli-to-fsharp/README.md)
  — Phase 2 repurposed it, Phase 9c orphaned it, Phase 11a carved it out by name.
- [Nx target anti-patterns](../../../repo-governance/development/infra/nx-targets/anti-patterns-echo-placeholders.md)
  — the same principle one layer over: a thing that looks like a quality boundary and is not one gets
  removed, not kept.
- [`remove-stale-compat-min-version-stubs`](../q1-urgent-important/remove-stale-compat-min-version-stubs.md)
  — the sibling case of "tooling that looks live and checks nothing", filed from the same triage.
- **`git log` as the archive** — the standard answer to "but we might want it back": deleted scripts
  are recoverable, and the two rewrite plans in `plans/done/` already narrate what it did.

## Proposed direction (sketch)

Two acceptable outcomes; the decision is the work.

- **Delete** (the simpler default). `git rm apps/rhino-cli/scripts/shadow-diff.sh` in both parity
  repos, and repoint the one live prose reference in `apps/rhino-cli/README.md` — which currently
  describes the script in the past tense as migration evidence — so the sentence survives without
  naming a file that does not exist.
- **Repurpose** into a generic two-binary differential runner: lift the hardcoded `RUST_BIN` /
  `FSHARP_BIN` resolution into two positional arguments, drop the `cargo build --profile gate`
  fallback, and keep the namespace-diffing core (`md`, `governance`, `git`) as a harness a future CLI
  rewrite could reuse.

Repurposing is only worth it if a future consumer is actually named. None is today, which is why
deletion is the default rather than a tie-break.

## Rough scope & non-goals

In scope: `apps/rhino-cli/scripts/shadow-diff.sh` and its live references, in `ose-public` and
the private sibling (the script is inside the `apps/rhino-cli` byte-identity boundary, so the two repos
must reach the same outcome).

Out of scope:

- Designing a genuinely new differential-testing tool. If repurposing wins, it goes exactly as far as
  "two arbitrary binaries, existing namespaces" and no further.
- Adding comparison surfaces beyond the `md`, `governance`, and `git` namespaces it already covers.
- Anything in `plans/done/**`, which describes the script in the past tense and is correct as history.
- The other two scripts in that directory (`rhino-bin.sh`, `dotnet-deps-audit.sh`), both live.

## Risks & open questions

- **Is there a named future consumer?** Repurposing is justified only by one. No language migration
  is planned or proposed today, so the honest answer is currently "no" — but that is a maintainer
  judgement, not a fact the brief can settle. (open)
- **Does the byte-identity boundary make this two PRs or one obligation?** A deletion inside the
  `apps/rhino-cli` parity surface opens the parity-manifest obligation; whether a deleted file is a
  manifest event or a manifest non-event is unverified here. (open)
- Low risk of loss: no automation invokes it, and `git` retains it either way.
- Moderate risk of churn if repurposed — a generic runner with no caller is the same dead-tooling
  problem wearing a better name.

## What success looks like + promotion signal

Success: `grep -rn 'shadow-diff' apps/ docs/ .github/ .husky/` outside `plans/done/**` returns either
nothing, or only a working tool and its updated callers, in both parity repos — and
`apps/rhino-cli/scripts/` contains no script whose primary code path cannot execute.

Promotion signal: a maintainer answers delete-vs-repurpose. That single answer decides between a
two-line deletion PR that needs no plan at all and a net-new generalization that does. Until it is
answered, promoting would produce a plan whose first phase is the question.
