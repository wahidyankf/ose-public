---
title: "Indonesian Content Policy - ayokoding-web"
description: Policy defining when and how to create Indonesian content in ayokoding-web bilingual platform
category: explanation
subcategory: conventions
tags:
  - ayokoding-web
  - indonesian
  - bilingual
  - content-policy
  - translation
created: 2026-02-07
updated: 2026-04-04
---

# Indonesian Content Policy - ayokoding-web

This document defines the policy for Indonesian language content in ayokoding-web, establishing when Indonesian content should be created and what types of content are appropriate for Indonesian translation.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Avoiding manual translation of technical tutorials that become outdated reduces maintenance burden. Resources focus on automated tooling and unique Indonesian-specific content where humans add most value.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Maintaining mirror translations doubles content maintenance complexity. English-first for technical tutorials with selective Indonesian content simplifies the content strategy while focusing resources where they have highest impact.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Explicitly stating which content types belong in Indonesian vs English prevents ambiguity and scope creep. Clear policy on translation exceptions ensures AI agents and contributors understand the content strategy.

## Purpose

This convention establishes a clear content language policy for ayokoding-web to:

- Define the primary language for different content types
- Prevent redundant translation effort for technical tutorials
- Focus Indonesian content on high-value, culturally-specific materials
- Provide clear guidance for content creators and AI agents on when to create Indonesian content

## Scope

### What This Convention Covers

- Language selection for technical tutorials (programming languages, frameworks, tools)
- Indonesian content types and their purpose
- Translation decision criteria
- Exception handling for specific translation requests
- Resource allocation strategy between languages

### What This Convention Does NOT Cover

- Indonesian language writing style and tone (covered in general content quality standards)
- Indonesian-specific frontmatter or markdown conventions (covered in [Hugo Content - ayokoding-web (historical)](../hugo/ayokoding.md))
- Bilingual navigation structure (covered in [Hugo Content - ayokoding-web (historical)](../hugo/ayokoding.md))
- Hugo multilingual configuration (covered in [Hugo Content - Shared (historical)](../hugo/shared.md))

---

## Core Policy: English-First for Technical Tutorials

**CRITICAL RULE**: ayokoding-web is **English-first** for technical tutorials and programming language content.

**Rationale**:

1. **Resource Efficiency**: Translating technical tutorials doubles maintenance burden
2. **Quality Degradation**: Translated tutorials often become outdated as English originals update
3. **Programming Reality**: Most programming resources, documentation, and communities use English
4. **Indonesian Value Focus**: Indonesian content should provide unique value, not mirror English content

**Applies to**:

- Programming language tutorials (Golang, Java, TypeScript, Python, Kotlin, Rust, Elixir, etc.)
- Software engineering concepts and patterns
- Framework and library tutorials
- Tool usage guides
- Technical reference materials

**Example** (English tutorial, no Indonesian mirror):

```
content/en/learn/swe/programming-languages/golang/
├── _index.md
├── overview.md
├── tutorials/
│   ├── by-example/
│   │   ├── beginner.md
│   │   ├── intermediate.md
│   │   └── advanced.md
│   └── by-concept/
│       └── comprehensive.md

NO Indonesian mirror at:
content/id/belajar/swe/programming-languages/golang/
(unless explicitly requested)
```

---

## Indonesian Content Categories

### Category 1: Unique Indonesian Content (ENCOURAGED)

**Purpose**: Content specifically valuable to Indonesian audience that doesn't exist in English.

**Content Types**:

- **Personal Essays** (`/id/celoteh/`) - Indonesian-language reflections, opinions, cultural perspectives
- **Key Lessons** - Learning insights specifically for Indonesian developers
- **Cheat Sheets** - Quick reference cards in Indonesian
- **Video Content** (`/id/konten-video/`) - Indonesian-language video tutorials or explanations
- **Blog Posts** - Indonesian-language articles on tech culture, career advice, local ecosystem
- **Local Ecosystem Guides** - Indonesian tech community resources, events, job market insights

**Characteristics**:

- Content originates in Indonesian (not translated from English)
- Provides culturally-specific value
- Addresses Indonesian developer community needs
- Not duplicating English technical tutorials

**Example Structure**:

```
content/id/
├── celoteh/                           # Personal essays
│   └── 2024/
│       └── 01/
│           └── refleksi-belajar-golang.md
├── konten-video/                      # Video content
│   └── intro-programming.md
└── cheat-sheets/                      # Quick references
    └── git-commands-bahasa.md
```

### Category 2: Strategic Translations (ALLOWED WITH EXPLICIT REQUEST)

**Purpose**: Specific English content that provides exceptional value when translated to Indonesian.

**When to Translate**:

- User explicitly requests translation of specific content
- Content has demonstrated high value in English
- Translation provides significant accessibility benefit
- Resources available for ongoing maintenance

**Process**:

1. **Explicit Request**: Translation must be explicitly requested (never automatic)
2. **Value Assessment**: Evaluate if translation provides sufficient value
3. **Maintenance Commitment**: Confirm resources to keep translation updated
4. **Create Deliberately**: Translate as separate, intentional task

**Example Request Flow**:

```markdown
User: "Please translate the Golang Initial Setup tutorial to Indonesian"
Agent: Creates /id/belajar/swe/programming-languages/golang/tutorials/initial-setup.md
Agent: Adds cross-reference links in both English and Indonesian versions
```

### Category 3: Mirror Translations (DISCOURAGED)

**Purpose**: None - mirror translations are explicitly discouraged.

**Definition**: Automatically creating Indonesian versions of all English technical tutorials.

**Why Discouraged**:

- **Maintenance Burden**: Doubles update effort when English content changes
- **Outdated Content**: Indonesian versions lag behind English updates
- **Resource Waste**: Translation effort could create unique Indonesian content
- **False Value**: Provides illusion of bilingual support without quality guarantee

**Policy**: DO NOT create mirror translations unless explicitly requested and justified.

---

## Decision Tree: Should I Create Indonesian Content?

Use this decision tree when considering Indonesian content creation:

```
START: Should I create Indonesian content?
│
├─ Is this a programming tutorial or technical reference?
│  ├─ Yes → Has user EXPLICITLY requested Indonesian translation?
│  │  ├─ Yes → Create Indonesian translation with maintenance commitment
│  │  └─ No → Create in ENGLISH only
│  │
│  └─ No → Is this personal essay, opinion, or culturally-specific?
│     ├─ Yes → Create in INDONESIAN (encouraged)
│     └─ No → Consider value proposition
│        ├─ High unique value → Create in INDONESIAN
│        └─ Low unique value → Create in ENGLISH
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

---

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

**See**: [Hugo Content - ayokoding-web (historical)](../hugo/ayokoding.md#cross-reference-pattern-bilingual-blogging-content) for complete cross-reference standards.

---

## Agent Guidelines

### Content Creation Agents

**apps-ayokoding-web-general-maker**, **apps-ayokoding-web-by-example-maker**, **ayokoding-web-by-concept-maker**:

- **Default behavior**: Create technical tutorials in English under `/en/learn/`
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

**apps-ayokoding-web-general-checker**:

- Validates that technical tutorials in English do NOT have automatic Indonesian mirrors
- Flags Indonesian technical tutorials without explicit translation justification
- Validates cross-reference links exist when translations DO exist
- Confirms Indonesian content matches encouraged categories (celoteh, cheat-sheets, konten-video)

---

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

---

## Rationale

### Why English-First for Technical Tutorials?

**Programming is International**: Programming languages, frameworks, tools, and communities predominantly use English. Indonesian developers need English proficiency for:

- Reading official documentation
- Participating in GitHub issues and discussions
- Following Stack Overflow answers
- Engaging with international developer communities

**Learning English Through Code**: Technical tutorials in English help Indonesian developers build both programming skills AND English technical vocabulary simultaneously.

**Resource Efficiency**: Translation effort is better spent creating:

- Unique Indonesian cultural perspectives
- Local ecosystem guides
- Career advice specific to Indonesian market
- Community-building content

### Why Encourage Unique Indonesian Content?

**Cultural Value**: Personal essays, reflections, and opinions carry cultural nuance that's lost in translation. Indonesian content provides authentic voice.

**Local Context**: Indonesian tech ecosystem, job market, community events, and career paths are unique. This content doesn't exist in English.

**Accessibility**: Cheat sheets, quick references, and introductory materials in Indonesian lower entry barriers for beginners while advanced learners consume English tutorials.

**Community Building**: Indonesian-language content builds local developer community identity and connection.

---

## Examples

### Example 1: Creating Technical Tutorial (English-First Policy)

**Scenario**: AI agent creates new TypeScript tutorial

**PASS: Good (follows policy)**:

```bash
# Agent creates English tutorial only
hugo new content/en/learn/swe/programming-languages/typescript/tutorials/by-example/advanced.md --kind learn

# No automatic Indonesian creation
# /id/belajar/swe/programming-languages/typescript/ does NOT exist
```

**FAIL: Bad (automatic mirroring)**:

```bash
# Agent creates English tutorial
hugo new content/en/learn/swe/programming-languages/typescript/tutorials/by-example/advanced.md --kind learn

# Agent ALSO creates Indonesian mirror (WRONG!)
hugo new content/id/belajar/swe/programming-languages/typescript/tutorials/by-example/advanced.md --kind learn
# This violates English-first policy unless explicitly requested
```

### Example 2: Creating Indonesian Unique Content

**Scenario**: Creating personal reflection on learning journey

**PASS: Good (unique Indonesian content)**:

```bash
# Create Indonesian personal essay (encouraged)
hugo new content/id/celoteh/2024/02/refleksi-belajar-golang.md --kind celoteh
```

**Content Focus**:

- Personal learning journey
- Cultural challenges specific to Indonesian developers
- Local community experiences
- Career insights for Indonesian market

**No English Version Needed**: This content is inherently Indonesian-specific and valuable in original language.

### Example 3: Explicit Translation Request

**Scenario**: User specifically requests Indonesian translation of high-value tutorial

**User Request**:

```markdown
User: "Please translate the Golang Initial Setup tutorial to Indonesian. This is critical for beginners who struggle with English."
```

**PASS: Good (explicit request with justification)**:

```bash
# Create Indonesian translation
hugo new content/id/belajar/swe/programming-languages/golang/tutorials/initial-setup.md --kind learn

# Add cross-reference in English version
echo "**Similar article:** [Pengaturan Awal Golang](/id/belajar/swe/programming-languages/golang/tutorials/initial-setup)" >> content/en/learn/swe/programming-languages/golang/tutorials/initial-setup.md

# Add cross-reference in Indonesian version with machine translation disclaimer
echo "> _Artikel ini adalah hasil terjemahan dengan bantuan mesin..._" >> content/id/belajar/swe/programming-languages/golang/tutorials/initial-setup.md
```

**Key Points**:

- Explicit user request
- Clear justification (accessibility for beginners)
- Cross-reference links in both versions
- Machine translation disclaimer in Indonesian version
- Maintenance commitment understood

---

## Quality Checklist

Before creating Indonesian content, verify:

- [ ] Content type matches encouraged Indonesian categories (personal essays, cheat sheets, video content, local guides)
- [ ] OR user has explicitly requested translation with clear justification
- [ ] Content is NOT automatic mirror of English technical tutorial
- [ ] If translation exists, both versions have cross-reference links
- [ ] Indonesian translation includes machine translation disclaimer
- [ ] Content provides unique value in Indonesian (not just language swap)
- [ ] Maintenance commitment understood for translated technical content

---

## References

**Related Conventions**:

- [Hugo Content - ayokoding-web (historical)](../hugo/ayokoding.md) - Site-specific conventions including bilingual support, cross-reference patterns, and navigation structure
- [Hugo Content - Shared (historical)](../hugo/shared.md) - Common Hugo conventions applying to all sites
- [Programming Language Content Standard](../tutorials/programming-language-content.md) - Full Set Tutorial Package architecture (applies to English tutorials)

**Related Principles**:

- [Automation Over Manual](../../principles/software-engineering/automation-over-manual.md) - Avoiding manual translation burden
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) - Simplified content strategy
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) - Clear translation policy

**Agents**:

- `apps-ayokoding-web-general-maker` - Creates ayokoding-web content following this policy
- `apps-ayokoding-web-by-example-maker` - Creates by-example tutorials (English-first)
- `ayokoding-web-by-concept-maker` - Creates by-concept tutorials (English-first)
- `apps-ayokoding-web-general-checker` - Validates compliance with this policy

---

**Last Updated**: 2026-02-07
