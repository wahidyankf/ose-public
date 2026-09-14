# Public Safety

This repository is published, so everything it emits — file contents, file names, commit messages, branch names, tags,
release notes — is outbound material. This directory is the gate that screens all of it, and it is the first gate to run
on every surface that has one.

Two scripts and the set they read, deliberately separate:

| File                    | Owns                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| `check.sh`              | what is outbound at a given surface                                 |
| `outbound-preflight.sh` | whether any of it is prohibited                                     |
| `shape-terms.txt`       | the generic private-metadata shapes screened for, alongside secrets |

The split is what lets the leaf be tested with synthetic inputs and no repository at all, and it is why the leaf never
runs `git`.

## The Gate

```bash
OSE_GATE_SURFACE=<commit-msg|pre-commit|pre-push|ci> scripts/public-safety/check.sh [hook arguments]
```

The surface arrives in the environment and nowhere else. A missing or unknown value is a protocol failure, not a
default. A gate that infers its own surface will eventually infer a weaker one, and that is exactly the case where
inferring is expensive.

| Surface      | Outbound at that moment                                           |
| ------------ | ----------------------------------------------------------------- |
| `commit-msg` | the message being written, and the current ref name               |
| `pre-commit` | the tracked tree and its names, then the staged additions         |
| `pre-push`   | the refs being pushed, the outgoing commit messages, and the tree |
| `ci`         | the ref, the head commit message, and the checked-out tree        |

`pre-commit` screens the whole tracked tree, not only the change. A leak that is already committed does not become safe
because this particular commit did not introduce it.

## The Leaf

```bash
scripts/public-safety/outbound-preflight.sh --surface <surface> \
  [--text <string>]... [--file <path>]... [--file-list <path>]... [--names-list <path>]... \
  [--terms <path>]
```

| Exit | Meaning    | What it means for publication  |
| ---: | ---------- | ------------------------------ |
|    0 | clean      | may proceed                    |
|    1 | blocked    | must not proceed; a finding    |
|    2 | scan error | must not proceed; not screened |

`1` and `2` are both refusals. They differ only in whether we know what is wrong. A scan that failed to run never counts
as a pass, and there is no allowlist, suppression, or bypass for either.

Leaf surfaces are `baseline`, `diff`, `commit`, `ref`, `pull-request`, `release`, and `logs`. A surface outside that set
exits `2`, and so does a surface given no input.

## How It Screens

Two layers, in this order:

1. **Shape screening.** Each input is matched against `shape-terms.txt`. The input's own path is screened too: a
   prohibited path is never printed, and appears as `<blocked-path>` instead.
2. **Credential scanning.** TruffleHog `v3.97.1`, pinned by SHA-256, downloaded once into a cache outside the
   repository, verified before extraction, and run offline with
   `--no-verification --no-update --fail --fail-on-scan-errors`.

Before either layer touches real material, a **canary** runs: a real RSA key generated at run time, scanned, and
required to produce a detection whose output does not contain the key. The canary proves detection _and_ non-disclosure.
A random token-shaped string would prove neither — the token detectors validate a checksum, so an invented `<token>` is
simply not detected.

## The Shape Set

`shape-terms.txt` holds shapes, never values: an absolute home directory, a private address range, an internal hostname
suffix. It is published, so a denylist of real names would publish exactly what it exists to protect.

The shapes name machines, not ranges or identifiers. A private-range CIDR network prefix — last octet `0` followed by a
prefix length — is left alone, because a range reads the same on every network that uses it; a bare address, a port, a
URL path, and a prefix with host bits set still match. An underscore continues a token on both sides of a hostname, so a
dotted API member that starts with a suffix word is code, not a host.

A workspace that must also screen for named private identifiers keeps that list outside every public checkout and passes
it with `--terms`. That second layer is the owner's, not this repository's.

The set is validated before it is trusted. A set that is missing, unreadable, empty, only comments, malformed, or
holding a credential-shaped value makes the leaf exit `2`. An empty set is refused on purpose: nothing separates it from
"this repository has nothing to screen for" — the one answer that would be wrong.

## Output

The entire diagnostic vocabulary is four fields:

```text
[public-safety] <status> <detector> <path>:<line>
```

`status` is `finding`, `scan-error`, or `blocked`; `detector` is a class name from the shape set or a TruffleHog
detector name; `path` is the input as the caller named it, screened, and never the temporary copy a scanner read; `line`
is an integer.

None of the following ever appears — not on stdout, not on stderr, not in a temporary file, not in evidence: text that
matched, the values of terms, decoder output, verification errors, commit author data, or raw scanner JSON. The
scanner's raw output passes over a pipe held only in memory to a strict extractor of named fields, and nothing else
survives; an unrecognized record shape counts as a scan error, and a scan error blocks.

## What Is Prohibited

Secrets and credentials; personal data that was never meant to be public; absolute home paths of maintainers; internal
hostnames, addresses, and topology; identifiers of private repositories; and raw detector output from which any of these
could be recovered.

Make examples safe by swapping in semantic placeholders — `<api-token>`, `<private-host>`, `<repository-path>`. When a
placeholder would destroy what the artifact means, the artifact has no place in a public repository.

## Tests

```bash
bash scripts/public-safety/tests/run.sh            # all cases
bash scripts/public-safety/tests/run.sh 080        # one case by name fragment
```

| Case                                     | Asserts                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `010-missing-term-set`                   | an absent term set blocks                                                      |
| `020-empty-term-set`                     | empty and comments-only term sets block                                        |
| `030-malformed-term-set`                 | short lines, unknown class or kind, bad regex, credentials                     |
| `040-matching-content`                   | literal, regex, and name matches all block                                     |
| `050-clean-content`                      | clean input passes, including against the tracked shape set                    |
| `060-non-disclosing-output`              | a blocked run reproduces neither credential nor term                           |
| `070-surface-coverage`                   | all seven leaf surfaces accept, block, and reject unknowns                     |
| `080-tracked-shape-set`                  | every tracked shape matches, and ordinary text still passes                    |
| `090-surface-dispatch`                   | a missing, empty, or unknown gate surface is a scan error                      |
| `100-credential-finding-names-its-input` | a credential finding names its input, not a temporary copy                     |
| `110-file-list-inputs`                   | listed files and names are screened and attributed; a bad list is a scan error |
| `120-large-tree-dispatch`                | a tracked tree larger than the host's argument limit is still screened         |
| `130-hook-environment-isolation`         | a suite started from a Git hook leaves the hook's own repository untouched     |
| `140-cidr-network-prefix`                | a CIDR network prefix passes; host forms in every private range still block    |
| `150-hostname-trailing-underscore`       | an underscore continues a hostname token; real hostnames still block           |

Every probe value is assembled at run time from fragments, so no string this repository's own gate would flag exists in
any test file — a test that hardcoded one would block the commit that added it. `assert_absent` reports only a length on
failure: naming the value would make a failing test the disclosure the test prevents.

Every shell file here, the cases included, is clean under `shfmt -d` with default settings and
`shellcheck --severity=warning`, so a repository whose own shell gates run those tools can adopt byte-identical copies.
The synthetic term set is written with `printf` rather than a heredoc for the same reason: a formatter re-indenting a
heredoc body would turn its tab separators into spaces. A case is sourced rather than executed, so it names its dialect
with a `# shellcheck shell=bash` directive instead of a shebang.
