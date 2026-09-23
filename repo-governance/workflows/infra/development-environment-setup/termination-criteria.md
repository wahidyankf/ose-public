---
description: "Defines success, partial, and failure outcomes for the environment-setup workflow."
when_to_use: "Use when determining whether your environment setup run succeeded, is partial, or failed."
---

# Termination Criteria

- **Success**: `npm run doctor` exits 0 with no findings, `./rhino gate run --surface pre-push`
  passes, at least one integration test and one E2E test pass
- **Partial**: Doctor reports no findings but some tests fail (likely a project-specific issue,
  not a toolchain issue); or, under `scope: minimal`, doctor reports only the toolchains that scope
  skips
- **Failure**: Doctor still reports findings after completing every phase the chosen scope covers
