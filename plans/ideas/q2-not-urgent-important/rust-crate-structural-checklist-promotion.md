# Promote the Rust crate structural checklist to governance

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: move the Rust crate structural checklist out of a plan's `tech-docs.md` and into a
governance doc, once a second Rust crate exists to validate it against.

> Surfaced 2026-05-23 during rust-governance-audit execution.

## Problem / context

The Rust crate structural checklist currently lives in `tech-docs.md §4` of a single completed plan,
not in `repo-governance/`. It cannot be validated as a reusable abstraction from a single crate:
`apps/rhino-cli` is the only Rust crate in `ose-public`, so the checklist is really "what rhino-cli
happens to do", not a generalized standard.

## Why now

Not yet — this idea is deliberately **gated** on a second Rust crate being added to `ose-public`.
Promoting it now would codify single-crate evidence as if it were general.

## Prior art / precedents

- **Rule of three** — the guideline against abstracting from a single instance, exactly why this
  promotion is gated on a second crate.
  [rule of three](<https://en.wikipedia.org/wiki/Rule_of_three_(computer_programming)>)
- **Cargo package layout** — the language-level standard crate structure any generalized checklist
  would reconcile against.
  [cargo layout](https://doc.rust-lang.org/cargo/guide/project-layout.html)
- **Rust coding standards** — the repo's existing Rust governance where a validated structural
  checklist would live.
  [rust standards](../../../docs/explanation/software-engineering/programming-languages/rust/coding-standards.md)

## Proposed direction (sketch)

- When a second Rust crate lands, promote the checklist to
  `repo-governance/development/quality/rust-crate-structural-checklist.md`.
- Generalize each item against both crates, dropping anything that turns out to be rhino-cli-specific.

## Rough scope & non-goals

In scope: promoting and generalizing the checklist once a second crate exists.

Out of scope (for now): writing the governance doc before a second crate exists; enforcing it via a
checker (a separate follow-up).

## Risks & open questions

- What is the second crate, and is it a CLI or a library? (open — the checklist may not survive
  contact with a non-CLI crate)
- Which current items are genuinely general vs. rhino-cli-shaped? (open — answerable only with the
  second crate in hand)

## What success looks like + promotion signal

Success: a governance-level checklist validated against ≥2 crates. Ready to promote the moment a
second Rust crate is added to `ose-public`.
