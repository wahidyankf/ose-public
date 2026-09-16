---
description: Which gates check this practice, and which parts are unenforced by decision with their reasons.
when_to_use: Use when asking how a resource-aware obligation is enforced, or why one deliberately is not.
---

# Enforcement and Judgment Boundaries

Bootstrap, config, entrypoint, mapping, smoke, and upstream scheduler tests gate the executable
contract. Plan validation checks guards, classes, edges, and justified serialization. Novel class
choice and safe human retry remain **unenforced by decision** because they require intent, and
container init because no OSE container runs HIPPO yet.

## Boundary presence is enforced; boundary class is not

`.claude/hooks/require-hippo-boundary.sh` refuses a compute-bearing agent command that carries no
outer boundary, **before the process spawns**. It decides only _whether_ a boundary is present — a
binary, mechanical property — and never _which_ class is correct, so it leaves the judgment boundary
above untouched. All three harnesses bind it: `.claude/settings.json`, `.codex/hooks.json`, and
`.opencode/opencode.json`'s `permission.bash` map.

The same file is also installed machine-wide, and the two placements do different jobs. The
repository copy is the durable, reviewable one — version-controlled, travelling to other machines
and to contributors, keeping the rule and its enforcement in one place. The machine-wide copy covers
what a repository copy structurally cannot: a repository that does not carry one yet, a fresh clone,
a scratch directory. A guard is skipped in any tree with no `./hippo` consumer, because a correction
naming an absent tool is one that gets switched off.

An unadmitted node is invisible to the ledger, so the host can reach critical pressure while
`hippo status` still reports `normal`: nothing on the HIPPO side can defer or shed work it was never
told about. That failure is unrecoverable after the fact, which is why presence is refused rather
than reported. A wrong _class_, by contrast, still admits the work and still accounts for it, and so
stays unenforced by decision alongside the judgments named above.

A reservation is also not a hard RSS limit — the ledger knows what an owner _asked for_, not what it
goes on to allocate. Admission is therefore necessary and never sufficient. What actually bounds a
run is the worker mapping in
[Guarded Admission and Parallelism](./guarded-admission-and-parallelism.md), which `./hippo run`
exports and nothing else does — so bypassing the boundary discards the clamp as well as the
accounting.

`npm run <script>` is outside the guard by design: those scripts carry their own boundary, and an
outer one makes the inner call wait on its own ancestor's lease.

Two residual gaps, recorded rather than hidden. A command reached through an intermediary — a shell
script, a Makefile target, an alias, an interpreter — still passes; text matching cannot close that
in principle. And enforcement reaches only what a harness exposes: Codex fires its pre-tool hook for
shell calls but not for file-tool calls, so any execution path outside a guarded shell call is
unguarded.
