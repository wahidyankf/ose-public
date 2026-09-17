---
description: The init gap for projects whose generated sources are gitignored, which need their own codegen target run once before a language server or build can resolve them.
when_to_use: Use when an editor or build reports an unresolved import naming a generated package right after provisioning a worktree.
---

# Per-Project Generated Sources

A second gap the two-step init does not cover, alongside
[per-project dependency restoration](./per-project-dependency-restoration.md). It is one-time,
worktree-local, and requires no source or config changes.

Generated contract code is **never committed** — the root `.gitignore` ignores
`**/generated-contracts/` and `**/generated_contracts/`, and no such file is tracked anywhere in
the repository. Every freshly provisioned worktree therefore starts without it, and it appears
only once that project's `codegen` target runs:

```bash
# Run once per project whose generated sources are absent, e.g. roots-be
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run <project>:codegen
```

The rule: run a project's `codegen` target once in a freshly provisioned worktree before running
its Nx targets directly or trusting a language server's diagnostics for it.

Some contract owners also gitignore their bundled OpenAPI spec (`a-demo`, `ose/lms-be`, and
`roots/be` do; `organiclever/be` and `ose/be` commit theirs), so that may be missing too. Every
`codegen` target declares `dependsOn: ["<owner>-contracts:bundle"]`, so the single command above
rebuilds the spec and the code together — there is no separate step to remember.

## Why It Surfaces in the Editor First

`typecheck`, `build`, and — where the compiler needs generated code — `test:unit` all declare
`dependsOn: ["codegen"]`, so an Nx invocation regenerates what it needs and never observes the
gap. A language server does not go through Nx. It reads the working tree directly, finds no
generated package, and reports a broken import against committed, correct source.

Symptom: an unresolved-import diagnostic naming a path under a project's declared codegen
`outputs` — for Go, `could not import …/generated-contracts (no required module provides package)`
— in a worktree where that project's `codegen` has never run. Root-cause it to this gap before
assuming a regression. It reproduces on every freshly provisioned worktree, not just once.

Passing observation: the paths in the project's codegen `outputs` exist, and
`nx run <project>:typecheck` succeeds.

## Why Not Commit Them Instead

Committing generated output trades this one-time step for a permanent drift class — output that
can disagree with the spec it came from — policed by a review gate that has to be built and kept
green. The `dependsOn` chain makes drift unrepresentable instead: nothing consumes generated code
without regenerating it first.

## Related Documents

- [Per-Project Dependency Restoration](./per-project-dependency-restoration.md) — the F#/.NET sibling gap.
- [Codegen Dependency Chain](../../infra/nx-targets/codegen-dependency-chain.md) — the `dependsOn` wiring that makes Nx invocations immune.
- [OpenAPI Contract-First](../../pattern/openapi-contract-first.md) — the pattern that owns codegen.
