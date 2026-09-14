---
description: "Defense-in-depth mandate for any test or fixture that shells out to git to build throwaway repositories -- caps upward discovery, forces explicit repo targeting, blanks identity/config, and asserts a pre-write escape guard so a fixture can never mutate the real repository"
when_to_use: "Read this index to find the right Git Fixture Isolation Convention child document."
---

# Git Fixture Isolation Convention

- [Principles Implemented/Respected](./principles-implemented-respected.md) — Principles this convention implements. Use to trace this convention's principle rationale.
- [Conventions Implemented/Respected](./conventions-implemented-respected.md) — Conventions this convention implements. Use to trace this convention's cross-references.
- [Purpose](./purpose.md) — Why this convention exists. Use when orienting to why git-fixture isolation is required.
- [Scope](./scope.md) — Which tests and fixtures this convention covers. Use when checking whether a test or fixture is in scope.
- [The Motivating Incident (part 1)](./the-motivating-incident-repository-corruption.md) — The incident: a git-fixture test corrupted the real repository. Use for the incident that motivated this convention.
- [The Motivating Incident (part 2)](./the-motivating-incident-root-cause-status.md) — Root-cause investigation status and open hypotheses. Use for the incident's root-cause status.
- [The Motivating Incident (part 3)](./the-motivating-incident-exit-status-limits.md) — Why exit-status checking alone cannot catch this defect class. Use when evaluating whether an exit-status check alone is sufficient isolation.
- [The Rule: Six Mandatory Layers (Standard 1)](./the-rule-six-mandatory-layers-standard-1.md) — Standard 1: cap discovery (GIT_CEILING_DIRECTORIES). Use when implementing capped git-discovery in a fixture.
- [The Rule: Six Mandatory Layers (Standard 2)](./the-rule-six-mandatory-layers-standard-2.md) — Standard 2: no ambient discovery (explicit GIT_DIR). Use when implementing explicit GIT_DIR targeting in a fixture.
- [The Rule: Six Mandatory Layers (Standards 3-4)](./the-rule-six-mandatory-layers-standards-3-4.md) — Standards 3-4: identity/config hygiene, escape guard. Use when implementing identity blanking or an escape guard.
- [The Rule: Six Mandatory Layers (Standards 5-6)](./the-rule-six-mandatory-layers-standards-5-6.md) — Standards 5-6: exit-status checks, no primary-worktree diagnosis. Use when implementing exit-status checks or diagnostic rules.
- [Why Defense-in-Depth (Not a Single Assertion)](./why-defense-in-depth-not-a-single-assertion.md) — Why all six layers are required, not just one assertion. Use when tempted to implement only one of the six layers.
- [Language-Agnostic Equivalents](./language-agnostic-equivalents.md) — How the six layers translate to non-Rust languages. Use when implementing git-fixture isolation in a non-Rust language.
- [Examples](./examples.md) — Worked examples of correctly isolated git fixtures. Use for a concrete example of a properly isolated git fixture.
- [Enforcement](./enforcement.md) — How this convention is enforced across checker/fixer agents. Use when locating the automated enforcement for git-fixture isolation.
- [Completeness Checklist](./completeness-checklist.md) — The checklist to verify a git fixture implements all six layers. Use before landing a new git-fixture test, to verify full isolation.
- [Related Documentation](./related-documentation.md) — Related testing and safety conventions. Use when you need a related convention on testing or safety.
