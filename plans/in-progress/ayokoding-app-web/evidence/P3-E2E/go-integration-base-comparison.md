# ayokoding-web:test:integration failure on the base revision

`ayokoding-web:test:integration` (heavy, ephemeral) fails on the worktree in
`apps/ayokoding-web/tests/integration`, test `TestSavingsRowMatchesSharedVectors`
(`calculator_vectors_test.go:208`). The failure is not caused by this unit.

## Evidence

- Worktree run: [go-test-integration-1.raw.txt](./go-test-integration-1.raw.txt).
- `git diff --stat 5d61ca0bc -- apps/ayokoding-web/internal apps/ayokoding-web/tests/integration` is empty. This unit
  changed neither the calculator code nor the integration test.
- Base revision `5d61ca0bc` extracted into a scratch tree (git-ignored `local-tmp/`), with the generated
  `data/`, `internal/web/assets/dist`, and `libs/ayokoding-data` copied in (the first two are git-ignored generated outputs, copied from the worktree, whose inputs this unit did not change), then the single
  test run: same assertion, same line, same values.

| Source           | `EssentialSavings` for `singapore`               |
| ---------------- | ------------------------------------------------ |
| Worktree         | `846.3808000000001` expected `846.3807999999999` |
| Base `5d61ca0bc` | `846.3808000000001` expected `846.3807999999999` |

The test compares exact float64 values. The difference is the last bit of the floating-point sum, which the calculator
produces on this host and the shared vector file records differently. The owner of the calculator vectors decides
whether to pin a tolerance or correct the vector. This unit owns neither, so it does not change either.
