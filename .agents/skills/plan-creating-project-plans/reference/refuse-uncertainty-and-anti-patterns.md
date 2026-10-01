# Refuse-on-Uncertainty, Web-Research Delegation, and Anti-Pattern Catalog

## Refuse-on-Uncertainty

When verification (see [verification-recipes.md](verification-recipes.md)) fails or is impossible: REFUSE to write the claim as a fact. Acceptable refusals:

1. **Skip the claim** (preferred when omission keeps the plan coherent)
2. **Use placeholder** — `_Unknown — verify before authoring_` under Open Questions (flagged for
   verification before execution)
3. **Reword as an expectation** — a plainly worded best guess ("we expect …; no baseline measured")

Forbidden: writing an unverified claim as a fact and hoping it is correct. No refusal uses an inline
confidence label.

## Web-Research Delegation (Lower Threshold for Plan Content)

For plan content the threshold is LOWER than the universal convention:

> **Any external claim that is not already documented in the repo (`docs/`, `repo-governance/`, `apps/*/README.md`, `package.json`, `go.mod`, etc.) and that requires more than a single `WebFetch` against an already-known authoritative URL MUST be delegated to `web-researcher`.**

Concretely: most external claims require delegation. Single-shot fetches against a known URL are the only in-context exception. See [Plan Anti-Hallucination Convention §Web-Research Delegation](../../../../repo-governance/development/quality/plan-anti-hallucination.md#web-research-delegation-lower-threshold-for-plans).

## Anti-Pattern Catalog (MUST NOT)

Reject these patterns at authoring time. `plan-checker` flags occurrences as HIGH:

- **AP-1** — citing a version without `Grep`'ing the manifest
- **AP-2** — inventing a file path that "should exist"
- **AP-3** — citing an Nx target that may not exist (read `project.json` first)
- **AP-4** — inventing a function or method name (delegate to `web-researcher`)
- **AP-5** — fabricating a numeric KPI presented as already-measured
- **AP-6** — inventing a test name (mark `_New test_` when applicable)
- **AP-7** — citing an agent or skill that does not exist
- **AP-8** — citing a CLI flag without `--help` or repo-doc reference
- **AP-9** — citing a behaviour claim without a source
- **AP-10** — cross-linking to a file that does not exist
