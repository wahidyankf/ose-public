## Example code for rust-in-depth

One folder per worked example: `ex-NN-<slug>/` holds the Rust sources, its `run.yaml` (`toolchain: rust`, standard library only), and the recorded output under `expected/`. Single-file units compile with `rustc main.rs -o main`; testing-convention units compile with `rustc --test suite.rs -o unittest` with timing normalized out of the transcript; the cfg unit passes `--cfg lesson`; the rustfmt unit runs `rustfmt --check` first; the tooling chapter's linter transcripts ride in illustration fences beside their fixed-shape units. No example needs the network, the clock, or random seeds: fixed inputs keep every run byte-deterministic.

The `.rs` files are heavily annotated in the `// =>` notation. The lesson pages embed every file byte-identically. No `Cargo.toml` is needed anywhere in `learning/code/`: with zero dependencies there is nothing to pin, and the capstone's manifest-reading habit is taught where a manifest actually exists.
