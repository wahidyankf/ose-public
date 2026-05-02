---
title: "Diagram and Schema Convention"
description: Standards for using Mermaid diagrams and ASCII art in open-sharia-enterprise markdown files. Includes color-blind accessibility requirements
category: explanation
subcategory: conventions
tags:
  - diagrams
  - mermaid
  - ascii-art
  - visualization
  - conventions
  - accessibility
  - color-blindness
created: 2025-11-24
---

# Diagram and Schema Convention

This document defines when and how to use different diagram formats in the open-sharia-enterprise project. Understanding the appropriate format for each context ensures diagrams render consistently across all platforms where our documentation is viewed.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Accessibility First](../../principles/content/accessibility-first.md)**: Requires color-blind friendly palettes, vertical orientation for mobile users, and text-based source that screen readers can parse. Mermaid diagrams provide semantic structure accessible to assistive technology.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Mermaid as the primary format for all markdown files provides a single, universal approach instead of juggling multiple diagram tools. Simple, text-based syntax that's easy to learn and version control.

## Purpose

This convention establishes Mermaid diagrams as the primary visualization format for all markdown files in the repository. It ensures diagrams are accessible, maintainable, and render consistently across GitHub, VS Code, and mobile platforms. This replaces fragmented diagram approaches with a single, universal standard that works everywhere.

## Scope

### What This Convention Covers

- **Mermaid diagram syntax** - Flowcharts, sequence diagrams, class diagrams, state diagrams, and all supported Mermaid types
- **Color accessibility requirements** - Mandatory color-blind friendly palette for all diagrams
- **Mobile-friendly orientation** - Vertical diagram orientation for mobile viewing
- **Mermaid comment syntax** - Correct use of `%%` comments (not `%%{ }%%`)
- **ASCII art guidelines** - When and how to use ASCII as optional fallback
- **Diagram placement** - Where to use diagrams in different markdown contexts

### What This Convention Does NOT Cover

- **Hugo theme diagram rendering** - Previously covered in Hugo Development Convention (now deprecated; no active Hugo sites remain)
- **Diagram content strategy** - What diagrams to create (covered in specific domain conventions)
- **Vector graphics or images** - This convention is only for text-based diagrams (Mermaid and ASCII)
- **Interactive diagram features** - Platform-specific interactivity (zoom, pan) is implementation detail
- **Diagram export formats** - Exporting Mermaid to PNG, SVG, PDF (tool-specific, not repository standard)

## The Core Principle

**Mermaid diagrams are the primary and preferred format for all markdown files** in this repository, both inside and outside the `docs/` directory.

- **All markdown files**: Use Mermaid diagrams as the primary format
- **ASCII art**: Optional fallback for edge cases where Mermaid isn't supported (rarely needed)

## Why Mermaid First?

Mermaid diagram support has become ubiquitous across modern development tools:

### Wide Platform Support

- **GitHub**: Native Mermaid rendering in markdown files (since May 2021)
- **Text Editors**: VS Code, IntelliJ IDEA, Sublime Text (via plugins/extensions)
- **Documentation Platforms**: GitLab, Notion, Confluence all support Mermaid
- **Mobile Apps**: GitHub mobile renders Mermaid correctly

### Advantages Over ASCII Art

1. **Professional Appearance**: Clean, crisp diagrams with proper styling
2. **Maintainability**: Text-based source is easier to edit than ASCII positioning
3. **Expressiveness**: Supports complex relationships (sequence diagrams, entity relationships, state machines)
4. **Interactive**: Many platforms allow zooming and inspection
5. **Accessible**: Screen readers can parse the source text structure

### When ASCII Art Is Still Useful

ASCII art is now **optional** and only recommended for rare edge cases:

- Terminal-only environments without rich markdown support
- Extremely limited bandwidth scenarios where rendering is disabled
- Simple directory tree structures (where ASCII is clearer than Mermaid)

**In practice**: Most users will view markdown files through GitHub or modern text editors, all of which support Mermaid.

## Mermaid Diagrams: Primary Format for All Markdown Files

### When to Use

Use Mermaid diagrams for **all markdown files** in the repository:

```
open-sharia-enterprise/
 ├── README.md              ← Use Mermaid
 ├── AGENTS.md             ← Use Mermaid
 ├── CONTRIBUTING.md       ← Use Mermaid
 ├── docs/                 ← Use Mermaid
│   ├── tutorials/
│   ├── how-to/
│   ├── reference/
│   └── explanation/
├── plans/                ← Use Mermaid
│   ├── in-progress/
│   ├── backlog/
│   └── done/
└── .github/              ← Use Mermaid
    └── *.md
```

### Why Mermaid?

1. **Universal Support** - GitHub, VS Code, and most platforms render Mermaid natively
2. **Rich Visuals** - Professional-looking diagrams with colors, shapes, and styling
3. **Interactive** - Diagrams can be zoomed and inspected
4. **Maintainable** - Text-based source is easy to version control and edit
5. **Powerful** - Supports flowcharts, sequence diagrams, class diagrams, entity relationships, state diagrams, and more
6. **Mobile-Friendly** - Renders beautifully on mobile devices (when using vertical orientation)

### Mermaid Syntax

Mermaid diagrams are defined in code blocks with the `mermaid` language identifier:

````markdown
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
%% All colors are color-blind friendly and meet WCAG AA contrast standards

```mermaid
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Action 1]
  B -->|No| D[Action 2]
  C --> E[End]
  D --> E
```
````

### Common Mermaid Diagram Types

#### Flowchart

Perfect for processes, workflows, and decision trees:

````markdown
```mermaid
flowchart LR
  A[User Request] --> B{Authenticated?}
  B -->|Yes| C[Process Request]
  B -->|No| D[Return 401]
  C --> E[Return Response]
```
````

```mermaid
flowchart LR
    A[User Request] --> B{Authenticated?}
    B -->|Yes| C[Process Request]
    B -->|No| D[Return 401]
    C --> E[Return Response]
```

#### Sequence Diagram

Shows interactions between components over time:

````markdown
```mermaid
sequenceDiagram
  participant Client
  participant API
  participant Database

  Client->>API: POST /transactions
  API->>Database: Save transaction
  Database-->>API: Confirmation
  API-->>Client: 201 Created
```
````

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Database

    Client->>API: POST /transactions
    API->>Database: Save transaction
    Database-->>API: Confirmation
    API-->>Client: 201 Created
```

#### Class Diagram

Represents object-oriented structures and relationships:

````markdown
```mermaid
classDiagram
  class Transaction {
    +String id
    +BigDecimal amount
    +Date timestamp
    +validate()
    +execute()
  }

  class Account {
    +String id
    +BigDecimal balance
    +debit()
    +credit()
  }

  Transaction --> Account : involves
```
````

```mermaid
classDiagram
    class Transaction {
        +String id
        +BigDecimal amount
        +Date timestamp
        +validate()
        +execute()
    }

    class Account {
        +String id
        +BigDecimal balance
        +debit()
        +credit()
    }

    Transaction --> Account : involves
```

#### Entity Relationship Diagram

Shows database schema relationships:

````markdown
```mermaid
erDiagram
  CUSTOMER ||--o{ ACCOUNT : owns
  ACCOUNT ||--o{ TRANSACTION : contains
  TRANSACTION }o--|| TRANSACTION_TYPE : has

  CUSTOMER {
    string id PK
    string name
    string email
  }

  ACCOUNT {
    string id PK
    string customer_id FK
    decimal balance
  }
```
````

```mermaid
erDiagram
    CUSTOMER ||--o{ ACCOUNT : owns
    ACCOUNT ||--o{ TRANSACTION : contains
    TRANSACTION }o--|| TRANSACTION_TYPE : has

    CUSTOMER {
        string id PK
        string name
        string email
    }

    ACCOUNT {
        string id PK
        string customer_id FK
        decimal balance
    }
```

#### State Diagram

Illustrates state transitions in systems:

````markdown
```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Processing : start
  Processing --> Completed : success
  Processing --> Failed : error
  Failed --> Pending : retry
  Completed --> [*]
```
````

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Processing : start
    Processing --> Completed : success
    Processing --> Failed : error
    Failed --> Pending : retry
    Completed --> [*]
```

#### Git Graph

Shows branch and merge history:

````markdown
```mermaid
gitGraph
  commit
  branch develop
  checkout develop
  commit
  checkout main
  merge develop
  commit
```
````

```mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop
    commit
```

### Diagram Orientation

**Default Layout: Left-to-Right (LR)**

**CRITICAL RULE**: Mermaid flowcharts and graph diagrams MUST use `flowchart LR` or `graph LR` (left-to-right layout) by default.

**Rationale**:

- LR diagrams fit within viewport width on mobile screens without horizontal scrolling
- Nodes stack vertically in LR layout, using the natural scroll direction on mobile
- Consistent user experience across all documentation content

**Default directive**: Use `flowchart LR` or `graph LR` as the opening line of every flowchart or graph diagram unless a semantic exception applies (see below).

**When changing existing diagrams**: Replace `flowchart TD`, `graph TD`, `graph BT`, and `flowchart BT` with their `LR` equivalents unless: (a) the diagram is semantically justified to remain top-down (see exception below), or (b) switching to LR would cause the depth to exceed MaxWidth=4 (in which case TD keeps depth as the unchecked vertical axis — see Flowchart Width Constraints).

**Exception — semantically required TD**: A diagram MAY use `TD` when top-down direction is intrinsic to the meaning of the diagram (for example, a class hierarchy diagram where parent classes appear above child classes to show inheritance direction). Add a `%%` comment on the line immediately before the diagram type directive explaining why TD is required:

```mermaid
%% TD required: parent classes must appear above subclasses to show inheritance direction
graph TD
    Animal --> Dog
    Animal --> Cat
```

**sequenceDiagram is unaffected**: The `sequenceDiagram` type has no orientation directive and is not subject to this rule.

**Example (standard LR default)**:

```mermaid
graph LR
    A[Start] --> B[Process]
    B --> C[End]
```

### Flowchart Width Constraints

The `rhino-cli docs validate-mermaid` command enforces a maximum horizontal width of **4 nodes** on any single rank level. "Horizontal" is direction-aware:

- **`graph LR` / `graph RL`**: horizontal = **depth** (number of rank columns, i.e., the longest chain)
- **`graph TD` / `graph TB` / `graph BT`**: horizontal = **span** (maximum nodes at any single rank level)

**Label length**: the validator enforces **≤ 30 raw characters per line** (each `<br/>`-separated segment measured individually). Note: most renderers visually clip at approximately 20 characters — keep displayed text shorter when possible.

**Automated enforcement**:

```bash
go run ./apps/rhino-cli/main.go docs validate-mermaid
```

Run without flags to validate all `docs/`, `governance/`, and platform binding directories (e.g., `.claude/`) markdown files using defaults (MaxWidth=4, unlimited depth).

### Width Violation Fix Strategy Guide

When `rhino-cli docs validate-mermaid` reports a `width_exceeded` violation, select the simplest fix strategy that works:

**Selection decision tree**:

```
Is min(span, depth) ≤ 4?
├── Yes → Strategy 0 (Direction Flip) — one-word fix
└── No  → Does the diagram have a clear sequential order?
          ├── Yes → Strategy 3 (Sequential Chaining)
          └── No  → Is there a natural semantic hub?
                    ├── Yes → Strategy 1 (Intermediate Grouping)
                    └── No  → Strategy 2 (Diagram Splitting)

Label too long only? → Strategy 4 (Label Shortening)
```

**Strategy 0 — Direction Flip** (preferred when the other axis is ≤ 4):

Change `graph TD` → `graph LR` (or vice versa). The horizontal dimension switches axis.

```
# Before — TD, span=5 (5 children share rank 1) → violation (5 > MaxWidth=4)
graph TD
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F

# After — LR, horizontal=depth=2 ≤ MaxWidth=4, vertical=span=5 → no violation
graph LR
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
```

**Strategy 1 — Intermediate Grouping**: Insert a semantic hub node that branches connect through, reducing fan-out at any single rank.

**Strategy 2 — Diagram Splitting**: Break one wide diagram into two or more focused diagrams with prose bridges between them.

**Strategy 3 — Sequential Chaining**: Linearize parallel branches when logical order can be established: `A --> B --> C` instead of `A --> B` / `A --> C` / `A --> D`.

**Strategy 4 — Label Shortening** (for `label_too_long` violations):

- Replace HTML entities with abbreviated text: `#40;` → `(`, `#41;` → `)`
- Abbreviate: `Configuration` → `Config`, `Implementation` → `Impl`
- Split on `<br/>` and shorten each line to ≤ 30 chars
- Move dropped detail into prose before/after the diagram

### Mermaid Best Practices

1. **Keep it Simple** - Complex diagrams become hard to maintain
2. **Use Descriptive Labels** - Clear node names improve readability
3. **Add Comments** - Explain complex logic with inline comments
4. **Test Rendering** - Preview on GitHub or in a markdown viewer before committing
5. **Version Control Friendly** - Use consistent formatting for easier diffs
6. **Default to LR Orientation** - Use `flowchart LR` or `graph LR` for mobile-friendly viewing; only use TD when semantically required (see Diagram Orientation rule)
7. **Use Color-Blind Friendly Colors** - REQUIRED: Use accessible hex codes in `classDef` from verified palette (see Color Accessibility below)
8. **Document Color Scheme** - RECOMMENDED: Add ONE color palette comment at the start listing colors used (aids verification, but somewhat redundant if `classDef` already has correct hex codes). No duplicate comments
9. **Correct Comment Syntax** - Use `%%` for comments, NOT `%%{ }%%` (see Comment Syntax below)

### Mermaid Comment Syntax

**CRITICAL**: Mermaid comments MUST use `%%` syntax, NOT `%%{ }%%` syntax.

**Correct Syntax** ():

```mermaid
%% This is a comment
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Start] --> B[End]
```

**Incorrect Syntax** ():

```mermaid
%% WRONG EXAMPLE - DO NOT USE
%% The %%{ }%% syntax below is INVALID and will cause errors
%% %%{ This is a comment }%%
%% %%{ Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 }%%
graph TD
    A[Start] --> B[End]
```

**Why**: The `%%{ }%%` syntax causes "Syntax error in text" in Mermaid rendering. The correct syntax is simply `%%` followed by the comment text.

**Common Mistake**: Adding curly braces around comments is invalid Mermaid syntax. Always use plain `%%` comments.

**Example (Color Palette Comment)**:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% All colors are color-blind friendly and meet WCAG AA contrast standards
graph TD
    A[Start] --> B[Process] --> C[End]
```

**Exception - Mermaid Initialization Directives**:

The `%%{init:...}%%` syntax is VALID when used for Mermaid initialization directives (theme configuration, variables). This is DIFFERENT from comments:

- **Valid Init Directive**: `%%{init: {'theme': 'base', 'themeVariables': {...}}}%%` - For theme customization
- **Invalid Comment**: `%%{ Color Palette: ... }%%` - WRONG syntax for comments
- **Valid Comment**: `%% Color Palette: ...` - Correct syntax for comments

**Key Distinction**: `%%{...}%%` is ONLY valid when containing `init:` directive for Mermaid configuration. Never use it for general comments, color palette notes, or documentation.

**When to Use Init Directives**: Rarely needed. Most diagrams use default theming. Use only when you need to customize Mermaid's theme variables or configuration.

### Color Accessibility for Color Blindness

**CRITICAL REQUIREMENT**: All Mermaid diagrams MUST use color-blind friendly colors that work in both light and dark modes.

**Master Reference**: See [Color Accessibility Convention](./color-accessibility.md) for the complete authoritative guide to color usage, including verified accessible palette, WCAG standards, testing methodology, and implementation details. This section provides a summary for diagram-specific context.

#### Why This Matters

Approximately 8% of males and 0.5% of females have some form of color blindness. Accessible diagrams benefit everyone with clearer, more professional appearance and ensure compliance with accessibility standards.

#### Color Blindness Types to Support

1. **Protanopia (red-blind)**: Cannot distinguish red/green, sees reds and greens as brownish-yellow
2. **Deuteranopia (green-blind)**: Cannot distinguish red/green, sees reds and greens as brownish-yellow
3. **Tritanopia (blue-yellow blind)**: Cannot distinguish blue/yellow, sees blues as pink and yellows as light pink

#### Accessible Color Palette

Use ONLY these proven accessible colors for Mermaid diagram elements:

**Recommended Colors (safe for all color blindness types):**

- **Blue**: `#0173B2` - Safe for all types, works in light and dark mode
- **Orange**: `#DE8F05` - Safe for all types, works in light and dark mode
- **Teal**: `#029E73` - Safe for all types, works in light and dark mode
- **Purple**: `#CC78BC` - Safe for all types, works in light and dark mode
- **Brown**: `#CA9161` - Safe for all types, works in light and dark mode
- **Black**: `#000000` - Safe for borders and text on light backgrounds
- **White**: `#FFFFFF` - Safe for text on dark backgrounds
- **Gray**: `#808080` - Safe for secondary elements

**DO NOT USE:**

- FAIL: Red (`#FF0000`, `#E74C3C`, `#DC143C`) - Invisible to protanopia/deuteranopia
- FAIL: Green (`#00FF00`, `#27AE60`, `#2ECC71`) - Invisible to protanopia/deuteranopia
- FAIL: Yellow (`#FFFF00`, `#F1C40F`) - Invisible to tritanopia
- FAIL: Light red/pink (`#FF69B4`, `#FFC0CB`) - Problematic for tritanopia
- FAIL: Bright magenta (`#FF00FF`) - Problematic for all types

#### Dark and Light Mode Compliance

All colors must provide sufficient contrast in BOTH rendering modes:

**Light mode background**: White (`#FFFFFF`)
**Dark mode background**: Dark gray/black (`#1E1E2E`)

**Contrast Requirements (WCAG AA):**

- Minimum contrast ratio: **4.5:1** for normal text
- Large text (18pt+ or 14pt+ bold): **3:1**
- Element borders must be distinguishable by shape + color, not color alone

#### Shape Differentiation (Required)

**Never rely on color alone.** Always use multiple visual cues:

- Different node shapes (rectangle, circle, diamond, hexagon)
- Different line styles (solid, dashed, dotted)
- Clear text labels
- Icons or symbols where appropriate

#### Implementation Example

**Good Example (accessible):**

````markdown
<!-- Uses accessible colors: blue (#0173B2), orange (#DE8F05), teal (#029E73) -->

```mermaid
graph TD
  A["User Request<br/>(Blue)"]:::blue
  B["Processing<br/>(Orange)"]:::orange
  C["Response<br/>(Teal)"]:::teal

  A --> B
  B --> C

  classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```
````

**Bad Example (not accessible):**

````markdown
<!-- Uses inaccessible colors: red and green -->

```mermaid
graph TD
  A["Success"]:::green
  B["Error"]:::red

  classDef green fill:#029E73,stroke:#000000  FAIL: Invisible to protanopia/deuteranopia
  classDef red fill:#DE8F05,stroke:#000000    FAIL: Invisible to protanopia/deuteranopia
```
````

#### Testing Requirements

All diagrams SHOULD be tested with color blindness simulators before publishing:

- **Simulators**: [Coblis Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)
- **Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Testing Process:**

1. Create diagram with accessible color palette
2. Test in at least one color blindness simulator (protanopia, deuteranopia, or tritanopia)
3. Verify contrast ratios meet WCAG AA standards
4. Confirm shape differentiation is sufficient

#### Documentation Requirements

**IMPORTANT DISTINCTION:**

- **REQUIRED FOR ACCESSIBILITY**: Using accessible hex codes in `classDef` from the verified palette - this is what makes diagrams accessible
- **RECOMMENDED FOR DOCUMENTATION**: Adding a color palette comment listing which colors are used - this aids verification and signals intent, but is somewhat redundant

For each diagram using colors:

1. **Use accessible hex codes in `classDef`** (REQUIRED)
   - Example: `classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF`
   - This is the functional accessibility requirement
2. **Add ONE color palette comment** (RECOMMENDED)
   - Example: `<!-- Uses colors #0173B2 (blue), #DE8F05 (orange) for accessibility -->`
   - This is a documentation/transparency practice
   - **CRITICAL**: Each diagram should have exactly ONE color palette comment (no duplicates)
   - Multiple identical comments add unnecessary clutter and create maintenance burden
   - Comment is helpful for quick verification but is redundant with the hex codes in `classDef`
3. **Include labels** that don't rely solely on color
4. **Test verification** noted in diagram documentation (if applicable)

#### Key Implementation Points

When creating Mermaid diagrams:

- Use hex color codes (not CSS color names like "red", "green")
- Always include black borders (`#000000`) for shape definition
- Use white text (`#FFFFFF`) for dark-filled backgrounds
- Use black text (`#000000`) for light-filled backgrounds
- Define colors in `classDef` sections, not inline
- Ensure contrast ratios meet WCAG AA (4.5:1 for normal text)

### Mermaid Resources

- [Official Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/) - Test diagrams online
- [Coblis Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/) - Test diagrams for accessibility
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Verify WCAG compliance

## ASCII Art: Optional Fallback

### When to Use

ASCII art is now **optional** and should only be used when:

- **Directory tree structures**: Simple file/folder hierarchies (ASCII is often clearer than Mermaid for this specific use case)
- **Terminal-only contexts**: Rare situations where rich markdown rendering is completely unavailable
- **Personal preference**: When you find ASCII art clearer for a specific simple diagram

**Default recommendation**: Use Mermaid for all diagrams unless you have a specific reason to use ASCII art.

### Why ASCII Art Is Now Optional

With widespread Mermaid support across GitHub, VS Code, and other platforms, the original rationale for requiring ASCII art in files outside `docs/` no longer applies:

1. **GitHub Support**: GitHub has supported Mermaid natively since May 2021
2. **Editor Support**: Modern text editors (VS Code, IntelliJ, Sublime) all support Mermaid previews
3. **Mobile Support**: GitHub mobile renders Mermaid correctly
4. **Better Maintainability**: Mermaid is easier to update than manually positioned ASCII art

**Previous approach**: We required ASCII art for files outside `docs/` (README.md, AGENTS.md, plans/) to ensure universal compatibility.

**Current approach**: Use Mermaid everywhere. ASCII art is a fallback option, not a requirement.

### ASCII Art Use Cases

#### Directory Structure

Perfect for showing file and folder hierarchies:

```
open-sharia-enterprise/
 ├── .opencode/                   # OpenCode configuration
 │   ├── agent/               # Specialized AI agents
 │   └── skill/               # Progressive knowledge packages
 ├── docs/                      # Documentation (Diátaxis framework)
│   ├── tutorials/            # Learning-oriented guides
│   ├── how-to/               # Problem-oriented guides
│   ├── reference/            # Technical reference
│   └── explanation/          # Conceptual documentation
├── src/                       # Source code
├── package.json              # Node.js manifest
└── README.md                 # Project README
```

#### Simple Diagrams

Basic flowcharts and relationships:

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ Validation  │────▶│   Process   │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Response   │
                    └─────────────┘
```

#### Process Flow

Sequential steps with connectors:

```
User Action
    │
    ├──▶ Authentication Check
    │        │
    │        ├─ Success ──▶ Process Request ──▶ Return Result
    │        │
    │        └─ Failure ──▶ Return 401
    │
    └──▶ Log Event
```

#### Component Relationships

System architecture overview:

```
┌──────────────────────────────────────┐
│           Frontend (React)           │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│         API Gateway (Express)        │
└─────┬──────────────┬─────────────────┘
      │              │
      ▼              ▼
┌─────────┐    ┌─────────────┐
│ Auth    │    │  Business   │
│ Service │    │  Logic      │
└─────────┘    └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │  Database   │
               └─────────────┘
```

#### Tables and Matrices

Structured data representation:

```
┌──────────────┬─────────────────────────┐
│   Category   │         Example         │
├──────────────┼─────────────────────────┤
│  Tutorials   │  docs/tutorials/start.md│
│  How-To      │  docs/how-to/api.md     │
│  Reference   │  docs/reference/spec.md │
│  Explanation │  docs/explanation/arch.md│
└──────────────┴─────────────────────────┘
```

### ASCII Art Best Practices

1. **Use Box-Drawing Characters** - `┌─┐│└┘├┤┬┴┼` for clean borders
2. **Consistent Spacing** - Align elements for better readability
3. **Test in Monospace** - Verify rendering in fixed-width fonts
4. **Keep it Simple** - Complex ASCII art is hard to maintain
5. **Comment Structure** - Add text labels for clarity

### ASCII Art Character Sets

Common characters for drawing:

```
Box Drawing:
┌ ┬ ┐   ╔ ╦ ╗
├ ┼ ┤   ╠ ╬ ╣
└ ┴ ┘   ╚ ╩ ╝
─ │     ═ ║

Arrows:
→ ← ↑ ↓ ↔ ↕
▶ ◀ ▲ ▼

Connectors:
┬ ┴ ├ ┤ ┼
╭ ╮ ╰ ╯
```

### ASCII Art Tools

- Manual creation in text editor with monospace font
- Online generators (limited utility)
- Terminal tools like `figlet` for text banners

## Decision Matrix

Use this quick reference to choose the right format:

| File Location     | Primary Format | Alternative       | Notes                                           |
| ----------------- | -------------- | ----------------- | ----------------------------------------------- |
| `docs/**/*.md`    | **Mermaid**    | ASCII (optional)  | Rich visuals, native GitHub rendering           |
| `README.md`       | **Mermaid**    | ASCII (optional)  | GitHub renders Mermaid natively                 |
| `AGENTS.md`       | **Mermaid**    | ASCII (optional)  | Modern text editors support Mermaid             |
| `plans/**/*.md`   | **Mermaid**    | ASCII (optional)  | GitHub and editors render Mermaid               |
| `.github/**/*.md` | **Mermaid**    | ASCII (optional)  | GitHub Actions and web UI support Mermaid       |
| `CONTRIBUTING.md` | **Mermaid**    | ASCII (optional)  | Contributors use GitHub web or modern editors   |
| Directory trees   | **ASCII**      | Mermaid (complex) | ASCII is clearer for simple file/folder listing |

## Examples in Context

### Example 1: API Flow in Documentation

**File**: `docs/explanation/architecture/request-flow.md`

**Use Mermaid**:

````markdown
## Request Processing Flow

```mermaid
sequenceDiagram
  participant Client
  participant Gateway
  participant Auth
  participant Business
  participant Database

  Client->>Gateway: HTTP Request
  Gateway->>Auth: Validate Token
  Auth-->>Gateway: Token Valid
  Gateway->>Business: Process Request
  Business->>Database: Query Data
  Database-->>Business: Result
  Business-->>Gateway: Response
  Gateway-->>Client: HTTP Response
```
````

### Example 2: Project Structure in README

**File**: `README.md`

**Recommended: Use Mermaid for Complex Diagrams**:

````markdown
## Project Architecture

```mermaid
graph TD
    A[Client Request] --> B[API Gateway]
    B --> C{Auth Check}
    C -->|Valid| D[Business Logic]
    C -->|Invalid| E[Return 401]
    D --> F[Database]
    F --> G[Response]
```
````

**Alternative: Use ASCII for Simple Directory Trees**:

```markdown
## Project Structure

open-sharia-enterprise/
├── .opencode/ # OpenCode configuration
├── docs/ # Documentation
│ ├── tutorials/ # Step-by-step guides
│ ├── how-to/ # Problem solutions
│ └── reference/ # Technical specs
├── src/ # Source code
└── package.json # Dependencies
```

### Example 3: State Machine in Tutorial

**File**: `docs/tutorials/transactions/tu-tr__transaction-lifecycle.md`

**Use Mermaid**:

````markdown
## Transaction States

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted : submit()
  Submitted --> UnderReview : auto
  UnderReview --> Approved : approve()
  UnderReview --> Rejected : reject()
  Approved --> Completed : process()
  Rejected --> [*]
  Completed --> [*]
```
````

### Example 4: Component Architecture in AGENTS.md

**File**: `AGENTS.md`

**Recommended: Use Mermaid**:

````markdown
## Agent Architecture

```mermaid
graph TD
    A[OpenCode- Main Agent] --> B[docs-maker.md]
    A --> C[repo-rules-checker.md]
    B --> D[repo-rules-maker.md]
    D --> E[plan-maker.md]

    B --> F[Documentation]
    D --> G[Validation]
    E --> H[Propagation]
    E --> I[Planning]
```
````

**Alternative: Use ASCII for Simple Hierarchies**:

```markdown
## Agent Architecture

OpenCode(Main Agent)
├── docs-maker.md (Documentation)
├── repo-rules-checker.md (Validation)
├── repo-rules-maker.md (Propagation)
└── plan-maker.md (Planning)
```

## Mixing Formats

**Prefer consistency within a single file**. Choose Mermaid as your primary format and use it throughout the file unless you have a specific reason to use ASCII art.

FAIL: **Avoid mixing unnecessarily**:

````markdown
## System Flow

```mermaid
graph TD
    A --> B
```

## Directory Structure

```
A
└── B
```

## Another Flow

A --> B (plain text - no format!)
````

PASS: **Good - consistent Mermaid**:

````markdown
## System Flow

```mermaid
graph TD
    A[Component A] --> B[Component B]
```

## State Transitions

```mermaid
stateDiagram-v2
    [*] --> Active
    Active --> Inactive
```
````

PASS: **Acceptable - intentional format choice**:

````markdown
## Architecture Diagram

```mermaid
graph TD
    A[API] --> B[Database]
```

## Project Structure (simple tree)

```
project/
├── src/
└── docs/
```
````

**Rationale**: Mermaid is preferred, but ASCII directory trees are acceptable when they're clearer for simple file/folder listings.

## Migration Strategy

### Upgrading ASCII to Mermaid (Recommended)

Since Mermaid is now the primary format, consider upgrading existing ASCII art diagrams to Mermaid for better maintainability and visual quality:

**When to upgrade**:

- Complex flowcharts or architecture diagrams currently in ASCII
- Diagrams that are hard to update due to ASCII positioning
- When adding new content to a file with ASCII diagrams (good time to upgrade all diagrams)

**When to keep ASCII**:

- Simple directory tree structures (ASCII is clearer)
- If the ASCII diagram is simple and works perfectly well

**Upgrade process**:

1. Identify the diagram type (flowchart, sequence, state machine, etc.)
2. Use appropriate Mermaid syntax
3. Test rendering on GitHub preview or a markdown viewer
4. Verify all relationships and labels are preserved
5. Use LR orientation by default for mobile-friendliness (see Diagram Orientation rule)

**Example upgrade**:

**Before (ASCII)**:

```
┌───────┐
│ Start │
└───┬───┘
    │
    ▼
┌─────────┐
│ Process │
└────┬────┘
     │
     ▼
┌─────┐
│ End │
└─────┘
```

**After (Mermaid - LR orientation)**:

````markdown
```mermaid
graph LR
    A[Start] --> B[Process]
    B --> C[End]
```
````

### No Need to Convert Mermaid to ASCII

With widespread Mermaid support, there's no reason to convert Mermaid diagrams to ASCII art. If you encounter a situation where Mermaid doesn't render, consider:

1. Using a different viewing platform (GitHub web, VS Code)
2. Updating your editor/viewer to support Mermaid
3. Only in extreme edge cases: create an ASCII fallback

## Verification Checklist

Before committing documentation with diagrams:

- [ ] Primary format is Mermaid (unless specific reason for ASCII)
- [ ] Mermaid flowcharts/graphs use LR orientation by default (or TD with a `%%` comment justifying the exception)
- [ ] Mermaid diagrams use color-blind friendly colors (only accessible palette)
- [ ] Colors work in both light and dark mode
- [ ] Shape differentiation used (not relying on color alone)
- [ ] Contrast ratios meet WCAG AA standards (4.5:1 for text)
- [ ] Color scheme documented in comment above diagram
- [ ] **Each diagram has exactly ONE color palette comment** (no duplicates)
- [ ] **Mermaid comments use `%%` syntax, NOT `%%{ }%%`** (correct comment syntax)
  - [ ] **Square brackets and angle brackets escaped** (use `#91;` `#93;` `#60;` `#62;` - prevents nested delimiter conflicts)
- [ ] **Parentheses and brackets escaped in node text** (use HTML entities: `#40;` `#41;` `#91;` `#93;`)
- [ ] **No literal quotes inside node text** (remove quotes or use descriptive text like "string value")
- [ ] **No style commands in sequence diagrams** (use `box` syntax or switch to flowchart)
- [ ] **No `\n` in any label** (`\n` renders as literal characters in node labels and edge labels — use `<br/>` for multi-line labels or shorten to single-line)
- [ ] **No `<br/>` in edge labels** (edge labels do not support HTML — use plain text only)
- [ ] **Node label lines**: validator enforces ≤ 30 raw chars per line (run `rhino-cli docs validate-mermaid`); renderers visually clip at ~20 chars — keep displayed text ≤ 20 when possible
- [ ] **Edge label strings ≤20 characters** (text inside `|"..."|` must not exceed 20 characters)
- [ ] **No URL paths or dot-prefixed tokens in edge labels** (leading `.` is parsed as a CSS class selector — describe the action in plain words instead)
- [ ] Mermaid diagrams tested in GitHub preview or a markdown viewer
- [ ] ASCII art (if used) verified in monospace font
- [ ] Format choice is intentional (not mixing Mermaid and ASCII unnecessarily)
- [ ] All labels and text are clear and readable
- [ ] Complex diagrams simplified where possible
- [ ] Diagram serves the documentation purpose
- [ ] LR orientation used by default; TD used only when semantically required and documented with a `%%` comment

## Common Mermaid Syntax Errors

This section documents critical Mermaid syntax rules discovered through debugging production diagrams. These errors cause "syntax error in text" or rendering failures.

### Error 1: Special Characters in Node Text and Edge Labels

**CRITICAL**: Parentheses, square brackets, and curly braces inside node definitions AND edge labels cause syntax errors.

**Problem Examples (FAIL: BROKEN):**

```mermaid
graph TD
    A[O 1 lookup]                   %% ERROR: Parentheses cause syntax error
    A --> B[function args]          %% ERROR: Parentheses cause syntax error
    B --> C[Array: 0 1 2]           %% ERROR: Square brackets cause syntax error
    C --> D[Dict: key value]        %% ERROR: Curly braces cause syntax error
    E -->|iter call| F[Iterator]    %% ERROR: Parentheses in edge label cause syntax error
```

**Solution (PASS: WORKING):**

Escape special characters using HTML entity codes:

**Entity Codes**:

- Parentheses: `(` → `#40;`, `)` → `#41;`
- Square brackets: `[` → `#91;`, `]` → `#93;`
- Curly braces: `{` → `#123;`, `}` → `#125;`
- Angle brackets: `<` → `#60;`, `>` → `#62;`

**In node text:**

```mermaid
graph TD
    A[O#40;1#41; lookup]                     %% CORRECT: Escaped parentheses
    A --> B[function#40;args#41;]            %% CORRECT: Escaped parentheses
    B --> C[Array: #91;0, 1, 2#93;]          %% CORRECT: Escaped square brackets
    C --> D[Dict: #123;key: value#125;]      %% CORRECT: Escaped curly braces
    D --> E[Generic#60;T#62;]                %% CORRECT: Escaped angle brackets
```

**In edge labels:**

Edge labels use `-->|text|` syntax and require the same escaping:

```mermaid
graph TD
    A -->|iter#40;#41;| B[Iterator]          %% CORRECT: Escaped parentheses in edge label
    B -->|next#40;#41;| C{Has Item?}         %% CORRECT: Escaped parentheses in edge label
    D -->|get#91;key#93;| E[Value]           %% CORRECT: Escaped brackets in edge label
```

**Rationale**: Mermaid's parser interprets unescaped special characters as syntax elements in BOTH node text and edge labels, not literal characters.

**Real-World Examples Fixed:**

- Python beginner Example 12 (dictionaries): `O(1) lookup` → `O#40;1#41; lookup`
- Python intermediate Example 43 (deque): `O(1) operations` → `O#40;1#41; operations`
- SQL beginner (index lookup): `O(log n)` → `O#40;log n#41;`
- Rust advanced (generics): `Array<T>` → `Array#60;T#62;`
- Rust advanced (arrays): `[i32; 3]` → `#91;i32; 3#93;`

### Error 2: Literal Quotes Inside Node Text

**CRITICAL**: Literal quote characters inside Mermaid node text cause parsing errors.

**Problem Example (FAIL: BROKEN)**:

```mermaid
graph TD
    F[let x = "hello"]        %% ERROR: Inner quotes conflict with node syntax
    G[const name = "Alice"]   %% ERROR: Parser sees "hello" as end of node label
```

**Why it fails**: The outer `[...]` syntax uses quotes for node label definition. When literal `"` characters appear inside, the Mermaid parser interprets them as structural syntax, not literal text.

**Solution (PASS: WORKING)**:

Remove the inner quotes or use descriptive text:

```mermaid
graph TD
    F[let x = hello]              %% CORRECT: No inner quotes
    G[const name = Alice]         %% CORRECT: No inner quotes
    H[let x = string value]       %% CORRECT: Descriptive text
```

**Rule**: Avoid literal quote characters inside Mermaid node text. If you need to show a string value, omit the quotes or use descriptive text.

**Real-World Context**: This error was discovered when trying to show code syntax like `let x = "hello"` in Mermaid nodes.

### Error 3: Nested Escaping in Node Text

**CRITICAL**: Combining HTML entity codes with escaped quotes in the same node text causes parsing failures.

**Problem Example (FAIL: BROKEN):**

```mermaid
graph TD
    A["JSON #123;name:Alice#125;"]    %% ERROR: Nested escaping fails
```

**Why it fails**: The combination of `#123;#125;` (entity codes for curly braces) with `\"` (escaped quotes) creates nested escaping that the Mermaid parser cannot handle.

**Solution (PASS: WORKING):**

Simplify the text - remove quotes or use plain text instead of trying to escape multiple special characters:

```mermaid
graph TD
    A["JSON #123;name:Alice#125;"]                %% CORRECT: No quotes, just entity codes
    B["JSON object with name field"]              %% CORRECT: Plain text description
```

**Rule**: Avoid nested escaping patterns. If you need both entity codes AND special punctuation in the same node:

- Option 1: Remove the punctuation (often quotes can be omitted)
- Option 2: Simplify to plain text description
- Option 3: Split into multiple nodes
- Do NOT combine entity codes with escaped quotes (`#123;` + `\"`) in the same node

**Real-World Context**: This error was discovered when trying to show JSON syntax like `{"name":"value"}` in Mermaid nodes. The working solution is to use entity codes for braces but omit the quotes: `#123;name:value#125;`.

### Error 4: Style Commands in Sequence Diagrams

**CRITICAL**: The `style` command only works in `graph`/`flowchart` diagrams, NOT in `sequenceDiagram`.

**Problem Example (FAIL: BROKEN):**

```mermaid
sequenceDiagram
    participant User
    participant System

    User->>System: Request
    System-->>User: Response

    style User fill:#0173B2           %% ERROR: style not supported in sequence diagrams
    style System fill:#DE8F05         %% ERROR: style not supported in sequence diagrams
```

**Solution (PASS: WORKING):**

For sequence diagrams, use `box` syntax for grouping and coloring instead:

```mermaid
sequenceDiagram
    box Blue User Side
        participant User
    end
    box Orange System Side
        participant System
    end

    User->>System: Request
    System-->>User: Response
```

**Alternative: Use graph/flowchart for styled diagrams:**

```mermaid
flowchart LR
    User[User]:::blue
    System[System]:::orange

    User --> System

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF
```

**Rationale**: Mermaid diagram types have different syntax capabilities. `style` commands are only valid in graph-based diagrams (graph, flowchart), not in interaction diagrams (sequenceDiagram, classDiagram, stateDiagram).

**Real-World Example Fixed:**

- Python intermediate Example 33 (context manager): Removed `style` commands from sequence diagram

### Error 5: Sequence Diagram Participant Syntax with "as" Keyword

**CRITICAL**: Using `participant X as "Display Name"` syntax with quotes in sequence diagrams causes rendering failures in Hugo/Hextra environments.

**Problem Example (FAIL: BROKEN)**:

```mermaid
sequenceDiagram
    participant Main as "main()"
    participant Loop as "Event Loop"
    participant F1 as "fetch_data(api1)"

    Main->>Loop: Start execution
    Loop->>F1: Call async function
    F1-->>Loop: Return result
```

**Why it fails**: The Hextra theme's Mermaid renderer struggles with complex display names containing spaces, parentheses, or special characters when combined with the `as` keyword and quotes. This syntax pattern causes parsing errors in Hugo/Hextra contexts.

**Solution (PASS: WORKING)**:

Use simple participant identifiers without the `as` keyword:

```mermaid
sequenceDiagram
    participant Main
    participant EventLoop
    participant API1

    Main->>EventLoop: Start execution
    EventLoop->>API1: Call async function
    API1-->>EventLoop: Return result
```

**Alternative - Descriptive names without quotes**:

If you need descriptive names, use CamelCase or underscores without the `as` keyword:

```mermaid
sequenceDiagram
    participant MainFunction
    participant EventLoop
    participant FetchData

    MainFunction->>EventLoop: Initialize
    EventLoop->>FetchData: Retrieve data
    FetchData-->>EventLoop: Data received
```

**Rule**: In sequence diagrams, use simple participant identifiers. Avoid the `as` keyword with quoted display names. Use CamelCase or simple names instead of quoted strings with spaces or special characters.

**Rationale**:

- The Hextra theme documentation shows working examples using simple participant syntax
- Complex display names with `as` keyword and quotes cause parsing errors
- Simple identifiers are more reliable across different Mermaid versions and rendering contexts
- Hugo/Hextra environments have different parser constraints than standalone Mermaid

**Affected diagram types**: `sequenceDiagram` only (not `graph`/`flowchart`)

**Real-World Examples Fixed:**

- Python intermediate Example 33 (async/await): Changed `participant Main as "main()"` to `participant Main`
- Elixir advanced Example 62 (GenServer): Changed `participant Client as "Client Process"` to `participant Client`

### Error 6: Colons in State Diagram Edge Labels

**CRITICAL**: In `stateDiagram-v2`, edge labels cannot contain colon characters (`:`).

**Syntax**: State diagram edge labels use the format `state1 --> state2: label text here`, where the colon after `state2` separates the transition from the label text.

**Problem**: If the label text itself contains colons (like Clojure keywords `:count` or `:users`, or other code snippets with colons), Mermaid's parser fails because the colon is a reserved separator character.

**Problem Example (FAIL: BROKEN)**:

```mermaid
stateDiagram-v2
    complex --> updated: swap! update :count inc
    updated --> final: swap! update :users conj
```

**Why it fails**: The parser sees `:count` and `:users` as additional syntax elements, not part of the label text. The first colon in the label text (`:` in `:count`) is interpreted as a new separator, breaking the parsing.

**Solution (PASS: WORKING)**:

Remove colons from edge label text. Use plain text descriptions instead of literal code syntax when colons are present:

```mermaid
stateDiagram-v2
    complex --> updated: swap! update count inc
    updated --> final: swap! update users conj
```

**Alternative - Descriptive Text**:

If the code syntax is critical to show, use descriptive text that avoids colons:

```mermaid
stateDiagram-v2
    complex --> updated: update count with increment
    updated --> final: add user to collection
```

**Rule**: Avoid colons in state diagram edge labels. Remove colons from code snippets in labels (e.g., use `count` instead of `:count` for Clojure keywords, use `key value` instead of `key: value` for object notation).

**Affected syntax**: `stateDiagram-v2` only. This does NOT affect:

- Flowchart edge labels (`graph TD` / `flowchart TD`) - colons work fine in flowchart edge labels
- Sequence diagram messages - different syntax, no issue with colons
- Node text in any diagram type - only affects state diagram edge labels

**Rationale**: In state diagrams, the colon is a structural syntax element that separates the transition from its label. Any additional colons in the label text create parsing ambiguity.

**Real-World Context**: This error was discovered when documenting Clojure state transitions using keywords like `:count` and `:users` in edge labels.

### Quick Reference: Character Escaping

**Characters requiring HTML entity codes in Mermaid node text:**

| Character       | HTML Entity | Example Usage                           |
| --------------- | ----------- | --------------------------------------- |
| `(`             | `#40;`      | `O#40;1#41;` for "O(1)"                 |
| `)`             | `#41;`      | `O#40;1#41;` for "O(1)"                 |
| `[`             | `#91;`      | `#91;0, 1#93;` for "[0, 1]"             |
| `]`             | `#93;`      | `#91;0, 1#93;` for "[0, 1]"             |
| `{`             | `#123;`     | `#123;key: value#125;` for "{key: ...}" |
| `}`             | `#125;`     | `#123;key: value#125;` for "{key: ...}" |
| `<` (less than) | `#60;`      | `Array#60;T#62;` for "Array<T>"         |
| `>` (more than) | `#62;`      | `Array#60;T#62;` for "Array<T>"         |

**When to escape:**

- Only when these characters appear **inside square bracket node definitions** `[text here]`
- Also required in **edge labels** (`-->|text|` syntax)
- NOT needed in regular text, comments, or code blocks

> **Note on `\n` in labels**: `\n` renders as literal text in **both** node labels (`["line1\nline2"]`) and edge labels (`-->|"line1\nline2"|`). Use `<br/>` for multi-line labels (`["line1<br/>line2"]`) or shorten to single-line text.

**Example: Complex node text with multiple escapes:**

```mermaid
graph TD
    A[HashMap#60;K, V#62;<br/>O#40;1#41; lookup<br/>Values: #91;1, 2, 3#93;<br/>Dict: #123;a: 1#125;]
```

Renders as: "HashMap<K, V> / O(1) lookup / Values: [1, 2, 3] / Dict: {a: 1}"

### Error 7: `\n` Escape Sequences Do Not Create Line Breaks in Hugo Mermaid Rendering

**CRITICAL**: The `\n` escape sequence does not create line breaks in Mermaid diagrams rendered via Hugo's code block render hook. It renders as the literal characters `\n` in both node labels and edge labels.

**Root Cause**: Hugo's `render-codeblock-mermaid.html` render hook pipes the diagram source through `htmlEscape`, which passes `\n` through unchanged (backslash is not an HTML special character). Mermaid ESM loaded from CDN then receives the literal string `\n` and does not interpret it as a line break in this rendering context.

**Context**:

- **Node labels** (`["text\nmore text"]`): `\n` renders as literal `\n` characters — does NOT create a line break.
- **Edge labels** (`-->|"Revenue\n& Learnings"|`): `\n` renders as literal `\n` characters — does NOT create a line break.

**Problem Example (FAIL: BROKEN)**:

```mermaid
graph LR
    P0["Phase 0\nRepository Setup\n& Knowledge Base"]:::blue
    P1["Phase 1"] -->|"Revenue\n& Learnings"| P2["Phase 2"]
```

This renders node labels as `Phase 0\nRepository Setup\n& Knowledge Base` and edge labels as `Revenue\n& Learnings` with literal `\n` characters visible.

**Solution (PASS: WORKING)**:

Use `<br/>` for multi-line labels, or shorten to single-line text:

```mermaid
graph LR
    P0["Phase 0<br/>Setup & Knowledge Base"]:::blue
    P1["Phase 1"] -->|"Revenue & Learnings"| P2["Phase 2"]
```

**Rule**: Never use `\n` in any Mermaid label (node or edge). Use `<br/>` for multi-line node labels. For edge labels, keep them single-line (edge labels do not support `<br/>`).

**Real-World Context**: Discovered when building a roadmap diagram on `apps/oseplatform-web/content/about.md`. Both node labels (`"Phase 3\nEnterprise Application\nLarge Organizations"`) and edge labels (`"Revenue\n& Learnings"`) rendered with literal `\n` characters visible.

### Error 8: Label Constraints — Character Width Limit, No HTML in Edge Labels, No URL Paths

**CRITICAL**: Mermaid renderers silently clip label text beyond approximately 20–22 characters with no warning. Edge labels do not support HTML tags. URL paths and dot-prefixed tokens in edge labels break the parser.

These three constraints apply everywhere labels appear and are documented together because they all stem from the same root problem: edge labels and node label lines have tight rendering limits and restricted syntax.

#### Rule 1: Node label line breaks — `<br/>` only

Use `<br/>` to create line breaks inside node labels. The `\n` escape sequence renders as the literal characters `\n` (see Error 7). `<br/>` is the only supported mechanism.

**DO:**

```mermaid
graph TD
    A["Auth service<br/>issues JWT"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**DO NOT:**

```mermaid
graph TD
    A["Auth service\nissues JWT"]:::blue
    %% BROKEN: renders as "Auth service\nissues JWT" (literal backslash-n)
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
```

#### Rule 2: Edge labels — plain text only, no HTML

Edge labels are the text inside `|"..."|` arrow syntax: `A -->|"text"| B`. They do not support `<br/>` or any other HTML. The tag renders as literal text characters, making the label long and broken.

**DO:**

```mermaid
graph TD
    A[Client]-->|"JWKS public key"| B[Auth service]
```

**DO NOT:**

```mermaid
graph TD
    A[Client]-->|"JWKS key<br/>via HTTPS"| B[Auth service]
    %% BROKEN: renders as "JWKS key<br/>via HTTPS" with visible tag
```

Keep edge labels single-line plain text. If you need multi-line detail, move it into the destination node label.

#### Rule 3: Maximum line length — 20 characters

Both node label lines (each segment between `<br/>` tags) and edge label strings must not exceed **20 characters**. Most Mermaid renderers clip text beyond approximately 20–22 characters with no error or warning.

Count every character including spaces, colons, slashes, and Unicode.

**Note**: `rhino-cli docs validate-mermaid` enforces ≤ **30** raw characters per `<br/>`-split line (Mermaid's `wrappingWidth` baseline). The stricter 20-character limit documented here is specific to Hugo/Hextra rendering clipping. Use `--max-label-len 20` when validating content for Hugo-based sites.

**Safe examples (≤20 chars):**

| Text                 | Length |
| -------------------- | ------ |
| `"Auth and profile"` | 16     |
| `"health check"`     | 12     |
| `"JWKS public key"`  | 15     |
| `"issues JWT"`       | 10     |

**Unsafe examples (>20 chars — will be clipped):**

| Text                                  | Length | Clipped rendering          |
| ------------------------------------- | ------ | -------------------------- |
| `"Single deployable backend process"` | 34     | `"Single deployable back"` |
| `"HTTPS: fetch JWKS public key"`      | 28     | `"HTTPS: fetch JWKS publ"` |
| `"GET /.well-known/jwks.json"`        | 26     | cut at `.well-known`       |

**DO:**

```mermaid
graph TD
    A["Backend process<br/>single deployable"]:::blue
    B[Client]-->|"JWKS public key"| A
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**DO NOT:**

```mermaid
graph TD
    A["Single deployable<br/>backend process"]:::blue
    %% BROKEN: "Single deployable backend process" is 34 chars — clipped
    B[Client]-->|"HTTPS: fetch JWKS public key"| A
    %% BROKEN: "HTTPS: fetch JWKS public key" is 28 chars — clipped
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Technique**: Split long phrases across two `<br/>` segments, each ≤20 chars.

```mermaid
graph TD
    A["Backend process<br/>single deployable"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
```

#### Rule 4: No URL paths or dot-prefixed tokens in edge labels

Any token starting with `.` inside an edge label (for example `/.well-known/`, `./path`, or `.json`) breaks the Mermaid parser. Mermaid interprets a leading `.` as the start of a CSS class selector, causing a parse failure.

Describe the action in plain words instead of quoting a URL path.

**DO:**

```mermaid
graph TD
    A[Client]-->|"JWKS public key"| B[Auth service]
    C[Client]-->|"health check"| D[API]
```

**DO NOT:**

```mermaid
graph TD
    A[Client]-->|"GET /.well-known/jwks.json"| B[Auth service]
    %% BROKEN: "." in "/.well-known" is parsed as CSS class selector
    C[Client]-->|"POST /api/v1/auth/register"| D[API]
    %% BROKEN AND too long (>20 chars)
```

URL paths belong in node label boxes (where HTML renders correctly), not on arrows.

#### Rule 5: Keep separator lines proportional

Separator characters like `────────────────────` set the minimum node width. Make them match the longest text line in the node label, keeping that longest line at ≤20 characters.

**DO:**

```mermaid
graph TD
    A["Auth service<br/>────────────<br/>issues JWT"]:::blue
    %% Separator length matches "Auth service" (12 chars)
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**DO NOT:**

```mermaid
graph TD
    A["Auth service<br/>────────────────────────────<br/>issues JWT"]:::blue
    %% BROKEN: separator (28 dashes) forces node wider than text lines,
    %% which causes adjacent text to be clipped
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
```

#### Quick reference: label constraint summary

| Location                               | `<br/>` supported? | Max length | URL paths allowed?            |
| -------------------------------------- | ------------------ | ---------- | ----------------------------- |
| Node label line (between `<br/>` tags) | Yes                | 20 chars   | Yes (node labels render HTML) |
| Edge label `\|"text"\|`                | No                 | 20 chars   | No (`.` breaks parser)        |

**Automated enforcement**: Run `rhino-cli docs validate-mermaid` to check these rules
mechanically instead of counting characters manually. Use `--max-label-len 20` to enforce
the 20-character Hugo/Hextra limit (the default is 30, matching Mermaid's `wrappingWidth`
baseline). The tool also checks parallel rank width (Rule 2 above) and single-diagram-per-block.

**Real-World Context**: All five rules were verified when fixing C4 architecture diagrams in the monorepo. Failures observed:

- `\n` in node labels rendered as literal `\n` (fixed by switching to `<br/>`)
- `<br/>` in edge labels rendered as literal `<br/>` text (fixed by removing HTML, using plain text)
- `"HTTPS: fetch JWKS public key"` (28 chars) clipped to `"HTTPS: fetch JWKS publ"` (fixed by shortening to `"JWKS public key"`)
- `"Single deployable backend process"` (34 chars) clipped to `"Single deployable back"` (fixed by splitting across two `<br/>` lines)
- `"GET /.well-known/jwks.json"` broke the parser at the leading `.` (fixed by replacing with `"JWKS public key"`)

## Diagram Size and Splitting

**CRITICAL RULE**: Split complex diagrams into multiple focused diagrams for mobile readability.

### Why This Matters

Large diagrams with multiple concepts, many branches, or subgraphs render too small on mobile devices (narrow screens) and become difficult to read. Mobile-first design requires each diagram to be simple enough to display clearly on small screens.

### Problem: Diagrams That Become Too Small

**Symptoms**:

- Diagram contains multiple distinct concepts in one visualization
- More than 4-5 branches from a single node (renders wide and small)
- Using `subgraph` syntax for comparisons (e.g., "Eager vs Lazy")
- Combining different aspects of a feature (hierarchy + usage pattern)

**Real-world examples of diagrams that were too small**:

1. **Java Example 43 (Sealed Classes)**: Combined sealed class hierarchy + pattern matching switch in one diagram
2. **Java Example 36 (Concurrent Collections)**: Combined BlockingQueue + ConcurrentHashMap in one diagram
3. **Kotlin Example 30 (Structured Concurrency)**: Combined hierarchy + cancellation propagation in one diagram
4. **Kotlin Example 34 (Flow Operators)**: Combined transform + buffer + conflate in one diagram
5. **Kotlin Example 38 (Sequences)**: Used subgraphs for Eager vs Lazy comparison
6. **Kotlin Example 43 (Operator Overloading)**: 7 operator types branching from one central node

### Solution: Split Into Focused Diagrams

**One Concept Per Diagram**: Each diagram should explain one idea, pattern, or workflow.

### When to Split

**SPLIT when you have**:

- Multiple distinct concepts in one diagram
- More than 4-5 branches from a single node
- `subgraph` syntax (replace with separate diagrams)
- A vs B comparisons (split into A diagram and B diagram)
- Workflow with multiple stages (split into stage-specific diagrams)

**KEEP as one diagram when**:

- Simple linear flow (3-4 steps)
- Single concept with minimal branching
- Diagram is already focused and readable on mobile

### Splitting Guidelines

**1. One Concept Per Diagram**

FAIL: **Bad** (multiple concepts):

- "Sealed classes + Pattern matching + Exhaustiveness checking"

PASS: **Good** (focused):

- Diagram 1: "Sealed Class Hierarchy"
- Diagram 2: "Pattern Matching with Switch"

**2. Limit Branching (3-4 nodes per level)**

FAIL: **Bad** (excessive branching):

- One node branching to 7+ child nodes (renders wide and small)

PASS: **Good** (controlled):

- Split into 2-3 diagrams, each with 3-4 branches maximum

**3. Avoid Subgraphs (use separate diagrams)**

FAIL: **Bad** (subgraphs):

```mermaid
graph TD
    subgraph Eager
        A[Load All] --> B[Process]
    end

    subgraph Lazy
        C[Load On Demand] --> D[Process]
    end
```

PASS: **Good** (separate diagrams with headers):

**Eager Evaluation:**

```mermaid
graph TD
    A[Load All Data] --> B[Process Immediately]
```

**Lazy Evaluation:**

```mermaid
graph TD
    A[Load On Demand] --> B[Process When Needed]
```

**4. Use Descriptive Headers**

When splitting diagrams, add bold headers above each diagram:

- Format: `**Concept Name:**` followed by the Mermaid code block
- Example: `**BlockingQueue (Producer-Consumer):**`

This provides clear context for each focused diagram.

**5. Mobile-First Design**

All diagrams should be readable on narrow mobile screens:

- LR (left-to-right) layout is the default; nodes stack vertically in the natural scroll direction
- Splitting ensures each diagram remains focused and readable on small screens
- Reduced node count per diagram prevents text truncation

### Real-World Fixes

**Example 1: Sealed Classes (Before)**

Combined hierarchy + pattern matching:

```mermaid
graph TD
    Shape --> Circle
    Shape --> Rectangle
    Shape --> Triangle

    Switch[Pattern Match] --> |Circle| C[Handle Circle]
    Switch --> |Rectangle| R[Handle Rectangle]
    Switch --> |Triangle| T[Handle Triangle]
```

**Example 1: Sealed Classes (After)**

**Sealed Class Hierarchy:**

```mermaid
graph TD
    Shape[Shape<br/>sealed interface] --> Circle
    Shape --> Rectangle
    Shape --> Triangle
```

**Pattern Matching Switch:**

```mermaid
graph TD
    A[switch#40;shape#41;] --> B{Type?}
    B -->|Circle| C[area = π × r²]
    B -->|Rectangle| D[area = w × h]
    B -->|Triangle| E[area = ½ × b × h]
```

**Example 2: Concurrent Collections (Before)**

Combined BlockingQueue + ConcurrentHashMap:

```mermaid
graph TD
    BQ[BlockingQueue] --> Put[put#40;#41;]
    Put --> Take[take#40;#41;]

    CHM[ConcurrentHashMap] --> PutIfAbsent
    PutIfAbsent --> Compute
    Compute --> Merge
```

**Example 2: Concurrent Collections (After)**

**BlockingQueue (Producer-Consumer):**

```mermaid
graph TD
    Producer --> |put#40;item#41;| Queue[BlockingQueue]
    Queue --> |take#40;#41;| Consumer
    Queue --> |Blocks if full| Producer
    Consumer --> |Blocks if empty| Queue
```

**ConcurrentHashMap (Atomic Operations):**

```mermaid
graph TD
    A[putIfAbsent#40;k,v#41;] --> B{Key exists?}
    B -->|No| C[Insert value]
    B -->|Yes| D[Return existing]
```

### Summary

**Golden Rules**:

1. **One concept per diagram** - Each diagram explains one idea
2. **Limit branching** - Maximum 3-4 branches per level
3. **No subgraphs** - Use separate diagrams with headers instead
4. **Descriptive headers** - Add `**Concept Name:**` above each diagram
5. **Mobile-first** - Ensure readability on narrow screens

This prevents "too small" diagram issues and improves mobile user experience.

## Related Documentation

- [Color Accessibility Convention](./color-accessibility.md) - Master reference for accessible color palette, WCAG standards, and testing tools (comprehensive guide for all color usage)
- [File Naming Convention](../structure/file-naming.md) - How to name documentation files
- [Linking Convention](./linking.md) - How to link between files
- [Diátaxis Framework](../structure/diataxis-framework.md) - Documentation organization principles
- [Conventions Index](../README.md) - Overview of all conventions

## External Resources

- [Mermaid Official Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [ASCII Art Generator](https://www.asciiart.eu/)
- [Box Drawing Unicode Characters](https://en.wikipedia.org/wiki/Box-drawing_characters)
