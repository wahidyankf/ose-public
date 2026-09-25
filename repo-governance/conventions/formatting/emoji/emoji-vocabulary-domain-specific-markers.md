---
description: The emoji vocabulary for general technical domains, enterprise/financial-services domains, and AI agent role categorization.
when_to_use: Use when picking an emoji for a heading in a technical, financial-services, or AI-agent-related section.
---

# Emoji Vocabulary: Domain-Specific Markers

## Domain-Specific Markers

Use for specific technical domains:

| Emoji | Meaning                   | Usage                                   |
| ----- | ------------------------- | --------------------------------------- |
|       | **Security**              | Security considerations, authentication |
|       | **Testing**               | Test cases, testing strategies          |
| ️      | **Architecture**          | System design, architectural decisions  |
|       | **API/Network**           | API documentation, network concepts     |
|       | **Data/Storage**          | Database, data structures               |
|       | **UI/Frontend**           | User interface, styling                 |
|       | **Performance**           | Optimization, speed improvements        |
|       | **Dependencies/Packages** | External libraries, modules             |

## Domain-Specific: Enterprise and Financial Services

Use for enterprise and financial services content:

| Emoji | Meaning                    | Usage                                      |
| ----- | -------------------------- | ------------------------------------------ |
|       | **Finance/Money**          | Financial concepts, transactions           |
|       | **Banking**                | Banking operations, accounts               |
|       | **Payments**               | Payment processing, cards                  |
|       | **Analytics/Growth**       | Financial analytics, metrics               |
| ️      | **Compliance/Legal**       | Regulatory compliance, legal requirements  |
|       | **Sharia/Islamic Finance** | Sharia-compliant features, Islamic banking |

## Domain-Specific: AI Agents

Use for AI agent categorization in `.agents/agents/README.md` (primary) and `.opencode/agents/README.md` (secondary):

| Emoji | Meaning                              | Usage                                                   |
| ----- | ------------------------------------ | ------------------------------------------------------- |
| 🟦    | **Writer/Creator Agents (Blue)**     | Agents that create or write content (docs, plans, etc.) |
| 🟩    | **Checker/Validator Agents (Green)** | Agents that validate or check consistency               |
| 🟨    | **Fixer Agents (Yellow)**            | Agents that update or modify existing content           |
| 🟪    | **Implementor Agents (Purple)**      | Agents that execute or implement plans                  |

**Note:** These colored square emojis are used in both `.agents/agents/README.md` (primary) and `.opencode/agents/README.md` (secondary) to visually categorize agents by role. They match the `color` field in agent frontmatter. See [AI Agents Convention](../../../development/agents/ai-agents.md) for complete details on agent color categorization.

**Color Accessibility:** All four colors (blue, green, yellow, purple) are from the verified accessible palette and work for all types of color blindness (protanopia, deuteranopia, tritanopia). These emojis are SUPPLEMENTARY to text labels - agents are primarily identified by their name, role suffix, and description, not by color alone. See [Color Accessibility Convention](../color-accessibility.md) for complete details.
