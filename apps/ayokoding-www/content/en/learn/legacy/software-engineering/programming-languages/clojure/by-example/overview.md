---
title: "Overview"
date: 2025-12-30T01:33:16+07:00
draft: false
weight: 10000000
description: "Learn Clojure through 80+ annotated code examples covering 95% of the language - ideal for experienced developers"
tags: ["clojure", "tutorial", "by-example", "examples", "code-first", "functional-programming", "lisp", "jvm"]
---

## What is By-Example Learning?

This tutorial teaches Clojure through **80 heavily annotated, runnable code examples** that cover 95% of the language and ecosystem features you'll use in production. Each example is self-contained and can be run directly in the REPL or as a script.

## Who This Is For

**Experienced developers** switching to Clojure who prefer:

- **Code-first learning**: See working examples before reading explanations
- **Comprehensive coverage**: 95% of language features, not just basics
- **Self-contained examples**: Copy-paste-run without cross-referencing
- **Production patterns**: Real-world usage, not toy examples

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    accTitle: Learning Path
    accDescr: Graph with 3 nodes and 2 connections. Nodes: Beginner Examples 1-27 Clojure Fundamentals, Intermediate Examples 28-54 Production Patterns, Advanced Examples 55-80 Expert Mastery. Connections: Beginner Examples 1-27 Clojure Fundamentals to Intermediate Examples 28-54 Production Patterns, Intermediate Examples 28-54 Production Patterns to Advanced Examples 55-80 Expert Mastery.
    A["Beginner<br/>Examples 1-27<br/>Clojure Fundamentals"] --> B["Intermediate<br/>Examples 28-54<br/>Production Patterns"]
    B --> C["Advanced<br/>Examples 55-80<br/>Expert Mastery"]

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class B pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class C pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Progress from Lisp fundamentals through production patterns to expert mastery. Each level builds on the previous, with immutability and functional thinking as the critical foundation.

## Coverage Philosophy

This tutorial provides **95% coverage of Clojure** through practical, annotated examples. The 95% figure represents the depth and breadth of concepts covered, not a time estimate—focus is on **outcomes and understanding**, not duration.

### What's Covered

- **Core syntax** - S-expressions, special forms, data literals
- **Immutable data structures** - Lists, vectors, maps, sets, keywords, symbols
- **Functions** - defn, fn, higher-order functions, closures
- **Sequence abstraction** - map, filter, reduce, lazy sequences
- **State management** - Atoms, refs, agents, Software Transactional Memory
- **Concurrency** - core.async channels, futures, promises
- **Macros** - quote/unquote, macro definitions, code generation
- **Protocols and multimethods** - Polymorphism without classes
- **clojure.spec** - Runtime validation and generative testing
- **Java interop** - Calling Java, implementing interfaces
- **Testing** - clojure.test, property-based testing

### What's NOT Covered

This guide focuses on **learning-oriented examples**, not problem-solving recipes or production deployment. For additional topics:

- **ClojureScript specifics** - Browser/Node.js runtime (separate tutorial)
- **Compiler internals** - Reader, analyzer, bytecode generation
- **Rare macros and special forms** - Obscure language corners
- **Platform-specific edge cases** - JVM version quirks
- **Specialized libraries** - Datascript, Datomic internals

The 95% coverage goal maintains humility—no tutorial can cover everything. This guide teaches the **core concepts that unlock the remaining 5%** through your own exploration and project work.

## Tutorial Structure

**80 examples across three levels**:

- **Beginner** (Examples 1-27, 0-40% coverage): Clojure fundamentals - immutable data, functions, sequences, REPL workflow
- **Intermediate** (Examples 28-54, 40-75% coverage): Production patterns - multimethods, protocols, macros, state management, core.async
- **Advanced** (Examples 55-80, 75-95% coverage): Expert mastery - advanced macros, transducers, reducers, performance, Java interop patterns

## How to Use This Tutorial

### Prerequisites

**Install Clojure**:

```bash
# macOS (via Homebrew)
brew install clojure/tools/clojure

# Linux (official installer)
curl -O https://download.clojure.org/install/linux-install-1.11.1.1435.sh
chmod +x linux-install-1.11.1.1435.sh
sudo ./linux-install-1.11.1.1435.sh

# Windows (via Scoop)
scoop install clojure
```

**Verify installation**:

```bash
clj -version
# => Clojure CLI version 1.11.1.1435
```

### Running Examples

**Method 1: REPL (Interactive)**

```bash
# Start REPL
clj

# Copy-paste example code
(defn greet [name]
  (str "Hello, " name "!"))

(greet "World")
;; => "Hello, World!"
```

**Method 2: Script (File)**

```bash
# Save example as example.clj
# Run directly
clj -M example.clj
```

**Method 3: deps.edn Project**

```bash
# Create project structure
mkdir -p myproject/src
cd myproject

# Create deps.edn
cat > deps.edn << 'EOF'
{:deps {org.clojure/clojure {:mvn/version "1.11.1"}}}
EOF

# Save example in src/example.clj
# Run with namespace
clj -M -m example
```

### Understanding Annotations

Examples use `;; =>` notation to show return values and side effects:

```clojure
(def x 10)                          ;; => #'user/x (var binding created)
(+ x 5)                             ;; => 15 (addition result)
(println "Hello")                   ;; => nil (prints "Hello" to stdout)
                                    ;; => Output: Hello
```

**Annotation types**:

- `;; => value` - Expression return value
- `;; => Output: text` - Stdout/stderr output
- `;; => #'namespace/name` - Var definition
- `;; => type` - Value type information
- `;; => state` - State changes (atoms, refs)

## Coverage Target: 95%

**What 95% means for Clojure**:

✅ **Included** (production essentials):

- Core syntax and special forms
- Standard library (clojure.core, clojure.string, clojure.set)
- Immutable data structures and persistent collections
- Functions, closures, higher-order functions
- Multimethods and protocols
- Macros and code generation
- Concurrency primitives (atoms, refs, agents, STM)
- core.async for asynchronous programming
- clojure.spec for validation
- Java interop patterns
- Testing with clojure.test
- Project structure and dependency management
- Performance optimization
- Common libraries (component, mount, ring, compojure)

❌ **Excluded** (rare/specialized, the 5%):

- ClojureScript specifics (different tutorial)
- Compiler internals and implementation details
- Rare macros and special forms
- Platform-specific edge cases
- Deprecated features
- Specialized libraries (datascript, datomic internals)

## Five-Part Structure

Each example follows a five-part format:

### 1. Brief Explanation (2-3 sentences)

Context and motivation: What is this concept? Why does it matter?

### 2. Mermaid Diagram (30-50% of examples)

Visual representation of data flow, state transitions, or concurrency patterns.

### 3. Heavily Annotated Code

Every significant line has an inline comment with `;; =>` notation showing values and states.

### 4. Key Takeaway (1-2 sentences)

Core insight distilled: When to use this pattern, common pitfalls to avoid.

## Learning Strategies

### For Java Developers

You're used to OOP and static typing. Clojure runs on JVM but thinks differently:

- **Data over objects**: Maps, vectors, and sets replace classes and objects
- **Functions over methods**: Pure functions transform data, no hidden state
- **REPL-driven development**: Interactive coding replaces compile-run-debug cycles

Focus on Examples 1-15 (data structures) and Examples 28-35 (Java interop) to bridge your JVM knowledge.

### For JavaScript Developers

You understand dynamic typing and functional patterns. Clojure deepens functional programming:

- **True immutability**: Data structures never change, persistent data structures share structure
- **Lisp syntax**: Prefix notation `(+ 1 2)` instead of infix `1 + 2`
- **Macros**: Code that writes code, extending the language itself

Focus on Examples 5-15 (core functions) and Examples 55-65 (macros) to leverage your JS functional knowledge.

### For Python Developers

You know dynamic typing and readable syntax. Clojure trades readability for power:

- **Parentheses everywhere**: Lisp syntax feels strange at first, becomes natural
- **No statements**: Everything is an expression that returns a value
- **Concurrency primitives**: Atoms, refs, and agents for managing shared state

Focus on Examples 1-10 (syntax basics) and Examples 40-50 (state management) to adjust your mental model.

### For Haskell/Scala Developers

You know functional programming. Clojure is practical FP on the JVM:

- **Dynamic typing**: No type system, but clojure.spec for runtime validation
- **Pragmatic purity**: Side effects allowed, but immutability enforced by default
- **Lisp heritage**: Homoiconicity enables powerful metaprogramming

Focus on Examples 45-55 (protocols and multimethods) and Examples 60-70 (advanced macros) to see Clojure's unique features.

## Code-First Philosophy

This tutorial prioritizes working code over theoretical discussion:

- **No lengthy prose**: Concepts are demonstrated, not explained at length
- **Runnable examples**: Every example runs in the REPL or as scripts
- **Learn by doing**: Understanding comes from running and modifying code
- **Pattern recognition**: See the same patterns in different contexts across 80 examples

If you prefer narrative explanations, the By-Concept tutorial path provides deeper pedagogical coverage. By-example learning works best when you learn through experimentation and direct code exploration.

## Example Format

Here's what every example looks like:

### Example 5: Destructuring Maps

Clojure's destructuring syntax allows you to extract values from maps and sequences directly in function parameters or let bindings. This eliminates boilerplate and makes code more readable, especially when working with nested data structures common in Clojure applications.

```mermaid
%% Map destructuring flow
graph TD
    accTitle: Example 5: Destructuring Maps
    accDescr: Graph with 4 nodes and 3 connections. Nodes: Map: :name Alice :age 30, Destructure, name → Alice, age → 30. Connections: Map: :name Alice :age 30 to Destructure, Destructure to name → Alice, Destructure to age → 30.
    A["Map: {:name<br/>\"Alice\" :age 30}"] --> B[Destructure]
    B --> C["name → \"Alice\""]
    B --> D["age → 30"]

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class B pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class C pal-029E73
    class D pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```clojure
;; Map destructuring in let binding
(let [{:keys [name age]} {:name "Alice" :age 30}]
                                    ;; => name is "Alice", age is 30
  (println name "is" age "years old"))
                                    ;; => nil
                                    ;; => Output: Alice is 30 years old

;; Function parameter destructuring
(defn greet-person [{:keys [name age]}]
                                    ;; => Destructures map argument
  (str "Hello " name ", you are " age " years old"))
                                    ;; => #'user/greet-person

(greet-person {:name "Bob" :age 25})
                                    ;; => "Hello Bob, you are 25 years old"

;; Destructuring with defaults
(defn greet-with-default [{:keys [name age] :or {age 18}}]
                                    ;; => age defaults to 18 if missing
  (str name " is " age))            ;; => Returns formatted string

(greet-with-default {:name "Charlie"})
                                    ;; => "Charlie is 18" (default used)

(greet-with-default {:name "Diana" :age 35})
                                    ;; => "Diana is 35" (provided value used)
```

**Key Takeaway**: Use destructuring with `:keys`, `:strs`, or `:syms` to extract map values directly in function parameters or let bindings, and use `:or` to provide default values for missing keys.

## Navigation

- **[Beginner](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner)** - Examples 1-27 (fundamentals)
- **[Intermediate](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate)** - Examples 28-54 (production patterns)
- **[Advanced](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced)** - Examples 55-80 (expert mastery)

## Next Steps

Start with [Beginner](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner) if you're new to Clojure, or jump to [Intermediate](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate) if you already know the basics. Progress through all three levels to achieve 95% Clojure coverage.

## Examples by Level

### Beginner (Examples 1–27)

- [Example 1: Hello World and Basic Values](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-1-hello-world-and-basic-values)
- [Example 2: Lists and Vectors](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-2-lists-and-vectors)
- [Example 3: Maps and Sets](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-3-maps-and-sets)
- [Example 4: Defining Functions](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-4-defining-functions)
- [Example 5: Let Bindings](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-5-let-bindings)
- [Example 6: Destructuring Vectors](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-6-destructuring-vectors)
- [Example 7: Destructuring Maps](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-7-destructuring-maps)
- [Example 8: Conditionals (if, when, cond)](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-8-conditionals-if-when-cond)
- [Example 9: Recursion and loop/recur](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-9-recursion-and-looprecur)
- [Example 10: Sequences and Lazy Evaluation](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-10-sequences-and-lazy-evaluation)
- [Example 11: Map, Filter, and Reduce](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-11-map-filter-and-reduce)
- [Example 12: Threading Macros (-> and ->>)](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-12-threading-macros---and--)
- [Example 13: Namespaces and require](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-13-namespaces-and-require)
- [Example 14: Atoms (Synchronous State)](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-14-atoms-synchronous-state)
- [Example 15: Java Interop Basics](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-15-java-interop-basics)
- [Example 16: Predicates and Type Checking](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-16-predicates-and-type-checking)
- [Example 17: String Operations](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-17-string-operations)
- [Example 18: Regular Expressions](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-18-regular-expressions)
- [Example 19: Anonymous Functions](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-19-anonymous-functions)
- [Example 20: Partial Application and Comp](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-20-partial-application-and-comp)
- [Example 21: Apply and Variadic Functions](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-21-apply-and-variadic-functions)
- [Example 22: Update and Update-in](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-22-update-and-update-in)
- [Example 23: Get and Get-in](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-23-get-and-get-in)
- [Example 24: Assoc and Assoc-in](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-24-assoc-and-assoc-in)
- [Example 25: Merge and Merge-with](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-25-merge-and-merge-with)
- [Example 26: Filter and Remove](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-26-filter-and-remove)
- [Example 27: Take, Drop, and Partition](/en/learn/software-engineering/programming-languages/clojure/by-example/beginner#example-27-take-drop-and-partition)

### Intermediate (Examples 28–54)

- [Example 28: Multimethods](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-28-multimethods)
- [Example 29: Protocols](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-29-protocols)
- [Example 30: Records and Types](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-30-records-and-types)
- [Example 31: Basic Macros](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-31-basic-macros)
- [Example 32: Macro Hygiene and Gensym](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-32-macro-hygiene-and-gensym)
- [Example 33: Atoms for Synchronous State](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-33-atoms-for-synchronous-state)
- [Example 34: Refs and Software Transactional Memory](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-34-refs-and-software-transactional-memory)
- [Example 35: Agents for Asynchronous State](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-35-agents-for-asynchronous-state)
- [Example 36: core.async Channels](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-36-coreasync-channels)
- [Example 37: core.async go Blocks](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-37-coreasync-go-blocks)
- [Example 38: clojure.spec Validation](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-38-clojurespec-validation)
- [Example 39: Function Specs](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-39-function-specs)
- [Example 40: Transducers](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-40-transducers)
- [Example 41: Exception Handling](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-41-exception-handling)
- [Example 42: Lazy Sequences](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-42-lazy-sequences)
- [Example 43: Testing with clojure.test](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-43-testing-with-clojuretest)
- [Example 44: deps.edn Dependencies](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-44-depsedn-dependencies)
- [Example 45: Namespace Organization](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-45-namespace-organization)
- [Example 46: Metadata](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-46-metadata)
- [Example 47: Destructuring Advanced](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-47-destructuring-advanced)
- [Example 48: Java Interop Advanced](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-48-java-interop-advanced)
- [Example 49: Reducers](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-49-reducers)
- [Example 50: Futures and Promises](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-50-futures-and-promises)
- [Example 51: Delays](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-51-delays)
- [Example 52: File I/O](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-52-file-io)
- [Example 53: Atoms Advanced Patterns](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-53-atoms-advanced-patterns)
- [Example 54: Set Operations](/en/learn/software-engineering/programming-languages/clojure/by-example/intermediate#example-54-set-operations)

### Advanced (Examples 55–80)

- [Example 55: Advanced Macros - Code Walking](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-55-advanced-macros---code-walking)
- [Example 56: Macro Debugging with macroexpand](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-56-macro-debugging-with-macroexpand)
- [Example 57: Reader Conditionals for Multiplatform](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-57-reader-conditionals-for-multiplatform)
- [Example 58: Type Hints for Performance](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-58-type-hints-for-performance)
- [Example 59: Stateful Transducers](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-59-stateful-transducers)
- [Example 60: Reducers with Fork-Join](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-60-reducers-with-fork-join)
- [Example 61: Protocols for Polymorphism](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-61-protocols-for-polymorphism)
- [Example 62: Multimethods with Hierarchies](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-62-multimethods-with-hierarchies)
- [Example 63: Component Architecture](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-63-component-architecture)
- [Example 64: Mount for State Management](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-64-mount-for-state-management)
- [Example 65: Ring Middleware](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-65-ring-middleware)
- [Example 66: Compojure Routing](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-66-compojure-routing)
- [Example 67: HTTP Client with clj-http](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-67-http-client-with-clj-http)
- [Example 68: Database Access with next.jdbc](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-68-database-access-with-nextjdbc)
- [Example 69: Spec Generative Testing](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-69-spec-generative-testing)
- [Example 70: test.check for Property Testing](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-70-testcheck-for-property-testing)
- [Example 71: Performance Profiling](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-71-performance-profiling)
- [Example 72: Memoization for Performance](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-72-memoization-for-performance)
- [Example 73: AOT Compilation](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-73-aot-compilation)
- [Example 74: Logging with timbre](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-74-logging-with-timbre)
- [Example 75: JSON and EDN Parsing](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-75-json-and-edn-parsing)
- [Example 76: Building Uberjars](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-76-building-uberjars)
- [Example 77: Environment Configuration](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-77-environment-configuration)
- [Example 78: Production Deployment Checklist](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-78-production-deployment-checklist)
- [Example 79: ClojureScript Basics](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-79-clojurescript-basics)
- [Example 80: Best Practices - Immutability and Pure Functions](/en/learn/software-engineering/programming-languages/clojure/by-example/advanced#example-80-best-practices---immutability-and-pure-functions)
