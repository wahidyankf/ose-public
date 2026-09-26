---
description: "Defines the mandatory content patterns every tutorial, how-to guide, and explanation document must follow for programming language content."
when_to_use: "Use when authoring or reviewing a tutorial, how-to guide, or explanation document for programming language content, to check it against the mandatory patterns."
---

# Pedagogical Requirements

## Mandatory Patterns for All Tutorials

Every tutorial MUST include:

1. **Front Hook** (first paragraph)
   - Format: "**Want to [achieve outcome]?** This [tutorial type] [value proposition]."
   - Example: "**Want to get productive with Python fast?** This Quick Start teaches you the essential syntax and core patterns you need to read Python code and try simple examples independently."

2. **Learning Path Visualization**
   - Mermaid diagram showing concept progression
   - Use color-blind friendly palette: Blue (#0173B2), Orange (#DE8F05), Teal (#029E73)
   - Example structure: Concept A → Concept B → Concept C → Ready!

3. **Prerequisites Section**
   - Clear entry requirements
   - Links to prerequisite tutorials
   - Tool/version requirements

4. **Coverage Declaration**
   - State coverage explicitly: "This covers X-Y% of [language] knowledge"
   - Explain what coverage means (scope, not time)

5. **Progressive Disclosure**
   - Start simple, increase complexity gradually
   - One concept per section
   - Build on previous concepts

6. **Runnable Code Examples**
   - Every concept has working code
   - Code includes comments explaining key points
   - Examples are complete (not fragments)

7. **Hands-On Exercises**
   - Multiple difficulty levels (Level 1-4 or similar)
   - Clear objectives for each exercise
   - Progressive challenge

8. **Cross-References**
   - Link to related How-To guides
   - Reference Cookbook for practical patterns
   - Point to next tutorial level

## Mandatory Patterns for How-To Guides

Every how-to guide MUST include:

1. **Problem Statement**
   - Clear description of the problem being solved
   - When you'd encounter this problem

2. **Solution**
   - Step-by-step instructions
   - Complete, runnable code

3. **How It Works**
   - Explanation of the solution
   - Key concepts involved

4. **Variations**
   - Alternative approaches
   - Trade-offs between approaches

5. **Common Pitfalls**
   - What can go wrong
   - How to avoid mistakes

6. **Related Patterns**
   - Links to similar how-to guides
   - References to relevant tutorial sections

## Mandatory Patterns for Explanation Documents

Best practices and anti-patterns MUST include:

1. **Organized by Category**
   - Group related practices together
   - Clear section headings

2. **Pattern Format**
   - **Principle/Pattern name**
   - **Why it matters** (rationale)
   - **Good example** (code showing correct approach)
   - **Bad example** (code showing what to avoid)
   - **Exceptions** (when rule doesn't apply)

3. **Philosophy Section**
   - "What Makes [Language] Special"
   - Core language philosophy
   - Design principles
