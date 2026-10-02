---
description: How content-creation and validation agents apply the English-first policy, and the 2026-02-07 removal of mirror-translated tutorials that established this policy.
when_to_use: Use when an ayokoding-www content or validation agent needs its default language behaviour, or to see the history behind this policy's establishment.
---

# Agent Guidelines and Migration Notes

## Agent Guidelines

### Content Creation Agents

**apps-ayokoding-www-general-maker**, **apps-ayokoding-www-by-example-maker**, **apps-ayokoding-www-in-the-field-maker**:

- **Default behaviour**: Create technical tutorials in English under `/en/learn/`
- **Do NOT automatically mirror** to Indonesian (`/id/belajar/`)
- **Exception**: If user explicitly requests Indonesian translation, create with cross-reference links
- **Ask if unclear**: When ambiguous, ask user about language preference

**Example Interaction**:

```markdown
User: "Create a tutorial about TypeScript generics"
Agent: Creates /en/learn/swe/programming-languages/typescript/tutorials/generics.md ONLY
Agent: Does NOT create /id/belajar/swe/programming-languages/typescript/tutorials/generics.md

User: "Create a personal essay in Indonesian about learning TypeScript"
Agent: Creates /id/celoteh/2024/02/belajar-typescript.md
```

### Validation Agents

**content-checker**:

- Validates that technical tutorials in English do NOT have automatic Indonesian mirrors
- Flags Indonesian technical tutorials without explicit translation justification
- Validates cross-reference links exist when translations DO exist
- Confirms Indonesian content matches encouraged categories (celoteh, cheat-sheets, konten-video)

## Migration Notes

**2026-02-07 - Policy Establishment**:

- Removed Indonesian translations of Elixir, Golang, TypeScript tutorials
- Established English-first policy for technical content
- Defined Indonesian content categories (unique content, strategic translations, discouraged mirrors)
- Created decision tree for language selection

**Past Indonesian Tutorial Content** (removed 2026-02-07):

```
Removed:
- content/id/belajar/swe/programming-languages/elixir/ (all tutorials)
- content/id/belajar/swe/programming-languages/golang/ (all tutorials)
- content/id/belajar/swe/programming-languages/typescript/ (all tutorials)

Reason: Mirror translations without ongoing maintenance commitment
Policy: These will only be recreated if explicitly requested with maintenance plan
```
