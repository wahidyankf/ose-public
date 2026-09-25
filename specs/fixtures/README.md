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

A mismatch means the local corpus changed. Restore the adopted bytes, or adopt a newer catalog copy explicitly together
with its `SHA256SUMS` — never a local edit to make the check pass.
