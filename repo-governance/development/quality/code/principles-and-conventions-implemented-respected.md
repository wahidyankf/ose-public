---
description: "Principles/conventions implemented."
when_to_use: "Use to trace this convention's rationale."
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Git hooks (Husky) automatically run Prettier and Commitlint before commits. Humans write code, machines enforce formatting and standards. No manual formatting or message validation required.

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: Prettier keeps its defaults except for the few options `.prettierrc.json` sets (print width, prose wrap, and two plugins). Commitlint uses standard Conventional Commits spec. Minimal tooling configuration reduces complexity.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[Commit Message Convention](../../workflow/commit-messages.md)**: Git hooks enforce Conventional Commits format through Commitlint, validating commit message structure before commits are created.

- **[Indentation Convention](../../../conventions/formatting/indentation.md)**: Prettier enforces consistent indentation (2 spaces for YAML frontmatter) across all formatted file types.

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Pre-commit hook formats all files matching the repository's file naming patterns without altering the naming structure.

- **[No Secrets in Git Convention](../../../conventions/security/no-secrets-in-committed-files.md)**: The hard iron
  rule that no system secret may ever be committed applies to every file touched by this practice —
  source code, config files, hook scripts, and staged content alike. Real secrets belong in
  gitignored `.env*` files; committed files use only placeholders or env-var references.
