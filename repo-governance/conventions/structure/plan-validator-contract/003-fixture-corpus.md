---
description: >-
  Defines the shared plan-structure fixture corpus, its manifest, its digest, and the rule that every implementation
  reads the same bytes.
when_to_use: >-
  Use when running a validator against the corpus, adding a case, or verifying that two implementations agree.
---

# The Shared Fixture Corpus

The corpus lives at `specs/fixtures/plan-structure/`. Every implementation of this contract runs against it, and
agreement between implementations means agreement on these exact bytes.

## Contents

```text
accepted/<NNN>-<slug>/plans/...   a tree that must produce exit 0
rejected/<NNN>-<slug>/plans/...   a tree that must produce exit 1
manifest.tsv                      case, expected exit, expected rule identifiers, note
SHA256SUMS                        per-file digests over every corpus file
CORPUS-DIGEST                     one digest over SHA256SUMS
```

`manifest.tsv` is the contract's test table. A run is correct when, for every case, the exit class matches and the set
of emitted rule identifiers equals the declared set — not merely contains it.

## One Rule Per Rejected Case

Each rejected case trips exactly one rule.

A fixture that violates three rules at once cannot tell an implementation that found all three from one that stopped at
the first, and a suite built from such fixtures reports agreement that was never tested.

## Everything Is Synthetic

No path, name, slug, or body comes from a real repository. Cases are invented to exercise a rule and describe no actual
work.

This is a safety property, not a stylistic one. The corpus is public and is copied into other repositories, so a fixture
derived from real content would carry whatever that content contained.

## Byte Identity

The corpus is excluded from this repository's formatter and Markdown linter, and that exclusion is deliberate.

A reformat is not cosmetic here. It changes bytes that other repositories verify by digest, and its first visible effect
is two implementations disagreeing for a reason unrelated to either.

## Changing the Corpus

Adding a case is routine. Editing one is not, unless the rule it encodes changed.

Any change regenerates `SHA256SUMS` and `CORPUS-DIGEST` in the same change, and is announced to every implementation
that pins the digest. Silent drift is worse than having no shared corpus, because both implementations keep reporting
agreement while testing different things.

## Verifying

```bash
shasum -a 256 -c SHA256SUMS
```

Run from the corpus root. A mismatch is a stop, not a warning: whatever the validator then reports was measured against
something other than the frozen corpus.
