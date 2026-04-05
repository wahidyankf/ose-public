---
title: "Overview"
date: 2026-04-05T00:00:00+07:00
draft: false
weight: 100000000
description: "Learn Radix UI through 80 annotated code examples covering 95% of the headless component library - ideal for experienced React developers building accessible design systems"
tags: ["radix-ui", "tutorial", "by-example", "examples", "react", "accessibility", "headless-ui"]
---

**Want to quickly master Radix UI through working examples?** This by-example guide teaches 95% of Radix UI through 80 annotated code examples organized by complexity level.

## What Is By-Example Learning?

By-example learning is an **example-first approach** where you learn through annotated, runnable code rather than narrative explanations. Each example is self-contained, immediately usable in a React project, and heavily commented to show:

- **What each line does** - Inline comments explain the purpose and mechanism
- **Expected behaviors** - Using `// =>` notation to show rendered output and state changes
- **Component relationships** - How Radix primitives compose together
- **Key takeaways** - 1-2 sentence summaries of core concepts

This approach is **ideal for experienced React developers** who understand component composition, hooks, and JSX, and want to quickly understand Radix UI's primitives, accessibility patterns, and composition model through working code.

Unlike narrative tutorials that build understanding through explanation and storytelling, by-example learning lets you **see the code first, render it second, and understand it through direct interaction**. You learn by doing, not by reading about doing.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Beginner<br/>Examples 1-30<br/>Core Primitives"] --> B["Intermediate<br/>Examples 31-55<br/>Production Patterns"]
    B --> C["Advanced<br/>Examples 56-80<br/>Expert Mastery"]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
```

Progress from core primitives through production patterns to expert mastery. Each level builds on the previous, increasing in sophistication and introducing more advanced composition and accessibility techniques.

## Prerequisites

Before starting this guide, you should be comfortable with:

- **React fundamentals** - Components, props, state, hooks, JSX
- **TypeScript basics** - Interfaces, generics, type narrowing
- **CSS fundamentals** - Selectors, specificity, CSS custom properties
- **npm/yarn** - Package installation, dependency management

You do **not** need prior experience with Radix UI, headless UI libraries, or WAI-ARIA specifications. The examples teach these concepts incrementally.

## Coverage Philosophy

This by-example guide provides **95% coverage of Radix UI** through practical, annotated examples. The 95% figure represents the depth and breadth of concepts covered, not a time estimate -- focus is on **outcomes and understanding**, not duration.

### What's Covered

- **Core primitives** - Dialog, Popover, Tooltip, DropdownMenu, Accordion, Tabs
- **Form components** - Switch, Checkbox, RadioGroup, Slider, Select, Toggle, ToggleGroup
- **Layout primitives** - Separator, ScrollArea, AspectRatio, Collapsible, VisuallyHidden
- **Overlay components** - Portal, AlertDialog, ContextMenu, HoverCard, Toast
- **Navigation** - NavigationMenu, Toolbar, Menubar
- **Composition patterns** - asChild, compound components, custom triggers, polymorphic rendering
- **Styling integration** - data-state attributes, CSS animations, Tailwind CSS patterns
- **Accessibility** - Keyboard navigation, focus management, screen reader support, ARIA roles
- **Production patterns** - Form builders, design system integration, testing, SSR, performance
- **Advanced techniques** - Virtualized lists, complex modal flows, custom primitive building

### What's NOT Covered

This guide focuses on **learning-oriented examples**, not problem-solving recipes or production deployment. For additional topics:

- **Specific CSS-in-JS libraries** - Emotion, Stitches, or styled-components integration details (beyond general patterns)
- **Radix Themes** - The pre-styled component library built on Radix Primitives (this guide covers primitives only)
- **Server Components** - React Server Component patterns (Radix components are client-side by nature)

The 95% coverage goal maintains humility -- no tutorial can cover everything. This guide teaches the **core concepts that unlock the remaining 5%** through your own exploration and project work.

## How to Use This Guide

1. **Sequential or selective** - Read examples in order for progressive learning, or jump to specific components when you need a particular primitive
2. **Render everything** - Paste examples into a React project to see results yourself. Experimentation solidifies understanding.
3. **Modify and explore** - Change props, add styling, break components intentionally. Learn through experimentation.
4. **Use as reference** - Bookmark examples for quick lookups when you forget a component's API or composition pattern
5. **Complement with narrative tutorials** - By-example learning is code-first; pair with Radix UI documentation for deeper API reference

**Best workflow**: Open your editor in one window, this guide in another, and a browser with your dev server in a third. Render each example as you read it. When you encounter something unfamiliar, render the example, modify it, see what changes.

## Relationship to Other Tutorials

Understanding where by-example fits in the tutorial ecosystem helps you choose the right learning path:

| Tutorial Type   | Focus           | Best For                                       |
| --------------- | --------------- | ---------------------------------------------- |
| **By Example**  | Code-first      | Experienced React developers, quick reference  |
| **By Concept**  | Theory-first    | Understanding WAI-ARIA, design system patterns |
| **Quick Start** | Getting started | First 30 minutes with Radix UI                 |

**By-example is your fastest path** if you already know React and want to learn Radix UI's primitives through working code. Choose concept-based tutorials if you need deeper understanding of accessibility specifications or design system architecture.

## Project Setup

All examples assume a React project with Radix UI packages installed. Use this setup:

```bash
npx create-next-app@latest my-radix-app --typescript
cd my-radix-app
```

Install Radix packages as needed per example:

```bash
npm install @radix-ui/react-dialog
npm install @radix-ui/react-popover
npm install @radix-ui/react-tooltip
# ... install per component as introduced
```

Each example specifies which `@radix-ui/react-*` package it uses, so you can install incrementally as you progress through the guide.
