---
description: The decision tree for whether to create Indonesian content, a content-type example table, and the mandatory cross-reference links when translations exist.
when_to_use: Use when unsure whether a specific piece of content should be Indonesian or English, or when a translation exists and needs cross-reference links.
---

# Decision Tree and Cross-Reference Requirements

## Decision Tree: Should I Create Indonesian Content?

Use this decision tree when considering Indonesian content creation:

```mermaid
flowchart TD
    accTitle: Decision Tree: Should I Create Indonesian Content?
    accDescr: Tutorial or reference? leads to User asked for Indonesian? via Yes; User asked for Indonesian? leads to Translate and maintain it via Yes; User asked for Indonesian? leads to English only via No; and 5 more links.
    Q1{"Tutorial or<br/>reference?"}
    Q1 -->|Yes| Q2{"User asked for<br/>Indonesian?"}
    Q2 -->|Yes| TR["Translate and<br/>maintain it"]
    Q2 -->|No| EN1["English only"]
    Q1 -->|No| Q3{"Essay, opinion<br/>or cultural?"}
    Q3 -->|Yes| ID1["Indonesian,<br/>encouraged"]
    Q3 -->|No| Q4{"High unique<br/>value?"}
    Q4 -->|Yes| ID2["Indonesian"]
    Q4 -->|No| EN2["English"]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Examples by Content Type**:

| Content Type                      | Default Language | Indonesian Version?              | Rationale                                   |
| --------------------------------- | ---------------- | -------------------------------- | ------------------------------------------- |
| Golang By-Example Tutorial        | English          | No (unless explicitly requested) | Technical tutorial, English-first policy    |
| Personal Reflection on Learning   | Indonesian       | Yes (encouraged)                 | Culturally-specific, unique value           |
| TypeScript Intermediate Tutorial  | English          | No (unless explicitly requested) | Technical tutorial, English-first policy    |
| Indonesian Tech Community Guide   | Indonesian       | Yes (encouraged)                 | Local ecosystem content                     |
| Java Quick Start                  | English          | No (unless explicitly requested) | Technical tutorial, English-first policy    |
| Git Cheat Sheet (Bahasa)          | Indonesian       | Yes (encouraged)                 | Quick reference, accessibility value        |
| React Hooks Explanation           | English          | No (unless explicitly requested) | Technical explanation, English-first policy |
| Career Advice for Indonesian Devs | Indonesian       | Yes (encouraged)                 | Culturally-specific career guidance         |

## Cross-Reference Requirements

**CRITICAL**: When Indonesian translations DO exist (by explicit request), both English and Indonesian versions MUST include cross-reference links.

**English Original → Indonesian Translation**:

```markdown
**Similar article:** [Judul Artikel Indonesia](/id/belajar/path/to/article)
```

**Indonesian Translation → English Original**:

```markdown
> _Artikel ini adalah hasil terjemahan dengan bantuan mesin. Karenanya akan ada pergeseran nuansa dari artikel aslinya. Untuk mendapatkan pesan dan nuansa asli dari artikel ini, silakan kunjungi artikel yang asli di: [English Article Title](/en/learn/path/to/article)_
```

**See**: [Programming Language Content Standard](../../tutorials/programming-language-content.md) for complete content standards.
