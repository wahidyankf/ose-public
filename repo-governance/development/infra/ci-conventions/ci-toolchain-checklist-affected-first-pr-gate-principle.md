---
description: Why PR checks scope to nx affected, and the exceptions.
when_to_use: Use when adding a PR-gate check and deciding its scope.
---

# Toolchain Checklist — Affected-First PR-Gate Principle

The PR quality gate runs `nx affected` for all per-project checks so only changed projects pay
the cost of typecheck, lint, test, and coverage on each PR. Whole-repo checks that cannot be
scoped to affected projects are an explicit exception and must be justified.

| Check                   | Gate / Command                                                        | Why whole-repo                                                                                      |
| ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Markdown linting        | Gate `markdownlint` (`npm run lint:md` runs the same scan)            | One shared lint configuration governs every file, so a rule change can newly fail an untouched file |
| Mermaid validation      | Gate `md-mermaid-repository` (`./rhino md mermaid validate`)          | A diagram that drifts outside the palette in an untouched file still fails                          |
| Link validation         | Gate `md-internal-link` (`./rhino md internal-link validate`)         | Adding, deleting, or renaming any `.md` file can break links in untouched files                     |
| README indexes          | Gate `md-readme-index` (`./rhino md readme-index validate`)           | Adding or removing a directory changes an index file the change never touches                       |
| Heading hierarchy       | Gate `md-heading-hierarchy` (`./rhino md heading-hierarchy validate`) | The gate scans the whole declared tree, a superset of the changed files                             |
| Governance vendor audit | Gate `governance-vendor` (`./rhino governance vendor validate`)       | Scans the declared governance roots globally for vendor-specific content                            |
| Governance word budgets | Gate `word-budget` (`./rhino governance word-budget validate`)        | A surface's glob or thresholds can change without the measured file changing                        |
| Harness adapter parity  | Gate `harness-adapters` (`./rhino harness adapters validate`)         | Adapters come from one canonical source; partial sync leaves gaps                                   |
| Env validation          | Gate `env-validate` (`./rhino env validate`)                          | All `.env.example` files are checked against the declared `env-contract:` policy                    |

Any new whole-repo check added to CI or pre-push must be listed here with its justification before
it lands.
