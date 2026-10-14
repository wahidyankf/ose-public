---
description: Rule 1 and Rule 2 of content separation — what belongs in docs/explanation/ repository-specific style guides versus ayokoding-www educational content
when_to_use: Read this when deciding whether new programming-language content belongs in docs/explanation/ (repo-specific) or ayokoding-www (educational).
---

# Content Separation Rules: Style Guides vs. Educational Content

## Rule 1: docs/explanation/ Focus - Repository-Specific Style Guides ONLY

**PASS: Repository-specific style guides**:

```
docs/explanation/software-engineering/programming-languages/rust/
├── README.md                                        # Overview + links to ayokoding-www
├── coding-standards.md            # OSE Platform Rust conventions
├── code-quality-standards.md      # OSE Platform Rust code quality
├── error-handling-standards.md    # OSE Platform error patterns
├── security-standards.md          # OSE Platform security standards
└── testing-standards.md           # OSE Platform testing standards
```

> **Note**: Rust (along with F#) follows the "Domain-Specific Standards Pattern" — multiple topic-focused standards files — rather than the "Three-Document Pattern" (idioms/best-practices/anti-patterns) used by TypeScript. Both patterns are valid. See `docs/explanation/software-engineering/programming-languages/README.md` for details.

**Content includes**:

- Naming conventions specific to OSE Platform (variable naming, file structure)
- Framework choices for the platform (Gin vs Echo, why we chose X)
- Repository-specific patterns (how we structure services, how we handle errors)
- Platform-specific anti-patterns (mistakes to avoid in OSE Platform context)
- Alignment with repo-governance/principles/software-engineering/ principles
- References to ayokoding-www for language fundamentals

**FAIL: Educational content** (move to ayokoding-www):

- ❌ Language syntax tutorials (variables, loops, functions)
- ❌ By-example learning content (75-85 annotated examples)
- ❌ In-practice practical guides (domain-driven design, security, testing)
- ❌ Beginner/intermediate/advanced learning paths
- ❌ Comprehensive language coverage (0-95%)

## Rule 2: ayokoding-www Focus - Educational Content (0-95% Coverage)

**PASS: Educational programming language content**:

```
apps/ayokoding-www/content/en/learn/software-engineering/programming-languages/golang/
├── _index.md                                   # Language overview
├── initial-setup.md                            # Installation, IDE setup
├── quick-start.md                              # First program, hello world
├── by-example/                                 # 75-85 annotated examples (PRIORITY)
│   ├── _index.md
│   ├── overview.md
│   ├── beginner.md                             # 0-40% coverage
│   ├── intermediate.md                         # 40-75% coverage
│   └── advanced.md                             # 75-95% coverage
├── in-practice/                                # Practical deep-dive guides
│   ├── error-handling.md                       # Generic Go error patterns
│   ├── domain-driven-design.md                 # DDD in Go (language-agnostic)
│   ├── security-practices.md                   # Go security basics
│   └── type-safety.md                          # Go type system
└── cookbook/                                   # 30+ practical recipes
    ├── _index.md
    └── common-tasks.md
```

**Content includes**:

- Language fundamentals (syntax, types, control flow)
- By-example annotated code (1-2.25 comment-to-code ratio)
- In-practice practical guides (generic patterns, not OSE Platform-specific)
- Cookbook recipes (copy-paste solutions to common problems)
- Progressive learning (0-30% foundational → 95% comprehensive)

**FAIL: Repository-specific content** (move to docs/explanation/):

- ❌ OSE Platform naming conventions
- ❌ OSE Platform framework choices
- ❌ OSE Platform architecture patterns
- ❌ OSE Platform-specific anti-patterns
