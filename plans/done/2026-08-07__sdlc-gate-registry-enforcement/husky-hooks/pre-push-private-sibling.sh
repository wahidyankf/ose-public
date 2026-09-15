#!/usr/bin/env sh
set -e

# Generated shim — do not add checks here. Declare them in repo-config.yml
# under `gates:` with a `pre-push` surface.
#
# Path-gated entries carry their own trigger lists in the registry, so the
# hand-written `git diff --name-only @{u}..HEAD` block this file used to carry
# is gone; `gate run` computes the changed set itself and skips entries whose
# triggers miss. Heavy tiers (test:integration, test:e2e) are never declared on
# any gate surface — see tech-docs 2.2.3.
cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- \
	gate run --surface=pre-push
