---
description: >-
  Links each software-development inventory project to the README that owns its stacks, commands, and test levels,
  carries the facts of projects without one, and names the manifests that declare each version.
when_to_use: >-
  Use when locating a project's stacks, commands, test levels, omitted targets, or declared toolchain versions.
---

# Project Applicability

Each project README states its stack, commands, applicable test levels, useful coverage, and every omitted target with
its reason. Stack IDs per project live in the inventory in `repo-config.yml`.

## Projects With a README

- [ayokoding-www](../../../../../apps/ayokoding-www/README.md)
- [ayokoding-www-be-e2e](../../../../../apps/ayokoding-www-be-e2e/README.md)
- [ayokoding-www-fe-e2e](../../../../../apps/ayokoding-www-fe-e2e/README.md)
- [crane-cli](../../../../../apps/crane-cli/README.md)
- [ferret-cli](../../../../../apps/ferret-cli/README.md)
- [ferret-cli-e2e](../../../../../apps/ferret-cli-e2e/README.md)
- [organiclever-app-web](../../../../../apps/organiclever-app-web/README.md)
- [organiclever-app-web-e2e](../../../../../apps/organiclever-app-web-e2e/README.md)
- [organiclever-be](../../../../../apps/organiclever-be/README.md)
- [organiclever-be-e2e](../../../../../apps/organiclever-be-e2e/README.md)
- [organiclever-www](../../../../../apps/organiclever-www/README.md)
- [organiclever-www-fe-e2e](../../../../../apps/organiclever-www-fe-e2e/README.md)
- [ose-app-web](../../../../../apps/ose-app-web/README.md)
- [ose-app-web-e2e](../../../../../apps/ose-app-web-e2e/README.md)
- [ose-be](../../../../../apps/ose-be/README.md)
- [ose-be-e2e](../../../../../apps/ose-be-e2e/README.md)
- [ose-id-be](../../../../../apps/ose-id-be/README.md)
- [ose-id-be-e2e](../../../../../apps/ose-id-be-e2e/README.md)
- [ose-id-web](../../../../../apps/ose-id-web/README.md)
- [ose-id-web-e2e](../../../../../apps/ose-id-web-e2e/README.md)
- [ose-lms-be](../../../../../apps/ose-lms-be/README.md)
- [ose-lms-be-e2e](../../../../../apps/ose-lms-be-e2e/README.md)
- [ose-www](../../../../../apps/ose-www/README.md)
- [ose-www-be-e2e](../../../../../apps/ose-www-be-e2e/README.md)
- [ose-www-fe-e2e](../../../../../apps/ose-www-fe-e2e/README.md)
- [roots-be](../../../../../apps/roots-be/README.md)
- [roots-be-e2e](../../../../../apps/roots-be-e2e/README.md)
- [fsharp-crane-core](../../../../../libs/fsharp-crane-core/README.md)
- [fsharp-env-loader](../../../../../libs/fsharp-env-loader/README.md)
- [ts-env-loader](../../../../../libs/ts-env-loader/README.md)
- [web-ui](../../../../../libs/web-ui/README.md)
- [web-ui-token](../../../../../libs/web-ui-token/README.md)
- [organiclever-contracts](../../../../../specs/apps/organiclever/be/contracts/README.md)
- [ose-contracts](../../../../../specs/apps/ose/be/contracts/README.md)
- [ose-id-contracts](../../../../../specs/apps/ose/id-be/contracts/README.md)
- [ose-lms-contracts](../../../../../specs/apps/ose/lms-be/contracts/README.md)
- [roots-contracts](../../../../../specs/apps/roots/be/contracts/README.md)
- [repo-scripts](../../../../../scripts/README.md)
- [public-safety](../../../../../scripts/public-safety/README.md)
- [workspace](../../../../.././README.md)

## Projects Without a README

- `ci-scripts` (`.github/scripts`, `shell`) — Bash scripts that CI workflows and `npm run doctor` call. The `shellcheck`
  gate checks them; they have no Nx project and no Unit target.
- `agent-hooks` (`.claude/hooks`, `shell`) — The primary coding agent's hook scripts. Each tested hook has a sibling `*.test.sh` run
  with `bash`; the `shellcheck` gate checks every script.
- `opencode-plugins` (`.opencode/plugins`, `typescript`) — The secondary coding agent's FERRET capture plugin. That agent's runtime
  loads it, and `ferret-cli`'s fail-open scenarios exercise it; it has no Nx project of its own.

## Version Sources

- `typescript`, `javascript`, `react`, `nextjs`: each project's `package.json`; Node in the root `package.json` `volta`
  block
- `nx`: the root `package.json`
- `fsharp`, `giraffe`: each project's `.fsproj`, and its `global.json` where present
- `csharp`, `aspnet-core`: `apps/ose-id-be/global.json` and `apps/ose-id-be/Directory.Packages.props`, and the same files
  in `apps/ose-id-be-e2e`
- `java`, `spring-boot`: `apps/ose-lms-be/build.gradle.kts`
- `golang`, `gin`: `apps/roots-be/go.mod`
- `python`: `apps/ferret-cli/.python-version` and `apps/ferret-cli/pyproject.toml`, and the same files in
  `apps/ferret-cli-e2e`
- `shell`: the host Bash; no tracked file pins it
