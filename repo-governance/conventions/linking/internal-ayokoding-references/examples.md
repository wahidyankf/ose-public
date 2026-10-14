---
description: Four worked examples of converting public AyoKoding URLs to correct relative repository paths, including a multi-link learning-resources block.
when_to_use: Use when you want a concrete before/after example to copy while fixing or writing an AyoKoding cross-reference.
---

# Examples

## Example 1: Language Documentation Cross-Reference

**Context:** docs/explanation/software-engineering/programming-languages/typescript/README.md references AyoKoding TypeScript tutorials

**Scenario:** Pointing readers to comprehensive TypeScript learning content

❌ **WRONG:**

```markdown
For hands-on TypeScript tutorials, see our [TypeScript learning path](https://ayokoding.com/en/learn/software-engineering/programming-languages/typescript/).
```

✅ **CORRECT:**

```markdown
For hands-on TypeScript tutorials, see our [TypeScript learning path](../../../../../apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/typescript/).
```

## Example 2: React Reference

**Context:** docs/explanation/software-engineering/platform-web/tools/fe-react/README.md references AyoKoding React content

**Scenario:** Directing readers to framework tutorials

❌ **WRONG:**

```markdown
Learn React basics at [ayokoding.com](https://ayokoding.com/en/learn/software-engineering/platforms/web/tools/fe-react/).
```

✅ **CORRECT:**

```markdown
Learn React basics in our [comprehensive React tutorial series](../../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-react/).
```

## Example 3: Next.js Deep Dive

**Context:** docs/explanation/software-engineering/platform-web/tools/fe-nextjs/README.md references Next.js tutorials

**Scenario:** Cross-referencing detailed Next.js educational content

❌ **WRONG:**

```markdown
Check out our [Next.js tutorials](https://ayokoding.com/en/learn/software-engineering/platforms/web/tools/fe-nextjs/) for practical examples.
```

✅ **CORRECT:**

```markdown
Check out our [Next.js tutorials](../../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-nextjs/) for practical examples.
```

## Example 4: Multiple Cross-References in One Document

**Context:** docs/explanation/software-engineering/programming-languages/typescript/README.md references multiple AyoKoding sections

**Scenario:** Comprehensive navigation to related educational content

✅ **CORRECT:**

```markdown
## Learning Resources

This documentation provides reference material for TypeScript in the open-sharia-enterprise project. For comprehensive learning content, explore:

- **[TypeScript Fundamentals](../../../../../apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/typescript/)** - Core language concepts, syntax, and basic programming
- **[React](../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-react/)** - Component model, hooks, and state management
- **[Next.js](../../../../../apps/ayokoding-www/content/en/learn/software-engineering/platforms/web/tools/fe-nextjs/)** - Routing, rendering, and data fetching on top of React
```
