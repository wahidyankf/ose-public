---
title: "Factual Validation Convention"
description: Universal methodology for validating factual correctness across all repository content using web verification
category: explanation
subcategory: conventions
tags:
  - factual-validation
  - verification
  - web-research
  - accuracy
  - quality-assurance
created: 2025-12-16
---

# Factual Validation Convention

This document defines the **universal methodology** for validating factual correctness across all content in the repository. This convention provides shared verification patterns that apply to documentation, Hugo sites, plans, and README files.

## Principles Implemented/Respected

This convention respects the following core principles:

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Factual validation requires verifying assumptions against authoritative sources rather than proceeding with hidden uncertainty. Makers surface unknown facts, Checkers verify claims using WebSearch/WebFetch tools, and both make verification status explicit rather than implicit.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Web-based verification (WebSearch + WebFetch) automates fact-checking against authoritative sources. Machines verify command syntax, version numbers, and API accuracy - humans focus on content creation and strategic decisions.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Clear confidence classification (PASS: Verified, Unverified, FAIL: Error, Outdated) with explicit verification sources. No hidden assumptions about factual accuracy - every claim is either verified with source citation or marked as unverified.

## Purpose

This convention establishes a systematic methodology for verifying factual correctness in documentation using WebSearch and WebFetch tools. It ensures command syntax, code examples, version numbers, and external references are accurate and up-to-date, reducing documentation errors that mislead users. This methodology provides confidence classification for verified facts.

## Scope

### What This Convention Covers

- **Validation methodology** - How to use WebSearch/WebFetch to verify facts
- **Confidence classification** - [Verified], [Unverified], [Error], [Outdated] labels
- **What to validate** - Command syntax, versions, code examples, API references, external links
- **When to validate** - During content creation, updates, and periodic reviews
- **Validation markers** - How to mark validated content in documentation

### What This Convention Does NOT Cover

- **Link checking** - Covered by dedicated link-checker agents
- **Content accuracy of opinions or recommendations** - This only validates verifiable facts
- **Hugo site deployment** - Covered in deployment conventions
- **Automated fact checking** - This is a manual methodology, not automated tooling

## Overview

### What is Factual Validation?

Factual validation is the systematic process of verifying technical claims, commands, code examples, and references against authoritative sources using web-based research tools (WebSearch and WebFetch).

**Core Activities:**

- Verifying command syntax and options against official documentation
- Checking software versions are current or marked as historical
- Validating API usage matches current implementations
- Confirming external references are accessible and accurate
- Detecting contradictions within and across documents
- Identifying outdated information using web research

### Why This Matters

**Without factual validation:**

- FAIL: Readers follow incorrect commands that don't work
- FAIL: Tutorials reference deprecated APIs causing confusion
- FAIL: Documentation contradicts itself creating trust issues
- FAIL: Outdated version numbers mislead about compatibility
- FAIL: Broken links frustrate users seeking additional information

**With factual validation:**

- PASS: All technical claims verified against authoritative sources
- PASS: Commands and code examples guaranteed to work
- PASS: Version information current and accurate
- PASS: Contradictions detected and resolved
- PASS: External references validated for accessibility

### Scope

This convention applies to **all content types** across the repository:

| Content Type                | Validation Focus                                                    |
| --------------------------- | ------------------------------------------------------------------- |
| **Documentation** (`docs/`) | Technical accuracy, command syntax, code examples, version numbers  |
| **Hugo Sites**              | Educational accuracy, tutorial code, bilingual consistency          |
| **Plans** (`plans/`)        | Technology choices, codebase assumptions, documentation URLs        |
| **README Files**            | Installation instructions, version requirements, feature claims     |
| **Convention Documents**    | Referenced standards, tool capabilities, specification URLs         |
| **Agent Definitions**       | Tool permissions, model capabilities, reference documentation links |

## Core Validation Methodology

### 1. Command Syntax Verification

**What to Verify:**

- Command-line tools use correct syntax
- Flags and options exist and are current
- Parameter names and types are accurate
- Example commands work as described

**Verification Process:**

```
1. Identify the tool (e.g., "gobuster", "npm", "git")
2. WebSearch: "[tool name] documentation [current year]"
3. WebFetch: Access official documentation URL
4. Verify:
   - Command exists and is spelled correctly
   - Flags/options exist (e.g., `-u`, `--url`, `-t`)
   - Parameter types are correct
   - Example usage matches official docs
```

**Example:**

```
Claim: "gobuster dir -u http://example.com -w wordlist.txt -x php,html"
Verification:
1. WebSearch: "gobuster dir mode documentation"
2. WebFetch: https://github.com/OJ/gobuster (official repo)
3. Check: -u flag exists, -w for wordlist, -x for extensions
4. Result: PASS: Verified or FAIL: Flag -x is actually --extensions
```

### 2. Feature Existence Verification

**What to Verify:**

- Described features actually exist in the software
- Feature names are correct (not outdated or renamed)
- Capabilities match what's documented
- Version-specific features are marked

**Verification Process:**

```
1. Identify feature claim (e.g., "Gobuster has 7 modes")
2. WebSearch: "[tool] features [current year]"
3. WebFetch: Official documentation or README
4. Compare: Documented features vs. claimed features
5. Flag differences: Missing, renamed, or extra features
```

**Example:**

```
Claim: "Gobuster supports 7 modes: dir, dns, vhost, s3, gcs, tftp, fuzz"
Verification:
1. WebFetch: https://github.com/OJ/gobuster/README.md
2. Extract: Actual mode list from official docs
3. Compare: Claimed vs. actual modes
4. Result: PASS: All 7 modes verified or FAIL: Only 6 modes exist (missing fuzz)
```

### 3. Version Number Verification

**What to Verify:**

- Version numbers are real and current
- Compatibility claims are accurate
- "Latest" qualifiers are still true
- No security advisories exist

**Verification Process:**

```
1. Extract version claim (e.g., "Next.js 15.0.0")
2. WebSearch: "[library] latest version [current year]"
3. WebFetch: Package registry (npm, PyPI, etc.) or GitHub releases
4. Check:
   - Is claimed version real?
   - Is it latest, or outdated?
   - Are there security advisories?
```

**Example:**

```
Claim: "Using Prisma 6.0.2 (latest stable)"
Verification:
1. WebSearch: "Prisma latest version 2025"
2. WebFetch: https://www.npmjs.com/package/prisma
3. Check: Latest version is 6.1.0 (released 2025-11-20)
4. Result: Outdated - 6.0.2 is not latest (6.1.0 is)
```

### 4. Code Example Validation

**What to Verify:**

- Code snippets use correct language syntax
- Imports/requires are accurate
- Function signatures match actual APIs
- API methods exist and are not deprecated
- Parameter order and types are correct

**Verification Process:**

```
1. Extract code snippet from documentation
2. Identify language and libraries used
3. WebSearch: "[library] [method/API] documentation"
4. WebFetch: Official API documentation
5. Verify:
   - Import paths are correct
   - Function signatures match current API
   - Parameters are in correct order
   - Return types are accurate
```

**Example:**

````
Claim:
```typescript
import { createUser } from '@prisma/client';
const user = await createUser({ name: 'John' });
```

Verification:
1. WebFetch: https://www.prisma.io/docs/reference/api-reference
2. Check: Prisma Client doesn't export `createUser` directly
3. Actual API: `prisma.user.create({ data: { name: 'John' } })`
4. Result: FAIL: Incorrect API usage
````

### 5. External Reference Verification

**What to Verify:**

- URLs are accessible (not 404/403)
- Citations support the claims made
- Documentation sources are current
- Attribution is correct

**Verification Process:**

```
1. Extract cited URLs from documentation
2. WebFetch: Check if URL is accessible (not 404/403)
3. If accessible: Read content to verify it supports the claim
4. If broken: WebSearch to find current URL or alternative source
```

**Example:**

```
Claim: "According to NIST guidelines at [broken URL]..."
Verification:
1. WebFetch: Original URL returns 404
2. WebSearch: "NIST [topic] guidelines"
3. Find: New URL for same guideline
4. Result: URL outdated, suggest replacement
```

### 6. Mathematical Notation Validation

**What to Verify:**

- LaTeX syntax is used for mathematical formulas
- Variables use proper subscripts ($r_f$ not r_f in text)
- Greek letters use LaTeX ($\beta$ not β in formulas)
- Display math uses `$$...$$` with proper spacing
- LaTeX is NOT used inside code blocks or Mermaid diagrams
- All variables are defined after formulas

**Verification Process:**

```
1. Search for mathematical content in markdown
2. Check inline math uses `$...$` delimiters
3. Check display math uses `$$...$$` delimiters
4. Verify LaTeX NOT in code blocks, Mermaid, or ASCII art
5. Confirm variables are defined
```

**Common error pattern:**

```markdown
FAIL: BROKEN - Single $ on its own line:
$
WACC = \frac{E}{V} \times r_e
$

PASS: CORRECT - Use $$:

$$
WACC = \frac{E}{V} \times r_e
$$
```

### 7. Diagram Color Accessibility Validation

**What to Verify:**

- Mermaid diagrams use color-blind friendly colors
- Inaccessible colors (red, green, yellow) are NOT used
- Shape differentiation is used (not relying on color alone)
- Black borders (#000000) are included for definition
- Color scheme is documented in comments
- Contrast ratios meet WCAG AA standards (4.5:1 for text)

**Accessible Palette:**

- Blue: `#0173B2`
- Orange: `#DE8F05`
- Teal: `#029E73`
- Purple: `#CC78BC`
- Brown: `#CA9161`

**Verification Process:**

```
1. Extract Mermaid diagrams from content
2. Check style declarations for fill colors
3. Verify all colors are from accessible palette
4. Flag any red, green, or yellow usage
5. Confirm black borders present
```

### 8. Markdown Structure Format Validation

**What to Verify:**

- File has H1 heading at start (`# ...`)
- Traditional sections are used (`## H2`, `### H3`, etc.)
- Proper document structure with paragraphs
- Single H1 per file (not multiple)

**Verification Process:**

```
1. Read file content
2. Check first non-frontmatter line is H1 (`# Title`)
3. Verify only one H1 in entire file
4. Confirm proper heading hierarchy (no H3 without H2)
```

### 9. Bullet Indentation Validation

**What to Verify:**

- Correct pattern: `- Text` (dash, space, text) for same-level
- Nested: `- Text` (2 spaces BEFORE dash)
- Deeper: `- Text` (4 spaces BEFORE dash)
- NOT: `-  Text` (spaces AFTER dash - wrong)

**Common error:**

```markdown
FAIL: WRONG - Spaces after dash:

- First level (spaces after dash - WRONG!)
- Nested level (spaces after dash - WRONG!)

PASS: CORRECT - Spaces before dash:

- First level
  - Nested level (2 spaces before dash)
    - Deeper level (4 spaces before dash)
```

### 10. Code Block Indentation Validation

**What to Verify:**

- Language-specific idiomatic indentation (NOT tabs, except Go)
- JavaScript/TypeScript: 2 spaces per indent level
- Python: 4 spaces per indent level
- YAML: 2 spaces per indent level
- JSON: 2 spaces per indent level
- CSS: 2 spaces per indent level
- Bash/Shell: 2 spaces per indent level
- Go: tabs (ONLY exception where tabs are correct)

**Rationale:** Code blocks must use language-specific idiomatic indentation to ensure examples can be copied and pasted correctly into actual code files.

## Web Verification Workflow

### WebSearch Usage Patterns

**When to use WebSearch:**

1. **Finding current version information**
   - "Next.js latest version 2025"
   - "Prisma npm latest"

2. **Verifying tool existence and status**
   - "gobuster GitHub repository"
   - "volta Node.js version manager"

3. **Checking best practices and standards**
   - "WCAG AA contrast ratio standard"
   - "Conventional Commits specification"

4. **Fallback when WebFetch is blocked (403 errors)**
   - "wikipedia TypeScript article"
   - Verify article exists via search results

**Search Query Patterns:**

- Include current year for recency: `"[tool] documentation 2025"`
- Use official source names: `"[library] npm"`, `"[tool] GitHub"`
- Be specific: `"Next.js 15 release notes"` not just `"Next.js"`

### WebFetch Usage Patterns

**When to use WebFetch:**

1. **Accessing official documentation URLs**
   - Official GitHub repositories
   - Package registries (npm, PyPI)
   - Standards bodies (NIST, OWASP, W3C)

2. **Verifying external reference accessibility**
   - Check links return 200 (not 404, 403)
   - Validate redirect chains are reasonable

3. **Reading API documentation for verification**
   - Method signatures
   - Parameter types
   - Return values

**Handling 403 Errors:**

Some sites block automated tools (Wikipedia, GitHub, etc.):

1. **Use WebSearch as fallback**
   - Search: "wikipedia [article name]"
   - Verify article exists via search results

2. **Try alternative sources**
   - Official mirrors or documentation
   - Internet Archive (Wayback Machine)

3. **Document the limitation**
   - Note: "Unable to WebFetch due to 403, verified via WebSearch"

### Authoritative Sources (Preference Order)

**Prefer in this order:**

1. **Official documentation** - Primary source of truth
2. **Official GitHub repository** - README, docs/, releases
3. **Package registries** - npm, PyPI, RubyGems (for versions)
4. **Standards bodies** - NIST, OWASP, W3C, IETF RFCs
5. **Reputable tech sites** - MDN, Stack Overflow Docs (with caution)

**Avoid:**

- Blog posts (unless from official source)
- Outdated Stack Overflow answers
- Unofficial wikis or third-party docs
- Forums or discussion threads

## Validation Priorities

### High Priority - Always Verify

**Critical technical claims that cause failures:**

- Commands and their flags/options
- Version numbers and compatibility claims
- Code examples and API usage
- External URLs and citations
- Installation instructions
- Configuration syntax

**Impact:** Users blocked or misled if incorrect

### Medium Priority - Verify if Suspicious

**Quality and performance claims:**

- Best practices and recommendations
- Performance claims and benchmarks
- Tool capabilities and limitations
- Feature comparisons

**Impact:** Quality degraded but not blocking

### Low Priority - Verify Periodically

**Background and context:**

- General explanations and concepts
- Historical information and background
- Subjective recommendations

**Impact:** Informational only

## Report Structure Standards

### Validation Report Sections

All factual validation reports should include:

#### 1. Summary Section

- Total files checked
- Total claims verified
- Factual errors found
- Contradictions detected
- Outdated information flagged

#### 2. Verified Facts Section

List claims successfully verified:

```markdown
PASS: Verified: Gobuster supports 7 modes (dir, dns, vhost, s3, gcs, tftp, fuzz)
Source: https://github.com/OJ/gobuster (verified 2025-12-16)
```

#### 3. Factual Errors Section

Document incorrect claims:

```markdown
FAIL: Factual Error at docs/guide.md:45
Current: "Use flag -x to specify extensions"
Issue: Flag -x does not exist in gobuster dir mode
Correction: Use --extensions
Source: https://github.com/OJ/gobuster#dir-mode
Severity: High (example won't work as documented)
```

#### 4. Contradictions Section

List conflicting statements:

```markdown
Contradiction Found
File 1: docs/tutorial.md:23 - "Use HTTP for local development"
File 2: docs/security.md:67 - "Always use HTTPS"
Conflict: Inconsistent security guidance
Recommendation: Align on single approach (recommend HTTPS everywhere)
```

#### 5. Potentially Outdated Section

Flag stale content:

```markdown
Potentially Outdated at docs/setup.md:34
Content: "Install Node.js 18 (latest LTS)"
Concern: Node.js 24 is now LTS (as of 2025-10-29)
Suggestion: Update to recommend Node.js 24 LTS
```

## ️ Confidence Level Classification

### PASS: Verified

**Criteria:**

- Re-validation using WebSearch/WebFetch confirms claim
- Authoritative source accessed successfully
- Current as of verification date

**Example:**

```
PASS: Verified: Next.js 15.0.0 supports React 19
Source: https://nextjs.org/blog/next-15
Verified: 2025-12-16
```

### Unverified

**Criteria:**

- Unable to access authoritative source
- Requires manual testing to confirm
- No clear verification method available

**Example:**

```
Unverified: Performance claim requires benchmarking
Reason: No public benchmark data available
Action Required: Manual performance testing
```

### FAIL: Error

**Criteria:**

- Re-validation clearly disproves claim
- Authoritative source contradicts content
- Command/code doesn't work as documented

**Example:**

```
FAIL: Error: Command syntax incorrect
Current: "npm install -g gobuster"
Issue: Gobuster is not an npm package
Correction: Install via apt-get or build from source
```

### Outdated

**Criteria:**

- Information was correct but is now superseded
- Newer version/approach available
- "Latest" qualifier no longer accurate

**Example:**

```
 Outdated: Version reference is stale
Current: "Node.js 18 (latest LTS)"
Issue: Node.js 24 is now LTS (since 2025-10-29)
Correction: Update to Node.js 24
```

## Common Verification Scenarios

### Scenario 1: Technical Tool Documentation

**Example:** Gobuster documentation

**Verify:**

- All modes exist: dir, dns, vhost, s3, gcs, tftp, fuzz
- Flags are correct: -u for URL, -w for wordlist, -t for threads
- Example commands work: Syntax is valid
- Features match docs: Capabilities align with official documentation

**Steps:**

```
1. WebFetch: https://github.com/OJ/gobuster
2. Read README.md and docs/ folder
3. Compare claimed features vs. actual features
4. Test example command syntax against usage docs
5. Flag any discrepancies with file:line references
```

### Scenario 2: API Documentation

**Example:** REST API endpoints

**Verify:**

- Endpoint paths are correct: /api/v1/users not /api/users
- Parameters match actual API: Name, type, required/optional
- Response formats are accurate: JSON structure, field names
- Authentication methods are current: OAuth2, JWT, API keys
- Error codes are documented correctly: 404, 401, 403

**Steps:**

```
1. WebFetch: API documentation URL
2. If available, test against live API (if permitted)
3. Compare documented vs. actual endpoints
4. Verify parameter types and requirements
5. Check response examples match actual responses
```

### Scenario 3: Framework Documentation

**Example:** Next.js features

**Verify:**

- Installation steps are current: Package names, commands
- Code examples use correct API: No deprecated methods
- Version compatibility claims: Works with React 19
- Configuration examples: Correct file names and structure
- Deprecated features are marked: Flagged as outdated

**Steps:**

```
1. WebFetch: https://nextjs.org/docs
2. WebSearch: "Next.js [feature] latest documentation"
3. Compare code examples with official docs
4. Check if APIs used are current or deprecated
5. Verify version numbers and compatibility claims
```

### Scenario 4: Installation/Setup Guides

**Example:** Software installation

**Verify:**

- Package names are correct: No typos or wrong package
- Commands are accurate: Install, build, run commands
- Prerequisites are current: Node.js versions, dependencies
- Configuration steps work: File locations, syntax
- Troubleshooting is relevant: Common issues are current

**Steps:**

```
1. WebFetch: Official installation documentation
2. Verify package names on npm/PyPI/etc.
3. Check command syntax against official docs
4. Validate version requirements are current
5. Test if configuration examples are syntactically correct
```

## Handling Uncertainty

### When Unable to Verify

**If verification is impossible:**

1. **State the limitation explicitly**
   - "Unable to verify: [reason]"
   - "Requires manual testing: [why]"

2. **Provide verification steps for user**
   - "To verify this claim, check: [source]"
   - "Test this by running: [command]"

3. **Flag as uncertain in report**
   - "Unverified: [claim] - requires [action]"

4. **Never present unverified info as verified**
   - Mark clearly as "unverified" or "assumed correct"

### Ambiguous Cases

**When context matters:**

- Document both interpretations
- Note which context applies where
- Flag for human review if critical

**Example:**

```
Potential Context-Dependent Claim:
"Use HTTP for development"

Context A (Local only): May be acceptable
Context B (Shared network): Security risk
Recommendation: Clarify which context applies or use HTTPS everywhere
```

## Integration Guidance for Different Content Types

### Documentation (`docs/`)

**Validation Focus:**

- Command syntax accuracy
- Code examples work as shown
- Version numbers are current
- External links are accessible
- No contradictions within/across files

**Agent:** `docs-checker`, `docs-fixer`

### Hugo Educational Content (ayokoding-web)

**Validation Focus:**

- Tutorial code compiles/runs
- Learning objectives are achievable
- Difficulty levels are accurate
- Indonesian/English consistency
- Educational sequences are logical

**Agent:** `apps-ayokoding-web-facts-checker`, `apps-ayokoding-web-facts-fixer`

### Hugo Platform Content (oseplatform-web)

**Validation Focus:**

- Feature claims are accurate
- Release information is current
- Links to external resources work
- Version compatibility is correct

### Plans (`plans/`)

**Validation Focus:**

- Technology choices are maintained (not deprecated)
- Codebase assumptions are accurate (files exist, structure correct)
- Documentation URLs are accessible
- Version requirements are current

**Agent:** `plan-checker`, `plan-fixer`

### README Files

**Validation Focus:**

- Installation instructions work
- Version requirements are current
- Feature claims are accurate
- Links to documentation are valid

**Agent:** `readme-checker`, `readme-fixer`

## Related Documentation

**Implementation Agents:**

- `docs-checker.md` - Documentation factual accuracy validator (implements this convention for `docs/`)
- `apps-ayokoding-web-facts-checker.md` - Educational content factual validator (implements this convention for ayokoding-web)
- `plan-checker.md` - Plan accuracy validator (implements portions of this convention)

**Quality Standards:**

- [Content Quality Principles](./quality.md) - Universal markdown quality standards
- [Mathematical Notation Convention](../formatting/mathematical-notation.md) - LaTeX notation standards
- [Color Accessibility Convention](../formatting/color-accessibility.md) - Accessible color palette
- [Hugo Content Convention - Shared](../hugo/shared.md) - Hugo content standards
- [Hugo Content Convention - ayokoding](../hugo/ayokoding.md) - ayokoding-web specifics

**Development Practices:**

- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Three-stage quality workflow
- [Fixer Confidence Levels](../../development/quality/fixer-confidence-levels.md) - Fix confidence assessment
- [Repository Validation Methodology](../../development/quality/repository-validation.md) - Standard validation patterns

---

This convention provides the **universal methodology** for factual validation. Individual agents implement domain-specific checks while following these shared verification patterns and confidence classifications.
