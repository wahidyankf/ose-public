---
title: "Documentation First"
description: Documentation is not optional - it is mandatory for knowledge transfer, maintainability, and democratization
category: explanation
subcategory: principles
tags:
  - principles
  - documentation
  - knowledge-transfer
  - institutional-memory
  - maintainability
created: 2025-12-28
---

# Documentation First

**Documentation is not an option, it is a must.** Every system, every convention, every feature, every architectural decision must be documented. Undocumented knowledge is lost knowledge - it exists in one person's head until they leave, forget, or become unavailable.

## Vision Supported

This principle serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) of democratizing Shariah-compliant enterprise by making knowledge accessible to everyone.

**How this principle serves the vision:**

- **Universal Knowledge Access**: Islamic enterprise knowledge locked in developers' heads cannot democratize anything. Documentation makes knowledge accessible to all, not just original authors
- **Enables Global Contribution**: Developers worldwide can understand, use, and contribute to systems when documentation explains WHY and HOW. Undocumented code creates barriers to participation
- **Supports Community Learning**: Newcomers learn Islamic business principles through clear documentation. Tutorials, explanations, and references enable self-guided mastery
- **Prevents Institutional Lock-In**: When knowledge exists only in experts' heads, communities become dependent on those individuals. Documentation creates institutional memory that survives personnel changes
- **Transparency Builds Trust**: Open-source code is transparent, but without documentation, it's opaque. Explanations of Shariah compliance decisions, architectural choices, and design rationale build community trust
- **Scalability of Impact**: Well-documented systems scale to thousands of users and contributors. Undocumented systems scale only to those who can reverse-engineer or ask the original authors
- **Alignment with Islamic Values**: Knowledge-sharing (`Ilm`) is an Islamic virtue. Hoarding knowledge (leaving it undocumented) contradicts the principle of benefiting the ummah (`Maslahah`)

**Vision alignment**: You cannot "democratize" knowledge if that knowledge is undocumented. Documentation is the mechanism by which expertise becomes a commons. Without it, open-source code is just readable binaries - available but not accessible.

## What

**Documentation First** means:

- All code requires documentation (README files, API documentation, inline comments for complex logic)
- All conventions require explanation documents (not just verbal traditions)
- All features require how-to guides (teaching users how to use them)
- All architectural decisions require explanation documents (capturing WHY choices were made)
- All workflows require step-by-step documentation (enabling consistent execution)
- Documentation is written BEFORE or WITH code, not "we'll document it later"
- "Self-documenting code" is not an excuse - code explains HOW, documentation explains WHY

**Documentation types required**:

- **README files**: Overview, purpose, quick start, key concepts
- **API documentation**: Function signatures, parameters, return values, examples
- **Inline comments**: Complex algorithms, non-obvious decisions, edge cases
- **How-To guides**: Step-by-step problem-solving documentation
- **Explanations**: Concepts, architecture, design decisions, trade-offs
- **Tutorials**: Learning-oriented instruction for newcomers
- **References**: Technical specifications, configuration options, comprehensive details

## Why

### Enables Knowledge Transfer

Documentation is the primary mechanism for knowledge transfer:

- **Across time**: Future maintainers understand past decisions
- **Across people**: New contributors understand systems without asking original authors
- **Across contexts**: Users in different situations can apply knowledge independently
- **Across skill levels**: Beginners learn from documentation; experts refresh their memory

**Without documentation**: Knowledge exists only where it was created. Every new person must rediscover, reverse-engineer, or ask.

**With documentation**: Knowledge spreads automatically. Written once, accessed infinitely.

### Reduces Tribal Knowledge

**Tribal knowledge** - information known only to insiders, passed verbally, never written down - creates:

- **Single points of failure**: "Only Alice knows how this works"
- **Barriers to entry**: New contributors can't participate without insider access
- **Information silos**: Teams hoard knowledge instead of sharing
- **Lost knowledge**: When people leave, their expertise leaves with them

Documentation eliminates tribal knowledge by making implicit expertise explicit and accessible.

### Makes Systems Maintainable

Systems are maintainable when future maintainers can:

- **Understand the code**: What it does, how it works
- **Understand the WHY**: Why this approach was chosen over alternatives
- **Modify safely**: Knowing which parts can change and which cannot
- **Extend correctly**: Adding features without breaking existing design

**Undocumented systems** are unmaintainable. Maintainers either:

- Avoid changes (fear of breaking unknown dependencies)
- Rewrite from scratch (cheaper than understanding undocumented code)
- Introduce bugs (modifying code they don't understand)

**Well-documented systems** welcome maintenance. Maintainers understand context, constraints, and rationale.

### Supports Onboarding and Scalability

**New contributor onboarding time**:

- **Undocumented system**: Weeks to months of asking questions, trial-and-error, and context-gathering
- **Well-documented system**: Days to productive contributions (read docs, understand context, contribute)

**Project scaling**:

- **Undocumented**: Limited by how many people original authors can personally mentor
- **Documented**: Scales to hundreds of contributors who can self-onboard through documentation

### Enables Automation and Tooling

Documentation supports automation:

- **API documentation** enables code generation (OpenAPI, GraphQL schemas)
- **Convention documents** enable automated validation (checker agents know what to verify)
- **Workflow documentation** enables orchestration (workflows can be automated)
- **Configuration documentation** enables validation (tools can verify correctness)

**Docs-as-code approach**: Documentation becomes infrastructure. Tools read it, validate against it, generate from it.

### Prevents "Works on My Machine" Problems

Undocumented knowledge often includes:

- Implicit environment setup steps ("everyone knows you need X installed")
- Undocumented configuration ("of course you set that environment variable")
- Assumed context ("obviously you run this command first")

**Documentation prevents assumptions**:

- **Explicit prerequisites**: What you need installed, what versions, what configuration
- **Explicit steps**: Exactly what to do, in what order, with what expected output
- **Explicit environment**: What environment variables, what operating systems, what dependencies

### Creates Institutional Memory

**Institutional memory** - the collective knowledge of an organization or project - is stored in:

- FAIL: **People's heads**: Lost when people leave
- FAIL: **Chat logs**: Buried, unsearchable, forgotten
- FAIL: **Email threads**: Scattered, inaccessible, lost to time
- PASS: **Documentation**: Permanent, searchable, accessible, versioned

Well-documented projects survive personnel changes. Knowledge persists regardless of who is present.

### Serves the Vision of Democratization

From the [Vision](../../vision/open-sharia-enterprise.md):

> "Islamic enterprise principles are universal and accessible to all. Yet the technology to implement them is locked away, creating artificial scarcity where abundance should exist."

Undocumented code is **locked knowledge**. It exists but is not accessible. Documentation transforms code from "viewable" to "understandable" - from availability to true democratization.

## How It Applies

### Code Documentation

**Context**: All source code in the repository.

**Requirements**:

PASS: **Every library** has a README explaining:

- What it does (purpose and scope)
- Why it exists (problem it solves)
- How to use it (quick start and examples)
- Key concepts (important abstractions and patterns)

PASS: **Every application** has a README explaining:

- What it is (application purpose)
- Who it's for (target users)
- How to run it (setup, configuration, deployment)
- How to contribute (development setup)

PASS: **Complex functions** have inline comments explaining:

- Non-obvious algorithm choices
- Performance considerations
- Edge cases and why they're handled that way
- Security implications

PASS: **Public APIs** have documentation for:

- Function signatures (parameters, return types)
- Parameter meanings and constraints
- Return value meanings
- Example usage
- Error conditions

FAIL: **Anti-pattern**: "The code is self-documenting"

````typescript
// NO DOCUMENTATION - UNMAINTAINABLE
function calculate(a: number, b: number, c: number): number {
  return (a * b) / c;
}

// PROPERLY DOCUMENTED - MAINTAINABLE
/**
 * Calculates the profit rate for a Murabahah contract.
 *
 * Formula: (cost * markup_percentage) / contract_duration
 *
 * @param cost - The cost price of the asset (in currency units)
 * @param markup_percentage - The profit markup as a percentage (e.g., 15 for 15%)
 * @param contract_duration - Duration in months
 * @returns The monthly profit rate
 *
 * @example
 * ```typescript
 * const monthlyProfit = calculateMurabahahProfitRate(10000, 15, 12);
 * // Returns: 125 (10000 * 15 / 12)
 * ```
 */
function calculateMurabahahProfitRate(cost: number, markup_percentage: number, contract_duration: number): number {
  return (cost * markup_percentage) / contract_duration;
}
````

**Why this works**: Future maintainers understand WHAT the function calculates, WHY these parameters matter, and HOW to use it correctly.

### Convention Documentation

**Context**: All standards and conventions in `governance/conventions/`.

**Requirements**:

PASS: **Every convention** has a document explaining:

- What the convention is (the rule)
- Why it exists (the rationale)
- How to apply it (examples)
- When exceptions are allowed (if any)
- Principles it implements (traceability)

FAIL: **Anti-pattern**: "We just follow this convention, everyone knows it"

**Example**: Instead of just enforcing file naming via checker agents, we have [File Naming Convention](../../conventions/structure/file-naming.md) explaining:

- The pattern: descriptive kebab-case filenames with category implied by directory location
- The why: Readability, searchability, no prefix lookup required
- Examples: `getting-started.md`, `file-naming-convention.md`
- Principles: Explicit Over Implicit, Simplicity Over Complexity

**Why this works**: New contributors understand WHY the convention exists and can apply it correctly in new contexts.

### Feature Documentation

**Context**: All features in applications and libraries.

**Requirements**:

PASS: **Every feature** has documentation including:

- **How-to guide**: Step-by-step instructions for using the feature
- **Reference documentation**: Complete technical details (API, configuration, options)
- **Explanation**: Why the feature exists, what problem it solves, design decisions

FAIL: **Anti-pattern**: "The feature is live, users will figure it out"

**Example**: When adding a new Islamic finance calculation (e.g., Murabahah profit calculation), document:

- **How-to**: "How to Calculate Murabahah Profits" (step-by-step guide)
- **Reference**: API documentation for `calculateMurabahahProfit()` function
- **Explanation**: "Understanding Murabahah Profit Structures" (concepts, Shariah principles, design rationale)

**Why this works**: Users can use the feature independently. Developers can maintain and extend it confidently.

### Architectural Decision Documentation

**Context**: All major technical decisions (frameworks, patterns, architecture).

**Requirements**:

PASS: **Every architectural decision** is documented with:

- **Context**: What problem are we solving?
- **Decision**: What approach did we choose?
- **Rationale**: Why this approach over alternatives?
- **Consequences**: What trade-offs does this create?
- **Alternatives considered**: What did we NOT choose and why?

FAIL: **Anti-pattern**: "We chose Express because I like it"

**Example**: Decision to use Nx monorepo:

```markdown
## Decision: Nx Monorepo Architecture

**Context**: Multiple applications and libraries sharing code and conventions.

**Decision**: Use Nx monorepo with apps/ and libs/ structure.

**Rationale**:

- Task caching reduces build times
- Affected detection runs only changed projects
- Dependency graph visualizes relationships
- Consistent tooling across projects

**Consequences**:

- Single repository (simpler than multi-repo, but larger)
- Shared dependencies (version alignment required)
- Learning curve for Nx CLI

**Alternatives Considered**:

- Multi-repo: More complex versioning, harder to share code
- Lerna/Turborepo: Less integrated than Nx
- No monorepo: Code duplication, inconsistent tooling
```

**Why this works**: Future maintainers understand WHY this architecture was chosen. When requirements change, they can reconsider with full context.

### Workflow Documentation

**Context**: All multi-step processes (deployment, validation, content creation).

**Requirements**:

PASS: **Every workflow** is documented with:

- **Purpose**: What the workflow achieves
- **Steps**: Exact sequence of actions
- **Tools**: What tools or agents are involved
- **Inputs**: What information is required
- **Outputs**: What is produced
- **Error handling**: What to do when things fail

FAIL: **Anti-pattern**: "Just run these commands in order (which order? what do they do?)"

**Example**: See [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md):

- Explains the three-stage pattern clearly
- Lists exact agents involved in each stage
- Describes inputs and outputs
- Provides execution examples

**Why this works**: Anyone can execute the workflow correctly without tribal knowledge or guessing.

## Anti-Patterns

### "Self-Documenting Code" Excuse

FAIL: **Problem**: Claiming code doesn't need documentation because it's "readable".

```typescript
// CLAIMED TO BE "SELF-DOCUMENTING"
const result = items
  .filter((i) => i.type === "murabahah")
  .map((i) => i.cost * 1.15)
  .reduce((sum, val) => sum + val, 0);
```

**Why it's bad**: Code shows WHAT is calculated, not WHY or in what context. Future maintainers don't know:

- Why filter for 'murabahah' specifically?
- Why multiply by 1.15 (is this a fixed markup? Shariah-compliant rate?)?
- What does this result represent?
- When should this calculation be used?

PASS: **Solution**: Add documentation explaining context and rationale.

```typescript
/**
 * Calculates total expected profit for all Murabahah contracts.
 *
 * Murabahah contracts use a fixed 15% markup (1.15 multiplier) as per
 * our Shariah board's approved profit structure for short-term asset financing.
 *
 * @param items - Array of financial contracts
 * @returns Total profit in currency units
 */
function calculateTotalMurabahahProfit(items: Contract[]): number {
  return items
    .filter((i) => i.type === "murabahah")
    .map((i) => i.cost * 1.15)
    .reduce((sum, val) => sum + val, 0);
}
```

### "We'll Document It Later"

FAIL: **Problem**: Writing code without documentation, planning to add it "later".

**Why it's bad**:

- "Later" never comes (other priorities emerge)
- Context is forgotten (what was obvious during coding is forgotten days later)
- Technical debt accumulates (undocumented code breeds more undocumented code)
- Quality suffers (documentation is treated as optional, not essential)

PASS: **Solution**: Documentation First - write docs BEFORE or WITH code, not after.

**Workflow**:

1. Write explanation document (what problem, what approach, why)
2. Write API documentation (function signatures, parameters)
3. Write code implementing the documented API
4. Write how-to guide (how to use the feature)
5. Update README with overview

### Verbal Tradition Instead of Written Documentation

FAIL: **Problem**: Knowledge passed verbally but never written down.

**Symptoms**:

- "Just ask Alice, she knows how this works"
- "We discussed this in a meeting last month"
- "Everyone on the team knows this convention"

**Why it's bad**:

- Alice might not always be available
- Meeting discussions are not searchable or permanent
- "Everyone knows" excludes newcomers and future contributors

PASS: **Solution**: Document all important knowledge in permanent, searchable formats (markdown docs, code comments, convention documents).

### README-less Repositories

FAIL: **Problem**: Repositories without README files.

**Why it's bad**: No entry point for understanding what the code does, why it exists, or how to use it.

PASS: **Solution**: Every repository, library, and application MUST have a README explaining:

- What it is
- Why it exists
- How to use it
- How to contribute

### Outdated Documentation

FAIL: **Problem**: Documentation that doesn't match current reality.

**Why it's bad**: Worse than no documentation - misleads users and maintainers.

PASS: **Solution**:

- Update documentation when changing code (documentation is part of the change)
- Use automated validation (checker agents verify docs match reality)
- Mark deprecated sections clearly
- Remove obsolete documentation rather than leaving it to confuse

### Documentation Without Context

FAIL: **Problem**: Technical details without explanation of WHY.

```markdown
## Configuration

Set `PROFIT_RATE=15` in environment variables.
```

**Why it's bad**: Doesn't explain WHY 15, whether it can change, or what it represents.

PASS: **Solution**: Always provide context.

```markdown
## Configuration

Set `PROFIT_RATE` to the Murabahah profit markup percentage approved by
your Shariah board. Default is `15` (representing 15% markup), which aligns
with our Shariah board's standard for short-term asset financing contracts.

This rate must be:

- Fixed (not variable) per Murabahah Shariah principles
- Approved by qualified Islamic scholars
- Clearly disclosed to all parties

Example: `PROFIT_RATE=15`
```

## PASS: Best Practices

### 1. Write Documentation BEFORE or WITH Code

**Documentation First approach**:

1. Start with explanation document (context, problem, approach)
2. Write API documentation (signatures, parameters, examples)
3. Implement code matching the documented API
4. Write how-to guide teaching usage
5. Update README with overview

**Why this works**: Documentation drives design. Explaining the API before writing it reveals design flaws early.

### 2. Use the Diátaxis Framework

Organize documentation into four categories:

- **Tutorials**: Learning-oriented (teach newcomers step-by-step)
- **How-To Guides**: Problem-oriented (solve specific problems)
- **Reference**: Information-oriented (technical specifications, API details)
- **Explanation**: Understanding-oriented (concepts, architecture, decisions)

See [Diátaxis Framework](../../conventions/structure/diataxis-framework.md) for complete details.

**Why this works**: Different audiences need different documentation types. Organizing by purpose makes information findable.

### 3. Document the WHY, Not Just the WHAT

**Code shows WHAT**. Comments and documentation explain **WHY**.

```typescript
// FAIL: BAD COMMENT - Repeats what code already shows
// Loop through items and add them
for (const item of items) {
  total += item.value;
}

// PASS: GOOD COMMENT - Explains WHY
// Murabahah contracts require total cost calculation before applying
// markup. This ensures profit is calculated on actual asset cost, not
// estimated values (Shariah compliance requirement).
for (const item of items) {
  total += item.value;
}
```

### 4. Provide Examples

Every piece of documentation should include examples:

- **API docs**: Show function calls with realistic parameters and expected outputs
- **How-to guides**: Include complete, working examples users can copy
- **Explanations**: Use concrete scenarios to illustrate abstract concepts

**Why this works**: Examples make abstract concepts concrete. Users learn faster from examples than from descriptions.

### 5. Keep Documentation Close to Code

**Location strategy**:

- **README files**: Next to the code they describe (every library, every app)
- **Inline comments**: In the source code (for complex logic, edge cases)
- **API documentation**: Generated from code comments (JSDoc, TypeScript doc comments)
- **High-level docs**: In `docs/` directory (conventions, explanations, tutorials)

**Why this works**: Co-location increases the chance documentation stays up-to-date. Developers see docs when changing code.

### 6. Make Documentation Reviewable

**Include documentation in code review**:

- README changes reviewed alongside code changes
- Inline comments reviewed as part of function implementation
- Convention documents reviewed before enforcement

**Why this works**: Review catches documentation errors, missing context, and unclear explanations before they spread.

### 7. Validate Documentation Automatically

**Use checker agents** to validate:

- PASS: README files exist in all libraries and apps
- PASS: Links in documentation are valid
- PASS: Code examples in docs actually work
- PASS: API documentation matches actual code signatures
- PASS: Convention documents exist for all enforced rules

**Why this works**: Automation catches documentation drift. Agents ensure docs stay accurate as code evolves.

## Examples from This Repository

### Comprehensive Convention Documentation

**Location**: `governance/conventions/`

Every convention is fully documented:

- [File Naming Convention](../../conventions/structure/file-naming.md) - Explains pattern, rationale, examples
- [Linking Convention](../../conventions/formatting/linking.md) - GitHub-compatible links, two-tier formatting
- [Diátaxis Framework](../../conventions/structure/diataxis-framework.md) - How to organize documentation
- [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) - Accessible color palette, WCAG compliance

**Why this works**: Contributors understand conventions deeply. Checker agents can validate against documented standards.

### README Files in Every Project

**Pattern**: Every library and application has a README.

**Examples**:

- Repository root: `README.md` (project overview, setup, structure)
- Each library: `libs/[lib-name]/README.md` (what it does, how to use it)
- Each application: `apps/[app-name]/README.md` (what it is, how to run it)

**Why this works**: No guessing. Every project has an entry point explaining purpose and usage.

### Architectural Decision Documentation

**Location**: `docs/explanation/` and `docs/reference/`

**Examples**:

- [Monorepo Structure](../../../docs/reference/monorepo-structure.md) - Explains Nx architecture, why apps/ and libs/, import patterns
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer hierarchy, governance, traceability
- [Trunk Based Development](../../development/workflow/trunk-based-development.md) - Git workflow, why main branch, deployment branches

**Why this works**: Maintainers understand WHY these architectures were chosen. Decisions are traceable and reversible with full context.

### Workflow Documentation

**Location**: `governance/workflows/`

**Examples**:

- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Three-stage pattern, agents, execution
- [Documentation Quality Gate Workflow](../../workflows/docs/docs-quality-gate.md) - Validation before commits

**Why this works**: Anyone can execute workflows consistently without prior knowledge or asking questions.

### API Documentation in Code

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

## Relationship to Other Principles

- [Explicit Over Implicit](../software-engineering/explicit-over-implicit.md) - Documentation makes implicit knowledge explicit
- [Accessibility First](./accessibility-first.md) - Documentation makes knowledge accessible to all
- [Progressive Disclosure](./progressive-disclosure.md) - Multiple documentation levels for different skill levels
- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Clear, simple documentation over complex jargon

## Related Conventions

- [Diátaxis Framework](../../conventions/structure/diataxis-framework.md) - How to organize documentation into four categories
- [Content Quality Principles](../../conventions/writing/quality.md) - Quality standards for all markdown content
- [README Quality Convention](../../conventions/writing/readme-quality.md) - Standards for README files
- [Convention Writing Convention](../../conventions/writing/conventions.md) - How to write convention documents

## References

**Documentation Philosophy**:

- [Write the Docs](https://www.writethedocs.org/) - Documentation community and best practices
- [Diátaxis](https://diataxis.fr/) - Systematic approach to technical documentation
- [Documentation Guide by Google](https://google.github.io/styleguide/docguide/) - Google's documentation standards

**API Documentation**:

- [JSDoc](https://jsdoc.app/) - JavaScript documentation standard
- [TypeDoc](https://typedoc.org/) - TypeScript documentation generator
- [OpenAPI](https://www.openapis.org/) - API documentation standard

**Architectural Decision Records**:

- [ADR GitHub Organization](https://adr.github.io/) - Lightweight architectural decision records
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Michael Nygard

**Knowledge Management**:

- [The Knowledge Creating Company](https://hbr.org/2007/07/the-knowledge-creating-company) - Nonaka and Takeuchi
- [Working in Public: The Making and Maintenance of Open Source Software](https://press.stripe.com/working-in-public) - Nadia Eghbal
