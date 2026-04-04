---
title: "README Quality Convention"
description: Quality standards for README.md files ensuring engagement, accessibility, and scannability
category: explanation
subcategory: conventions
tags:
  - conventions
  - readme
  - engagement
  - accessibility
  - writing
created: 2025-12-07
updated: 2025-12-07
---

# README Quality Convention

This document defines quality standards for README.md files to ensure they are engaging, accessible, and welcoming to contributors of all backgrounds while maintaining technical accuracy.

## Philosophy

**README as Navigation Document**: The README should be a clear, scannable guide that helps readers understand what the project is, why it matters, and where to find detailed information. It is NOT a comprehensive manual—link to detailed documentation instead.

**Engagement First**: Every section should be inviting and easy to read. Technical accuracy is essential, but accessibility matters just as much.

**Plain Language**: Use conversational, benefits-focused language. Avoid jargon, corporate speak, and unnecessarily technical terms.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Accessibility First](../../principles/content/accessibility-first.md)**: README quality standards prioritize accessible writing - plain language (no jargon), acronym context (not just expansion), short paragraphs (≤5 lines for scannability), conversational tone (welcoming to all backgrounds). These practices ensure READMEs are accessible to non-native English speakers, those with cognitive disabilities, and contributors with varying technical backgrounds.

- **[Progressive Disclosure](../../principles/content/progressive-disclosure.md)**: READMEs serve as navigation documents, not comprehensive manuals. Each section provides a 3-5 line summary with links to detailed documentation. Users get quick orientation without cognitive overload, then dive deeper into specific topics as needed. Essential information is present, but comprehensive explanations are linked, not embedded.

### 1. Hook Readers Immediately

**Problem-Solution Narrative**: Start motivation sections with a clear problem statement followed by your solution.

**FAIL: Bad** (jumps straight to solution):

```markdown
## Purpose

This convention establishes quality standards for README.md files to make them engaging, accessible, and scannable. It ensures READMEs use problem-solution hooks, plain language, proper structure, and benefits-focused language that welcomes all readers including those new to the project.

## Scope

### What This Convention Covers

- **README structure** - Essential sections and their order
- **Opening hooks** - Problem-solution framing to engage readers
- **Plain language** - No jargon, acronym context, accessible writing
- **Paragraph limits** - Maximum 5 lines per paragraph for scannability
- **Benefits-focused language** - Emphasizing value to users
- **Accessibility** - Making READMEs welcoming to all skill levels

### What This Convention Does NOT Cover

- **Technical accuracy** - Factual validation covered in [Factual Validation Convention](./factual-validation.md)
- **Code examples in README** - Code quality covered in development conventions
- **Hugo site READMEs** - Hugo-specific patterns in Hugo content conventions
- **OSS compliance** - License, contribution guidelines covered in [OSS Documentation Convention](./oss-documentation.md)

## Motivation

This project aims to make Sharia-compliant enterprise solutions accessible to organizations worldwide. By creating an open-source platform...
```

**PASS: Good** (problem → solution):

```markdown
## Motivation

**The Challenge**: Organizations worldwide need enterprise software that respects Islamic principles, but most solutions treat Sharia-compliance as an afterthought—bolted on rather than built in.

**Our Solution**: We're building an open-source platform with Sharia-compliance at its core...
```

**Why**: Readers immediately understand the context and relevance instead of having to extract it from a long paragraph.

### 2. Make It Scannable

**Short Paragraphs**: Maximum 4-5 lines per paragraph. Break longer content into multiple paragraphs or bullet points.

**FAIL: Bad** (6+ line dense paragraph):

```markdown
This project aims to make Sharia-compliant enterprise solutions accessible to organizations worldwide. By creating an open-source platform that puts Sharia-compliance at its core, we enable enterprises to build trust-worthy business systems (fintech, ERP, and beyond) that serve communities with specific religious and ethical requirements. We're starting with ERP to establish a solid enterprise foundation that can support diverse business operations, with plans to expand into fintech and other domains.
```

**PASS: Good** (scannable structure):

```markdown
We're building an open-source platform with Sharia-compliance at its core. Starting with ERP foundations, we'll expand to fintech and beyond.

Our goal: Make trustworthy business systems accessible to any organization—regardless of size, region, or industry.
```

**Visual Breaks**: Use headings, bullet points, code blocks, and emojis strategically to create visual hierarchy.

### 3. Eliminate Jargon

**Plain Language First**: Write like you're explaining to a smart friend, not a technical committee.

**FAIL: Bad** (jargony, corporate):

```markdown
We prioritize open-source and vendor-neutral technologies to avoid lock-in while maintaining project quality and long-term sustainability. We value avoiding vendor lock-in over strict OSS-only requirements.
```

**PASS: Good** (plain language):

```markdown
We choose technologies that keep you free. Your data stays yours, in open formats you can take anywhere. No vendor traps, no proprietary formats, no forced dependencies.
```

**Jargon to Avoid**:

- "vendor lock-in" → "no vendor traps" or "keep you free"
- "vendor-neutral" → "you control your choices"
- "OSS" → "open-source" (spell it out)
- "utilize" → "use"
- "leverage" → "use"
- "solutions" → "software" or "tools"
- "utilize synergies" → just... no

### 4. Explain Acronyms with Context

**First Mention**: Always explain acronyms on first use, and provide context for what they mean.

**FAIL: Bad** (no context):

```markdown
- International Islamic finance standards (AAOIFI, IFSB)
- OJK (Otoritas Jasa Keuangan) Sharia banking regulations
```

**PASS: Good** (context provided):

```markdown
- International Islamic finance standards - Accounting (AAOIFI) and prudential (IFSB) standards
- Indonesian Banking Authority (OJK) - Sharia banking regulations
```

**English-First Naming**: For non-English terms, lead with English translation, then provide original name.

**PASS: Good**:

- **Indonesian Banking Authority (OJK)** - not "OJK (Otoritas Jasa Keuangan)"
- **National Sharia Board (DSN-MUI)** - not "DSN-MUI (Dewan Syariah Nasional...)"

### 5. Benefits-Focused Language

**User Benefits Over Features**: Frame technical capabilities as user benefits.

**FAIL: Bad** (feature list):

```markdown
- Data is stored in transparent, portable formats (no proprietary formats)
- No dependency on vendor-specific infrastructure
- Easy data export and migration to alternatives
```

**PASS: Good** (benefits):

```markdown
- **Your data is portable** - Plain text and open formats you can read anywhere
- ️ **No forced dependencies** - Pick your own hosting, database, or infrastructure
- **Easy migration** - Export and move to alternatives anytime
```

**Active Voice**: Use "you" and "we" to create connection.

**FAIL: Bad** (passive, distant):

```markdown
This ensures complete portability—migration to any markdown editor or documentation system can be done anytime without vendor lock-in.
```

**PASS: Good** (active, personal):

```markdown
You can open them in any text editor—no lock-in, complete freedom.
```

### 6. Maintain Navigation Focus

**Link to Details**: README should summarize and link, not duplicate comprehensive documentation.

**FAIL: Bad** (too detailed):

````markdown
### Monorepo Architecture

This project uses Nx as a monorepo build system to manage multiple applications and shared libraries with efficient task execution and caching.

#### Apps (apps/)

Deployable applications - independent executables that consume shared libraries. Part of the Nx monorepo.

**Examples**: api-gateway, admin-dashboard, customer-portal

**Run an app**:

```bash
nx dev [app-name]    # Start development server
nx build [app-name]  # Build for production
```
````

[... 60+ more lines of detailed explanations ...]

````

**PASS: Good** (summary + links):
```markdown
### Monorepo Architecture

This project uses Nx to manage applications and libraries:

- **apps/** - Deployable applications (e.g., api-gateway, admin-dashboard)
- **libs/** - Reusable libraries with language prefixes (ts-*, future: java-*, py-*)
- **apps-labs/** - Experimental apps and POCs (framework evaluation, language exploration)

**Quick Commands**:
```bash
nx dev [app-name]       # Start development server
nx build [app-name]     # Build specific project
nx graph                # Visualize dependencies
````

**Learn More**:

- [Monorepo Structure Reference](../../../docs/reference/re__monorepo-structure.md)
- [How to Add New App](../../../docs/how-to/hoto__add-new-app.md)

````

**Key Difference**: Summary (3-5 lines) + essential commands + links to detailed docs.

### 7. Conversational Tone

**Friendly, Not Corporate**: Write like a welcoming teammate, not a marketing brochure.

**FAIL: Bad** (corporate, distant):
```markdown
This project is licensed under the FSL-1.1-MIT License. Users are granted broad rights while maintaining proper attribution requirements as specified in the license agreement.
````

**PASS: Good** (friendly, clear):

```markdown
This project is source-available under the FSL-1.1-MIT License. This means you are free to use this project for:

- **Commercial projects** - Build commercial products and services (except competing platforms)
- **Enterprise solutions** - Deploy in enterprise environments

PASS: **Converts to MIT after 2 years.** Each version becomes fully open-source on a rolling basis.
```

**Encourage, Don't Command**: Invite participation rather than demand it.

**FAIL: Bad**: "You must follow these steps exactly"
**PASS: Good**: "Here's how to get started:"

## Quality Checklist

Use this checklist when writing or reviewing README content:

### Engagement

- [ ] Opens with clear problem statement or hook?
- [ ] Uses problem-solution narrative structure?
- [ ] Makes the "why" clear before the "what"?
- [ ] Creates emotional connection to the project's purpose?

### Scannability

- [ ] Paragraphs are 4-5 lines maximum?
- [ ] Uses visual hierarchy (headings, bullets, code blocks)?
- [ ] Strategic emoji use for visual markers?
- [ ] Important information stands out?
- [ ] Easy to skim and find specific sections?

### Accessibility

- [ ] No unexplained jargon or acronyms?
- [ ] Technical terms explained in plain language?
- [ ] Acronyms have context (not just expansion)?
- [ ] English-first naming for international audiences?
- [ ] Conversational, welcoming tone?

### Content Balance

- [ ] Each section is summary + links (not comprehensive)?
- [ ] No duplicate content from detailed docs?
- [ ] Essential information present?
- [ ] Detailed explanations linked, not embedded?
- [ ] Total length reasonable (not overwhelming)?

### Language Quality

- [ ] Active voice ("you can" not "users are able to")?
- [ ] Benefits-focused ("Your data is portable" not "Data portability feature")?
- [ ] Conversational ("keep you free" not "avoid vendor lock-in")?
- [ ] Short sentences (mostly 15-25 words)?
- [ ] Specific examples provided where helpful?

## Section-Specific Guidelines

### Opening (Project Name & Tagline)

**Format**:

```markdown
# Project Name

One-line description that's clear and inviting.
```

**Guidelines**:

- Tagline should be 8-15 words maximum
- Avoid jargon in the tagline—this is the first impression
- Use an emoji that represents the project (optional but recommended)

### Motivation Section

**Must Have**:

1. **Problem statement**: What challenge does this solve?
2. **Solution**: How does this project address it?
3. **Beliefs/Values**: What principles guide the project?
4. **Mission**: What's the ultimate goal?

**Structure**:

```markdown
## Motivation

**The Challenge**: [Problem statement in 1-2 sentences]

**Our Solution**: [How you're solving it in 2-3 sentences]

**What We Believe:**

- Principle 1
- Principle 2
- Principle 3

Our mission is to [clear, inspiring goal].
```

### Roadmap Section

**Guidelines**:

- Show phased approach if applicable
- Explain why this sequence makes sense
- Keep phase descriptions to 4-5 bullet points maximum
- Link to detailed roadmap if one exists

**Acronyms**: Always provide context

- FAIL: "AAOIFI, IFSB standards"
- PASS: "Accounting (AAOIFI) and prudential (IFSB) standards"

### Tech Stack Section

**Guidelines**:

- Explain guiding principles in plain language
- Benefits-focused: "Your data is portable" not "portable data format"
- Provide concrete examples
- Avoid listing every single dependency (link to package.json instead)
- Focus on architectural choices, not implementation details

### Getting Started Section

**Must Have**:

1. Prerequisites (what they need installed)
2. Installation (simple copy-paste commands)
3. Quick start (get something running fast)
4. Links to detailed guides

**Keep It Simple**: This should get someone up and running in <5 minutes.

## Emoji Usage

**Strategic, Not Excessive**: Use emojis to create visual markers and hierarchy, not decoration.

**Good Uses**:

- Section headers (, ️, , )
- Bullet point categories (, ️, )
- Emphasis on key points (, ️, )

**Avoid**:

- Multiple emojis per line
- Emojis in every sentence
- Decorative-only emojis
- Emojis that don't add meaning

**Accessibility**: Emojis should enhance, not replace, clear text.

## Common Mistakes

### 1. Corporate Speak

**FAIL: Avoid**:

- "leverage synergies"
- "best-in-class solutions"
- "utilize cutting-edge technology"
- "paradigm shift"
- "value proposition"

**PASS: Use Instead**:

- "use" (not "leverage" or "utilize")
- "good/great" (not "best-in-class")
- "new approach" (not "paradigm shift")
- "what you get" (not "value proposition")

### 2. Assumed Knowledge

**FAIL: Bad**:

```markdown
This project uses TBD with CQRS and DDD patterns for maximum scalability.
```

**PASS: Good**:

```markdown
This project follows Trunk Based Development—all development happens on the main branch with small, frequent commits.
```

**Rule**: If you use an acronym, either spell it out or link to explanation on first use.

### 3. Feature Dumping

**FAIL: Bad**:

```markdown
Features:

- Real-time synchronization
- Multi-tenant architecture
- RBAC implementation
- Event sourcing
- CQRS pattern
- Microservices
  [... 20 more features ...]
```

**PASS: Good**:

```markdown
**What You Get**:

- **Real-time collaboration** - Changes sync instantly across your team
- **Multi-organization support** - One installation serves many clients
- **Granular permissions** - Control who can access what

See [Feature Overview](../../features.md) for complete list.
```

**Rule**: Highlight 3-5 key benefits, link to comprehensive feature list.

### 4. Wall of Text

**FAIL: Bad**: Single paragraph with 10+ lines of continuous text

**PASS: Good**: Multiple short paragraphs, each making one point

**Rule**: If a paragraph exceeds 5 lines, break it up or use bullets.

### 5. Missing Context

**FAIL: Bad**:

```markdown
- OJK compliance
- DSN-MUI guidelines
- AAOIFI standards
```

**PASS: Good**:

```markdown
- Indonesian Banking Authority (OJK) - Sharia banking regulations
- National Sharia Board (DSN-MUI) - Islamic finance guidelines
- Accounting standards (AAOIFI) - International Islamic finance
```

**Rule**: Every acronym needs context, not just expansion.

## Examples from This Project

### Good Example: Motivation Hook

```markdown
**The Challenge**: Organizations worldwide need enterprise software that respects Islamic principles, but most solutions treat Sharia-compliance as an afterthought—bolted on rather than built in.

**Our Solution**: We're building an open-source platform with Sharia-compliance at its core.
```

**Why it works**:

- Clear problem statement (one sentence)
- Emotional connection (afterthought vs built-in)
- Clear solution (one sentence)
- No jargon
- Scannable structure

### Good Example: Benefits-Focused

```markdown
**What this means:**

- **Your data is portable** - Plain text and open formats you can read anywhere
- ️ **No forced dependencies** - Pick your own hosting, database, or infrastructure
- **Easy migration** - Export and move to alternatives anytime
```

**Why it works**:

- User benefits, not features
- Active voice ("Your data")
- Plain language ("keep you free")
- Visual markers (emojis)
- Short, clear statements

### Good Example: Navigation Focus

```markdown
### Monorepo Architecture

This project uses Nx to manage applications and libraries:

- **apps/** - Deployable applications
- **libs/** - Reusable libraries

**Learn More**:

- [Monorepo Structure Reference](../../../docs/reference/re__monorepo-structure.md)
- [How to Add New App](../../../docs/how-to/hoto__add-new-app.md)
```

**Why it works**:

- Brief summary (3 lines)
- Links to detailed docs
- Doesn't duplicate comprehensive content
- Easy to scan

## Maintenance

**When Updating README**:

1. Use `readme-maker` agent to help write new sections
2. Use `readme-checker` agent to validate changes
3. Run through quality checklist before committing
4. Get feedback from non-technical reviewers if making major changes

**Red Flags** (triggers for review):

- Any paragraph exceeds 5 lines
- Any acronym without context
- Any jargon from "avoid" list above
- README file exceeds 400 lines
- Complaints from contributors about clarity

## Related Documentation

- [Content Quality Principles](./quality.md) - General content quality standards
- [Emoji Usage Convention](../formatting/emoji.md) - Emoji usage guidelines
- [Linking Convention](../formatting/linking.md) - How to format links

## External Resources

- [Make a README](https://www.makeareadme.com/) - README best practices
- [Awesome README](https://github.com/matiassingers/awesome-readme) - Examples of great READMEs
- [Plain Language Guidelines](https://www.plainlanguage.gov/guidelines/) - US Government plain language guide
