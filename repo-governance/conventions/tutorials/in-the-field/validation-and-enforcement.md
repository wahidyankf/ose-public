---
description: The automated checks and quality-gate workflow that validate In-the-Field guides.
when_to_use: Use when you need to know which automated agent or workflow enforces a specific In-the-Field standard.
---

# Validation and Enforcement

## Automated Validation

The **content-checker** agent validates:

- **Production topic coverage**: 20-40 guides
- **Standard library first**: Built-in examples precede frameworks
- **Annotation density**: 1.0-2.25 comment lines per code line PER CODE BLOCK
- **Error handling**: Production code includes proper exception handling
- **Resource management**: try-with-resources used for closeables
- **Security practices**: Input validation, secret management present
- **Diagram frequency**: 10-20 total diagrams (25-50% of guides)
- **Color-blind palette**: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- **Frontmatter completeness**: Title, date, weight, description, tags present

## Quality Gate Workflow

The **in-the-field-quality-gate** workflow orchestrates:

1. **apps-ayokoding-www-general-maker**: Creates/updates production guides
2. **content-checker**: Validates against standards
3. **User review**: Reviews audit report
4. **content-fixer**: Applies validated fixes
