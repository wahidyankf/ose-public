---
description: How this workflow relates to the continuous `harness-adapters` gate — which mechanism catches which class of drift, and why neither replaces the other.
when_to_use: Read this when deciding whether a harness-drift concern belongs to this periodic workflow or to a continuous CI gate.
---

# Complementary Anti-Drift Gates

This workflow is **not** the only anti-drift mechanism, and it is not the first line of defence.
Two mechanisms operate at different cadences over different failure classes.

| Mechanism                                             | Cadence                     | Catches                                                                                                                                                 |
| ----------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `harness adapters validate` (`harness-adapters` gate) | pre-commit and pull request | byte-drift between a generated mirror and what the emitter would write now; a tracked binding file with no declared SOURCE / GENERATED / VENDORED class |
| This workflow                                         | on demand / scheduled       | upstream harness conventions changing out from under the catalog                                                                                        |

The gate is mechanical and continuous: it compares the repository against itself and fails
fast, with no judgement and no network. It cannot notice that a harness changed its config format
last week — nothing in the repository records that fact yet.

This workflow closes exactly that gap. Its Phase 1 dimensions are web-research-backed, so they can
observe an upstream change the repository has not yet absorbed. What they cannot do is run on every
push; research is slow, non-deterministic, and needs a human-reviewable report.

**Practical rule**: if a check can be written as a comparison between two files already in the
repository, it belongs in a gate, not here. If answering it requires reading a vendor's current
documentation, it belongs here.
