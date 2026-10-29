# P2 CI setup action RED: the contract test against the pre-migration workflows

## Result and scope

Genuine RED captured on 2026-10-29. `scripts/setup-podman-contract.test.mjs` was first committed with the action it
tests (`24a4c54d4`), so no failing run existed. This record runs the unmodified test against the baseline tree of
commit `71bb3aa5`. Ten of 15 tests failed (exit 1). The five that passed are the preserved-contract assertions.

## Method

Same as `callers-red.md`: the baseline `.github/` and `scripts/` come from `git archive 71bb3aa5`, extracted to
`<short-tmp>/d2p-red/`. The test was copied from `HEAD` byte-identical and not edited. It resolves its paths from its
own location, so it read only baseline files. Command, from the scratch root:
`rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- node --test scripts/setup-podman-contract.test.mjs`,
`TMPDIR=<short-tmp>`. Exit code 1. Tests 15, pass 5, fail 10. This is a behavioural RED: the baseline workflows are
syntactically valid, and `actionlint` was not part of this capture.

## Failing tests (10)

| Test                                                                                | Failure on the baseline                                                                             |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| setup-podman pins one reviewed Podman row for ubuntu/resolute/amd64                 | `ENOENT` reading `.github/actions/setup-podman/action.yml`: the action does not exist               |
| setup-podman asserts a rootless engine and the explicit podman-compose provider     | same `ENOENT`                                                                                       |
| setup-podman checks the Ubuntu candidate, archive origin and installed Podman       | same `ENOENT`                                                                                       |
| `action.yml` uses no Docker action, no docker command and no Buildx                 | same `ENOENT`                                                                                       |
| `publish-images.yml` uses no Docker action, no docker command and no Buildx         | `Docker actions must not be used`: actual `['      - uses: docker/login-action@v3', ...]` (2 lines) |
| `_reusable-be-build-deploy.yml` uses no Docker action, no docker command, no Buildx | `Docker actions must not be used`: actual 1 line, `docker/login-action@v3`                          |
| `publish-images.yml` logs in with `--password-stdin` and an ephemeral auth file     | `at least one podman login step`: there is none                                                     |
| `publish-images.yml` builds with `podman build --layers --format docker` and pushes | `each build tags :latest and :<sha>`: `4 !== 0` (the Docker-era build lines do not match)           |
| `_reusable-be-build-deploy.yml` logs in with `--password-stdin` and an auth file    | `at least one podman login step`: there is none                                                     |
| `_reusable-be-build-deploy.yml` builds with `podman build` and pushes every tag     | `each build tags :latest and :<sha>`: `2 !== 0`                                                     |

The Docker-era publish commands are visible in `callers-red.md`: `publish-images.yml` lines 63, 67, 68, 87, 91, 92 and
`_reusable-be-build-deploy.yml` lines 41, 45, 46 run `docker build` and `docker push`.

## Passing tests on the baseline (5): the unchanged external contract

- `publish-images.yml` keeps the pinned triggers and permissions.
- `publish-images.yml` keeps the pinned GHCR image names and tags.
- `_reusable-be-build-deploy.yml` keeps the pinned triggers and permissions.
- `_reusable-be-build-deploy.yml` keeps the pinned GHCR image names and tags.
- The caller workflows keep their pinned image-name inputs.

These passing on the baseline shows the constants in the test are the pre-migration triggers, permissions, repository
names, tags and caller inputs, and that the migration left them unchanged (they also pass on the migrated tree).

## GREEN (migrated tree)

On the working tree the same test file passes 16 of 16, exit 0 (15 original tests plus the e2e-job test recorded in
`evidence/P2/cli-ci-rediscovery.md`). The previous recorded run was 197 of 197 across the validators
(`evidence/P2/local-gates.md`).
