---
description: Real examples of documentation-first applied in this repository.
when_to_use: Use when looking for worked documentation examples.
---

# Examples from This Repository

## Comprehensive Convention Documentation

**Location**: `repo-governance/conventions/`

Every convention is fully documented:

- [File Naming Convention](../../../conventions/structure/file-naming.md) - Explains pattern, rationale, examples
- [Linking Convention](../../../conventions/formatting/linking.md) - GitHub-compatible links, two-tier formatting
- [Diátaxis Framework](../../../conventions/structure/diataxis-framework.md) - How to organize documentation
- [Color Accessibility Convention](../../../conventions/formatting/color-accessibility.md) - Accessible color palette, WCAG compliance

**Why this works**: Contributors understand conventions deeply. Checker agents can validate against documented standards.

## README Files in Every Project

**Pattern**: Every library and application has a README.

**Examples**:

- Repository root: `README.md` (project overview, setup, structure)
- Each library: `libs/[lib-name]/README.md` (what it does, how to use it)
- Each application: `apps/[app-name]/README.md` (what it is, how to run it)

**Why this works**: No guessing. Every project has an entry point explaining purpose and usage.

## Architectural Decision Documentation

**Location**: `docs/explanation/` and `docs/reference/`

**Examples**:

- [Monorepo Structure](../../../../docs/reference/monorepo-structure.md) - Explains Nx architecture, why apps/ and libs/, import patterns
- [Repository Architecture](../../../repository-governance-architecture.md) - Six-layer hierarchy, governance, traceability
- [Trunk Based Development](../../../development/workflow/trunk-based-development.md) - Git workflow, why main branch, deployment branches

**Why this works**: Maintainers understand WHY these architectures were chosen. Decisions are traceable and reversible with full context.

## Workflow Documentation

**Location**: `repo-governance/workflows/`

**Examples**:

- [Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md) - Three-stage pattern, agents, execution
- [Docs Propagation Workflow](../../../workflows/docs/docs-propagation.md) - Carries each change into every document it affects before commit

**Why this works**: Anyone can execute workflows consistently without prior knowledge or asking questions.

## API Documentation in Code

**Pattern**: TypeScript JSDoc comments for all public APIs.

````typescript
/**
 * Validates Shariah compliance of a Murabahah contract.
 *
 * Checks:
 * - Asset is halal (not alcohol, pork, weapons, gambling)
 * - Profit margin is fixed (not variable)
 * - Ownership transfer is clear
 *
 * @param contract - The Murabahah contract to validate
 * @returns Validation result with compliance status and issues
 * @throws {ValidationError} If contract structure is invalid
 *
 * @example
 * ```typescript
 * const result = validateMurabahahContract({
 *   asset: { type: 'vehicle', description: 'Toyota Camry' },
 *   cost: 25000,
 *   profitRate: 15,
 *   duration: 12
 * });
 * if (result.compliant) {
 *   console.log('Contract is Shariah-compliant');
 * }
 * ```
 */
function validateMurabahahContract(contract: MurabahahContract): ValidationResult {
  // Implementation
}
````

**Why this works**: Developers can use APIs confidently without reading implementation. IDE autocomplete shows documentation.
