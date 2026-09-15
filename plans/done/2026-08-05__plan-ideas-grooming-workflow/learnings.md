# Learnings: plan-ideas-grooming-workflow

<!-- Running log accrued during execution. Append a `## Learning: <summary>` entry whenever an
     item surfaces a generalizable insight (a workaround, a wrong assumption corrected, a tool
     quirk, a rule gap). Triaged against the Knowledge Capture Convention in Phase 5, before
     archival. See repo-governance/development/quality/knowledge-capture.md. -->

## Learning: `apps/rhino-cli` byte-identity across repos is aspirational, not current state

AGENTS.md states `apps/rhino-cli` byte-identity spans `ose-public`, `ose-primer`, the private sibling
with zero carve-outs. `diff -rq` between `ose-public`'s and `ose-primer`'s `apps/rhino-cli/src`
trees during Phase 2 showed dozens of files differ and several exist only on one side — the two
codebases have already diverged substantially (matches the pre-existing project note about
`ose-primer` rhino-cli propagation needing polyglot dep provisioning). Practical consequence for
any future plan that adds a new naming/type token enforced by rhino-cli: adding the token to the
shared governance doc is not enough — each repo's own rhino-cli fork needs the matching
enum/const update independently verified (RED via the failing `naming validate` run, GREEN via a
minimal, repo-local patch), the same way Phase 1 fixed `ose-public`'s `WORKFLOW_TYPES` const and
Phase 2 had to redo the identical minimal fix against `ose-primer`'s own (differently-shaped)
copy of the file. Do not assume the two `rhino-cli` codebases are interchangeable; do not attempt
full byte-identity reconciliation as a side effect of an unrelated propagation plan — that is a
separate, much larger initiative.

**Routing**: `plans/ideas/tri-repo-rhino-cli-byte-identity-gate.md` (non-code, small) — an existing
two-pager already covers this exact problem (drift detection across the byte-identity boundary).
Folded this occurrence's data point (4/4 repos needed independent fixes, not the smaller 4-file
count the existing brief cited) and a new open question (reconcile vs. correct-the-claim) into it
INLINE, landed in this plan's own commit. No new two-pager created — see the Before-You-Add
integrate-don't-duplicate rule.

## Learning: `ose-primer` pre-push still needs polyglot NuGet restore after being untouched

`git push origin main` from `ose-primer` failed pre-push on `crud-be-fsharp-giraffe:typecheck`
with `NETSDK1004: Assets file ... project.assets.json not found` — the F# demo app's NuGet
packages weren't restored. `npm run doctor -- --fix` reported all 13 tools OK and did not restore
them (doctor checks toolchain presence, not per-project package restore). Fixed with a manual
`dotnet restore` against both `.fsproj` files in the affected app. This reproduces the
pre-existing project note that a fresh `ose-primer` pre-push needs explicit polyglot dependency
provisioning beyond `npm install` + `npm run doctor -- --fix` — worth confirming whether `doctor
--fix` should be extended to cover `dotnet restore` for all `.fsproj`/`.csproj` projects so this
stops recurring per-session.

**Routing**: `plans/ideas/doctor-fix-polyglot-restore.md` (non-code home for the idea brief itself;
the eventual fix is code) — no existing two-pager covered this problem, so filed as a NEW two-pager,
landed INLINE in this plan's own commit (creating one small idea-brief file). The idea folds in the
`beaver-nest` npm-hoisting occurrence below as a second data point for the same underlying gap
class. The eventual `doctor --fix` code change itself, if promoted, will be a separate
`plans/backlog/` plan per the code-routing downstream rule — not landed here.

## Learning: `beaver-nest`'s rhino-cli fork test binary rejects `cargo test <filter>` syntax

Running `cargo test --manifest-path apps/rhino-cli/Cargo.toml --quiet <test-name>` in
`beaver-nest` (used successfully in `ose-public`/`ose-primer`/the private sibling for the same
grooming-fix verification) failed with `error: unexpected argument '<test-name>' found` against
an integration test binary named `agent_naming_validator` — a `beaver-nest`-specific fork
artifact whose binary parses its own CLI args (clap-based) rather than accepting the standard
libtest filter argument. Confirmed unrelated to the actual fix (the target command, `repo-governance
workflows naming validate`, already reported PASSED). Worked around with `cargo test
--manifest-path apps/rhino-cli/Cargo.toml --lib -- <test-name>`, which scopes to the lib target's
unit tests only and bypasses the conflicting integration binary. Worth remembering for any future
`beaver-nest` rhino-cli work: prefer `--lib` when filtering by test name.

**Routing**: discard — fails the litmus test. This is a narrow, single-fork CLI-parsing quirk that
only surfaces when an agent bypasses Nx and invokes `cargo test <filter>` directly for ad-hoc
diagnosis; the repo's own Nx targets already invoke `cargo test` correctly and never hit this path.
The error message (`unexpected argument '<test-name>' found`) is self-explanatory enough to
re-diagnose in under a minute if it recurs, and a durable doc note would sit in a file no one reads
before an ad-hoc diagnostic command. Not worth a `beaver-nest`-specific doc edit for this
occurrence's narrow value.

## Learning: npm workspace hoisting can strand a package away from where its consumer resolves it

`beaver-nest`'s pre-push failed on `beaver-nest-fe:test:coverage` with `Cannot find package
'@vitest/coverage-v8'` even though `npm ls @vitest/coverage-v8` showed it correctly resolved in the
dependency tree. The package was nested under per-workspace `node_modules/` (`apps/beaver-nest-fe/`
and `libs/web-ui/`) rather than hoisted to root, while `vitest` itself was hoisted to root — Node's
ESM bare-specifier resolution walks up from the _importing_ module's own location, so root-hoisted
`vitest` couldn't see the nested copy. `npm install @vitest/coverage-v8@<version> -w
<workspace>` "fixes" this but silently converts an exact pin to a caret range, violating the repo's
"Exact pins only" policy — caught and reverted here. The correct, side-effect-free fix is `npm
dedupe`, which re-hoists without touching any declared version. Worth checking `npm ls
<pkg>` alone is not sufficient evidence a package is resolvable — check whether the _consumer_
(not just the declaring workspace) can reach it, and prefer `npm dedupe` over a targeted
`npm install -w` when a hoisting mismatch is suspected.

**Routing**: `repo-governance/development/workflow/reproducible-environments.md` (non-code, small)
— added a Troubleshooting entry (`"npm ls <package>" shows it resolved, but a consumer still
reports it missing`) covering the hoisting-mismatch symptom and the `npm dedupe` fix, cross-linking
the "exact pins only" policy this occurrence nearly violated. Routed INLINE, landed in this plan's
own `ose-public` commit. Also folded as a second data point into
`plans/ideas/doctor-fix-polyglot-restore.md` above.
