---
description: "Why this convention exists, the accessibility and no-time-estimates principles it implements, and which markdown content it covers"
when_to_use: "Read this to confirm this convention applies to the markdown file you are writing or reviewing."
---

# Purpose, Scope, and Principles

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Accessibility First](../../../principles/content/accessibility-first.md)**: Requires alt text for images, proper heading hierarchy, WCAG AA color contrast, semantic HTML structure, and screen reader support. Accessibility is not optional - it's a baseline requirement for all content.

- **[No Time Estimates](../../../principles/content/no-time-estimates.md)**: Permits labelled time estimates in documentation; only plan documents state no time estimates.

## Purpose

This convention establishes universal quality standards that apply to **all markdown content** in the repository. It ensures consistent writing quality, accessibility compliance, and professional presentation across documentation, ayokoding-www content, planning documents, and repository root files. These standards make content readable, maintainable, and accessible to all users including those using assistive technologies.

## Scope

These principles apply to markdown content in:

- **docs/** - Documentation (tutorials, how-to guides, reference, explanations)
- **apps/** - ayokoding-www and ose-www content
- **plans/** - Project planning documents
- **Repository root files** - README.md, CONTRIBUTING.md, SECURITY.md, etc.

**Universal Application**: Every markdown file in this repository should follow these quality principles, regardless of location or purpose.

%% TD required: concept hierarchy flows top-down from root principle to sub-principles

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161 %%
graph TD
    accTitle: Scope
    accDescr: Content Quality Principles leads to Writing Style & Tone; Content Quality Principles leads to Heading Hierarchy; Writing Style & Tone leads to Active Voice; Active Voice leads to Professional Tone; and 6 more links.
    A[Content Quality<br/>Principles] --> B[Writing Style & Tone]
    A --> C[Heading Hierarchy]

    B --> B1[Active Voice]
    B1 --> B2[Professional Tone]
    B2 --> B3[Clarity &<br/>Conciseness]
    B3 --> B4[Audience Awareness]

    C --> C1[Single H1 Rule]
    C1 --> C2[Proper Nesting H2-H6]
    C2 --> C3[Descriptive Headings]
    C3 --> C4[Semantic Structure]

    classDef blueNode fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef orangeNode fill:#DE8F05,stroke:#000000,color:#000000
    classDef tealNode fill:#029E73,stroke:#000000,color:#000000
    class A blueNode
    class B orangeNode
    class C tealNode
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

%% TD required: concept hierarchy flows top-down from root principle to sub-principles

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161 %%
graph TD
    accTitle: Scope (2)
    accDescr: Content Quality Principles leads to Accessibility Standards; Content Quality Principles leads to Formatting Conventions; Accessibility Standards leads to Alt Text Required; Alt Text Required leads to Semantic HTML; Semantic HTML leads to ARIA Labels; and 8 more links.
    A[Content Quality<br/>Principles] --> D[Accessibility<br/>Standards]
    A --> E[Formatting<br/>Conventions]

    D --> D1[Alt Text Required]
    D1 --> D2[Semantic HTML]
    D2 --> D3[ARIA Labels]
    D3 --> D4[Color Contrast]
    D4 --> D5[Screen Reader<br/>Support]

    E --> E1[Code Block<br/>Formatting]
    E1 --> E2[Text Formatting]
    E2 --> E3[List Formatting]
    E3 --> E4[Blockquotes &<br/>Callouts]
    E4 --> E5[Table Formatting]
    E5 --> E6[Line Length<br/>Guidelines]

    classDef blueNode fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef purpleNode fill:#CC78BC,stroke:#000000,color:#000000
    classDef brownNode fill:#CA9161,stroke:#000000,color:#000000
    class A blueNode
    class D purpleNode
    class E brownNode
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```
