---
description: The four rules holding apps/rhino-cli to a stricter, byte-identical standard across ose-public and the private sibling.
when_to_use: Use when changing anything under apps/rhino-cli and verifying cross-repo parity obligations.
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

See [SDLC Gate Standard §rhino-cli Byte-Identity Boundary](../../../../docs/reference/sdlc-gate-standard.md#rhino-cli-byte-identity-boundary)
for the divergence-policy boundary this standard establishes, and
[tech-docs.md §4 "rhino-cli Source-Identity Standard"](../../../../plans/done/2026-07-03__unify-rhino-cli-sdlc-parity/tech-docs.md#4-rhino-cli-source-identity-standard)
for the full synthesis approach.
