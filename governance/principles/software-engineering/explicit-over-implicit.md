---
title: "Explicit Over Implicit"
description: Choose explicit composition and configuration over magic, convenience, and hidden behavior
category: explanation
subcategory: principles
tags:
  - principles
  - explicit-configuration
  - transparency
  - clarity
created: 2025-12-15
updated: 2025-12-24
---

# Explicit Over Implicit

Choose **explicit composition and configuration** over magic, convenience, and hidden behavior. Code and configuration should be transparent and understandable without requiring deep knowledge of defaults or conventions.

## Vision Supported

This principle serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) of creating transparent, verifiable Shariah-compliant enterprise that anyone can audit and trust.

**How this principle serves the vision:**

- **Verifiable Shariah Compliance**: Explicit code makes Islamic finance logic visible and auditable. Anyone can verify implementations follow Shariah principles, not just claim they do
- **Builds Trust**: Transparent configuration and behavior build confidence in halal enterprise. No hidden assumptions or "magic" that could violate Islamic principles
- **Educational Value**: Explicit implementations serve as learning resources. Developers understand HOW Shariah compliance is achieved, not just THAT it's claimed
- **Community Auditing**: Open, explicit code enables peer review by both developers and Islamic scholars. Shared verification strengthens reliability
- **Alignment with Islamic Values**: Transparency (Amanah) and honesty are Islamic values. Explicit-over-implicit embodies these values in code

**Vision alignment**: Democratizing Islamic enterprise requires trust. Explicit, transparent implementations enable independent verification - essential when financial transactions must be Shariah-compliant. No black boxes in halal finance.

## What

**Explicit configuration** means:

- All behavior is visible and stated clearly
- No hidden defaults or "magic" conventions
- Configuration is written out, not inferred
- Dependencies are declared, not assumed
- Behavior is predictable and transparent

**Implicit configuration** means:

- Behavior relies on defaults or conventions
- Configuration is inferred from context
- "Magic" happens behind the scenes
- Dependencies are assumed or auto-discovered
- Behavior requires insider knowledge

## Why

### Benefits of Explicit Configuration

1. **Understandability**: Anyone can read the code/config and understand what happens
2. **Maintainability**: Changes don't break hidden assumptions
3. **Security**: No accidental permissions or unexpected behavior
4. **Debuggability**: Problems are easier to trace and fix
5. **Onboarding**: New team members can understand systems faster

### Problems with Implicit Configuration

1. **Hidden Behavior**: "Magic" that works until it doesn't
2. **Insider Knowledge**: Requires tribal knowledge to understand
3. **Debugging Nightmares**: Hard to trace where behavior comes from
4. **Accidental Breaking**: Changing defaults breaks everything
5. **Security Risks**: Unintended permissions or access

## How It Applies

### AI Agent Tool Permissions

**Context**: Agent files specify which tools they can use.

PASS: **Explicit (Correct)**:

```yaml
---
name: docs-checker
tools: Read, Glob, Grep
---
```

**Why this works**: Clear whitelist of exactly three tools. Anyone reading this knows the agent can read files, glob patterns, and grep content. No surprises.

FAIL: **Implicit (Avoid)**:

```yaml
---
name: docs-checker
tools: all
---
```

**Why this fails**: "All tools" is implicit. What does "all" include? Write? Bash? Can this agent delete files? Run commands? Requires knowledge of what tools exist. Security risk.

### File Naming Prefixes

**Context**: Files use prefixes to encode location.

PASS: **Explicit (Correct)**:

```
ex-pr__explicit-over-implicit.md
```

**Why this works**: The prefix `ex-pr` explicitly states "explanation/principles". Anyone can decode this by reading the convention.

FAIL: **Implicit (Avoid)**:

```
eoi.md  # "clever" abbreviation
```

**Why this fails**: What does "eoi" mean? Requires insider knowledge. Not self-documenting.

### Color Specification

**Context**: Mermaid diagrams use colors.

PASS: **Explicit (Correct)**:

```css
fill: #0173b2;
```

**Why this works**: Exact hex code. Renders identically everywhere. No ambiguity about which blue.

FAIL: **Implicit (Avoid)**:

```css
fill: blue;
```

**Why this fails**: CSS color names vary by browser and system. "Blue" could be #0000FF, #0173B2, or any blue. Not predictable.

### Frontmatter Fields

**Context**: Document metadata in YAML frontmatter.

PASS: **Explicit (Correct)**:

```yaml
---
title: "Explicit Over Implicit"
description: Choose explicit composition over magic
category: explanation
subcategory: principles
tags:
  - principles
  - explicit-configuration
created: 2025-12-15
updated: 2025-12-15
---
```

**Why this works**: All fields present. No guessing about category, tags, or dates. Self-contained.

FAIL: **Implicit (Avoid)**:

```yaml
---
title: "Explicit Over Implicit"
---
```

**Why this fails**: Missing category, tags, dates. Relies on defaults or context. Not self-documenting.

### Dependency Declaration

**Context**: Code imports and dependencies.

PASS: **Explicit (Correct)**:

```typescript
import { validateEmail } from "@open-sharia-enterprise/ts-validation";
import { createUser } from "./user-service";
```

**Why this works**: Clear dependency on validation library and local service. Path mappings defined in `tsconfig.base.json`. Traceable.

FAIL: **Implicit (Avoid)**:

```typescript
// Assumes global validateEmail function exists
// Assumes user-service is somehow available
```

**Why this fails**: Hidden dependencies. Requires knowledge of globals or auto-imports. Breaks silently.

### Configuration Files

**Context**: Application configuration.

PASS: **Explicit (Correct)**:

```json
{
  "api": {
    "baseUrl": "https://api.example.com",
    "timeout": 5000,
    "retries": 3
  }
}
```

**Why this works**: All settings visible. No hidden defaults. Behavior is predictable.

FAIL: **Implicit (Avoid)**:

```json
{
  "api": {
    "baseUrl": "https://api.example.com"
  }
}
```

**Why this fails**: What's the timeout? How many retries? Relies on code defaults. Behavior unclear from config.

## Anti-Patterns

### Magic Conventions

FAIL: **Problem**: Files named `index.ts` auto-import in certain contexts.

```
src/
  utils/
    index.ts  # "Magic" file
```

**Why it's bad**: Requires knowing the framework's auto-import convention. Not explicit.

### Hidden Defaults

FAIL: **Problem**: Agent assumes it has Write access if not specified.

```yaml
---
name: example-agent
# No tools field - assumes defaults
---
```

**Why it's bad**: What tools does it have? Requires reading agent runner code to know.

### Global State

FAIL: **Problem**: Functions rely on global variables.

```typescript
// Somewhere else: global.config = { ... }

function processData(data) {
  // Uses global.config implicitly
  return transform(data, config.settings);
}
```

**Why it's bad**: Hidden dependency on global state. Not visible in function signature.

### Convention-Based Routing

FAIL: **Problem**: File location determines route.

```
pages/
  about.tsx  # Implicitly creates /about route
```

**Why it's bad** (for our context): Route not visible in code. Requires knowing framework conventions. (Note: This is fine in Next.js/Nuxt where it's the standard pattern, but avoid inventing new conventions like this.)

## PASS: Best Practices

### 1. Write It Out

**Don't rely on defaults** - state everything explicitly:

```yaml
---
name: docs-maker
description: Expert documentation writer
tools: Read, Write, Edit, Glob, Grep
model: inherit
color: blue
---
```

All five required fields present. No guessing.

### 2. Make Dependencies Visible

**Import what you use** - don't assume globals:

```typescript
import { logger } from "./logger";
import { config } from "./config";

function processUser(userId: string) {
  logger.info(`Processing user ${userId}`);
  return fetchUser(userId, config.api);
}
```

Dependencies are clear from imports.

### 3. Use Typed Configuration

**Define types for configuration** - make structure explicit:

```typescript
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

const config: ApiConfig = {
  baseUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
};
```

Type system enforces completeness.

### 4. Document Explicitly

**Don't assume context** - state it in documentation:

```markdown
## Prerequisites

- Node.js 24.13.1 or higher (Volta managed)
- npm 11.10.1 or higher (Volta managed)
- Git 2.40 or higher

These versions are pinned in `package.json` under the `volta` field.
```

Version requirements and their source are explicit.

### 5. Validate Explicitly

**Check assumptions** - don't fail silently:

```typescript
function validateAgent(agent: AgentConfig) {
  if (!agent.name) throw new Error("Agent name is required");
  if (!agent.tools || agent.tools.length === 0) {
    throw new Error("Agent must specify at least one tool");
  }
  // Explicit validation, not implicit assumptions
}
```

## Examples from This Repository

### Git Hook Configuration

**Location**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Explicit behavior**:

- Hook triggers on pre-commit
- Runs `npx lint-staged` command
- No hidden magic
- Behavior visible in file

### Prettier Configuration

**Location**: `package.json` (lint-staged)

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,mjs,cjs}": "prettier --write",
    "*.json": "prettier --write",
    "*.md": "prettier --write",
    "*.{yml,yaml}": "prettier --write",
    "*.{css,scss}": "prettier --write"
  }
}
```

**Explicit behavior**:

- File patterns explicitly listed
- Command explicitly stated
- No "format all files" magic
- Only staged files processed

### Nx Path Mappings

**Location**: `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@open-sharia-enterprise/ts-validation": ["libs/ts-validation/src/index.ts"]
    }
  }
}
```

**Explicit behavior**:

- Path alias explicitly mapped
- Exact file path specified
- No convention-based discovery
- Behavior traceable

## Relationship to Other Principles

- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Explicit configuration is often simpler than magic
- [Accessibility First](../content/accessibility-first.md) - Explicit configuration improves understanding for all users
- [Automation Over Manual](./automation-over-manual.md) - Automate explicit checks, not implicit assumptions

## Related Conventions

- [AI Agents Convention](../../development/agents/ai-agents.md) - Explicit tool permissions
- [File Naming Convention](../../conventions/structure/file-naming.md) - Explicit prefixes
- [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) - Explicit hex codes
- [Code Quality Convention](../../development/quality/code.md) - Explicit git hooks

## References

**Software Engineering Principles**:

- [The Zen of Python](https://peps.python.org/pep-0020/) - "Explicit is better than implicit"
- [The Twelve-Factor App](https://12factor.net/config) - Configuration in environment
- [Martin Fowler on Explicit Dependencies](https://martinfowler.com/articles/injection.html)

**Security Best Practices**:

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/) - Explicit access control
- [Principle of Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)

---

**Last Updated**: 2025-12-24
