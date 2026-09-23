---
description: "Automated code quality tools (Prettier, Husky, the Rhino gate registry, Commitlint) and git hooks for consistent formatting and commit message standards"
when_to_use: "Read this index to find the right Code Quality Convention child document."
---

# Code Quality Convention

- [Principles and Conventions Implemented/Respected](./principles-and-conventions-implemented-respected.md) — Principles/conventions implemented. Use to trace this convention's rationale.
- [Overview](./overview.md) — Overview of the automated code-quality tooling. Use when orienting to the code-quality toolchain.
- [Prettier - Code Formatting](./prettier-code-formatting.md) — How Prettier formats code in this repository. Use when configuring or debugging Prettier formatting.
- [Husky - Git Hooks](./husky-git-hooks.md) — How Husky wires git hooks in this repository. Use when configuring or debugging a Husky git hook.
- [Staged Formatting Gate](./staged-formatting-gate.md) — How the format-staged registry gate formats staged files and verifies pull requests. Use when configuring or debugging staged-file formatting.
- [Git Hook Workflow: Pre-commit Hook (Execution Order)](./git-hook-workflow-pre-commit-execution-order.md) — The pre-commit hook's location and gate steps. Use to trace what runs on git commit.
- [Git Hook Workflow: Pre-commit Hook (What It Validates)](./git-hook-workflow-pre-commit-what-it-validates.md) — What the pre-commit hook validates. Use when debugging a pre-commit check failure.
- [Git Hook Workflow: Commit-msg and Pre-push Hooks](./git-hook-workflow-commit-msg-and-pre-push-hooks.md) — What the commit-msg and pre-push hooks validate. Use when debugging a commit-msg or pre-push hook.
- [Bypassing Hooks (Not Recommended)](./bypassing-hooks-not-recommended.md) — Why bypassing a hook is discouraged. Use before bypassing a git hook.
- [Troubleshooting: Prettier, Commitlint, and Hooks Not Running](./troubleshooting-prettier-commitlint-hooks.md) — Fixes for Prettier, commitlint, and non-running hooks. Use when Prettier, commitlint, or a hook misbehaves.
- [Troubleshooting: Pre-push Hook](./troubleshooting-pre-push-hook.md) — Fixes for a slow or failing pre-push hook. Use when pre-push is slow or a check fails.
- [Adding New File Types](./adding-new-file-types.md) — How to add a new file type to the pipeline. Use when a new file type needs lint coverage.
- [Integration with Development Workflow](./integration-with-development-workflow.md) — How quality tooling fits the dev workflow. Use to see how quality tooling fits your workflow.
- [Language-Specific Auto-Formatters](./language-specific-auto-formatters.md) — Auto-formatters used per language across the repository. Use when checking which formatter applies to a given language.
- [Best Practices](./best-practices.md) — Best practices for working with the code-quality tooling. Use for a quick best-practice reminder on code quality.
- [Related Documentation and References](./related-documentation-and-references.md) — Related conventions and external references. Use for a related convention or reference.
