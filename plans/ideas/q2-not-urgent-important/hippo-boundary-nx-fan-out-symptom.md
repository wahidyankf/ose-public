# Name the Nx fan-out symptom in the HIPPO admission rule

One-line summary: one `nx run-many` over four projects drove the host into memory exhaustion because
each target is itself a nested `nx run` chain — and the governance rule that would have stopped it
states its principle without naming either the shape that triggers it or the warning line that
announces it.

> Routed here 2026-09-17 by the Knowledge Capture phase of
> [`ose-id-init-01-foundation`](../../done/2026-09-17__ose-id-init-01-foundation/learnings.md), which
> flagged it as a `rules-propagation` candidate rather than an ad-hoc edit from inside that plan's
> delivery unit.

## Problem / context

`npm exec nx -- run-many -t typecheck,lint,test:quick` across `ose-id-be`, `ose-id-be-e2e`,
`ose-id-web`, and `ose-id-web-e2e`, run outside the HIPPO boundary, put the host into severe memory
pressure and the run had to be interrupted by hand to recover the machine. Three causes compounded,
and none of them is visible from reading the command:

1. Every project's `test:quick` is itself a chain of nested `npm exec -- nx run ...` calls, so one
   `run-many` over 4 projects x 3 targets expanded into dozens of concurrent Node and Nx processes.
2. Repeated `dotnet build`/`publish`/`test` leave MSBuild node-reuse workers and Roslyn
   `VBCSCompiler` servers resident between commands.
3. `ose-id-web-e2e:test:e2e` transitively started a Next.js dev server and Chromium on top of that
   residue.

[`guarded-admission-and-parallelism.md`](../../../repo-governance/development/practice/resource-aware-development/guarded-admission-and-parallelism.md)
already states the governing principle — one outer HIPPO boundary per compute-bearing DAG node — and
that principle is correct and sufficient in the abstract. What it does not do is tell a reader that a
`run-many` over nested-chain targets is one of these nodes, or that a transitively-started dev server
is another. It also does not name the one line the transcript actually prints when this is happening:
`MaxListenersExceededWarning: 14 exit listeners added to [process]`. An executor reading the rule and
then typing the command can satisfy their own reading of the rule and still remove the guard, because
the command "looks read-only" or "is just one target".

## Why now

The cost is already paid once, in a user-visible host recovery, and the conditions that produced it
are not going away: the repository just gained four more projects whose `test:quick` targets are
nested chains, so the fan-out multiplier is larger now than when the rule was written. The symptom is
cheap to recognize once named and effectively invisible until then — `MaxListenersExceededWarning` is
a generic Node warning that reads as noise unless a reader has been told it is the signature of this
specific condition. Nothing is blocked while this stays undocumented; the next person to hit it just
pays the same recovery cost again.

## Prior art / precedents

- **Guarded admission and parallelism** — the rule this brief proposes extending; already holds the
  principle, lacks the instances and the symptom.
  [guarded-admission-and-parallelism](../../../repo-governance/development/practice/resource-aware-development/guarded-admission-and-parallelism.md)
- **Resource-aware development** — the parent practice that makes HIPPO admission normative for local
  compute, and the surface AGENTS.md points at.
  [resource-aware-development](../../../repo-governance/development/practice/resource-aware-development.md)
- **Rules propagation workflow** — the required route for any rule addition, and the reason this was
  not edited in place during the originating plan.
  [rules-propagation](../../../repo-governance/workflows/rules/rules-propagation.md)
- **Knowledge Capture convention** — the mechanism that routed this learning here instead of losing
  it in an archived plan.
  [knowledge-capture](../../../repo-governance/development/quality/knowledge-capture.md)
- **`ayokoding-www-e2e-flake-under-concurrent-load`** — an adjacent brief where unbounded fan-out in
  test code produces a different failure (flake, not exhaustion) from the same root shape.
  [brief](../q3-urgent-not-important/ayokoding-www-e2e-flake-under-concurrent-load.md)

## Proposed direction (sketch)

Run a `rules-propagation` pass that adds a short "recognizing the symptom" passage to
`guarded-admission-and-parallelism.md`. The passage names the two concrete shapes that make a command
a compute-bearing node even though it reads as one command — a `run-many` fan-out over targets that
are themselves nested `npm exec -- nx run ...` chains, and a target that transitively starts a dev
server — gives `MaxListenersExceededWarning` as the recognizable transcript signature, and states the
preference for sequential per-project runs over a `run-many` fan-out in exactly that case. The
propagation pass, not this brief, decides whether the existing repo-root hook that already rewrites
bare `nx run` invocations should also warn on the fan-out shape, and records an enforcement
disposition either way.

## Rough scope & non-goals

In scope:

- The wording addition to `guarded-admission-and-parallelism.md`, through the propagation workflow.
- A conflict scan against the other resource-aware surfaces so the new instances do not contradict
  the existing principle or the `AGENTS.md` summary of it.
- An enforcement disposition: documented-only, or documented plus a hook warning.

Out of scope:

- Changing HIPPO itself or anything in the upstream HIPPO repository; HIPPO's admission classes are
  not what is wrong here.
- Rewriting any project's `test:quick` chain to flatten the nesting. The nesting is a deliberate
  target-composition choice and re-litigating it is a separate, much larger question.
- The third cause above (resident MSBuild/Roslyn daemons). The originating plan already judged that
  one to belong to the independent HIPPO consumer, not to this repository.

## Risks & open questions

- **Does naming a symptom invite treating it as the only symptom?** A reader told to watch for
  `MaxListenersExceededWarning` may conclude its absence means the boundary was unnecessary. The
  wording has to keep the principle primary and the symptom secondary. (open)
- **Documented-only, or enforced?** A hook that warns on `run-many` would catch the case the prose
  cannot, but `run-many` is legitimate under a boundary, so the warning would fire on correct usage
  too. (open)
- **Does the instance list age badly?** Two named shapes today; a third appears the next time a target
  gains a transitive server. A list that is read as exhaustive is worse than no list. (open)
- **Cross-repo reach.** The private parity sibling carries the same practice tree, so the propagation
  pass has to decide whether this addition is one repo's or both.

## What success looks like + promotion signal

Success: a reader who hits this condition recognizes it from the transcript within one reading of the
rule, and an executor deciding how to run four projects' targets can tell from the rule alone that
`run-many` is the shape that needs the boundary most. No further host-recovery interruption from this
cause.

**Promotion signal**: this does not need a full plan unless the enforcement question is answered
"enforced" — a prose addition is one propagation run. Promote only if the decision lands on a hook or
gate change, which brings its own scenario coverage and cross-repo parity obligations. A second
independent host-exhaustion incident from the same shape would also force promotion regardless.
