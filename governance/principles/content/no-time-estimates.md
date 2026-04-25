---
title: "No Time Estimates"
description: People work and learn at vastly different speeds - focus on outcomes and deliverables, not arbitrary time constraints
category: explanation
subcategory: principles
tags:
  - principles
  - no-time-estimates
  - learning
  - productivity
  - outcomes
created: 2025-12-15
---

# No Time Estimates

People work and learn at **vastly different speeds**. Focus on **outcomes and deliverables**, not arbitrary time constraints. Time estimates create pressure, anxiety, and artificial deadlines that harm learning and productivity.

## Vision Supported

This principle serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) of making Islamic enterprise accessible to developers, businesses, and individuals working at their own pace worldwide.

**How this principle serves the vision:**

- **Respects Individual Context**: Developers in different timezones, with different work schedules, and different life circumstances can contribute meaningfully. No one excluded because they can't work "fast enough"
- **Encourages Thorough Learning**: Learners can master Islamic finance principles deeply without artificial pressure. Quality understanding over speed produces better Shariah-compliant implementations
- **Reduces Anxiety**: Removing time pressure makes the community welcoming. Developers focus on building halal enterprise correctly, not quickly
- **Sustainable Contribution**: Open-source thrives on consistent contribution over time, not sprints. Respecting pace enables long-term, sustainable participation
- **Global Inclusivity**: Not everyone has 40-hour workweeks or fast internet. No time estimates means no one left behind due to circumstances

**Vision alignment**: Democratization means meeting people where they are - in skill, time, and pace. Time estimates create artificial barriers that contradict the vision of universal accessibility.

## What

**No Time Estimates** means:

- No "X hours to complete" in tutorials
- No "takes 30 minutes" in documentation
- No "2-3 weeks" in learning materials
- Focus on WHAT you'll achieve, not HOW LONG it takes
- Outcomes-based language

**Time-Based Framing** means:

- "This tutorial takes 2 hours"
- "Complete in 30 minutes"
- "Estimated time: 45 min"
- Focus on duration over outcomes
- Creates artificial pressure

## Why

### Benefits of Outcome Focus

1. **No Pressure**: Learn at your own pace without anxiety
2. **Inclusive**: Accommodates different learning speeds
3. **Accurate Expectations**: Focus on skills gained, not time spent
4. **Evergreen Content**: No need to update time estimates
5. **Intrinsic Motivation**: Learn for mastery, not to "finish on time"

### Problems with Time Estimates

1. **Creates Pressure**: "I should be done by now" anxiety
2. **Inaccurate**: Beginners take 10x longer than experts
3. **Discourages Deep Learning**: Rushing to meet time target
4. **Maintenance Burden**: Time estimates become outdated
5. **False Precision**: "2 hours" is meaningless without context

### Individual Variation in Learning Speed

**Same tutorial, different speeds**:

- Expert programmer: 20 minutes
- Experienced developer: 1 hour
- Junior developer: 3 hours
- Career changer: 8 hours
- Complete beginner: 2 days

**All are valid**. Time estimates serve no one well.

## How It Applies

### Tutorial Content

**Context**: Educational documentation and learning materials.

PASS: **Outcome-Focused (Correct)**:

```markdown
# React Quick Start

By the end of this tutorial, you'll be able to:

- Create React components
- Manage state with hooks
- Handle user events
- Build a simple interactive app

Coverage: 5-30% of React fundamentals
```

**Why this works**: Describes WHAT you'll learn. No pressure. Clear outcomes.

FAIL: **Time-Based (Avoid)**:

```markdown
# React Quick Start

️ Estimated time: 2-3 hours

This tutorial will teach you React basics in under 3 hours.
```

**Why this fails**: Creates anxiety if you take longer. Inaccurate for most learners.

### How-To Guides

**Context**: Problem-solving documentation.

PASS: **Outcome-Focused (Correct)**:

```markdown
# How to Deploy to Production

This guide walks through production deployment steps:

1. Configure environment variables
2. Set up database
3. Deploy application
4. Verify deployment

You'll have a working production deployment by the end.
```

**Why this works**: Describes outcome (working deployment). No time pressure.

FAIL: **Time-Based (Avoid)**:

```markdown
# How to Deploy to Production

️ Takes approximately 30-45 minutes

Quick 30-minute deployment guide.
```

**Why this fails**: 30 minutes for expert, 4 hours for beginner. Creates false expectations.

### Coverage Percentages (Allowed)

**Context**: Indicating tutorial depth.

PASS: **Coverage Percentages (Correct)**:

```markdown
# Beginner Tutorial

Coverage: 0-60% of domain knowledge

Teaches fundamentals needed for 90% of real-world use cases.
```

**Why this works**: Indicates **depth/scope**, not duration. No time pressure.

**Important**: Coverage percentages describe **how much of the domain** you'll learn, not **how long it takes**.

### Project Planning (Exception)

**Context**: Project management documents in `plans/`.

PASS: **Time Estimates Allowed (In Planning Context)**:

```markdown
# Project Plan

Implementation estimate: 2-3 weeks

Tasks:

- Database schema: 2 days
- API endpoints: 1 week
- Frontend: 1 week
```

**Why this is acceptable**: Project planning requires resource allocation. This is for team coordination, not learner pressure.

**Not applicable to**: Educational content, tutorials, documentation, how-to guides.

## Anti-Patterns

### Tutorial Time Estimates

FAIL: **Problem**: Adding time estimates to educational content.

```markdown
# Python for Beginners

️ Total time: 10 hours
Suggested pace: 2 hours/day for 5 days

- Day 1 (2 hours): Variables and data types
- Day 2 (2 hours): Control flow
- Day 3 (2 hours): Functions
```

**Why it's bad**:

- Creates artificial daily schedule
- Pressures learners to "keep up"
- Ignores individual learning speeds
- Discourages deep understanding

### "Quick" or "In X Minutes" Titles

FAIL: **Problem**: Using time in titles.

```markdown
- "React in 30 Minutes"
- "Quick Python Tutorial (45 min)"
- "Learn Go in 2 Hours"
```

**Why it's bad**:

- Clickbait-style titles
- False advertising (beginners take much longer)
- Creates pressure to rush
- Undermines quality learning

### Speed as a Selling Point

FAIL: **Problem**: Emphasizing speed over mastery.

```markdown
Learn React FAST! Complete this bootcamp in just 2 weeks!

Rapid learning path
Fast-track to employment
```

**Why it's bad**:

- Quality learning takes time
- Creates unrealistic expectations
- Discourages beginners who need more time
- Promotes shallow understanding

### Comparing Learning Speeds

FAIL: **Problem**: Suggesting "normal" learning speeds.

```markdown
Most people complete this tutorial in 3-4 hours.
```

**Why it's bad**:

- Implies those taking longer are "slow"
- Creates anxiety and discouragement
- No basis for "most people" claim
- Unhelpful and harmful

## PASS: Best Practices

### 1. Describe Outcomes, Not Duration

**Focus on what learners will achieve**:

```markdown
PASS: By the end of this tutorial, you'll be able to:

- Build REST APIs with Express
- Implement authentication
- Connect to databases
- Deploy to production

FAIL: This tutorial takes 4-6 hours
```

### 2. Use Coverage Percentages for Depth

**Indicate scope, not time**:

```markdown
PASS: Coverage: 60-85% of domain knowledge (intermediate depth)

This tutorial covers professional-level techniques for production
systems. Builds on beginner foundation.

FAIL: This is a 3-week intermediate course
```

### 3. Provide Completion Criteria

**Describe how learners know they're done**:

```markdown
PASS: You've completed this tutorial when you can:

- [ ] Create components independently
- [ ] Debug React applications
- [ ] Build a working app from scratch

FAIL: You should finish this in 2-3 days
```

### 4. Use Section Headings, Not Time Blocks

**Organize by topic, not duration**:

```markdown
PASS: ## Core Concepts

- Variables and types
- Control flow
- Functions

FAIL: ## Day 1 (2 hours)

- Variables and types
- Control flow
```

### 5. Emphasize Mastery Over Speed

**Value understanding, not completion time**:

```markdown
PASS: Take your time to understand each concept. Experiment with the
code examples. Learning thoroughly now saves time debugging later.

FAIL: Try to complete each section in 30 minutes to stay on track.
```

## Examples from This Repository

### Tutorial Naming Convention

**Location**: `governance/conventions/tutorials/naming.md`

**Outcome-focused language**:

```markdown
## Quick Start

Coverage: 5-30% of domain knowledge
Goal: Learn enough to explore independently

After completing a quick start, learners can read documentation,
try examples, and solve simple problems on their own.
```

**No time estimates**: Focus on coverage percentage (depth) and outcomes (what you can do).

### Content Quality Principles

**Location**: `governance/conventions/writing/quality.md`

**Explicit "No Time Estimates" section**:

```markdown
### No Time Estimates

Do NOT include time estimates in educational or tutorial content.

Forbidden:
FAIL: "This tutorial takes 2-3 hours to complete"
FAIL: "Estimated time: 45 minutes"
FAIL: "You'll learn this in 30 minutes"

Correct:
PASS: "By the end of this tutorial, you'll be able to..."
PASS: "This tutorial covers the fundamentals of..."
PASS: "Coverage: 60-85% of domain knowledge (intermediate depth)"
```

### Tutorial Structure

**Location**: All tutorials in `docs/tutorials/`

**Outcome-focused structure**:

```markdown
# Tutorial Title

## What You'll Learn

By the end of this tutorial, you'll be able to:

- Outcome 1
- Outcome 2
- Outcome 3

## Prerequisites

- Required knowledge
- Required tools

## Steps

[Step-by-step instructions]

## Verification

How to verify you've achieved the outcomes.
```

**No**: Time estimates, suggested schedules, "Day 1/Day 2" sections.

### AGENTS.md Guidance

**Location**: `AGENTS.md`

**Explicit guidance**:

```markdown
## Planning Without Timelines

When planning tasks or creating educational content, provide concrete
steps without time estimates. Never suggest timelines like "this will
take 2-3 weeks" or "complete this in 30 minutes."

Focus on WHAT needs to be done or learned, not HOW LONG it takes.
```

## Relationship to Other Principles

- [Progressive Disclosure](./progressive-disclosure.md) - Learn at your own pace through progressive levels
- [Accessibility First](./accessibility-first.md) - Inclusive of different learning speeds
- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Simple outcomes, not complex schedules

## Related Conventions

- [Tutorial Naming Convention](../../conventions/tutorials/naming.md) - Coverage percentages, not time estimates
- [Tutorial Convention](../../conventions/tutorials/general.md) - Outcome-focused tutorial structure
- [Content Quality Principles](../../conventions/writing/quality.md) - Explicit no-time-estimates rule

## References

**Learning Science**:

- [Spaced Repetition](https://en.wikipedia.org/wiki/Spaced_repetition) - Learning over time
- [Deliberate Practice](<https://en.wikipedia.org/wiki/Practice_(learning_method)#Deliberate_practice>) - Anders Ericsson
- [Growth Mindset](https://en.wikipedia.org/wiki/Mindset#Fixed_and_growth_mindset) - Carol Dweck

**Educational Psychology**:

- [Self-Paced Learning](https://www.edutopia.org/article/self-paced-learning) - Benefits of individual pacing
- [Mastery Learning](https://en.wikipedia.org/wiki/Mastery_learning) - Benjamin Bloom
- [Zone of Proximal Development](https://en.wikipedia.org/wiki/Zone_of_proximal_development) - Lev Vygotsky

**Documentation Best Practices**:

- [Write the Docs: Learning-Oriented Documentation](https://www.writethedocs.org/guide/writing/beginners-guide-to-docs/) - Focus on outcomes
- [Diátaxis Framework](https://diataxis.fr/) - Tutorial structure without time constraints
