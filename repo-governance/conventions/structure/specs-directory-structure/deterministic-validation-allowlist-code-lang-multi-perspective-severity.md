---
description: What mechanically validates a specs/ tree today (the behaviour-coverage target and the link and README-index gates) and which structural properties stay review-owned
when_to_use: Read this when deciding how to check a specs/ change mechanically.
---

# Deterministic Validation: What Exists and What Is Review-Owned

No declared gate and no pinned RHINO command validates a specs tree's layout. Three checks run
mechanically:

| Check                                         | What it checks                                                                        | How it runs                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `test:coverage:behaviour` (per owner project) | Gherkin corpus shape, scenario bindings, adapters, and exemption syntax; never layout | Through `test:quick`, in the PR workflow's language jobs |
| `./rhino md internal-link validate`           | Markdown link targets within the spec tree exist; never `#anchor`s                    | The pull-request gate `md-internal-link`                 |
| `./rhino md readme-index validate`            | Each declared spec root's README links every direct child                             | The pull-request gate `md-readme-index`                  |

These properties have no deterministic check, so `specs-checker` judges them on request through the
[Specs Quality Gate](../../../workflows/quality/specs-quality-gate.md):

- top-level folders match the canonical owner corpus, with no flat-root artifacts;
- README count claims match actual `.feature` file counts; and
- BDD/Contracts adoption gaps per surface profile.

The static coverage detail lives in
[Deterministic Validation: Exact Bindings, Owner Corpora, and Drift Detection](./deterministic-validation-orphan-checks-combined-scopes-relationship-symmetry-drift.md),
and the split between deterministic and LLM checks in
[Deterministic Offload](./pre-push-ci-llm-validation-deterministic-offload-and-related-documentation.md#deterministic-offload).
