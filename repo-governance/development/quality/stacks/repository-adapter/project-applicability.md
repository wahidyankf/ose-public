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
- [ayokoding-cli](../../../../../apps/ayokoding-cli/README.md)
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
- [ose-www](../../../../../apps/ose-www/README.md)
- [ose-www-be-e2e](../../../../../apps/ose-www-be-e2e/README.md)
- [ose-www-fe-e2e](../../../../../apps/ose-www-fe-e2e/README.md)
- [fsharp-crane-core](../../../../../libs/fsharp-crane-core/README.md)
- [fsharp-env-loader](../../../../../libs/fsharp-env-loader/README.md)
- [ts-env-loader](../../../../../libs/ts-env-loader/README.md)
- [web-ui](../../../../../libs/web-ui/README.md)
- [web-ui-token](../../../../../libs/web-ui-token/README.md)
- [organiclever-contracts](../../../../../specs/apps/organiclever/be/contracts/README.md)
- [ose-contracts](../../../../../specs/apps/ose/be/contracts/README.md)
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
- `fsharp`, `aspnet-core`, `giraffe`: each project's `.fsproj` (target framework and package references), and its
  `global.json` (SDK version) where present
- `golang`: `apps/ayokoding-cli/go.mod` (`go` directive and `toolchain` line)
- `python`: `apps/ferret-cli/.python-version` and `apps/ferret-cli/pyproject.toml`, and the same files in
  `apps/ferret-cli-e2e`
- `shell`: the host Bash; no tracked file pins it
