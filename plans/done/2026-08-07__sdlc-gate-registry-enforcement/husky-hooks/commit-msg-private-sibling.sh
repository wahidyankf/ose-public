#!/usr/bin/env sh
set -e

# Generated shim — do not add checks here. Declare them in repo-config.yml
# under `gates:` with a `commit-msg` surface; `gate run` executes them in
# declaration order. `rhino-cli gate validate` fails if this file and the
# registry disagree.
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- \
	gate run --surface=commit-msg -- "$1"
