# Owned-server port selection and the retry

## What changed

- `apps/ayokoding-web-fe-e2e/tests/e2e/support/servers.ts`: `spawnBinary` makes one attempt. The five-attempt loop, its
  `bind: address already in use` retry, the backoff, and `withFreshPort` are removed. A collision now fails the spawn with
  the server's stderr.
- `apps/ayokoding-web-fe-e2e/tests/e2e/steps/localdev.steps.ts`: `launch` no longer copies retry-changed ports back into
  state. `flagValue` had no other caller and is removed.
- The be home's `startOwnedBinary` already made one attempt, and it is unchanged.

No `retries` setting, `test.skip`, or `reuseExistingServer` changed in any config. `retries: 0` and
`reuseExistingServer: false` remain in all three Playwright configs.

## What port selection can do

`freePort()` still binds port 0 on loopback, reads the OS-assigned number, and closes the probe before the server binds
the same port. Between those two steps another process can take the port. That race is not fully removed.

The binary cannot report an OS-assigned port. `cmd/ayokoding-web/main.go` binds `127.0.0.1:<AYOKODING_WEB_PORT>` (line 69)
and prints nothing when it starts, so a test cannot learn an ephemeral port 0 from it. Removing the race needs a product
change: the server would print its bound address once it listens, and the suite would start it with port 0 and read that
line. That change is a product behaviour change, so it is not part of this unit. A collision now fails loudly and is
never silently retried.

## Verification

- fe `test:e2e` on the final tree: 276 passed ([fe-e2e-4.raw.txt](./fe-e2e-4.raw.txt)). The local-development scenarios
  that spawn servers pass without the retry.
- fe `typecheck` and `lint`: pass after the edit, with the lint warning on the `corpusEnv` spread fixed.
