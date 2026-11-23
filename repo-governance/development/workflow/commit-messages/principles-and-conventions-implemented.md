---
description: The principles and companion conventions the commit message format respects.
when_to_use: Use when tracing why the commit message convention exists back to the principles and conventions it respects.
---

# Principles and Conventions Implemented

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Commit format (`type(scope): description`) explicitly states the nature of change. No guessing from cryptic messages like "fix stuff" or "updates". Commit type, scope, and description are all explicit.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Automation covers the format. The commit-msg hook and the pull-request gate run Commitlint on every message, so format drift fails mechanically. Review still judges whether each commit is cohesive.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[Code Quality Convention](../../quality/code.md)**: The commit-msg hook in that toolchain runs Commitlint on the message; review checks the commit's composition.

- **[Content Quality Principles](../../../conventions/writing/quality.md)**: Commit messages use active voice (imperative mood) and clear, concise descriptions - aligning with content quality standards for communication.
