---
description: "The warning-and-above threshold, two enforcement points, toolchain convergence, clean-then-gate rollout, and documented-waivers-only rule for every cross-language lint gate."
when_to_use: "Use when adding a new lint gate, deciding its failure threshold, or documenting a lint-rule waiver."
---

# Policy

- **Threshold**: every gate fails on a finding of severity **warning or above**.
  This matches how Prettier and markdownlint are already gated — there is no
  "advisory" tier that prints findings without blocking.
- **Two enforcement points**: every gate runs in CI (`.github/workflows/pr-quality-gate.yml`)
  **and** in the local Husky hooks (`.husky/pre-commit`). CI is the hard gate;
  the local hook gives fast feedback and degrades gracefully (skips with a hint)
  when the tool is not yet installed, so a fresh checkout can still commit before
  its toolchain is provisioned.
- **Toolchain convergence**: every gate's binary belongs in the `repo-config.yml` `toolchains`
  declaration, so `npm run doctor` reports it when missing and `./rhino toolchain provision --apply`
  provisions it from the entry's declared provisioning.
- **Clean-then-gate**: a gate is wired ON only after its existing violation
  backlog is cleaned, so the first CI/hook run never breaks on pre-existing
  findings.
- **Documented waivers only**: a rule is suppressed only where applying it would
  reduce clarity or reproducibility for no real safety gain, and every waiver is
  documented inline at the point of suppression (config comment or inline
  `disable`/`nowarn`), never silently.
