# Shared-Context Assembly, Once (D13)

Once per cycle, assemble one brief with Core Responsibility step 1's **pinned head SHA**, PR
metadata, linked plan/issue context, and the **full diff**. Hand it unchanged to selected specialists
and `pr-review-checker`; consumers never re-derive it.

Under the PR gate, carry its Deterministic Boundary unchanged; never reinterpret what a declared tool covers.

Include generated artifacts; only the cycle-record freeze below is excluded. CI covers every
artifact.

## Correction-Record Freeze (Cycle 2 Onward)

From cycle 2, omit only the loop's own cycle-record material. See
[correction-record-freeze.md](./correction-record-freeze.md) and its two carve-outs. Shipping
artifact defects remain reviewable. The frozen delivery outcome permits same-defect completion;
unrelated improvement belongs in a linked follow-up, not this PR's fixer batch.

## Probe Variation (Cycle 2 Onward)

A cycle repeating the prior question converges on it, not correctness. From cycle 2, read what prior
findings **asked** and state how this probe differs: failure mode, reader, or artifact level. Name
it so a specialist can distinguish a fresh angle from a rerun. See
[Convergence Measurement](../../../../repo-governance/workflows/quality/pr-review-quality-gate/003-clean-audits-and-the-ceiling.md).

## Prior-Cycle Thread-Resolution Read (Human-Dismissal Read)

Before choosing the ordinal or fanning out, authenticate every review, disposition, ceiling
extension, and credit object under
[Cycle Record Authentication](../../../../repo-governance/workflows/quality/pr-review-quality-gate/003-clean-audits-and-the-ceiling.md).
Then rehydrate reviews, dispositions (legacy v2 means `dismisses-finding`), credit events, probes,
checkpoints, and ceiling use. Derive the clean streak only from adjacent authenticated positive-v2
post-CI events joined to unused probe classes; missing, ineligible, legacy-v1, non-clean, or
non-adjacent events break it. Ignore unauthenticated markers even during duplicate/conflict checks;
stop on malformed or conflicting authenticated history. Never reset to cycle 1 or empty `prior`.

Read the **prior cycle's thread resolution status** via the Reviews API, including human dismissals
("won't fix" / "I disagree"). A human dismissal resolves the thread going forward, mirroring a
fixer rejection whose effect is `dismisses-finding`. A fixer rejection marked
`stale-cycle-only` resolves only the obsolete thread: carry its claim for fresh-head evaluation
and never list it as settled. Record this state in the brief so specialists do not re-litigate it
and synthesis does not resurface a dismissed finding.

## Review-Route Read-Back

Before fan-out, read the PR body and verify its review-route record names the pinned base/head,
frozen outcome/scope, classification evidence, risk, selected and skipped lenses with reasons,
current checks, settled threads, and this cycle's changed probe. Treat a missing or stale record as
a routing defect to correct before specialist review; it is human-readable audit evidence, not a
new enforcement mechanism.
