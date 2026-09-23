---
description: "Phase 7 (full scope only): install Rust through rustup so rustfmt can format the Rust course content."
when_to_use: "Use when doctor reports rustfmt missing or when formatting Rust course content."
---

# Phase 7: Rust Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: `rustfmt`, which `scripts/format-staged` runs on staged `*.rs` files. No Nx project in
this workspace is a Rust project today; the tracked Rust sources are AyoKoding course content.
`rustfmt` is declared under `toolchains` in `repo-config.yml`, so `npm run doctor` reports it when
missing.

This phase runs before the repository bootstrap makes the pinned `./hippo` consumer available. Its
system-level installers therefore remain native and sequential; subsequent repository-local work
uses HIPPO admission.

## 7.1 Install Rust via rustup

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup component add rustfmt
```

**Success criteria**: `rustc --version` and `rustfmt --version` return version strings.
