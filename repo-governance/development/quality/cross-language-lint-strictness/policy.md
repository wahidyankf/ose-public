---
description: "The warning-and-above threshold, two enforcement points, toolchain convergence and its exemptions, clean-then-gate rollout, and documented-waivers-only rule for every cross-language lint gate."
when_to_use: "Use when adding a new lint gate, deciding its failure threshold, declaring a gate's binary under toolchains, or documenting a lint-rule waiver."
---

# Policy

- **Threshold**: every gate fails on a finding of severity **warning or above**.
  This matches how Prettier and markdownlint are already gated — there is no
  "advisory" tier that prints findings without blocking.
- **Two enforcement points**: every gate is declared in the `repo-config.yml` gate registry and
  runs through `./rhino gate run` both in CI (`.github/workflows/pr-quality-gate.yml`,
  `pull-request` surface) **and** in the local Husky hooks (`.husky/pre-commit` and its siblings).
  CI is the hard gate; the local hook gives fast feedback. A gate whose binary is missing fails
  rather than skipping, which is why its binary must converge through `toolchains`.
- **Toolchain convergence**: every native binary a declared gate invokes from `PATH` — directly or
  through its script — belongs in the `repo-config.yml` `toolchains` declaration, so
  `npm run doctor` reports it when missing. `./rhino toolchain provision --apply` runs only the
  provision vectors an entry declares; an entry that declares none is installed through its native
  manager (see the development-environment tool inventory), then doctor runs again. Exempt, and
  recorded beside the declaration: tools pinned by the npm lockfile and resolved from
  `node_modules/.bin`; binaries shipped inside a declared toolchain's own distribution (`gofmt` with
  `go`, `npx` with `npm`); a project-owned build wrapper such as `gradlew`; a script that downloads
  and digest-verifies its own pinned binary; and POSIX base utilities.
- **Clean-then-gate**: a gate is wired ON only after its existing violation
  backlog is cleaned, so the first CI/hook run never breaks on pre-existing
  findings.
- **Documented waivers only**: a rule is suppressed only where applying it would
  reduce clarity or reproducibility for no real safety gain, and every waiver is
  documented inline at the point of suppression (config comment or inline
  `disable`/`nowarn`), never silently.
