# Baseline — M9 Rust Version Declarations (2026-08-09)

Reproduces the DD-9 evidence table (`tech-docs.md` §DD-9) from a fresh capture in this session.
Three independent sources of truth, all disagreeing today.

## Source 1 — `rust-toolchain.toml` → `channel` (what `cargo` actually builds with)

| Repo                | Path                                         | `channel` |
| ------------------- | -------------------------------------------- | --------- |
| ose-public          | `libs/rust-commons/rust-toolchain.toml`      | `1.95.0`  |
| ose-public          | `apps/ayokoding-cli/rust-toolchain.toml`     | `1.95.0`  |
| ose-public          | `apps/rhino-cli/rust-toolchain.toml`         | `1.95.0`  |
| ose-public          | `apps/ose-cli/rust-toolchain.toml`           | `1.95.0`  |
| ose-primer          | `rust-toolchain.toml`                        | `1.95.0`  |
| ose-primer          | `apps/rhino-cli/rust-toolchain.toml`         | `1.95.0`  |
| ose-primer          | `apps/crud-be-rust-axum/rust-toolchain.toml` | `stable`  |
| The private sibling | `apps/coralpolyp-be/rust-toolchain.toml`     | `stable`  |
| The private sibling | `apps/rhino-cli/rust-toolchain.toml`         | `1.95.0`  |
| beaver-nest         | `apps/rhino-cli/rust-toolchain.toml`         | `1.95.0`  |
| beaver-nest         | `libs/rust-commons/rust-toolchain.toml`      | `1.95.0`  |

**Tally: `1.95.0` at 9 sites; `stable` at 2 sites (`crud-be-rust-axum`, `coralpolyp-be`)** — matches
`tech-docs.md` §DD-9 exactly. `beaver-nest` matches the expectation of `1.95.0` at both its sites; no
divergence observed.

## Source 2 — `Cargo.toml` → `rust-version` (MSRV floor)

| Repo                | Path                                | `rust-version` |
| ------------------- | ----------------------------------- | -------------- |
| ose-public          | `libs/rust-commons/Cargo.toml`      | `1.88`         |
| ose-public          | `apps/ayokoding-cli/Cargo.toml`     | `1.88`         |
| ose-public          | `apps/rhino-cli/Cargo.toml`         | `1.88`         |
| ose-public          | `apps/ose-cli/Cargo.toml`           | `1.88`         |
| ose-primer          | `apps/crud-be-rust-axum/Cargo.toml` | `1.94.0`       |
| ose-primer          | `apps/rhino-cli/Cargo.toml`         | `1.88`         |
| The private sibling | `apps/coralpolyp-be/Cargo.toml`     | `1.88`         |
| The private sibling | `apps/rhino-cli/Cargo.toml`         | `1.88`         |
| beaver-nest         | `libs/rust-commons/Cargo.toml`      | `1.88`         |
| beaver-nest         | `apps/rhino-cli/Cargo.toml`         | `1.88`         |

**Tally: `1.88` at 9 sites; `1.94.0` at 1 site (`crud-be-rust-axum`)** — matches `tech-docs.md` §DD-9
exactly.

## Source 3 — `doctor`'s expected-rustc

`apps/rhino-cli/src/application/doctor/tools.rs` (`tool_defs_rust`) declares:

```rust
source: "apps/rhino-cli/Cargo.toml → rust-version".into(),
```

i.e. `doctor` validates the installed `rustc` against the **MSRV floor** (`1.88`), never the
`rust-toolchain.toml` channel (`1.95.0`) that `cargo` actually builds with. Confirmed unchanged from
`tech-docs.md` §DD-9's description.

## Three distinct declared values (as required by the Phase 0 acceptance criterion)

1. `1.95.0` — the dominant `rust-toolchain.toml` channel (9/11 sites)
2. `1.88` — the dominant `Cargo.toml` rust-version floor (9/10 sites), and the value `doctor` checks
   against
3. `stable`/`1.94.0` — the two outlier declarations (`ose-primer`'s and the private sibling's
   `crud-be-rust-axum`/`coralpolyp-be`), each disagreeing with its own repo's dominant value

## Machine toolchain inventory

`rustup toolchain list` on this machine:

```text
stable-aarch64-apple-darwin (active, default)
1.80-aarch64-apple-darwin
1.88-aarch64-apple-darwin
1.94-aarch64-apple-darwin
1.95.0-aarch64-apple-darwin
1.96.0-aarch64-apple-darwin
```

`rustc --version` (active): `rustc 1.94.0 (4a4ef493e 2026-03-02)` — reported by `stable`, currently
resolving to `1.94.0`, not any of the 9 dominant `1.95.0` pins. Six toolchains installed; per
`tech-docs.md` §D.1, `1.80` (1.1 GB), `1.94` (1.2 GB), and `1.96.0` (952 MB) are pinned by nothing in
any of the four repos.
