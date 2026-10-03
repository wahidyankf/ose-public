---
description: "How the forcing-functions apply across the three live-site tester agents."
when_to_use: "Use when deciding how a live-site tester agent should apply these forcing-functions."
---

# Relationship to the Three Live-Site Testers

The three tester agents each carry their own operational playbook. This document defines the
shared underlying discipline:

| Agent                                  | Primary lens                                       | Applies forcing-functions |
| -------------------------------------- | -------------------------------------------------- | ------------------------- |
| `swe-web-tester` (exploratory charter) | Spec-aware correctness (EWT findings)              | FF1, FF2, FF3, FF6        |
| `swe-usability-tester`                 | Spec-blind first-time-user friction (UWT findings) | FF5, FF6                  |
| `swe-web-tester` (design charter)      | Design-aware visual fidelity (DWT findings)        | FF4, FF6                  |
| `swe-api-tester` (exploratory charter) | Spec/contract-aware API correctness (AET findings) | FF1, FF2, FF3, FF6        |

FF6 (recurrence + diff memory + completeness critic) applies to all of them. The `web-ux-test-
fixing-planning` workflow coordinates the three **web** testers sequentially against the same target
URL and integrates their findings into a unified fix-ready plan. `swe-api-tester` (exploratory charter) is the
**API-surface** counterpart — HTTP/curl-driven, never a browser — and applies the same enumerate-don't-
sample forcing functions to API operations (its three mandatory sweeps are the operation × property
matrix, the cross-cutting convention round-trip, and the declared-invariant conformance pass). It runs
as a single specialist (no triad, no dedicated workflow) because the API surface has one exploratory
lens.
