---
description: >-
  Requires every outbound artifact from a public repository to pass a safety screen first, with no allowlist,
  suppression, or bypass, plus a full read of each change before commit, synthetic fixtures, and a disclosure response.
when_to_use: >-
  Use before any commit, push, pull request, comment, release, or published log, when adding a publication surface or
  writing examples or fixtures, and after something unsafe was published.
---

# Public Outbound Safety

Nothing leaves a public repository without being screened first. Files, filenames, commit messages, branch and tag
names, pull-request titles and bodies, comments, release notes, and published logs are all outbound.

Deletion is not a remedy. Anything published may already be cached, cloned, indexed, or mirrored, so the only control
that works is the one that runs before publication.

## Surfaces

| Outbound artifact         | Screened input                                    |
| ------------------------- | ------------------------------------------------- |
| tracked content           | every tracked file, plus file and directory names |
| a staged or pushed change | added content and changed names                   |
| a commit                  | the message and related metadata text             |
| a branch or tag           | the name                                          |
| a pull request or comment | the title and the body                            |
| a release                 | tag annotation, title, notes, changelog excerpt   |
| a log or evidence record  | the text before it is written                     |

Names are screened as carefully as content. A branch named after an internal host publishes that host, and no diff
review looks at branch names.

## What Is Prohibited

Never publish secrets or credentials; identifiers of private repositories or groups; internal host names and addresses,
and internal network layout; absolute paths bound to a person or machine; personal data nobody deliberately made public;
or raw scanner output able to reproduce any of these.

Also prohibited unless deliberately public: usernames, device names, hardware addresses, serial numbers, private network
names, local mount paths, and account or project identifiers.

Prefer a repository-relative path or a documented environment variable to a placeholder where either keeps the meaning;
see [No Machine-Specific Commits](../../development/quality/no-machine-specific-commits.md).

Swap prohibited values for semantic placeholders: `<repository-path>`, `<private-host>`, `<api-token>`. If swapping
leaves the artifact meaningless, it stays private.

## Review Still Reads the Change

A screen matches shapes. It cannot tell a deliberately public value, such as the repository's canonical address, from a
plausible one copied from somewhere real.

Before every commit, read the whole proposed change: staged content, intended untracked files, generated artifacts, and
the message. Neither the screen nor the reading replaces the other. Ignore rules are not a security boundary; see
[No Secrets in Committed Files](no-secrets-in-committed-files.md).

## Fixtures Are Unmistakably Synthetic

Examples, fixtures, logs, and screenshots use values nobody could take for real: placeholders, reserved example domains
([RFC 2606](https://www.rfc-editor.org/rfc/rfc2606)), obviously invented names. Evidence captured from a real machine
describes that machine; capture it from one holding nothing private, or say it cannot be shown.

## Three Outcomes, Two Refusals

| Exit | Means      | Publication      |
| ---: | ---------- | ---------------- |
|    0 | clean      | may proceed      |
|    1 | blocked    | must not proceed |
|    2 | scan error | must not proceed |

The refusals differ only in knowledge: under `1` the problem is known, under `2` it is not. A screen that failed to run
passed nothing, and treating an error as clean reduces the one guard that must be dependable to a formality.

## No Bypass

No allowlist, no suppression comment, no environment variable, no `--force`. A screen that can be turned off will be
turned off, in a hurry, by someone who is certain it is a false positive.

A genuine false positive is fixed by narrowing the rule, in a change that is reviewed like any other.

## Runs First

Where a repository has gates, this is the first one on every surface it applies to. Screening after a formatter has
rewritten the file, or after a push has already happened, screens the wrong thing at the wrong time.

## Scanner Output Is Itself Sensitive

A finding names what it found. Reports record the file, the rule, and the location — never the matched value, which
would publish it a second time in the record of having caught it.

## If Something Lands Anyway

Treat it as disclosed. Preserve evidence of the exposure without recording the value, and report the affected scope. A
history rewrite never substitutes for rotation; [No Secrets in Committed Files](no-secrets-in-committed-files.md) owns
rotation and history rewriting.
