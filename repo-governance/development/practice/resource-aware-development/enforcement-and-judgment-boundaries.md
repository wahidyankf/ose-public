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
above untouched. The `.claude/`, `.opencode/`, and `.commandcode/` bindings route native policy through the repository-owned
`scripts/agent-policy-hook.sh`. The endpoint composes
compute admission and repository-protected paths; subagents use the same bindings. Command Code's
[native settings](../../../../.commandcode/settings.json) and
[policy bridge](../../../../.commandcode/hooks/run-policy-hook.sh) remain repository-owned.

Codex 0.161 retains its existing global and repository-native guards; Serena and new destination routing are deferred.
Its role loader omits MCP overrides, and shell hook payloads omit the requested working directory.

The repository owns the guard and its policy. The three migrated user-global settings allow ordinary operations
without approval prompts. A neutral machine adapter routes cross-repository operations to the
destination checkout's endpoint and contains no HIPPO or secret classifier. Repository-native
hooks evaluate their own physical checkout, avoiding a duplicate decision in the global adapter.
Existing compute-admission exemptions remain governed by each checkout's owning policy.

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
