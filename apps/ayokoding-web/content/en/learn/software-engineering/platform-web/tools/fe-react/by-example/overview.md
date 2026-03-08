---
title: "Overview"
weight: 10000000
date: 2025-01-29T00:00:00+07:00
draft: false
description: "Learn React + TypeScript through 75 heavily annotated code examples achieving 95% language coverage"
tags: ["react", "typescript", "by-example", "code-first", "examples"]
---

**Want to learn React through code?** This by-example tutorial provides 75 heavily annotated examples covering 95% of React + TypeScript. Master React idioms, patterns, and best practices through working code rather than lengthy explanations.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the React concept
2. **How it works** - A focused, heavily commented code example
3. **Key Takeaway** - A pattern summary highlighting the key takeaway
4. **Why It Matters** - Production context, when to use, deeper significance

This approach works best when you already understand programming fundamentals and basic web development concepts. You learn React's component model, hooks system, and TypeScript integration by studying real code rather than theoretical descriptions.

## What Is React?

React is a **JavaScript library for building user interfaces** that prioritizes component composition and declarative rendering. Key distinctions:

- **Not a framework**: React focuses on the view layer; routing, state management, and other concerns require additional libraries
- **Component-based**: UI built from reusable, composable components with clear boundaries
- **Declarative**: Describe what UI should look like for any state; React handles DOM updates efficiently
- **TypeScript integration**: Strong typing provides better developer experience and catches errors early
- **Modern patterns**: Hooks, Context API, Suspense enable powerful composition without class components

## Learning Path

```mermaid
graph TD
  A["Beginner<br/>Core React Concepts<br/>Examples 1-25"] --> B["Intermediate<br/>Production Patterns<br/>Examples 26-50"]
  B --> C["Advanced<br/>Performance & Scale<br/>Examples 51-90"]
  D["0%<br/>No React Knowledge"] -.-> A
  C -.-> E["95%<br/>Framework Mastery"]

  style A fill:#0173B2,color:#fff
  style B fill:#DE8F05,color:#fff
  style C fill:#029E73,color:#fff
  style D fill:#CC78BC,color:#fff
  style E fill:#029E73,color:#fff
```

## Coverage Philosophy: 95% Through 75 Examples

The **95% coverage** means you'll understand React deeply enough to build production applications with confidence. It doesn't mean you'll know every edge case or advanced optimization—those come with experience.

The 75 examples are organized progressively:

- **Beginner (Examples 1-25)**: Foundation concepts (JSX, components, props, state, basic hooks, event handling, conditional rendering)
- **Intermediate (Examples 26-50)**: Production patterns (custom hooks, context, forms, data fetching, routing, error boundaries, performance basics)
- **Advanced (Examples 51-75)**: Scale and optimization (advanced patterns, performance optimization, testing strategies, accessibility, deployment patterns)

Together, these examples cover **95% of what you'll use** in production React applications.

## Annotation Density: 1-2.25 Comments Per Code Line

**CRITICAL**: All examples maintain **1-2.25 comment lines per code line PER EXAMPLE** to ensure deep understanding.

**What this means**:

- Simple lines get 1 annotation explaining purpose or result
- Complex lines get 2+ annotations explaining behavior, state changes, and side effects
- Use `// =>` notation to show expected values, outputs, or state changes

**Example**:

```typescript
const [count, setCount] = useState(0);     // => count is 0 initially (type: number)
                                           // => setCount updates count and triggers re-render

const handleClick = () => {                // => Event handler for button clicks
  setCount(count + 1);                     // => Increments count by 1
                                           // => Component re-renders with new count
};

return <button onClick={handleClick}>     {/* => Button displays current count */}
  Count: {count}                          {/* => Shows "Count: 0" initially */}
</button>;                                 {/* => Updates to "Count: 1" after click */}
```

This density ensures each example is self-contained and fully comprehensible without external documentation.

## Structure of Each Example

All examples follow a consistent five-part format:

````
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

```typescript
// Heavily annotated code example
// showing the React pattern in action
````

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words explaining significance in production applications.

````

**Code annotations**:

- `// =>` shows expected output, state changes, or results
- Inline comments explain what each line does
- Variable names are self-documenting
- Type annotations make data flow explicit

## What's Covered

### Core React Concepts

- **JSX & Elements**: JSX syntax, element creation, rendering, fragments
- **Components**: Function components, composition patterns, component lifecycle
- **Props**: Prop passing, children, prop drilling, type safety with TypeScript
- **State**: useState hook, state updates, state lifting, derived state

### Hooks System

- **Basic Hooks**: useState, useEffect, useContext
- **Advanced Hooks**: useReducer, useCallback, useMemo, useRef
- **Custom Hooks**: Creating reusable hooks, hooks composition, testing hooks
- **Hook Rules**: Rules of hooks, dependency arrays, stale closures

### Event Handling & Forms

- **Event System**: Event handling, synthetic events, event delegation
- **Forms**: Controlled components, form validation, form libraries (React Hook Form)
- **Input Patterns**: Text inputs, checkboxes, radio buttons, file uploads

### Component Patterns

- **Composition**: Component composition, render props, higher-order components
- **State Management**: Context API, reducers, state machines
- **Error Handling**: Error boundaries, error recovery patterns
- **Code Splitting**: Lazy loading, Suspense, dynamic imports

### TypeScript Integration

- **Type Safety**: Component props typing, event typing, children typing
- **Generic Components**: Generic props, type inference, constraint types
- **Type Guards**: Discriminated unions, type narrowing, type predicates
- **Utility Types**: Partial, Pick, Omit, Record for React patterns

### Performance & Optimization

- **React.memo**: Component memoization, comparison functions
- **useCallback & useMemo**: Hook memoization, dependency optimization
- **Virtualization**: List virtualization, windowing techniques
- **Profiling**: React DevTools profiler, performance measurement

### Production Patterns

- **Data Fetching**: Fetch patterns, loading states, error handling, caching
- **Routing**: React Router patterns, nested routes, protected routes
- **Authentication**: Auth patterns, token management, protected components
- **Testing**: Jest, React Testing Library, integration tests
- **Accessibility**: ARIA attributes, keyboard navigation, screen reader support

## What's NOT Covered

We exclude topics that belong in specialized tutorials:

- **Advanced TypeScript**: Deep TypeScript features unrelated to React
- **State Management Libraries**: Redux, MobX, Zustand (covered in separate tutorials)
- **Testing Deep Dives**: Advanced testing strategies (separate testing tutorial)
- **Build Tools**: Webpack, Vite, bundler configuration details
- **Server-Side Rendering**: Next.js, Remix (covered in framework-specific tutorials)
- **React Native**: Mobile development (separate tutorial)

For these topics, see dedicated tutorials and framework documentation.

## Prerequisites

### Required

- **JavaScript fundamentals**: ES6+ syntax, arrow functions, destructuring, spread/rest operators
- **TypeScript basics**: Basic types, interfaces, generics, type inference
- **HTML/CSS**: Basic web fundamentals, DOM concepts
- **Programming experience**: You've built applications before

### Recommended

- **Web APIs**: Fetch API, local storage, event handling
- **Asynchronous JavaScript**: Promises, async/await patterns
- **Modern tooling**: npm/yarn, command-line basics

### Not Required

- **React experience**: This guide assumes you're new to React
- **Framework experience**: Not necessary, but helpful
- **Advanced TypeScript**: We teach TypeScript patterns as needed

## Getting Started

Before starting the examples, ensure you have basic environment setup:

1. **Review Initial Setup**: [Initial Setup](/en/learn/software-engineering/platform-web/tools/fe-react/initial-setup) - Install Node.js, npm, and create React + TypeScript project
2. **Try Quick Start**: [Quick Start](/en/learn/software-engineering/platform-web/tools/fe-react/quick-start) - Build a simple todo app to understand React basics

These tutorials provide hands-on foundation before diving into by-example learning.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to React?** Start with Beginner (Example 1)
- **Framework experience** (Angular, Vue)? Start with Intermediate (Example 21)
- **Building specific feature?** Search for relevant example topic

### 2. Read the Example

Each example has five parts:

- **Explanation** (2-3 sentences): What React concept, why it exists, when to use it
- **Code** (heavily commented): Working TypeScript code showing the pattern
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production context and deeper significance

### 3. Run the Code

Create a test project and run each example:

```bash
npm create vite@latest react-examples -- --template react-ts
cd react-examples
npm install
# Paste example code into src/App.tsx
npm run dev
````

### 4. Modify and Experiment

Change props, add state, break things on purpose. Experimentation builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Ready to Start?

Choose your learning path:

- **Beginner** - Start here if new to React. Build foundation understanding through 25 core examples.
- **Intermediate** - Jump here if you know React basics. Master production patterns through 25 examples.
- **Advanced** - Expert mastery through 25 advanced examples covering performance, scale, and optimization.

Or jump to specific topics by searching for relevant example keywords (hooks, context, forms, testing, performance, etc.).
