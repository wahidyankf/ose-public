# P1 preflight evidence

This file records the RED, GREEN, and REFACTOR runs for `scripts/container-runtime-check` and its test,
`scripts/container-runtime-check.test.mjs`. It is a sanitized copy of untracked scratch receipts. It states
only what those receipts say. Where a receipt gives no exit code, the table says so.

Command shape for every focused run:
`./hippo run --class ephemeral --resource-tier light --disk-path . -- node --test scripts/container-runtime-check.test.mjs`.

## Tool versions

Podman 5.7.0 and podman-compose 1.6.0, from `podman-compose --version` (exit 0).

## Test identities

The test file defines nine tests. The receipts count passes but do not map each failure to a title, so
these titles come from the tracked test file.

1. rootless engine succeeds silently and explicitly selected provider defeats competitor
2. rootful, unreachable and malformed engines stop before provider
3. missing and non-executable engine return shell statuses
4. lookup skips blocked PATH candidates for engine, jq and provider
5. interrupted jq preserves its signal status
6. fake probes reject workload and incorrect provider arguments
7. compose requires selected executable and exact provider identity and version
8. invalid arguments are rejected before probes
9. missing jq returns 127 and interrupted probes retain signal status

## Outcome table

| Step                                                              | Result                                                                                                               | Exit code                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| RED 1, against an executable stub                                 | Assertion failures: 4 failed, 1 passed                                                                               | Not stated in the receipt |
| GREEN 1, after implementation                                     | 5 of 5 passed                                                                                                        | Not stated in the receipt |
| RED 2, after adding missing-jq and signal                         | Assertion failure: expected 127, got 125                                                                             | Not stated in the receipt |
| GREEN 2, after the missing-jq distinction                         | 6 of 6 passed                                                                                                        | Not stated in the receipt |
| GREEN 2, rerun after the peer drained, and rerun after formatting | 6 of 6 passed each time                                                                                              | 0 and 0                   |
| RED 3, review findings A1 to A3                                   | Assertion failures: jq 125 vs 143, PATH candidate 126 vs 0, fake unexpected argv 0 vs 90, and wrong call-log content | 1                         |
| GREEN 3, after implementation                                     | 9 of 9 passed                                                                                                        | 0                         |
| GREEN 3, after formatting                                         | 9 of 9 passed (focused 9/9)                                                                                          | 0                         |

Every RED failure is an assertion failure against absent or wrong behavior, not a syntax or import error.

## REFACTOR and supporting gates

| Gate                                                                               | Result                                                                                                                                                     | Exit code                                                   |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run test:validators`                                                          | 144 of 144 passed, before the final test formatting edit                                                                                                   | 0                                                           |
| `npm run test:validators`, after review findings A1 to A3                          | No tests ran: HIPPO deferred admission for capacity. The 144 of 144 result covers the earlier source state only                                            | 124                                                         |
| `shellcheck scripts/container-runtime-check`                                       | Clean                                                                                                                                                      | 0 (three runs, one combined with shfmt and Prettier checks) |
| `shfmt -d scripts/container-runtime-check`                                         | First run found formatting differences; `shfmt -w` applied; later runs clean                                                                               | 1, then 0                                                   |
| `prettier --check` on the test file and `package.json`                             | Failed after a test edit; `prettier --write` on the test file fixed it; recheck clean                                                                      | 1, then 0, then 0                                           |
| `./rhino toolchain validate`                                                       | First run: fantomas, csharpier and dart unavailable. After an invocation-only PATH fix: 25 declared toolchains, no findings                                | 1, then 0                                                   |
| `PODMAN_COMPOSE_PROVIDER=podman-compose scripts/container-runtime-check --compose` | Silent success on the native Ubuntu engine                                                                                                                 | 0                                                           |
| `prettier repo-config.yml` diffed against the file                                 | One difference, on an existing `AYOKODING_WWW_BUILD_WORKERS` line owned elsewhere. The Podman declarations are unchanged by formatting. No rewrite applied | 1                                                           |

Three calls (the final focused test, the shfmt check, the Prettier check) returned HIPPO status 125 earlier
because a peer reservation mode was active. No tests ran in those calls. They were rerun after the peer
drained, and the table reports the rerun results.

## Limits of this proof

- The fake competitor and the direct provider version probe do not prove native `podman compose` wrapper
  dispatch. That is a separate acceptance item.
- The Phase 1 item asks for doctor output on both supported platforms. The receipts hold a `./rhino toolchain
validate` run on Ubuntu only. No macOS doctor run is in them.
- The receipts do not include the fake call log text. They do not show it here.

## Omitted

- The scratch receipts name a HIPPO machine configuration path, a config hash prefix, an SDK PATH list, and an
  owned temporary directory path. These are host details and are left out.
- The scratch file `red.log` is not used. It holds a RED run of a different test,
  `scripts/container-healthcheck-loopback.test.mjs`, which is not Phase 1 preflight evidence.
