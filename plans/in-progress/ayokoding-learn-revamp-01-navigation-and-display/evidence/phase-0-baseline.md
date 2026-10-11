# Phase 0 Baseline — AyoKoding Learn Revamp 01

> Evidence per delivery.md Phase 0. Repository-relative paths only.

- **Date**: 2026-10-10
- **Branch**: `ayokoding-learn-revamp-01-navigation-and-display` (delivery branch) at `4df1f41b3`
  (promotion merge #677; synced with `origin/main`)
- **Environment notes** (root causes fixed before the baseline):
  - The shell exports `NODE_ENV=production` (user rc + session env). Plain installs skip
    devDependencies (npm `omit` default resolves to `["dev"]`); every install in this session runs
    with `--include=dev`. `npm ci --include=dev` rebuilt the partial `node_modules` (root `.bin`
    39 → 106 entries).
  - Test commands strip `NODE_ENV`: component tests fail en masse under `NODE_ENV=production`
    (react-dom resolves the production test-utils build where `React.act` does not exist).
    All baseline runs below used `env -u NODE_ENV`.

## Baseline Results

| Command     | Exit | Result                                                                                                                                                                           |
| ----------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QUICK`     | 0    | `test:unit`: 161 test files passed, 3239 tests passed; typecheck, lint, and every `test:coverage:*` target green; `Successfully ran target test:quick for project ayokoding-www` |
| `E2E-QUICK` | 0    | `Successfully ran target test:quick for project ayokoding-www-fe-e2e`                                                                                                            |
| `E2E`       | 0    | 998 passed, 4 skipped (environment guards), 0 failed, 8.1m. Run note: the plain                                                                                                  |

target command was repeatedly terminated by `hippo.limit.pressure-shed` (host memory warning at
the run's tail; 814–815/818 scenarios green with zero failures before each shed). Root-cause
mitigation: ran the target's own steps with a lower peak footprint —
`nx run ayokoding-www:build` (cache), `npx bddgen`, then
`AYOKODING_WEB_MANIFESTS_DIR=… AYOKODING_WEB_SHOW_DRAFTS=true npx playwright test --workers=3`
(the config's default is 6 workers; `CI=1` was rejected because it drops firefox/webkit). Every
scenario still runs in all three browsers. Orphaned webServers from the shed runs were killed
(ports freed) before this run. |
| `VALIDATE-INDEXES` | 0 | `Successfully ran target validate-indexes for project ayokoding-www` |
