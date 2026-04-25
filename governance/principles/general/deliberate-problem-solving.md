---
title: "Deliberate Problem-Solving"
description: Think before coding - surface assumptions, tradeoffs, and confusion rather than hiding them
category: explanation
subcategory: principles
tags:
  - problem-solving
  - communication
  - decision-making
  - clarity
created: 2026-01-29
---

# Deliberate Problem-Solving

## Vision Supported

This principle serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) of democratizing Shariah-compliant enterprise systems that anyone can use and trust.

**How this principle serves the vision:**

- **Shariah Compliance Accuracy**: Islamic finance requirements must be understood correctly before implementation. Assumptions about halal/haram can't be implicit - they must be verified through deliberate analysis
- **Transparent Decision-Making**: When building systems for trust-based transactions, showing the reasoning behind technical choices builds confidence. Users see WHY solutions were chosen, not just WHAT was built
- **Educational Platform**: Making problem-solving deliberate and visible helps others learn. Developers understand HOW to analyze Shariah-compliant requirements, not just implement predefined solutions
- **Community Collaboration**: Surfacing assumptions and tradeoffs enables peer review by both developers and Islamic scholars. Shared understanding strengthens community trust
- **Reduced Technical Debt**: Correct understanding from the start prevents costly rework in systems handling financial transactions and religious obligations

**Vision alignment**: Democratizing Islamic enterprise requires solutions that are both technically sound and Shariah-compliant. Deliberate problem-solving ensures we build the right thing correctly - essential when financial transactions and religious obligations are at stake.

## Principle

**Think before coding. Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing any solution, deliberately analyze the problem space, make assumptions explicit, and communicate uncertainties rather than proceeding with hidden confusion.

## Why This Matters

Rushing to implementation without clarity leads to:

- Solutions that don't address the actual problem
- Hidden assumptions that break under different conditions
- Technical debt from overlooked simpler approaches
- Wasted effort on the wrong solution

Deliberate problem-solving ensures:

- Correct understanding before action
- Transparent decision-making
- Better solutions through explicit tradeoff analysis
- Reduced rework and technical debt

## Core Practices

### 1. State Assumptions Explicitly

**Do**: Make all assumptions visible and verifiable
**Don't**: Proceed with implicit assumptions

```
✅ PASS: "I'm assuming X uses REST API based on the /api routes. Should I verify this?"
❌ FAIL: Proceeds to implement GraphQL integration without asking
```

### 2. Present Multiple Interpretations

**Do**: Surface ambiguity and present options
**Don't**: Choose silently when multiple valid approaches exist

```
✅ PASS: "This could mean either A (faster) or B (more maintainable). Which do you prefer?"
❌ FAIL: Picks approach A without mentioning B existed
```

### 3. Suggest Simpler Approaches

**Do**: Advocate for simpler solutions when appropriate
**Don't**: Default to complex solutions without questioning necessity

```
✅ PASS: "We could use a microservices architecture, but given our scale, a monolith might be simpler. Thoughts?"
❌ FAIL: Implements microservices without questioning if complexity is warranted
```

### 4. Stop and Ask When Unclear

**Do**: Name confusion explicitly and ask for clarification
**Don't**: Proceed with hidden confusion hoping it resolves itself

```
✅ PASS: "I'm confused about whether this handles authentication or authorization. Can you clarify?"
❌ FAIL: Makes a guess and implements the wrong thing
```

## Application Examples

### Example 1: API Integration

**Situation**: Asked to integrate a third-party payment API

**❌ FAIL - Hidden Assumptions**:

- Assumes API uses JSON
- Assumes synchronous responses
- Proceeds to implement
- Discovers later it's XML and asynchronous
- Must rewrite everything

**✅ PASS - Deliberate Approach**:

1. "I'm assuming this API uses JSON with synchronous responses. Let me verify the documentation."
2. Reads actual API docs with WebFetch
3. Discovers it's XML with webhooks
4. "The API uses XML with webhook callbacks, not JSON synchronous responses. Should I proceed with XML parsing and webhook endpoint setup?"
5. Gets confirmation before implementing

### Example 2: Database Choice

**Situation**: Asked to add data persistence

**❌ FAIL - Silent Complex Choice**:

- Immediately chooses PostgreSQL with replication
- Implements complex setup
- User only needed simple file storage

**✅ PASS - Surface Tradeoffs**:

1. "For data persistence, I see three options:"
   - File-based storage (simplest, suitable for < 1000 records)
   - SQLite (good for single-server, ACID compliance)
   - PostgreSQL (scalable, complex setup)
2. "What's your expected scale and deployment model?"
3. Gets clarification: single server, < 100 records
4. "Given that, SQLite would be simpler than PostgreSQL. Shall I use SQLite?"
5. Implements after agreement

### Example 3: Feature Implementation

**Situation**: Asked to add "user settings"

**❌ FAIL - Hidden Confusion**:

- Unclear if settings are per-user or global
- Unclear if settings need persistence
- Implements one interpretation
- User wanted different behavior

**✅ PASS - Name Confusion**:

1. "I'm unclear on the scope of 'user settings'. Questions:"
   - Per-user or global defaults?
   - Persisted in database or session-only?
   - Which settings should be configurable?
2. User clarifies: per-user, persisted, theme + language only
3. Now has clear requirements
4. Implements correctly on first try

## Relationship to Other Principles

- **[Explicit Over Implicit](../software-engineering/explicit-over-implicit.md)**: Stating assumptions makes implicit knowledge explicit
- **[Simplicity Over Complexity](./simplicity-over-complexity.md)**: Suggesting simpler approaches aligns with minimizing complexity
- **[Automation Over Manual](../software-engineering/automation-over-manual.md)**: Clear problem understanding enables effective automation
- **[Root Cause Orientation](./root-cause-orientation.md)**: Root cause diagnosis requires the same deliberate analysis — verify the actual cause before acting, not the first apparent symptom

## Verification Checklist

Before implementing any solution:

- [ ] Have I stated my assumptions explicitly?
- [ ] If multiple interpretations exist, have I presented them?
- [ ] Have I considered simpler alternatives?
- [ ] If anything is unclear, have I stopped to ask?
- [ ] Have I verified my understanding using available tools (Read, Grep, WebFetch)?
- [ ] Have I communicated tradeoffs transparently?

## For AI Agents

All agents must follow this principle by:

1. **Using verification tools** (Read, Grep, Glob, WebSearch, WebFetch) to validate assumptions
2. **Presenting options** when multiple valid approaches exist
3. **Asking questions** using AskUserQuestion tool when uncertain
4. **Stating limitations** explicitly when information cannot be verified
5. **Advocating simplicity** and pushing back on unnecessary complexity

See [Information Accuracy and Verification section in AI Agents Convention](../../development/agents/ai-agents.md#information-accuracy-and-verification) for agent-specific verification requirements.

## Common Violations

### Violation 1: Assuming Without Verification

```
❌ FAIL: "Based on common patterns, this probably uses JWT authentication."
✅ PASS: "Let me check the actual implementation." [Uses Read tool] "The code shows it uses session-based authentication, not JWT."
```

### Violation 2: Choosing Silently

```
❌ FAIL: [Implements Redux without mentioning alternatives]
✅ PASS: "For state management, we could use Redux (complex, powerful) or Context API (simpler, sufficient for this scale). Which do you prefer?"
```

### Violation 3: Proceeding Despite Confusion

```
❌ FAIL: [Guesses what "optimize performance" means, implements caching]
✅ PASS: "I'm unclear what aspect of performance to optimize. Is it page load time, API response time, or something else?"
```

## Summary

Deliberate problem-solving means:

- **Verify** rather than assume
- **Present** rather than choose silently
- **Simplify** rather than over-engineer
- **Ask** rather than guess

This principle ensures correct, maintainable, and appropriate solutions through transparent communication and thoughtful analysis.
