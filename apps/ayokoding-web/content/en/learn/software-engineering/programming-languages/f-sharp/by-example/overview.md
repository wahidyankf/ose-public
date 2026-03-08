---
title: "Overview"
date: 2026-02-02T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn F# through 85+ annotated code examples covering 95% of functional programming - ideal for developers switching to F#"
tags: ["f-sharp", "fsharp", "dotnet", "tutorial", "by-example", "examples", "code-first", "functional"]
---

**Learn F# by reading functional code.** This by-example tutorial teaches F# through 85 heavily annotated, self-contained code examples achieving 95% language coverage. If you're an experienced programmer who prefers learning by reading working code rather than narrative explanations, this is your functional programming path.

## What is By Example?

By Example is a **functional code-first learning approach** designed for experienced developers switching to F# from object-oriented or imperative languages. Instead of lengthy explanations followed by code snippets, you'll see complete, runnable programs with inline annotations explaining what each line does, why immutability matters, and how functional patterns work.

**Target audience**: Seasonal programmers, software engineers, and developers with experience in Python, C#, Java, JavaScript, or other languages who want to learn functional programming with F# efficiently.

## How This Tutorial Works

### Structure

- **[Beginner](/en/learn/software-engineering/programming-languages/f-sharp/by-example/beginner)** (Examples 1-30): Fundamentals and functional core - 0-40% coverage
- **[Intermediate](/en/learn/software-engineering/programming-languages/f-sharp/by-example/intermediate)** (Examples 31-60): Production patterns and advanced features - 40-75% coverage
- **[Advanced](/en/learn/software-engineering/programming-languages/f-sharp/by-example/advanced)** (Examples 61-85): Expert mastery and optimization - 75-95% coverage

### Example Format

Each example follows a five-part structure:

1. **Brief explanation** (2-3 sentences) - What is this concept and why does it matter for functional programming?
2. **Diagram** (when appropriate) - Visual representation of data flow, transformations, or architecture
3. **Heavily annotated code** - Complete, runnable program with inline `// =>` annotations
4. **Key takeaway** (1-2 sentences) - The essential functional insight distilled
5. **Why it matters** (50-100 words) - Production relevance and functional programming benefits

### Example: Annotation Style

```fsharp
let numbers = [1; 2; 3; 4; 5]              // => numbers is int list (immutable)
                                           // => List is immutable linked list

let doubled =
    numbers                                // => Start with list
    |> List.map (fun n -> n * 2)           // => Transform each element
                                           // => Returns new list [2; 4; 6; 8; 10]
                                           // => Original list unchanged

let sum =
    doubled                                // => [2; 4; 6; 8; 10]
    |> List.reduce (+)                     // => Reduce with + operator
                                           // => sum is 30 (type: int inferred)
                                           // => doubled and numbers unchanged
```

## What You'll Learn

### Coverage: 95% of F# for Production Work

**Included**:

- Core functional syntax (immutability, functions, composition)
- Type system (type inference, records, discriminated unions)
- Pattern matching (exhaustive matching, active patterns)
- Collection operations (List, Seq, Array modules)
- Piping and composition (|>, >>, function chaining)
- Option and Result types (safe error handling)
- Computation expressions (async, result, option workflows)
- Railway-oriented programming (error handling pipelines)
- Type providers (JSON, SQL, CSV)
- Units of measure (type-safe calculations)
- Async programming (async workflows, parallel operations)
- Object programming (classes, interfaces, when needed)
- Testing (Expecto, FsUnit)
- Advanced types (GADTs, phantom types)
- Performance (tail recursion, value types)

**Excluded (the 5% edge cases)**:

- Rarely-used legacy features (.NET Framework specifics)
- Deep quotation internals
- Platform-specific advanced features
- Framework source implementation details

## Self-Contained Examples

**Every example is copy-paste-runnable.** Each example includes:

- Complete module definitions
- All necessary type definitions
- Helper functions defined inline
- No references to previous examples (you can start anywhere)

**Example independence**: You can jump to Example 42, copy the code, run it with `dotnet fsi`, and understand the functional pattern without reading Examples 1-41.

## Why Functional Code-First?

Traditional tutorials explain concepts, then show code. By Example inverts this with functional emphasis:

1. **See the functional code first** - Complete, working program
2. **Run it in F# Interactive** - Immediate REPL feedback
3. **Read annotations** - Understand immutability, composition, and functional flow
4. **Absorb the functional pattern** - Internalize through direct interaction

**Benefits**:

- **Faster learning** - No walls of text before seeing actual functional code
- **Immediate verification** - Run code in FSI to confirm understanding
- **Reference-friendly** - Come back later to find specific functional patterns
- **Production-focused** - Examples use real-world functional patterns, not toy code
- **REPL-driven** - Leverage F# Interactive for exploration

## How to Use This Tutorial

### If You're New to Programming

Start with [Quick Start](/en/learn/software-engineering/programming-languages/f-sharp/quick-start) first, then return to By Example for comprehensive functional coverage.

### If You Know C# or Java

Jump straight into **Beginner** examples. You'll see familiar .NET concepts transformed into functional patterns with immutability, pattern matching, and composition.

### If You Know Functional Programming

Start with **Intermediate** examples to see F#-specific features like computation expressions, type providers, and railway-oriented programming.

### If You Know Some F# (Intermediate)

Start with **Advanced** based on your comfort level. Each example is self-contained, so you won't get lost.

### As a Reference

Use the example index to find specific functional topics (e.g., "How do I use computation expressions?" → Example 47).

## Comparison to Object-Oriented Tutorials

| Aspect               | By Example (F#)                     | OOP Tutorial (C#)                   |
| -------------------- | ----------------------------------- | ----------------------------------- |
| **Approach**         | Functional-first (immutability)     | Object-oriented (mutability)        |
| **Default Style**    | Immutable, pure functions           | Mutable state, methods              |
| **Error Handling**   | Option, Result types                | Exceptions, null checks             |
| **Composition**      | Piping, function composition        | Method chaining, inheritance        |
| **Learning Curve**   | Steeper (new paradigm)              | Familiar (mainstream OOP)           |
| **Use as Reference** | Excellent (self-contained examples) | Excellent (self-contained examples) |

**Both paradigms are valid.** F# excels at correctness, domain modeling, and parallel processing. Choose based on your problem domain.

## Diagrams and Visualizations

Approximately 40% of examples include Mermaid diagrams visualizing:

- Data transformation pipelines (map, filter, fold)
- Pattern matching flow and exhaustiveness
- Railway-oriented programming (success/failure tracks)
- Async workflow execution
- Type provider data flow
- Computation expression builders
- Recursive data structures

All diagrams use a color-blind friendly palette (Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161) meeting WCAG AA accessibility standards.

## Prerequisites

- **Programming experience** - Familiarity with at least one programming language (Python, C#, Java, JavaScript, etc.)
- **F# environment set up** - .NET SDK installed and verified (see [Initial Setup](/en/learn/software-engineering/programming-languages/f-sharp/initial-setup))
- **Code editor ready** - VS Code with Ionide extension
- **F# Interactive running** - Comfort using `dotnet fsi` or FSI panel in VS Code

**No prior F# knowledge required** - Examples start from functional fundamentals.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Initial Setup<br/>0-5%"]
    B["Quick Start<br/>5-30%"]
    C["By Example: Beginner<br/>0-40%<br/>Examples 1-30"]
    D["By Example: Intermediate<br/>40-75%<br/>Examples 31-60"]
    E["By Example: Advanced<br/>75-95%<br/>Examples 61-85"]

    A --> B
    B --> C
    C --> D
    D --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
```

## What's Next?

Ready to start learning functional programming? Choose your entry point:

- **New to F#?** → [Beginner Examples (1-30)](/en/learn/software-engineering/programming-languages/f-sharp/by-example/beginner)
- **Know the basics?** → [Intermediate Examples (31-60)](/en/learn/software-engineering/programming-languages/f-sharp/by-example/intermediate)
- **Experienced with F#?** → [Advanced Examples (61-85)](/en/learn/software-engineering/programming-languages/f-sharp/by-example/advanced)

## Learning Progression

Coverage advances progressively through three stages, each building on functional fundamentals:

- **Beginner**: 0-40% coverage through 30 examples (immutability, composition, pattern matching)
- **Intermediate**: 40-75% coverage through 30 examples (computation expressions, type providers)
- **Advanced**: 75-95% coverage through 25 examples (advanced types, performance optimization)

Work at your own pace. Each example is self-contained, so you can explore topics in any order based on your current needs.

## Key Principles

1. **Every example is runnable in FSI** - Copy, paste, run in REPL, verify
2. **Annotations explain functional WHY** - Understand immutability, composition, type safety
3. **Self-contained is non-negotiable** - No hunting for code in other examples
4. **Production patterns, not toys** - Real-world functional code you'll actually write
5. **Modern F# features** - F# 8, .NET 8, contemporary functional idioms

## Functional Programming Benefits Highlighted

Throughout examples, you'll see how functional programming provides:

- **Correctness** - Type system catches errors at compile time
- **Immutability** - Eliminates race conditions and side effects
- **Composability** - Build complex operations from simple functions
- **Testability** - Pure functions are trivial to test
- **Conciseness** - Express complex logic in fewer lines
- **Domain modeling** - Types represent business rules exactly

## Feedback and Improvements

Found an error? See a better functional way to explain something? Examples are continuously improved based on learner feedback.

**Let's start functional coding!** Choose your level and dive into the examples.
