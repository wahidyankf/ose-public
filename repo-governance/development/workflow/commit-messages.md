---
description: Understanding Conventional Commits and why we use them in open-sharia-enterprise
when_to_use: Use when writing a commit message, choosing its type/scope, or checking one against Commitlint on demand.
---

# Commit Message Convention

<!--
  MAINTENANCE NOTE: Master reference for commit message format
  This is duplicated (intentionally) in multiple files for different audiences:
  1. repo-governance/development/workflow/commit-messages.md (this file - comprehensive reference)
  2. AGENTS.md (quick reference for AI agents)
  When updating, synchronize both locations.
-->

This document explains the commit message convention used in the open-sharia-enterprise project, why we use it, and how it's checked. Understanding commit messages helps maintain a clean, navigable project history that benefits all contributors.

## Contents

- [Principles and Conventions Implemented](./commit-messages/principles-and-conventions-implemented.md) — Why this convention exists.
- [What are Conventional Commits?](./commit-messages/what-are-conventional-commits.md) — The specification and overall structure.
- [The Format Explained](./commit-messages/the-format-explained.md) — Header, body, footer rules.
- [Valid Commit Types](./commit-messages/valid-commit-types.md) — The type table and detailed descriptions.
- [Scope Examples](./commit-messages/scope-examples.md) — Common scope names and usage.
- [Real-World Examples](./commit-messages/real-world-examples.md) — Good and bad commit messages.
- [Why We Use This Convention](./commit-messages/why-we-use-this-convention.md) — Benefits for developers, teams, project, users.
- [How It's Checked](./commit-messages/how-its-enforced.md) — Review, the on-demand Commitlint config, and what the commit-msg hook actually runs.
- [Common Errors and Fixes](./commit-messages/common-errors-and-fixes.md) — Fixing the most common errors an on-demand Commitlint run reports.
- [Best Practices](./commit-messages/best-practices.md) — Habits beyond the mechanical format rules.
- [Thematic Commit Composition and Boundaries](./commit-messages/commit-granularity-and-when-to-split-commits.md) — Authorization and the fewest build-valid, reviewable, revertible boundaries.
- [What Belongs in One Commit](./commit-messages/when-to-combine-commits.md) — Required completion artifacts stay with one coherent purpose.
- [Commit Ordering Best Practices](./commit-messages/commit-ordering-best-practices.md) — Dependency ordering for already-independent thematic commits.
- [Atomic Commits](./commit-messages/atomic-commits.md) — What makes a commit atomic.
- [Commit Granularity: Real-World Examples](./commit-messages/commit-granularity-real-world-examples.md) — Three worked granularity examples.
- [Benefits of Proper Commit Granularity](./commit-messages/benefits-of-proper-commit-granularity.md) — Why granularity discipline pays off.
- [Making Commits](./commit-messages/making-commits.md) — The three practical ways to invoke `git commit`.

## Related Documentation

- [AI Agents Convention](../agents/ai-agents.md) - Standards for AI agents
- [Code Quality Convention](../quality/code.md) - Automated tools and git hooks for code formatting and commit validation
- [Development Index](../README.md) - Overview of development conventions
- [Conventions Index](../../conventions/README.md) - Documentation conventions

## Enforcement Disposition

**Unenforced by decision; checked by review.** No hook or CI step checks commit-message format: the
`commit-msg` surface runs only the `public-safety-commit-message` gate, and the `pull-request`
surface runs that same public-safety screen over the PR's commits. Reviewers check the Conventional
Commits format, and assess composition against the thematic boundary test. Commitlint
(`commitlint.config.js`) can check the format on demand, but it validates message syntax, not
whether a commit is semantically cohesive, independently revertible, or the fewest valid partition
of an authorized change set.

## External Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/) - Official specification
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#type) (verified 2026-02-08) - Inspiration for commit types
- [Commitlint Documentation](https://commitlint.js.org/) - Tool documentation
- [Semantic Versioning](https://semver.org/) - Version numbering standard
