---
description: >-
  Records each choice the adopted stack standards leave open, and each local rule stronger than the catalog, with its
  reason.
when_to_use: >-
  Use when a stack standard asks for an adopter decision, or before changing a test framework, library, runner, or
  coverage rule here.
---

# Adopter Decisions

Adoption never loosens a stronger local rule. Each row below is one decision and its reason.

## Stack Standard Decisions

| Source                                                         | Decision              | Choice                                                       | Reason                                                                                          |
| -------------------------------------------------------------- | --------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [F#](../fsharp-standards.md)                                   | web framework         | Giraffe                                                      | handlers compose as plain functions in `ose-be` and `organiclever-be`                           |
| [F#](../fsharp-standards.md)                                   | test framework        | xUnit v3, with TickSpec binding the Gherkin                  | tooling shared with the C# projects; TickSpec runs the canonical `.feature` files               |
| [JavaScript](../javascript-standards.md)                       | check scope           | none yet (deviation)                                         | `scripts/*.mjs` have no type-check gate; the gap is recorded here until one is chosen           |
| [JavaScript](../javascript-standards.md)                       | test runner           | the built-in `node --test`                                   | no dependency; `npm run test:validators` runs it                                                |
| [Go](../golang-standards.md)                                   | assertions            | the `testing` package only                                   | `roots-be` needs no assertion dependency                                                        |
| [Go](../golang-standards.md)                                   | integration selection | not applicable                                               | `roots-be` owns no local-resource boundary; its README records the omitted target               |
| [Python](../python-standards.md)                               | boundary validation   | standard-library dataclasses and checks                      | `ferret-cli` declares no runtime dependency                                                     |
| [Python](../python-standards.md)                               | expected failures     | exceptions                                                   | the standard-library idiom `ferret-cli` follows                                                 |
| [Shell](../shell-standards.md)                                 | test tool             | the main test stack; hook scripts keep a sibling `*.test.sh` | `node --test` spawns each `scripts/` wrapper; each Claude hook is tested beside itself          |
| [Next.js](../nextjs-standards/version-hosting-and-examples.md) | version line          | the current stable major, named in each app's `package.json` | the longest support window; the line also fixes the React major                                 |
| [Next.js](../nextjs-standards/version-hosting-and-examples.md) | hosting               | a managed platform (Vercel)                                  | caching and images run unoperated; see [Vercel Deployment](../../../infra/vercel-deployment.md) |
| [React](../react-standards/library-decisions.md)               | store                 | XState, where state outgrows context                         | shared flows are explicit state machines                                                        |
| [React](../react-standards/library-decisions.md)               | query                 | TanStack Query                                               | mutations and optimistic updates built in                                                       |
| [React](../react-standards/library-decisions.md)               | forms                 | controlled components with a Zod schema                      | no form library dependency; Zod already validates boundaries                                    |

## Local Rules Stronger Than the Catalog

| Rule                | Choice                                                                                                                                               | Reason                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| test contract       | Gherkin first and Unit always, per [Behaviour-Driven Development](../../../behaviour-driven-development.md)                                          | every testable project proves its behaviour        |
| coverage floor      | 99% Unit line coverage during `test:unit`, owned per project                                                                                         | stronger than the catalog's recorded floor         |
| script subjects     | [Script-Subject Unit Proof](../../../behaviour-driven-development/script-subject-unit-proof.md) instead of a coverage floor                          | no forced coverage for shell, IaC, or config       |
| task runner         | Nx, with targets per [Nx Targets](../../../infra/nx-targets.md)                                                                                      | one target vocabulary across stacks                |
| Python type checker | strict Pyright, declared in `apps/ferret-cli/pyproject.toml`                                                                                         | the Python standard's checker of record            |
| backend languages   | F# for a new backend; Java only in `ose-lms-be`                                                                                                      | a new Java service needs its own recorded decision |
| style guides        | each [language style guide](../../../../../docs/explanation/software-engineering/programming-languages/README.md) wins where it is stricter          | the guides predate the catalog and stay binding    |
| checker reports     | `swe-code-checker` writes to `local-tmp/swe-code/`, per [Mandatory Report Generation](../../../infra/temporary-files/mandatory-report-generation.md) | every checker leaves an auditable report           |
