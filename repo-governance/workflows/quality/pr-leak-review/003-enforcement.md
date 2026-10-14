---
name: 003-enforcement
description: >-
  Makes the delivery harness the only enforcer of the leak review's refusal, keeps the push screen local, and records
  the enforcement disposition and the one adopter decision.
when_to_use: >-
  Use when adopting the leak review, or when deciding how the delivery harness refuses a merge or push that lacks a pass
  verdict.
---

# Enforcement

A precondition stated only in prose is a convention someone forgets, so the leak review's refusal is made mechanical
where a mechanism exists. Here the delivery harness is that mechanism, and nothing shared with the forge enforces it.

## The Screen

The repository's outbound screen runs at the pre-push hook. It screens the outgoing range commit by commit: each
commit's added lines at the line numbers they occupy, its file names, its message, and the ref names. A merge
contributes what it resolved beyond the automatic merge. Content the range did not add is not screened again, so the
screen binds from adoption onward. Its shapes include absolute home paths, private addresses, and internal hostnames,
beside a credential scanner.

The screen matches shapes; the review reads context. Neither replaces the other. A pull-request replay of the same
screen can run in a repository's hosted pipeline for composition reasons; the harness's refusal does not depend on it.

## Harness Refusal

The delivery harness, not the forge, enforces the leak review:

- **Merge.** It merges a pull request only on a `pass` verdict for the head it is about to merge, after a live-head
  check immediately before the merge.
- **Push.** It pushes a range only on a `pass` verdict for that range, after confirming the local head has not moved.
- **Refusal.** A `findings`, `failed`, or `stale` outcome refuses the merge or push.

No required status check, branch-protection rule, or designated reviewer identity is part of this design, and the
harness posts nothing that gates. The only public record is the optional audit comment in
[Sequence](../pr-leak-review.md#sequence), which nothing reads as authority.

## Enforcement Disposition

The merge gate is enforced by the harness alone, and a server cannot force it: no forge rule can read a verdict this
design never posts. The rule that refuses a merge or push without a `pass` verdict is therefore **unenforced by
decision**, for that reason. The screen stays covered by a named check: the pre-push gate fails on any shape or
credential it matches.

## Fresh-Context Judgement

The harness spawns a new `leak-reviewer` for each head or range and never judges itself. A spawn failure ends the run as
`failed` before any verdict exists, so the refusal holds on every outcome the harness can observe. No artifact the
harness leaves can prove which context judged, so freshness is **unenforced by decision**, for that reason.

The reviewer's read-only constraint and its duties never to post and never to copy a value are judgements its body
states. The harness grants only the declared capabilities, and no check reads a verdict for values, so these too are
**unenforced by decision**.

## Adopter Decision: Integration Path

Record once, in the adopting repository's own conventions, whether its integration path is a pull request or a direct
push to the default branch. A direct-push repository has no pull request to gate, so its push review is its only review,
and the harness's refusal on push is the whole gate.

This repository's integration path is a pull request under mandatory `worktree-to-pr`
([AGENTS.md](../../../../AGENTS.md#delivery-mode)), so both the push review and the merge review apply.
