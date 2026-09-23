---
description: "When a rule must hold across more than one file, generate the dependent file(s) from a single declared source and validate the result, rather than stating the rule in prose and trusting hand-sync"
when_to_use: "Read this index to find the right Mechanize Cross-File Invariants child document."
---

# Mechanize Cross-File Invariants

- [Mechanize Cross-File Invariants — The Rule](./the-rule.md) — The four-step procedure - identify a single source of truth, generate dependents from it, validate generated output in the normal gate, and never hand-edit a generated file Use when you've identified a rule that must hold across two or more files and need the concrete steps to mechanize it.
- [Mechanize Cross-File Invariants — Prior Art In This Repository](./prior-art-in-this-repository.md) — Four cross-cutting invariants this repository already governs via generate-and-validate - harness adapters, repo-config.yml schema parity, git hooks, and formatter replay Use when looking for an existing example of this pattern to model a new generate-and-validate pipeline on.
- [Mechanize Cross-File Invariants — Examples](./examples.md) — A PASS example of mechanizing a newly-recognized duplicated rule, and a FAIL example of leaving the same rule restated as prose across files Use when deciding whether to mechanize a duplicated rule or leave it as prose, and you want a concrete PASS/FAIL comparison.
- [Mechanize Cross-File Invariants — Scope and Related Documentation](./scope-and-related-documentation.md) — Where this practice applies and where it deliberately does not, plus links to related conventions and principles Use when deciding whether a specific case of divergence falls under this practice, or to find the related conventions and principles.
