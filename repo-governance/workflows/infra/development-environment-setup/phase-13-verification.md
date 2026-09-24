---
description: "Phase 13: verify the pre-commit hook, pre-push gate set, one backend's integration tests, and one backend's E2E tests all work end to end."
when_to_use: "Use as the final smoke test confirming the whole environment setup actually works."
---

# Phase 13: Verification (Sequential)

**Depends on**: All previous phases

## 13.1 Verify pre-commit hook

```bash
# Create a test change and attempt a commit
echo "# test" >> /tmp/test-precommit.md
cp /tmp/test-precommit.md README.md
git add README.md
git commit -m "test: verify pre-commit hook"
# Pre-commit hook should run the declared pre-commit gates (./rhino gate list)
# Then abort: git reset HEAD~1 && git checkout README.md
git reset HEAD~1
git checkout README.md
```

**Success criteria**: Pre-commit hook runs every declared `pre-commit` gate without errors
(including `format-staged` and `markdownlint`).

## 13.2 Verify pre-push targets (cache warm)

```bash
# Run the registry gate set .husky/pre-push runs, with each gate's output
./rhino gate run --surface pre-push
```

**Success criteria**: Every declared gate passes. This also warms the Nx cache (via the
`test:quick` affected-projects gate) so subsequent pushes are fast. Discover the live gate set
with `./rhino gate list`.

## 13.3 Verify Integration tests (one backend)

```bash
# Pick any backend to validate its isolated non-network local-resource boundary
nx run organiclever-be:test:integration
```

**Success criteria**: Integration tests pass using isolated local files, embedded non-network
resources, process environment, child-process streams, or an allowlisted loopback socket the test
owns. They reach no external network and no service the test did not start.

**On failure**: Inspect the target's local fixture lifecycle and confirm every resource is isolated
and cleaned deterministically. Docker-hosted PostgreSQL and other networked services belong to the
E2E verification in the next section.

## 13.4 Verify E2E tests (one backend)

```bash
# Start a backend
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:dev &

# Wait for it to be ready, then run E2E
sleep 5
./hippo run --class ephemeral --resource-tier standard --disk-path . -- \
  npm exec nx -- run organiclever-be-e2e:test:e2e

# Stop the backend
kill %1
```

**Success criteria**: Playwright E2E tests pass against the running backend.
