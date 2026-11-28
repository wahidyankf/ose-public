# Savings vector failure: arm64 fused multiply-subtract

Test: `apps/ayokoding-web/tests/integration` `TestSavingsRowMatchesSharedVectors` (exact float64 comparison against
`libs/ayokoding-data/test-vectors/calculator.json`). It failed on this arm64 host with `EssentialSavings` one ulp away from
the vector. Base revision `5d61ca0bc` fails identically.

## Measured inputs (singapore, first vector)

Read from the calculator functions at runtime: `rate = 0.7744` (bits `3fe8c7e28240b780`), `net = 4500`, local essentials
`X = 4718`. Node (IEEE, no fusion) and a plain Go expression give `846.3807999999999`, the value in the vector.

## Root cause

The compiler fused a multiply with a later subtraction. This is allowed by the Go spec across statements. The fused
instruction rounds once, which moves the last bit.

- Before any change: `SavingsRowFor` contained `FMSUBD` at the lines computing `essential` and `afterLifestyle`
  (`calc.go` lines 217 and 218 at that revision).
- An explicit `float64(...)` conversion around the product did not stop the fusion on this toolchain. The assembly showed
  `FNMSUBD` at the `essential` subtraction (`calc-asm-after` listing, line 220).
- `NetUSD` (`gross * (1 - rate)`), inlined into `SavingsRowFor`, was a third product that fused with the `net - essentials`
  subtraction.

Assembly evidence (fused-op count inside `SavingsRowFor`, from `go build -gcflags=-S ./internal/tools/calculator`):

| State                                              | Fused ops in SavingsRowFor                                         |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Original                                           | 2 (`FMSUBD`)                                                       |
| Explicit `float64(...)` conversions only           | 1 (`FNMSUBD`, the `essential` line)                                |
| `mulRounded` around the two savings products       | 1 (`FNMSUBD`, the `essential` line, fused with `NetUSD`'s product) |
| `mulRounded` in `NetUSD` and both savings products | 0                                                                  |

## Tiny Go check (outside the repo)

Scratch program `fused` versus explicitly rounded `z - x*y` on arm64, 200000 cases: 35783 differ (about 18 percent).
First difference: `x=19.3019 y=1.0137 z=4500.25 fused=4480.68366397 rounded=4480.6836639699995`. The program is kept in the
scratchpad, not the repository.

## Fix

- `calc.go`: a `//go:noinline` helper `mulRounded(a, b float64) float64 { return a * b }` keeps each product behind a call
  boundary. `NetUSD` and both savings products use it. The values are the same IEEE products in the same order that
  `apps/ayokoding-www/src/features/cost-of-living-calculator/core/calc.ts` computes (`essUsd = essLocal * rate`,
  `essential = net - essUsd`, `afterLifestyle = essential - lifestyleUsd`).
- The shared vectors and the exact comparison are unchanged. A regression note was added above the test.

## Deviation from the coordinator's brief

The brief said an explicit `float64(...)` conversion prevents fusion. It did not, on this toolchain (Go 1.26.1, arm64).
The fix uses a non-inlined call instead, which the assembly confirms.

## Result

- `TestSavingsRowMatchesSharedVectors`: pass.
- `internal/tools/calculator` unit tests: pass.
- `ayokoding-web:test:integration`: pass (see `go-test-integration-2.raw.txt`).
