---
description: Defense-in-depth mandate for any test or fixture that shells out to git to build throwaway repositories -- caps upward discovery, forces explicit repo targeting, blanks identity/config, and asserts a pre-write escape guard so a fixture can never mutate the real repository
when_to_use: "Use when writing or reviewing a test or fixture that shells out to git to build a throwaway repository."
---

# Git Fixture Isolation Convention

This convention mandates six defense-in-depth layers for any test or fixture that shells out to git to build a throwaway repository, so a fixture can never mutate the real repository.

## Documents

- [Principles Implemented/Respected](./git-fixture-isolation/principles-implemented-respected.md) — Principles this convention implements. Use to trace this convention's principle rationale.
- [Conventions Implemented/Respected](./git-fixture-isolation/conventions-implemented-respected.md) — Conventions this convention implements. Use to trace this convention's cross-references.
- [Purpose](./git-fixture-isolation/purpose.md) — Why this convention exists. Use when orienting to why git-fixture isolation is required.
- [Scope](./git-fixture-isolation/scope.md) — Which tests and fixtures this convention covers. Use when checking whether a test or fixture is in scope.
- [The Motivating Incident (part 1)](./git-fixture-isolation/the-motivating-incident-repository-corruption.md) — The incident: a git-fixture test corrupted the real repository. Use for the incident that motivated this convention.
- [The Motivating Incident (part 2)](./git-fixture-isolation/the-motivating-incident-root-cause-status.md) — Root-cause investigation status and open hypotheses. Use for the incident's root-cause status.
- [The Motivating Incident (part 3)](./git-fixture-isolation/the-motivating-incident-exit-status-limits.md) — Why exit-status checking alone cannot catch this defect class. Use when evaluating whether an exit-status check alone is sufficient isolation.
- [The Rule: Six Mandatory Layers (Standard 1)](./git-fixture-isolation/the-rule-six-mandatory-layers-standard-1.md) — Standard 1: cap discovery (GIT_CEILING_DIRECTORIES). Use when implementing capped git-discovery in a fixture.
- [The Rule: Six Mandatory Layers (Standard 2)](./git-fixture-isolation/the-rule-six-mandatory-layers-standard-2.md) — Standard 2: no ambient discovery (explicit GIT_DIR). Use when implementing explicit GIT_DIR targeting in a fixture.
- [The Rule: Six Mandatory Layers (Standards 3-4)](./git-fixture-isolation/the-rule-six-mandatory-layers-standards-3-4.md) — Standards 3-4: identity/config hygiene, escape guard. Use when implementing identity blanking or an escape guard.
- [The Rule: Six Mandatory Layers (Standards 5-6)](./git-fixture-isolation/the-rule-six-mandatory-layers-standards-5-6.md) — Standards 5-6: exit-status checks, no primary-worktree diagnosis. Use when implementing exit-status checks or diagnostic rules.
- [Why Defense-in-Depth (Not a Single Assertion)](./git-fixture-isolation/why-defense-in-depth-not-a-single-assertion.md) — Why all six layers are required, not just one assertion. Use when tempted to implement only one of the six layers.
- [Language-Agnostic Equivalents](./git-fixture-isolation/language-agnostic-equivalents.md) — How the six layers translate to non-Rust languages. Use when implementing git-fixture isolation in a non-Rust language.
- [Examples](./git-fixture-isolation/examples.md) — Worked examples of correctly isolated git fixtures. Use for a concrete example of a properly isolated git fixture.
- [Enforcement](./git-fixture-isolation/enforcement.md) — How this convention is enforced across checker/fixer agents. Use when locating the automated enforcement for git-fixture isolation.
- [Completeness Checklist](./git-fixture-isolation/completeness-checklist.md) — The checklist to verify a git fixture implements all six layers. Use before landing a new git-fixture test, to verify full isolation.
- [Related Documentation](./git-fixture-isolation/related-documentation.md) — Related testing and safety conventions. Use when you need a related convention on testing or safety.
