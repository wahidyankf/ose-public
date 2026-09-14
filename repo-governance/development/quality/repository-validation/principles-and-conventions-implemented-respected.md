---
description: "Principles/conventions implemented."
when_to_use: "Use to trace this convention's rationale."
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Standard validation patterns enable accurate automated consistency checking. AWK commands reliably extract frontmatter, bash scripts verify conventions automatically. Machines handle repetitive validation instead of humans.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Frontmatter extraction pattern (`awk 'BEGIN{p=0}...'`) is explicitly documented as the canonical method. Validation logic is transparent and reproducible. No magic regex or undocumented checking methods.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Validation methods verify files use lowercase kebab-case basenames with standard extensions, matching the GitHub-compatible filename rule.

- **[Linking Convention](../../../conventions/formatting/linking.md)**: Link validation checks verify relative paths with .md extension exist and target files are accessible.

- **[Timestamp Format Convention](../../../conventions/formatting/timestamp.md)**: Validation patterns verify UTC+7 timestamps in YAML frontmatter match ISO 8601 format with timezone offset.

- **[Indentation Convention](../../../conventions/formatting/indentation.md)**: Frontmatter extraction assumes 2-space YAML indentation when parsing nested structures.
