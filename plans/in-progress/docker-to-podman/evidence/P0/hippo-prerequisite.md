# HIPPO profile compatibility prerequisite

## Outcome and authorization

The maintainer explicitly approved HIPPO **0.13.0** on 2026-10-27, including a specific exception
to the dependency policy's 60-day age requirement. The release is less than a day old; this is
neither normal Path B compliance nor a CVE-based Path C waiver. Security and functional checks
remain required. No host-profile change or general policy exception was approved.

An external profile rollout added `coordination.swapUsedMaxMultiple: 1.0`. The existing 0.11.0
consumer rejected that unknown field with exit 125 before new payloads started. The frontend
baseline was already admitted before that rollout; its later assertion failures are separate.

Only the worktree's root `hippo.lock` changed, with six release identity/digest replacements.
Its SHA-256 is `371ea6282c4d90285e2b857c55caafeda95a0589cde4cd8036fd38bd86e0575d`.
The root bootstrap remains unchanged at SHA-256
`1bb5bd86a5ca4730db50d311f0e375e12399784b16bc0864f4a44317e5ee98dd`.
The primary checkout, host profile, foreign staged changes and Git identity remain untouched.

## Release review

The [official immutable release](https://github.com/wahidyankf/hippo/releases/tag/v0.13.0)
was published on 2026-10-27 at 06:36:41 UTC. Its tag resolves to full commit
`b8a87a49b2aa123816cc7e197f5995273d5ce479`. All four platform archive digests match the
published release metadata and checksum asset. There are five assets total: four archives and
the checksum file; no release-attestation JSON asset is claimed.

Independent review closed both recorded findings before authorization. Exact-commit
[Linux and macOS CI](https://github.com/wahidyankf/hippo/actions/runs/40458313498) ran the pinned
test script, including `go tool govulncheck ./...`, and reported zero vulnerabilities. The
[release workflow](https://github.com/wahidyankf/hippo/actions/runs/40458877319) verified the tag,
commit, passing MainTest and assets before publication.

The bounded security assessment was clear as of 2026-10-27: the official NVD API query returned
zero records; GitHub and project security pages showed no published advisory; Snyk returned no
package entry, verified against a successful indexed-package control. No Snyk entry is not a
zero-findings package assessment. No CVE IDs were found, so KEV and EPSS cross-references are
not applicable. These observations do not establish absolute or future absence of defects.

## Native verification

All commands used the unchanged root bootstrap and the existing approved host profile.

| Check                                         | Actual result                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Bootstrap artifact and embedded identity      | Exit 0; version 0.13.0 and exact reviewed full commit                                                 |
| Current-profile status before and after smoke | Exit 0; decision `run`, reason `normal`, expected unchanged profile hash                              |
| `.github/scripts/test-hippo-consumer.sh`      | One admitted ephemeral/standard invocation; outer exit 0; bootstrap and OSE consumer contracts passed |
| Bounded policy/receipt smoke                  | One admitted ephemeral/light invocation; payload and outer exit 0; history recorded `passed`          |

The consumer contract ran at 08:49:29–08:49:46 UTC; the policy smoke ran at
08:50:10–08:50:13 UTC. Both retained pressure level 1. Final status reported used swap below
physical RAM and accepted the existing `1.0` gate. This exercises the below-threshold path;
it does not claim a live above-threshold fallback test. The `degradedAdmission` marker did not
prevent the actual `run` decision. All owned verification handles are terminal.

## Baseline and rollback boundaries

Subsequent origin/main commit `533a2630cfd8e76cbc8f329efbef60e4d817af50` independently contains
the exact same approved lock blob. The execution branch fast-forwarded to that base after
verifying equality; its `hippo.lock` is now clean against HEAD, with the same verified SHA-256.
All other local changes were preserved, the index is empty and no execution commit was created.
This convergence changes neither the reviewed artifact nor the host profile.

Keep the 44 passing baseline target receipts, the failed frontend target and its original four
skips tied to their exact source, old consumer and original profile. The compatibility smoke is
not application-test proof. Refreeze current inputs and record actual policy envelopes; repeat a
passing target only when its source closure or demonstrated policy dependence requires it.

Do not downgrade to 0.11.0 while the profile contains the new field, remove that field, borrow
another consumer, force admission or restore a private policy snapshot. Any profile rollback
belongs to its owner. Runtime migration implementation still waits for the remaining P0 gate.
