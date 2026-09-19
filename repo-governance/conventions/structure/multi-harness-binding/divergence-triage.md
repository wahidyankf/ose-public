---
description: Rule 9 — generation stays one-way by default, divergence is detected by content and never by timestamp, and promoting a mirror edit back into canonical source is a human-reviewed patch rather than an automatic write.
when_to_use: Read this when a hand edit made inside a generated mirror needs keeping, or when `harness adapters validate` fails and you are deciding which side to change.
---

# Rule 9 — Divergence Triage and Reviewed Promotion

**Generation is one-way by default.** A hand edit inside a generated mirror fails
`harness adapters validate`, exactly as it did before triage existed. Triage explains the failure;
promotion proposes a patch. Neither writes canonical source.

## Detection is by content, never by timestamp

`harness sync triage` regenerates every `generated`-class file into a scratch tree and compares
bytes. It reads no modification time, and none may be reintroduced: **git does not store
modification times**, so in a fresh clone every file carries checkout time. A timestamp-based
detector reports the whole tree as simultaneously changed there, and reports nothing at all where an
editor preserved stamps. Content is the only signal that survives both.

Scope is the `generated` class alone. A `vendored` file covers two structurally different
subclasses — see [the two vendored
subclasses](../../../glossary/vendored-exception-subclasses.md) — and a `source` file is the
promotion target rather than a triage subject; see [Rule 8](./ownership-classes.md).

## The three outcomes

| Outcome          | Meaning                                | What is offered            |
| ---------------- | -------------------------------------- | -------------------------- |
| in sync          | the mirror is what the generator emits | nothing; exit 0            |
| one side moved   | the mirror, or the canonical source    | promotion, or regeneration |
| both sides moved | both were hand-edited                  | **nothing — a hard stop**  |

There is no fourth outcome and no automatic winner. When both sides moved, no correct automatic
answer exists, so none is guessed.

## Promotion is human-reviewed

`harness sync promote --from <mirror>` prints a unified diff against the canonical file and exits.
It also lists the canonical fields the editing harness's schema cannot carry, computed by
intersecting that file's frontmatter keys with the harness's own field policy. Cross-harness
translation is lossy; a promote that silently dropped those fields would be a data-loss event, so
applying the diff stays a human act.

## Related

- [Rules 4-5](./rules-4-to-5.md) — the generation and parity guard this rule builds on
- [Rule 8](./ownership-classes.md) — the ownership classes that make triage scope decidable
