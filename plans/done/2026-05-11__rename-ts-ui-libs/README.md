# Plan: Rename ts-ui Libraries to web-ui

**Status**: In Progress
**Scope**: `ose-public` (Scope A — runs in worktree `worktrees/ui/`)
**Plan identifier**: `rename-ts-ui-libs`

## Context

Two Nx libraries carry the prefix `ts-ui`, which signals a technology binding (TypeScript) rather than a
functional domain (web UI). Aligning library identifiers to domain-first naming improves discoverability
and reduces confusion when non-TypeScript code (CSS, design tokens) lives alongside TypeScript source.

The rename touches two libraries and cascades across app consumers, Storybook configuration, and
governance documentation.

## Scope

### In Scope

- Directory rename: `libs/ts-ui/` → `libs/web-ui/`
- Directory rename: `libs/ts-ui-tokens/` → `libs/web-ui-token/`
- Nx project name rename: `ts-ui` → `web-ui`, `ts-ui-tokens` → `web-ui-token`
- npm package rename: `@open-sharia-enterprise/ts-ui` → `@open-sharia-enterprise/web-ui`
- npm package rename: `@open-sharia-enterprise/ts-ui-tokens` → `@open-sharia-enterprise/web-ui-token`
- All import references updated across: lib internals, Storybook config, app `package.json` /
  `project.json` / `next.config.ts` / source TSX / CSS files
- Governance, agent, and skill documentation updated

### Out of Scope

- Internal source-code refactoring (exports, component behaviour)
- Version bumps (`0.1.0` unchanged)
- Any app other than the four Next.js apps already importing these libs

## Navigation

| Document                       | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, success metrics, risks                      |
| [prd.md](./prd.md)             | Product requirements, user stories, Gherkin acceptance criteria |
| [tech-docs.md](./tech-docs.md) | Architecture, file-impact map, design decisions                 |
| [delivery.md](./delivery.md)   | Phased execution checklist                                      |

## Approach Summary

1. Rename the two library directories with `git mv`.
2. Update all `project.json` and `package.json` files inside the renamed libs.
3. Update Storybook configuration inside the renamed `web-ui` lib.
4. Update all four app consumers (imports, `transpilePackages`, `implicitDependencies`).
5. Update governance, agent, and skill markdown files via global find-and-replace.
6. Run `npm install` to regenerate `package-lock.json` with new package names.
7. Validate with `nx run-many -t typecheck lint test:quick -p web-ui web-ui-token` and
   affected app typechecks.
8. Push to `main`, verify CI green.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
