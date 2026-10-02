---
description: "Describes the automated validation performed by content-checker and the quality-gate workflow."
when_to_use: "Read when you need to know what an automated checker validates on By-Concept content or how the quality-gate workflow runs."
---

# Validation and Enforcement

## Automated Validation

The **content-checker** agent validates:

- **Coverage percentage**: 95% target achieved
- **Section count**: 40-60 total (beginner: 15-25, intermediate: 12-20, advanced: 10-20)
- **Annotation density**: 1.0-2.25 comment lines per code line PER CODE BLOCK (not file average)
- **Annotation quality**: `// =>` or `# =>` notation used, explains WHY not just WHAT
- **Diagram frequency**: 30-50 total diagrams (10-15 per level)
- **Color-blind palette**: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- **Section structure**: Intro, narrative, code, takeaway, why it matters present
- **Frontmatter completeness**: Title, date, weight, description, tags present

**Production validation targets** (ayokoding-www needs enhancement to match by-example quality):

- Current: 40-60 sections, 8-15 diagrams, minimal annotation
- Target: 40-60 sections, 30-50 diagrams, 1.0-2.25 annotation density

## Quality Gate Workflow

The **by-concept-quality-gate** workflow orchestrates:

1. **apps-ayokoding-www-general-maker**: Creates/updates sections
2. **content-checker**: Validates against standards
3. **User review**: Reviews audit report
4. **content-fixer**: Applies validated fixes
