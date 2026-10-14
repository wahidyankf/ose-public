---
description: The core rule, pattern recognition, path-calculation method, common path examples, language selection, and link-text guidelines for AyoKoding relative-path linking.
when_to_use: Use when writing or reviewing a link from docs/ to apps/ayokoding-www/ and you need the exact relative-path rule and examples.
---

# Standards

## Core Rule: Use Relative Paths for Repository-Internal References

When documentation in `docs/` references educational content in `apps/ayokoding-www/`, use **relative file paths** within the repository, not public web URLs.

**Rationale:**

1. **Works during local development** - No web server or domain required
2. **Environment independence** - Same link works in dev, test, CI/CD, production
3. **Offline capability** - Developers can work without internet access
4. **Domain portability** - Links remain valid if domain changes
5. **Explicit relationship** - Path shows repository structure clearly

## Pattern Recognition

### ❌ WRONG: Public Web URL

```markdown
[TypeScript Explanation](https://ayokoding.com/en/learn/software-engineering/programming-languages/typescript/)
```

**Problems:**

- Breaks during offline development
- Fails if domain changes or is unavailable
- Creates external dependency on DNS and web server
- Obscures that content is in same repository

### ✅ CORRECT: Relative Repository Path

```markdown
[TypeScript Explanation](../../../../../apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/typescript/)
```

**Benefits:**

- Works in all environments (local, CI/CD, offline)
- No external dependencies
- Portable across domain changes
- Explicit repository relationship

## Path Calculation Method

To calculate the correct relative path from `docs/` to `apps/ayokoding-www/`:

1. **Count your depth in docs/** - How many directories deep is your current file?
2. **Navigate to repository root** - Use that many `../` to reach the root
3. **Navigate down to target** - `apps/ayokoding-www/content/[lang]/[path]/`

**Formula:** `[../]×depth + apps/ayokoding-www/content/[lang]/[path]/`

## Common Path Examples

### From docs/explanation/software-engineering/programming-languages/typescript/

**Depth:** 5 levels deep (`docs` → `explanation` → `software-engineering` → `programming-languages` → `typescript`)

**Target:** `apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/typescript/`

**Path:**

```markdown
../../../../../apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/typescript/
```

**Breakdown:**

```
Start:  docs/explanation/software-engineering/programming-languages/typescript/README.md
../     docs/explanation/software-engineering/programming-languages/  (up 1)
../     docs/explanation/software-engineering/                        (up 2)
../     docs/explanation/                                             (up 3)
../     docs/                                                          (up 4)
../     [repository root]                                              (up 5)
apps/ayokoding-www/                                                    (down 1)
content/en/learn/software-engineering/programming-languages/typescript/     (down to target)
```

### From docs/explanation/software-engineering/platform-web/tools/fe-react/

**Depth:** 6 levels deep

**Target:** `apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-react/`

**Path:**

```markdown
../../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-react/
```

### From docs/explanation/software-engineering/platform-web/tools/fe-nextjs/

**Depth:** 6 levels deep

**Target:** `apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-nextjs/`

**Path:**

```markdown
../../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-nextjs/
```

## Language Selection

AyoKoding content is bilingual (English and Indonesian). When linking from an English-language
page under `docs/`, use the **English path** (`/en/`):

**Pattern:**

```markdown
apps/ayokoding-www/content/en/learn/[topic-path]/
```

**Not:**

```markdown
apps/ayokoding-www/content/id/learn/[topic-path]/ ← Indonesian version
```

**Rationale:** The [Repository Working Language Convention](../../writing/repository-working-language.md)
makes English the default while permitting intentionally localized or language-native documents.
An English document should therefore point to English educational content for consistency; a
permitted non-English document may link to the matching language when available.

## Link Text Guidelines

Use **descriptive, context-appropriate link text** that follows [Content Quality Principles](../../writing/quality.md):

**Good examples:**

```markdown
[TypeScript programming language explanation](../../../../../apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/typescript/)

[React fundamentals](../../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-react/)

[Complete Next.js tutorial series](../../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-nextjs/)
```

**Avoid:**

```markdown
[here](../../../../../apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/typescript/) ← Vague

[Click this link](../../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-react/) ← Non-descriptive

[ayokoding-www](../../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-nextjs/) ← Technical, not semantic
```
