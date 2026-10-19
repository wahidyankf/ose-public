# Changelog

All notable changes to `ayokoding-cli` are recorded here. The format
follows Keep a Changelog; versions are repository commits, since the CLI
ships only inside this repository.

## Unreleased

## 0.1.0

- First Go release; replaces the retired Rust link checker.
- Checks AyoKoding course code examples in pinned containers:
  `examples validate`, `sync`, `run`, `check`, `coverage`, and
  `affected`, plus `toolchains list` and `toolchains build`.
- The `ayokoding-www:examples:check` Nx target runs the harness in the
  PR gate and monthly; inert on courses with no `run.yaml`.
