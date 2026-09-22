# Fixture Corpora

Shared fixtures this repository verifies against rather than authors.

## Corpora

- [plan-structure/](plan-structure/README.md) — the plan-structure corpus. This copy was
  adopted from the `ose-rules` catalog and is owned here: nothing pins it upstream.

## Verifying

```bash
cd specs/fixtures/plan-structure
shasum -a 256 -c SHA256SUMS
```

A mismatch means the corpus moved. The fix is upstream in the catalog, then a fresh copy and a new
digest — never a local edit to make the check pass.
