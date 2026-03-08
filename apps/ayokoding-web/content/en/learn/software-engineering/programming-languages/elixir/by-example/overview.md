---
title: "Overview"
date: 2025-12-23T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Elixir through 85 annotated code examples covering essential concepts of the language - ideal for experienced developers switching from other languages"
tags: ["elixir", "tutorial", "by-example", "examples", "code-first"]
---

**Want to quickly pick up Elixir through working examples?** This by-example guide teaches essential concepts of Elixir through 85 annotated code examples organized by complexity level.

## What Is By-Example Learning?

By-example learning is an **example-first approach** where you learn through annotated, runnable code rather than narrative explanations. Each example is self-contained, immediately executable in IEx (Elixir's interactive shell), and heavily commented to show:

- **What each line does** - Inline comments explain the purpose and mechanism
- **Expected outputs** - Using `# =>` notation to show results
- **Intermediate values** - Variable states and process flows made visible
- **Key takeaways** - 1-2 sentence summaries of core concepts

This approach is **ideal for experienced developers** (seasonal programmers or software engineers) who are familiar with at least one programming language and want to quickly understand Elixir's syntax, idioms, and unique features through working code.

Unlike narrative tutorials that build understanding through explanation and storytelling, by-example learning lets you **see the code first, run it second, and understand it through direct interaction**. You learn by doing, not by reading about doing.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Beginner<br/>Examples 1-30<br/>Basics"] --> B["Intermediate<br/>Examples 31-60<br/>Practical Patterns"]
    B --> C["Advanced<br/>Examples 61-85<br/>Complex Features"]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
```

Progress from fundamentals through practical patterns to advanced OTP and metaprogramming features. Each level builds on the previous, increasing in sophistication and introducing more Elixir-specific concepts.

## Coverage Philosophy

This by-example guide provides **comprehensive coverage of Elixir** through practical, annotated examples. This tutorial covers core language features comprehensively, not a time estimate—focus is on **outcomes and understanding**, not duration.

### What's Covered

- **Core syntax** - Variables, types, operators, pattern matching
- **Data structures** - Lists, tuples, maps, structs, keyword lists
- **Functions** - Anonymous and named functions, pipe operator, higher-order functions
- **Control flow** - Case, cond, with expressions, guards
- **Pattern matching** - Basic to advanced, guards, pin operator, destructuring
- **Modules and organization** - Modules, protocols, behaviors, import/alias/require
- **Error handling** - Result tuples, try/rescue, raising exceptions
- **Concurrency** - Processes, message passing, spawn, Task, Agent
- **OTP fundamentals** - GenServer, Supervisor, Applications
- **Metaprogramming** - Quote/unquote, macros, AST manipulation
- **Testing** - ExUnit, doctests, test patterns
- **Advanced features** - ETS, Registry, DynamicSupervisor, Erlang interop

### What's NOT Covered

This guide focuses on **learning-oriented examples**, not problem-solving recipes or production deployment. For additional topics:

- **Deep framework knowledge** - Phoenix, Ecto, LiveView covered at introductory level only

The comprehensive coverage goal maintains humility—no tutorial can cover everything. This guide teaches the **core concepts that continue learning beyond this tutorial** through your own exploration and project work.

## How to Use This Guide

1. **Sequential or selective** - Read examples in order for progressive learning, or jump to specific topics when switching from another language
2. **Run everything** - Copy and paste examples into IEx to see outputs yourself. Experimentation solidifies understanding.
3. **Modify and explore** - Change values, add print statements, break things intentionally. Learn through experimentation.
4. **Use as reference** - Bookmark examples for quick lookups when you forget syntax or patterns
5. **Complement with narrative tutorials** - By-example learning is code-first; pair with comprehensive tutorials for deeper explanations

**Best workflow**: Open IEx in one window, this guide in another. Run each example as you read it. When you encounter something unfamiliar, run the example, modify it, see what changes.

## Relationship to Other Tutorials

Understanding where by-example fits in the tutorial ecosystem helps you choose the right learning path:

| Tutorial Type    | Coverage                          | Approach                       | Target Audience         | When to Use                                          |
| ---------------- | --------------------------------- | ------------------------------ | ----------------------- | ---------------------------------------------------- |
| **By Example**   | Comprehensive through 85 examples | Code-first, annotated examples | Experienced developers  | Quick language pickup, reference, language switching |
| **Quick Start**  | 5-30% touchpoints                 | Hands-on project               | Newcomers to Elixir     | First taste, decide if worth learning                |
| **Beginner**     | 0-60% comprehensive               | Narrative, explanatory         | Complete beginners      | Deep understanding, first programming language       |
| **Intermediate** | 60-85%                            | Practical applications         | Past basics             | Production patterns, frameworks                      |
| **Advanced**     | advanced topics                   | Complex systems                | Experienced Elixir devs | BEAM internals, distributed systems                  |
| **Cookbook**     | Problem-specific                  | Recipe-based                   | All levels              | Solve specific problems                              |

**By Example vs. Quick Start**: By Example provides comprehensive coverage through examples vs. Quick Start's 5-30% through a single project. By Example is code-first reference; Quick Start is hands-on introduction.

**By Example vs. Beginner Tutorial**: By Example is code-first for experienced developers; Beginner Tutorial is narrative-first for complete beginners. By Example shows patterns; Beginner Tutorial explains concepts.

**By Example vs. Cookbook**: By Example is learning-oriented (understand concepts); Cookbook is problem-solving oriented (fix specific issues). By Example teaches patterns; Cookbook provides solutions.

## Prerequisites

**Required**:

- Experience with at least one programming language
- Ability to run code in IEx (Elixir's interactive shell)

**Recommended (helpful but not required)**:

- Familiarity with functional programming concepts (immutability, pure functions)
- Experience with REPL-driven development (Python, Ruby, JavaScript)
- Understanding of concurrent programming basics

**No prior Elixir experience required** - This guide assumes you're new to Elixir but experienced with programming in general. You should be comfortable reading code, understanding basic programming concepts (variables, functions, loops), and learning through hands-on experimentation.

## Structure of Each Example

Every example follows this consistent format:

````markdown
### Example N: Concept Name

Brief explanation of the concept in 2-3 sentences. Explains **what** the concept is and **why** it matters.

[OPTIONAL: Mermaid diagram when concept relationships need visualization]

**Code**:

```elixir
defmodule Example do
  # Inline comment for each significant line
  def function(arg) do
    result = operation(arg) # => expected_output_value
    # Intermediate values shown in comments
    transformed = transform(result) # => intermediate_value
    transformed # => final_return_value
  end
end

Example.function(input) # => output
```

**Key Takeaway**: 1-2 sentence summary highlighting the most important insight or pattern from this example.
````

The **brief explanation** provides context. The **code** is heavily annotated with inline comments and `# =>` output notation. The **key takeaway** distills the concept to its essence.

Mermaid diagrams appear when **visual representation clarifies concept relationships** - showing data flow, process hierarchies, or abstract structures. Not every example needs a diagram; they're used strategically to enhance understanding.

## Learning Strategies

### For Python/Ruby Developers

You're used to dynamic typing and OOP. Elixir will feel familiar yet fundamentally different:

- **Immutable data**: No variable mutation, create new values instead
- **Pattern matching**: Destructure data directly in function heads and case statements
- **No classes**: Use modules, functions, and data instead of objects

Focus on Examples 1-15 (immutability and pattern matching) and Examples 20-30 (functions and modules) to build functional intuition.

### For JavaScript/Node.js Developers

You understand async programming and callbacks. Elixir takes a different approach:

- **Processes instead of callbacks**: Lightweight processes replace event loops
- **Message passing**: Processes communicate via send/receive, not shared state
- **Supervision trees**: Let processes crash and restart instead of catching errors

Focus on Examples 45-55 (processes and message passing) and Examples 65-75 (GenServer and Supervisor) to understand the actor model.

### For Java/C# Developers

You're used to OOP and threads. Elixir replaces both:

- **Functional over OOP**: Data and functions separate, no methods on objects
- **Lightweight processes**: Spawn millions of processes, not limited by OS threads
- **Fault tolerance**: Let it crash philosophy, supervisors handle recovery

Focus on Examples 60-70 (OTP patterns) and Examples 75-85 (fault tolerance) to leverage your concurrency knowledge.

### For Haskell/ML Developers

You know functional programming. Elixir is practical FP with less type rigor:

- **Dynamic typing**: No type system, but pattern matching catches errors at runtime
- **Pragmatic purity**: Side effects allowed, but immutability enforced
- **BEAM runtime**: Actor model and hot code reloading for production systems

Focus on Examples 70-80 (metaprogramming and macros) and Examples 80-90 (advanced patterns) to see Elixir's unique features.

## Code-First Philosophy

This tutorial prioritizes working code over theoretical discussion:

- **No lengthy prose**: Concepts are demonstrated, not explained at length
- **Runnable examples**: Every example runs in IEx or as scripts
- **Learn by doing**: Understanding comes from running and modifying code
- **Pattern recognition**: See the same patterns in different contexts across 85 examples

If you prefer narrative explanations. By-example learning works best when you learn through experimentation.

## Ready to Start?

Jump into the beginner examples to start learning Elixir through code:

- [Beginner Examples (1-30)](/en/learn/software-engineering/programming-languages/elixir/by-example/beginner) - Basic syntax, pattern matching, data structures, functions
- [Intermediate Examples (31-60)](/en/learn/software-engineering/programming-languages/elixir/by-example/intermediate) - Advanced patterns, processes, testing, error handling
- [Advanced Examples (61-85)](/en/learn/software-engineering/programming-languages/elixir/by-example/advanced) - GenServer, Supervisor, metaprogramming, OTP

Each example is self-contained and runnable. Start with Example 1, or jump to topics that interest you most.
