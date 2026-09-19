# Fixture Corpora

Shared fixtures this repository verifies against rather than authors.

## Corpora

- [plan-structure/](plan-structure/README.md) — the plan-structure corpus. This copy is
  byte-identical to the `ose-rules` catalog, pinned by `CORPUS-DIGEST`, and regenerated nowhere.

## Verifying

```bash
cd specs/fixtures/plan-structure
shasum -a 256 -c SHA256SUMS
shasum -a 256 SHA256SUMS | cut -d' ' -f1   # must equal CORPUS-DIGEST
```

A mismatch means the corpus moved. The fix is upstream in the catalog, then a fresh copy and a new
digest — never a local edit to make the check pass.
