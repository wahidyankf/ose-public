---
description: The rules holding apps/rhino-cli, and the safety-load-bearing agent guard scripts, to a stricter byte-identical standard.
when_to_use: Use when changing anything under apps/rhino-cli or .claude/hooks/, and when verifying cross-repo parity obligations.
---

# Cross-Repo rhino-cli Byte-Identity Standard

`apps/rhino-cli` is the one project held to a stricter, cross-repo standard beyond the per-project
`inputs`/caching rules above. Four rules govern it, in force across `ose-public` and the private sibling
— the only two repos in the parity set:

1. `apps/rhino-cli`'s `src/`, `Cargo.toml`, `Cargo.lock`, `project.json`, and `LICENSE` MUST be
   byte-identical across `ose-public`/the private sibling with zero carve-outs (carrying the
   union command superset).
2. Every Nx-registered project in every repo (per `nx show projects` — this includes the
   `*-contracts` projects rooted under `specs/apps/*/*/contracts/`, which a directory-only
   `apps`/`libs` scan cannot see) MUST declare `namedInputs.specs`.
3. rhino-cli's own behaviour MUST be cucumber-covered in both repos.
4. Both `repo-config.yml` files MUST carry an identical key set (the schema-parity gate,
   enforced by `rhino-cli repo-config validate`).

## Safety-load-bearing guard scripts

A guard script under `.claude/hooks/` is **safety-load-bearing** when it is the only technical
control standing between an agent and an unrecoverable outcome. Two qualify today:
`block-env-file-access.sh` and `require-hippo-boundary.sh`. Both MUST be byte-identical everywhere
they are deployed — across repositories, and across the repository and machine-wide layers — under
the same union-superset rule as `apps/rhino-cli`: one script names the union of all consuming
ecosystems' verbs and lets the inapplicable arms sit inert, rather than forking into variants.

The superset rule is the enforcement mechanism, not a stylistic preference. Two variants of one
guard is how drift hides: a hardening fix lands in whichever copy was being edited and is never
ported, and nothing detects it because both copies still appear to work. A single byte-identical
file makes parity checkable by checksum.

Harness bindings follow the same rule. A harness MUST reference the canonical script rather than
hold its own copy, which is why `.codex/hooks.json` points into `.claude/hooks/`. Where a harness
offers no equivalent mechanism, or covers only part of its tool surface, the resulting gap is
recorded in
[Enforcement and Judgment Boundaries](../../practice/resource-aware-development/enforcement-and-judgment-boundaries.md)
rather than left silently absent.

See [SDLC Gate Standard §rhino-cli Byte-Identity Boundary](../../../../docs/reference/sdlc-gate-standard.md#rhino-cli-byte-identity-boundary)
for the divergence-policy boundary this standard establishes, and
[tech-docs.md §4 "rhino-cli Source-Identity Standard"](../../../../plans/done/2026-07-03__unify-rhino-cli-sdlc-parity/tech-docs.md#4-rhino-cli-source-identity-standard)
for the full synthesis approach.
