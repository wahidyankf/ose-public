---
description: "How markdown tooling implements core principles and aligns with related conventions."
when_to_use: "Use when tracing markdown quality tooling to the principles/conventions it implements."
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

This practice implements and respects the following core principles:

### Automation Over Manual

**Implementation**: Markdown quality is enforced through automated tools rather than manual review:

- Pre-commit hooks automatically format staged markdown files
- Pre-push hooks prevent committing markdown violations
- coding agent PostToolUse hooks format/lint markdown after Edit/Write operations
- Single command (`npm run lint:md:fix`) auto-fixes 99.5% of violations

See [Automation Over Manual Principle](../../../principles/software-engineering/automation-over-manual.md) for foundational rationale.

### Explicit Over Implicit

**Implementation**: Quality rules are explicitly defined and transparent:

- Explicit configuration files (`.markdownlint-cli2.jsonc`, `.prettierrc.json`)
- Documented enabled/disabled rules with rationale
- Clear violation messages with fix guidance
- No "magic" formatting - all rules traceable to configuration

See [Explicit Over Implicit Principle](../../../principles/software-engineering/explicit-over-implicit.md) for foundational rationale.

### Simplicity Over Complexity

**Implementation**: Minimal configuration, maximum automation:

- Only two complementary tools (Prettier + markdownlint-cli2)
- Intentionally disabled overly strict rules (18 disabled rules)
- Simple npm scripts (`lint:md`, `format:md`)
- Zero-config for most use cases

See [Simplicity Over Complexity Principle](../../../principles/general/simplicity-over-complexity.md) for foundational rationale.

## Conventions Implemented/Respected

This practice enforces and aligns with the following documentation conventions:

### Content Quality Convention

**Alignment**: Markdown quality standards directly enforce content quality requirements:

- MD022: Ensures visual separation (readability)
- MD034/MD042: Enforces proper link formatting (accessibility)
- MD031: Ensures code block formatting (technical clarity)
- Disabled MD013: Allows long links (convention compliance)

See [Content Quality Convention](../../../conventions/writing/quality.md) for quality standards.

### Indentation Convention

**Alignment**: Enforces 2-space indentation for markdown lists:

- MD007: List indentation must be 2 spaces per level
- MD010: No hard tabs (spaces only)
- Prettier auto-formats to 2-space indentation

See [Indentation Convention](../../../conventions/formatting/indentation.md) for indentation standards.

### Linking Convention

**Alignment**: Enforces proper markdown linking:

- MD034: No bare URLs (use proper markdown links)
- MD042: No empty links
- Disabled MD041: Allows frontmatter before H1

See [Linking Convention](../../../conventions/formatting/linking.md) for linking standards.
