# Plan Structure Fixture Corpus

Twenty-six synthetic cases: six a conforming validator accepts, twenty it rejects, one rule at a time.

Every case is invented. No path, name, or body is taken from a real repository.

## Layout

```text
accepted/<NNN>-<slug>/plans/...      a tree a validator must accept
rejected/<NNN>-<slug>/plans/...      a tree a validator must reject
manifest.tsv                         case, expected exit, expected rule identifiers, note
SHA256SUMS                           per-file digests over every corpus file
CORPUS-DIGEST                        one digest over SHA256SUMS
README.md                            this file; excluded from the digests, like SHA256SUMS and CORPUS-DIGEST
```

## Byte Identity

More than one implementation validates plan structure, and they are required to agree. Agreement is only meaningful if
they read the same bytes, so this corpus is the shared boundary and its digest is what other repositories verify.

That is why it is excluded from the repository's formatter and Markdown linter. A reformat here is not a cosmetic
change; it breaks every digest recorded elsewhere and makes two implementations disagree for a reason that has nothing
to do with either.

## Changing the Corpus

Adding a case is normal. Editing one is not, unless the rule it encodes changed.

Any change regenerates `SHA256SUMS` and `CORPUS-DIGEST` and is announced to every implementation that pins the digest,
in the same change. A corpus that drifts silently is worse than no shared corpus, because both implementations still
report agreement.

## One Rule Per Rejected Case

Each rejected case is built to trip exactly one rule. A fixture that violates three rules at once cannot distinguish an
implementation that found all three from one that stopped at the first.

Where one defect could plausibly trip a second rule in the same family, the contract's suppression rule decides: a rule
that cannot be meaningfully evaluated because an earlier rule in its family already failed for the same subject is not
reported.

## Verifying

```bash
shasum -a 256 -c SHA256SUMS
```

Run from the corpus root. A mismatch is a stop, not a warning.
