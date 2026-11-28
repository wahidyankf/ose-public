# P3-E2E C4 gates on the final tree

Every gate below ran through `./hippo run` with the class and tier shown. Each log is in this directory.

| Gate                                                                             | Class and tier          | Result                                                                | Log                                                  |
| -------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| `ayokoding-web:test:quick`                                                       | ephemeral, standard     | pass                                                                  | `go-test-quick-2.raw.txt`                            |
| `ayokoding-web:build`                                                            | transactional, standard | pass                                                                  | `go-build-2.raw.txt`                                 |
| `ayokoding-web:test:integration`                                                 | ephemeral, heavy        | pass (unit vector test fixed; see `savings-arm64-fusion.md`)          | `go-test-integration-2.raw.txt`                      |
| `ayokoding-web-be-e2e:test:e2e`                                                  | ephemeral, heavy        | pass: fixture 4, real-corpus 19                                       | `be-e2e-3.raw.txt`                                   |
| `ayokoding-web-fe-e2e:test:e2e`                                                  | ephemeral, heavy        | pass: 276 across chromium, firefox, webkit                            | `fe-e2e-4.raw.txt`                                   |
| `ayokoding-web-be-e2e:test:e2e` with `BASE_URL`                                  | ephemeral, heavy        | pass: real-corpus 19, no fixture run, no server started by Playwright | `be-e2e-base-url-mode.raw.txt`                       |
| `run-many -t test:e2e -p ayokoding-web-fe-e2e ayokoding-web-be-e2e --parallel=1` | ephemeral, heavy        | pass: 276 and 4 and 19, serial on port 3191                           | `run-many-e2e-shared-port-2.raw.txt`                 |
| `ayokoding-web-be-e2e:test:behaviour:coverage`                                   | ephemeral, standard     | pass: 1002 scenarios, no findings                                     | `be-coverage-2.raw.txt`                              |
| `ayokoding-web-fe-e2e:test:behaviour:coverage`                                   | ephemeral, standard     | pass: 1002 scenarios, no findings                                     | `fe-coverage-2.raw.txt`                              |
| `ayokoding-web-be-e2e:test:quick`                                                | ephemeral, standard     | pass                                                                  | `be-test-quick-1.raw.txt`                            |
| `ayokoding-web-fe-e2e:test:quick`                                                | ephemeral, standard     | pass                                                                  | `fe-test-quick-2.raw.txt`                            |
| `./rhino md readme-index validate`                                               | direct                  | pass                                                                  | `readme-index-validate-2.txt`                        |
| markdownlint-cli2 and prettier check on changed markdown                         | ephemeral, standard     | pass (two new READMEs formatted with prettier --write first)          | `local-tmp` only; reproducible with the repo scripts |
| `npm install` (lockfile regenerated)                                             | transactional, standard | pass                                                                  | `npm-install-lock-1.raw.txt`                         |
| commit-msg gate on each commit                                                   | hook                    | pass                                                                  | commit history                                       |

## Open

- Item 48 (C6, push and pull request) is not to be done in this unit.
- The product change that removes the owned-server port race (print the bound address) is not part of this unit; see
  `server-port-and-retry.md`.
