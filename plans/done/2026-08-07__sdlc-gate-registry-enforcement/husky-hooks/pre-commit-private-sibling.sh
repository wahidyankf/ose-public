#!/usr/bin/env sh
set -e

# Generated shim — do not add checks here. Declare them in repo-config.yml
# under `gates:` with a `pre-commit` surface; `gate run` executes them in
# declaration order, which is why the registry lists the staged guard first,
# then the per-file pass, then the re-staging mutations.
#
# `gate run --surface=pre-commit` delegates the per-file dispatch to
# `npx lint-staged`, whose block in package.json is itself generated from the
# registry by `gate emit`. lint-staged keeps its stash-and-restore safety.
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- \
	gate run --surface=pre-commit
