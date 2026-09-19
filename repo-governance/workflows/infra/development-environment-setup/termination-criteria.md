---
description: "Defines success, partial, and failure outcomes for the environment-setup workflow."
when_to_use: "Use when determining whether your environment setup run succeeded, is partial, or failed."
---

# Termination Criteria

- **Success**: `npm run doctor` shows all tools OK, `./rhino gate run --surface pre-push`
  passes, at least one integration test and one E2E test pass
- **Partial**: Doctor shows all tools OK but some tests fail (likely a project-specific issue,
  not a toolchain issue)
- **Failure**: Doctor reports missing tools after completing all phases
