---
title: "Overview"
date: 2025-12-30T00:31:19+07:00
draft: false
weight: 10000000
description: "Learn Python through 80 annotated code examples covering essential concepts of the language - ideal for experienced developers"
tags: ["python", "tutorial", "by-example", "examples", "code-first"]
---

## What is Python by Example?

Python by Example is a code-first tutorial series designed for **experienced developers** switching to Python or deepening their Python expertise. Instead of narrative explanations, you learn through **80 self-contained, heavily annotated, runnable examples** that demonstrate Python concepts in action.

## Why By-Example?

Traditional tutorials explain concepts with prose, then show code. By-example **inverts this approach**:

1. **Show the code first** - Working, production-relevant examples
2. **Run it second** - Every example is copy-paste-runnable
3. **Understand through interaction** - Inline annotations reveal behavior
4. **Build pattern recognition** - 80 examples create comprehensive mental models

This approach works best for developers who **prefer learning through working code** rather than reading documentation.

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    accTitle: Learning Path
    accDescr: Graph with 3 nodes and 2 connections. Nodes: Beginner Examples 1-27 Python Fundamentals, Intermediate Examples 28-54 Production Patterns, Advanced Examples 55-80 Expert Mastery. Connections: Beginner Examples 1-27 Python Fundamentals to Intermediate Examples 28-54 Production Patterns, Intermediate Examples 28-54 Production Patterns to Advanced Examples 55-80 Expert Mastery.
    A["Beginner<br/>Examples 1-27<br/>Python Fundamentals"] --> B["Intermediate<br/>Examples 28-54<br/>Production Patterns"]
    B --> C["Advanced<br/>Examples 55-80<br/>Expert Mastery"]

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class B pal-DE8F05
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class C pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Progress from fundamentals through production patterns to expert mastery. Each level builds on the previous, increasing in sophistication and introducing more Pythonic idioms.

## Coverage Philosophy

This tutorial provides **comprehensive coverage of Python** through practical, annotated examples. This tutorial covers core language features comprehensively, not a time estimate—focus is on **outcomes and understanding**, not duration.

### What's Covered

**Core Topics Covered**:

- Core syntax and semantics (variables, operators, control flow)
- Built-in types and data structures (lists, dicts, sets, tuples)
- Functions, lambdas, and closures
- Object-oriented programming (classes, inheritance, magic methods)
- Modules and packages
- File I/O and context managers
- Exception handling and custom exceptions
- Decorators and descriptors
- Comprehensions and generators
- Itertools and functools
- Type hints and protocols
- Asyncio and concurrency
- Testing with pytest
- Standard library essentials (pathlib, collections, datetime, json)
- Virtual environments and packaging

### What's NOT Covered

This guide focuses on **learning-oriented examples**, not problem-solving recipes or production deployment. For additional topics:

- **CPython internals and C extensions** - Implementation details beyond the language
- **Rare standard library modules** - aifc, sunau, uu, and other niche modules
- **Platform-specific features** - ctypes internals, Windows registry
- **Deprecated features** - imp module, old-style classes
- **Framework internals** - Django ORM source, Flask internals (covered at introductory level only)

The comprehensive coverage goal maintains humility—no tutorial can cover everything. This guide teaches the **core concepts that continue learning beyond this tutorial** through your own exploration and project work.

## Tutorial Structure

**80 examples across three levels**:

- **Beginner** (Examples 1-27, fundamental concepts): Python fundamentals - variables, types, control flow, functions, basic data structures, simple OOP
- **Intermediate** (Examples 28-54, production patterns): Production patterns - modules, file I/O, exceptions, decorators, comprehensions, iterators, testing
- **Advanced** (Examples 55-80): Advanced mastery: Expert mastery - metaclasses, asyncio, context managers, generators, protocols, type hints, packaging, performance

Coverage percentages indicate **depth and breadth** of Python knowledge, not time investment.

## Example Format

Every example follows a **five-part format**:

### 1. Brief Explanation (2-3 sentences)

Context and motivation for the concept:

```markdown
### Example 15: List Comprehensions

List comprehensions provide a concise syntax for creating lists based on existing sequences, combining mapping and filtering in a single expression. They are more readable and often faster than equivalent for-loop constructions, making them a Pythonic way to transform data.
```

### 2. Mermaid Diagram (when appropriate)

Visual representation for non-obvious concepts (30-50% of examples):

```mermaid
%% List comprehension flow
graph TD
    accTitle: 2. Mermaid Diagram
    accDescr: Graph with 6 nodes and 7 connections. Nodes: Input List, For Each Element, Filter Condition?, Transform Element, Add to Result, Output List. Connections: Input List to For Each Element, For Each Element to Filter Condition?, Filter Condition? to Transform Element (True), Filter Condition? to For Each Element (False), Transform Element to Add to Result, Add to Result to For Each Element, For Each Element to Output List.
    A[Input List] --> B[For Each Element]
    B --> C{Filter Condition?}
    C -->|True| D[Transform Element]
    C -->|False| B
    D --> E[Add to Result]
    E --> B
    B --> F[Output List]

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A pal-0173B2
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
    class B pal-DE8F05
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
    class C pal-CC78BC
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
    class D pal-029E73
    class E pal-029E73
    class F pal-0173B2
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

### 3. Heavily Annotated Code

Self-contained, runnable code with `# =>` annotations showing outputs and states:

```python
# Original list
numbers = [1, 2, 3, 4, 5]        # => numbers is [1, 2, 3, 4, 5]

# List comprehension: squares of even numbers
squares = [x**2 for x in numbers if x % 2 == 0]
                                  # => squares is [4, 16] (2^2=4, 4^2=16)

# Equivalent for-loop (for comparison)
squares_loop = []                # => squares_loop is []
for x in numbers:                # => Iterates: 1, 2, 3, 4, 5
    if x % 2 == 0:               # => True for 2, 4
        squares_loop.append(x**2)# => Appends 4, then 16
                                  # => squares_loop is [4, 16]

print(squares)                   # => Output: [4, 16]
print(squares == squares_loop)   # => Output: True
```

### 4. Key Takeaway (1-2 sentences)

Essential insight distilled:

```markdown
**Key Takeaway**: Use list comprehensions for simple transformations and filtering - they're more Pythonic and readable than equivalent loops, but switch to regular loops when logic becomes complex or requires multiple statements.
```

## How to Use This Tutorial

### For Complete Beginners to Python

1. Start with **Beginner** level (Examples 1-27)
2. Run every example in a Python REPL or `.py` file
3. Modify examples to test your understanding
4. Progress to **Intermediate** when comfortable with basics

### For Developers with Python Experience

1. Skim **Beginner** to identify gaps
2. Focus on **Intermediate** (Examples 28-54) for production patterns
3. Deep-dive **Advanced** (Examples 55-80) for expert techniques

### For Experienced Developers from Other Languages

1. Review **Beginner** quickly to learn syntax differences
2. Focus on Pythonic idioms in **Intermediate**
3. Use **Advanced** as a reference for Python-specific features

## Self-Containment Philosophy

Every example is **copy-paste-runnable** within its level scope:

- **Beginner examples**: Completely standalone - full imports, no dependencies on previous examples
- **Intermediate examples**: Assume beginner knowledge but include all necessary code to run
- **Advanced examples**: Assume beginner + intermediate concepts but remain fully runnable

**Golden rule**: If you delete all other examples, any single example should still run successfully.

## Educational Annotations

Examples use `# =>` notation to show:

- **Variable states**: `x = 10  # => x is 10 (type: int)`
- **Outputs**: `print(x)  # => Output: 10`
- **Intermediate values**: `y = x * 2  # => y is 20 (x remains 10)`
- **Side effects**: `lst.append(5)  # => lst is now [1, 2, 3, 5]`
- **Error cases**: `int("bad")  # => Raises ValueError: invalid literal for int()`

These annotations make code behavior explicit without needing to run examples (though running them is encouraged!).

## Diagram Guidelines

Diagrams use **color-blind friendly palette**:

- **Blue** (#0173B2): Primary elements, starting states
- **Orange** (#DE8F05): Processing states, operations
- **Teal** (#029E73): Success states, outputs
- **Purple** (#CC78BC): Conditional paths, options
- **Brown** (#CA9161): Neutral elements, helpers

This ensures accessibility for all learners.

## Prerequisites

- **Python 3.9+** installed (examples use modern Python features)
- **Basic programming knowledge** (variables, loops, functions in any language)
- **Text editor or IDE** (VS Code, PyCharm, or any editor)
- **Terminal/command prompt** access

Install Python from [python.org](https://python.org) or use your system package manager.

## Running Examples

### Option 1: Python REPL (Interactive)

```bash
python3
>>> # Paste example code here
```

### Option 2: Script File

```bash
# Save example to example.py
python3 example.py
```

### Option 3: Jupyter Notebook

```bash
pip install jupyter
jupyter notebook
# Create new notebook, paste examples in cells
```

## Learning Strategies

### For Java/C# Developers

You're used to static typing and verbose OOP. Python will feel liberating but initially unfamiliar:

- **Dynamic typing**: No type declarations required (though type hints are available)
- **Duck typing**: If it walks like a duck and quacks like a duck, it's a duck
- **No braces**: Indentation defines code blocks, whitespace matters

Focus on Examples 1-10 (Python basics) and Examples 40-45 (type hints) to bridge your static typing background.

### For JavaScript/TypeScript Developers

You understand dynamic typing and async patterns. Python has similar flexibility:

- **Similar feel**: Dynamic typing, first-class functions, flexible syntax
- **Different async model**: `async/await` works similarly but with different event loop semantics
- **No `this` confusion**: Methods receive `self` explicitly

Focus on Examples 55-65 (asyncio) and Examples 28-35 (decorators) to leverage your JS knowledge.

### For C/C++ Developers

You understand systems programming and pointers. Python abstracts all of that:

- **No manual memory**: Garbage collection handles everything
- **No pointers**: References are implicit, everything is an object
- **Slower but productive**: Rapid development, slower execution

Focus on Examples 70-80 (performance optimization, C extensions) to understand when Python's abstractions matter.

### For Ruby Developers

You know dynamic, expressive languages. Python is similar but more explicit:

- **Explicit is better**: No implicit returns, blocks, or magic methods (mostly)
- **One way to do it**: Python prefers single obvious solutions
- **Significant whitespace**: Indentation instead of `end` keywords

Focus on Examples 35-45 (comprehensions, generators) to see Python's expressive patterns.

## Code-First Philosophy

This tutorial prioritizes working code over theoretical discussion:

- **No lengthy prose**: Concepts are demonstrated, not explained at length
- **Runnable examples**: Every example runs in Python REPL or as scripts
- **Learn by doing**: Understanding comes from running and modifying code
- **Pattern recognition**: See the same patterns in different contexts across 80 examples

If you prefer narrative explanations. By-example learning works best when you learn through experimentation.

## What You'll Learn

By completing all 80 examples, you'll master:

- **Python fundamentals**: Syntax, types, control flow, functions
- **Data structures**: Lists, dicts, sets, tuples, and their methods
- **Pythonic patterns**: Comprehensions, generators, decorators, context managers
- **Object-oriented Python**: Classes, inheritance, magic methods, protocols
- **Functional programming**: Lambdas, map/filter/reduce, functools, itertools
- **Concurrency**: Asyncio, async/await, tasks, and event loops
- **Error handling**: Exceptions, custom errors, exception chaining
- **Testing**: Pytest, fixtures, parametrization, mocking
- **Type safety**: Type hints, protocols, generics, mypy
- **Packaging**: Modules, packages, virtual environments, pip, setup.py

## Navigation

- **[Beginner](/en/learn/software-engineering/programming-languages/python/by-example/beginner)** - Examples 1-27 (fundamental concepts)
- **[Intermediate](/en/learn/software-engineering/programming-languages/python/by-example/intermediate)** - Examples 28-54 (production patterns)
- **[Advanced](/en/learn/software-engineering/programming-languages/python/by-example/advanced)** - Examples 55-80 (advanced mastery)

---

**Ready to learn Python through code?** Start with [Beginner](/en/learn/software-engineering/programming-languages/python/by-example/beginner) examples!

## Examples by Level

### Beginner (Examples 1–27)

- [Example 1: Hello World and Print](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-1-hello-world-and-print)
- [Example 2: Variables and Dynamic Typing](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-2-variables-and-dynamic-typing)
- [Example 3: Numbers and Arithmetic](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-3-numbers-and-arithmetic)
- [Example 4: Strings and String Methods](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-4-strings-and-string-methods)
- [Example 5: Boolean Logic and Comparisons](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-5-boolean-logic-and-comparisons)
- [Example 6: Conditional Statements (if/elif/else)](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-6-conditional-statements-ifelifelse)
- [Example 7: While Loops](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-7-while-loops)
- [Example 8: For Loops and Range](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-8-for-loops-and-range)
- [Example 9: Lists - Creation and Access](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-9-lists---creation-and-access)
- [Example 10: Lists - Modification Methods](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-10-lists---modification-methods)
- [Example 11: Tuples - Immutable Sequences](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-11-tuples---immutable-sequences)
- [Example 12: Dictionaries - Key-Value Pairs](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-12-dictionaries---key-value-pairs)
- [Example 13: Sets - Unique Collections](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-13-sets---unique-collections)
- [Example 14: Functions - Definition and Calls](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-14-functions---definition-and-calls)
- [Example 15: Function Scope and Global Variables](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-15-function-scope-and-global-variables)
- [Example 16: Lambda Functions](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-16-lambda-functions)
- [Example 17: List Comprehensions](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-17-list-comprehensions)
- [Example 18: Dictionary and Set Comprehensions](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-18-dictionary-and-set-comprehensions)
- [Example 19: Exception Handling - Try/Except](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-19-exception-handling---tryexcept)
- [Example 20: File I/O - Reading and Writing](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-20-file-io---reading-and-writing)
- [Example 21: Classes - Basics](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-21-classes---basics)
- [Example 22: Classes - Inheritance](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-22-classes---inheritance)
- [Example 23: Class Properties and Magic Methods](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-23-class-properties-and-magic-methods)
- [Example 24: Modules and Imports](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-24-modules-and-imports)
- [Example 25: String Formatting](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-25-string-formatting)
- [Example 26: Iterators and the Iterator Protocol](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-26-iterators-and-the-iterator-protocol)
- [Example 27: Basic Error Handling Patterns](/en/learn/software-engineering/programming-languages/python/by-example/beginner#example-27-basic-error-handling-patterns)

### Intermediate (Examples 28–54)

- [Example 28: Basic Decorator](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-28-basic-decorator)
- [Example 29: Decorator with Arguments](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-29-decorator-with-arguments)
- [Example 30: Preserving Function Metadata](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-30-preserving-function-metadata)
- [Example 31: Basic Generator](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-31-basic-generator)
- [Example 32: Generator Expression](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-32-generator-expression)
- [Example 33: Context Manager (with statement)](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-33-context-manager-with-statement)
- [Example 34: contextlib for Simple Context Managers](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-34-contextlib-for-simple-context-managers)
- [Example 35: Regular Expression Matching](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-35-regular-expression-matching)
- [Example 36: Regular Expression Groups and Substitution](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-36-regular-expression-groups-and-substitution)
- [Example 37: JSON Serialization](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-37-json-serialization)
- [Example 38: CSV Reading and Writing](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-38-csv-reading-and-writing)
- [Example 39: Pathlib for Modern File Operations](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-39-pathlib-for-modern-file-operations)
- [Example 40: Collections - namedtuple](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-40-collections---namedtuple)
- [Example 41: Collections - Counter](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-41-collections---counter)
- [Example 42: Collections - defaultdict](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-42-collections---defaultdict)
- [Example 43: Collections - deque](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-43-collections---deque)
- [Example 44: functools - partial](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-44-functools---partial)
- [Example 45: functools - lru_cache](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-45-functools---lru_cache)
- [Example 46: itertools - Powerful Iteration](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-46-itertools---powerful-iteration)
- [Example 47: Datetime Basics](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-47-datetime-basics)
- [Example 48: Type Hints Basics](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-48-type-hints-basics)
- [Example 49: Dataclasses](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-49-dataclasses)
- [Example 50: Enums for Named Constants](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-50-enums-for-named-constants)
- [Example 51: Abstract Base Classes](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-51-abstract-base-classes)
- [Example 52: Basic pytest Tests](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-52-basic-pytest-tests)
- [Example 53: pytest Fixtures](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-53-pytest-fixtures)
- [Example 54: pytest Parametrize](/en/learn/software-engineering/programming-languages/python/by-example/intermediate#example-54-pytest-parametrize)

### Advanced (Examples 55–80)

- [Example 55: Basic Metaclass](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-55-basic-metaclass)
- [Example 56: **init_subclass** (Simpler Alternative)](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-56-init_subclass-simpler-alternative)
- [Example 57: Descriptor Protocol](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-57-descriptor-protocol)
- [Example 58: Property as Descriptor](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-58-property-as-descriptor)
- [Example 59: Asyncio Basics](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-59-asyncio-basics)
- [Example 60: Asyncio Tasks](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-60-asyncio-tasks)
- [Example 61: Async Context Managers](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-61-async-context-managers)
- [Example 62: Protocol (Structural Subtyping)](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-62-protocol-structural-subtyping)
- [Example 63: Generic Types](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-63-generic-types)
- [Example 64: Profiling with cProfile](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-64-profiling-with-cprofile)
- [Example 65: Memory Profiling](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-65-memory-profiling)
- [Example 66: Threading for I/O-Bound Tasks](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-66-threading-for-io-bound-tasks)
- [Example 67: ThreadPoolExecutor](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-67-threadpoolexecutor)
- [Example 68: Multiprocessing for CPU-Bound Tasks](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-68-multiprocessing-for-cpu-bound-tasks)
- [Example 69: Weak References](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-69-weak-references)
- [Example 70: Context Variables for Async Context](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-70-context-variables-for-async-context)
- [Example 71: Advanced Decorators - Class Decorators](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-71-advanced-decorators---class-decorators)
- [Example 72: Introspection with inspect](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-72-introspection-with-inspect)
- [Example 73: Dynamic Code Execution](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-73-dynamic-code-execution)
- [Example 74: AST Module for Code Analysis](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-74-ast-module-for-code-analysis)
- [Example 75: Packaging with pyproject.toml](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-75-packaging-with-pyprojecttoml)
- [Example 76: Advanced pytest - Mocking](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-76-advanced-pytest---mocking)
- [Example 77: pytest Markers for Test Organization](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-77-pytest-markers-for-test-organization)
- [Example 78: Singleton Pattern (Pythonic)](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-78-singleton-pattern-pythonic)
- [Example 79: Observer Pattern](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-79-observer-pattern)
- [Example 80: Best Practices - EAFP and Duck Typing](/en/learn/software-engineering/programming-languages/python/by-example/advanced#example-80-best-practices---eafp-and-duck-typing)
