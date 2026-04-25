---
title: "Indentation Convention"
description: Standard markdown indentation for all files in the repository
category: explanation
subcategory: conventions
tags:
  - indentation
  - formatting
  - markdown
created: 2025-12-12
---

# Indentation Convention

This convention establishes standard markdown indentation for all files in the repository to ensure compatibility with standard markdown tools.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Uses standard markdown space indentation (2 spaces per level) instead of complex tab/space mixing schemes. One simple rule for all markdown files - no exceptions, no edge cases.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Spaces are visible and consistent across all editors. No hidden tab characters that render differently depending on editor configuration. What you see is what you get.

## Purpose

This convention establishes consistent indentation standards for all markdown files in the repository. It ensures bullet points, code blocks, and YAML frontmatter use appropriate indentation (spaces for bullets, 2 spaces for YAML, 4 spaces for code), improving readability and cross-tool compatibility.

## Scope

### What This Convention Covers

- **Bullet indentation** - Space indentation for nested bullets (2 spaces per level)
- **YAML frontmatter indentation** - 2-space indentation for YAML
- **Code block indentation** - How to indent code within markdown
- **Nested list formatting** - Multi-level bullet and numbered lists

### What This Convention Does NOT Cover

- **Source code indentation** - This convention is for markdown files, not application code
- **Hugo template indentation** - Covered in Hugo development practices
- **Diagram indentation** - Mermaid diagrams have their own syntax rules

## Core Principle

**All markdown files use STANDARD MARKDOWN bullet formatting** with space indentation.

**Why?**

- **Standard markdown compatibility**: Works in all markdown processors (GitHub, VS Code)
- **Universal compatibility**: Same format works everywhere (GitHub web, local editors, note-taking apps)
- **Editor consistency**: All text editors handle spaces consistently
- **Project-wide consistency**: All markdown files follow the same indentation rules

## Basic Rules

### Markdown Bullet Indentation

**Standard markdown format:**

- `- Text` (dash, SPACE, text) for same-level bullets
- Nested bullets use SPACES for indentation (2 spaces per level)

**Correct Pattern:**

```markdown
PASS: CORRECT - Standard markdown format:

- Main point
  - Nested detail (2 spaces before dash)
  - Another detail (2 spaces before dash)
    - Deeper elaboration (4 spaces before dash)

FAIL: INCORRECT - Tab after dash (NEVER use this):

-<TAB>Main point (tab after dash - WRONG!) -<TAB>Nested detail (tab after dash - WRONG!)

FAIL: INCORRECT - Tab before dash (NEVER use this):

- Main point
  <TAB>- Nested detail (tab before dash - WRONG!)
  <TAB><TAB>- Deeper elaboration (tabs before dash - WRONG!)
```

**Important**: Standard markdown uses:

1. Dash (`-`)
2. Single space
3. Text content

For nested bullets, add 2 spaces per indentation level BEFORE the dash. The pattern is always: `[SPACES]- Text` where SPACES determine nesting level (0 spaces = level 1, 2 spaces = level 2, 4 spaces = level 3, etc.).

## YAML Frontmatter Indentation

All YAML frontmatter blocks MUST use **2 spaces per indentation level** (standard YAML requirement):

```yaml
PASS: CORRECT - Frontmatter uses 2 spaces:
---
title: "Document Title"
description: Brief description
category: explanation
tags:
  - primary-topic # 2 spaces before dash
  - secondary-topic # 2 spaces before dash
created: 2025-12-12
---
```

**Why spaces in frontmatter?**

- **YAML specification**: YAML standard uses spaces for indentation
- **Tool compatibility**: All YAML parsers expect consistent space indentation
- **Critical for ALL nested frontmatter fields**: This applies to `tags`, any list fields, and any nested objects

**After frontmatter**: All markdown content (including bullets) continues using standard markdown formatting (space indentation).

## Code Block Indentation

Code blocks within documentation MUST use **language-specific idiomatic indentation**:

- **JavaScript/TypeScript**: 2 spaces per indent level (aligns with project Prettier configuration)
- **Python**: 4 spaces per indent level (PEP 8 standard)
- **YAML**: 2 spaces per indent level (YAML specification)
- **JSON**: 2 spaces per indent level (project standard)
- **CSS**: 2 spaces per indent level
- **Bash/Shell**: 2 spaces per indent level (common practice)
- **Go**: Tabs (Go language standard - ONLY exception where tabs are correct)

**CRITICAL**: Using TAB characters in code blocks (except Go) creates code that cannot be copied and pasted correctly. Always use the language's idiomatic indentation.

**Example**:

````markdown
- Research on authentication patterns #auth
  - Key findings about OAuth 2.0
    - Implementation in JavaScript:

```javascript
function authenticate(user) {
  if (user.isValid) {
    return generateToken(user); // 2 spaces (JavaScript standard)
  }
  return null;
}
```

    - Implementation in Python:

```python
def authenticate(user):
    if user.is_valid:
        return generate_token(user)  # 4 spaces (Python standard)
    return None
```

    - Implementation in Go (uses tabs):

```go
func Authenticate(user User) Token {
 if user.IsValid {
  return generateToken(user) // Tab indentation (Go standard)
 }
 return nil
}
```
````

**Rationale**: Code blocks represent actual source code and must follow their language's conventions, not the markdown formatting rules. This ensures code examples are syntactically correct and can be copied directly into editors or files without modification.

## Complete Example

Here's a complete example showing proper indentation in a `docs/` file:

````markdown
---
title: "Authentication Guide"
description: How to implement authentication
category: how-to
tags:
  - auth # 2 spaces (frontmatter uses spaces)
  - oauth # 2 spaces (frontmatter uses spaces)
created: 2025-12-12
---

# Authentication Guide

- Overview of authentication #auth
  - OAuth 2.0 is the recommended approach
    - Authorization code flow for web apps
    - Client credentials flow for service-to-service
  - Key security considerations
    - Token storage strategy
    - Refresh token rotation

- Implementation steps
  - Install dependencies:

```bash
npm install oauth2-provider
```

- Configure the provider:

```javascript
const oauth = new OAuth2Provider({
  clientId: process.env.CLIENT_ID, // 2 spaces (JS standard)
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: "https://example.com/callback",
});
```

- Test the integration
  - Use Postman for manual testing
  - Write automated tests for token flow

#authentication #oauth #implementation
````

## Indentation Checklist

Before committing files in `docs/`:

- [ ] **Markdown bullets** use standard format: `- Text` (dash-space-text)
- [ ] **Nested bullets** use 2 spaces per indentation level
- [ ] **YAML frontmatter** uses 2 spaces per indentation level
- [ ] **Code blocks** use language-specific idiomatic indentation:
  - [ ] JavaScript/TypeScript: 2 spaces
  - [ ] Python: 4 spaces
  - [ ] YAML: 2 spaces
  - [ ] JSON: 2 spaces
  - [ ] CSS: 2 spaces
  - [ ] Bash/Shell: 2 spaces
  - [ ] Go: Tabs (Go language standard)
- [ ] **No mixed indentation** - consistent throughout file
- [ ] **No tabs in bullets** - use spaces only (standard markdown)

## Related Conventions

**Universal Application**:

- [Content Quality Principles](../writing/quality.md) - Quality standards for all markdown

**Context-Specific**:

- [Hugo Content Convention - Shared](../hugo/shared.md) - Adapted for Hugo (frontmatter spaces, content standard markdown)
- [Hugo Content Convention - ayokoding](../hugo/ayokoding.md) - ayokoding-web indentation specifics
- [Hugo Content Convention - OSE Platform](../hugo/ose-platform.md) - oseplatform-web indentation specifics
- [File Naming Convention](../structure/file-naming.md) - File naming standards

## External Resources

- [YAML Specification](https://yaml.org/spec/) - YAML format specification
- [CommonMark Specification](https://spec.commonmark.org/) - Standard markdown specification
