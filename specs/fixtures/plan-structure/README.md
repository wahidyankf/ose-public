# Plan Structure Fixture Corpus

Twenty-six synthetic cases: six a conforming validator accepts, twenty it rejects, one rule at a time.

Every case is invented. No path, name, or body is taken from a real repository.

## Layout

```text
accepted/<NNN>-<slug>/plans/...      a tree a validator must accept
rejected/<NNN>-<slug>/plans/...      a tree a validator must reject
manifest.tsv                         case, expected exit, expected rule identifiers, note
SHA256SUMS                           per-file digests over every corpus file
README.md                            this file; excluded from the digests, like SHA256SUMS
```

## The Bytes Are the Fixture

More than one implementation validates plan structure, and a comparison between them is only meaningful over the same
bytes. That is why this corpus is excluded from the repository's formatter and Markdown linter: a reformat here is not
a cosmetic change, it silently alters what the suite tests.

This copy is owned here. Nothing pins it to `ose-rules`, and nothing obliges this repository to notice that the
catalog moved.

## Changing the Corpus

Adding a case is normal. Editing one is not, unless the rule it encodes changed.

Any change regenerates `SHA256SUMS` in the same change, so the integrity check keeps describing what is actually
here.

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
