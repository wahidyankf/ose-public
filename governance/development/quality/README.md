# Quality Development

Quality standards and methodologies for code quality, validation, and content preservation.

## Purpose

These standards define **HOW to maintain and validate quality**, covering automated code quality tools, repository validation methodologies, criticality and confidence level systems, and content preservation principles.

## Scope

**✅ Belongs Here:**

- Code quality automation (Prettier, Husky)
- Validation methodologies and patterns
- Criticality and confidence level systems
- Content preservation principles
- Quality gate standards

**❌ Does NOT Belong:**

- Why quality matters (that's a principle)
- Specific validation implementations (that's agents/)
- Content writing standards (that's conventions/)

## Documents

- [Code Quality Convention](./code.md) - Automated code quality tools and git hooks (Prettier, Husky, lint-staged) for consistent formatting and commit validation
- [Markdown Quality Convention](./markdown.md) - Standards for markdown linting and formatting using markdownlint-cli2 and Prettier for consistent markdown quality
- [Three-Level Testing Standard](./three-level-testing-standard.md) - Mandatory three-level testing architecture (unit/integration/E2E) for all projects: unit (all mocks + Gherkin specs for demo-be), integration (real PostgreSQL, no HTTP for demo-be; in-process mocking for others), E2E (full stack + Gherkin specs via Playwright)
- [Content Preservation Convention](./content-preservation.md) - Principles and processes for preserving knowledge when condensing files and extracting duplications
- [Criticality Levels Convention](./criticality-levels.md) - Universal criticality level system for categorizing validation findings (CRITICAL/HIGH/MEDIUM/LOW)
- [Fixer Confidence Levels Convention](./fixer-confidence-levels.md) - Universal confidence level system for fixer agents to assess and apply validated fixes (HIGH/MEDIUM/FALSE_POSITIVE)
- [Repository Validation Methodology Convention](./repository-validation.md) - Standard validation methods and patterns for repository consistency checking
- [No Machine-Specific Information in Commits](./no-machine-specific-commits.md) - Practice prohibiting absolute local paths, usernames, IP addresses, and environment-specific configuration from committed code

## Related Documentation

- [Development Index](../README.md) - All development practices
- [Nx Target Standards](../infra/nx-targets.md) - How `test:unit`, `test:integration`, and `test:e2e` map to Nx targets and their caching rules
- [BDD Spec-to-Test Mapping Convention](../infra/bdd-spec-test-mapping.md) - Gherkin spec consumption at each test level
- [Automation Over Manual Principle](../../principles/software-engineering/automation-over-manual.md) - Why automated quality matters
- [Maker-Checker-Fixer Pattern](../pattern/maker-checker-fixer.md) - Quality workflow pattern
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model

## Principles Implemented/Respected

This set of development practices implements/respects the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Code quality automation uses git hooks (Husky, Prettier, lint-staged) to enforce standards automatically before commits.

- **[Documentation First](../../principles/content/documentation-first.md)**: Content preservation conventions ensure knowledge is preserved during file condensation and restructuring, treating documentation as essential.

## Conventions Implemented/Respected

This set of development practices respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Quality validation standards align with documentation quality requirements for active voice, accessibility, and proper structure.

- **[Timestamp Format](../../conventions/formatting/timestamp.md)**: Quality reports and validation artifacts use standard UTC+7 timestamps for consistency and traceability.

---

**Last Updated**: 2026-01-01
