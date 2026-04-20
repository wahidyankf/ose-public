---
title: "Part 1: The Shape of Lisp"
weight: 200001
date: 2026-04-20T00:00:00+07:00
draft: false
description: "Why Lisp is the canonical vehicle for interpreter theory — formal language structure, S-expressions, homoiconicity, and the REPL model"
tags: ["compilers", "interpreters", "lisp", "scheme", "computer-science", "formal-languages"]
---

Before writing a single line of Go, we need to understand _why_ Lisp is used to teach interpreter theory and what properties of its design make an interpreter so tractable to implement.

## The Series at a Glance

Each part of this series builds on the previous, adding one layer at a time:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    P1["Part 1\nThe Shape of Lisp\nWhy Lisp? S-expressions. REPL."]
    P2["Part 2\nTokenizing & Reading\nText → LispVal tree"]
    P3["Part 3\nEnvironments & Evaluation\neval / apply / env chain"]
    P4["Part 4\nSpecial Forms & Closures\ndefine · if · lambda"]
    P5["Part 5\nDerived Forms & REPL\nlet · cond · interactive shell"]
    P6["Part 6\nTail-Call Optimization\nStack-safe recursion"]

    P1 --> P2 --> P3 --> P4 --> P5 --> P6

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC
    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    classDef gray fill:#808080,color:#fff,stroke:#808080

    class P1 blue
    class P2 orange
    class P3 teal
    class P4 purple
    class P5 brown
    class P6 gray
```

## The Problem with Most Language Syntaxes

Most programming languages are surprisingly hard to parse. Consider a fragment of arithmetic:

```
3 + 4 * 2
```

A naive left-to-right reading gives `(3 + 4) * 2 = 14`. The correct answer is `3 + (4 * 2) = 11`. The parser must know that `*` binds more tightly than `+` — this is **operator precedence**. Real languages have dozens of precedence levels, associativity rules, and special syntactic forms (`if/else`, `for`, `while`, `switch`) that each require dedicated grammar rules and parser branches.

**Infix language parser** — must resolve precedence, associativity, and special forms:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    I1["3 + 4 * 2"] --> I2["Precedence table\n15+ levels in Java"] --> I3["Associativity\nrules"] --> I4["Special form\ngrammar"] --> I5["AST"]

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    class I1,I2,I3,I4,I5 blue
```

**Lisp parser** — one recursive rule, no precedence table needed:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    L1["(+ 3 (* 4 2))"] --> L2["One rule:\nLPAREN = read list\nelse = read atom"] --> L5["AST"]

    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    class L1,L2,L5 teal
```

Lisp removes all of it.

## S-Expressions: One Rule to Parse Them All

Lisp programs are built from **S-expressions** (symbolic expressions). An S-expression is either:

1. An **atom** — a number, a string, a boolean, or a symbol (identifier)
2. A **list** — zero or more S-expressions enclosed in parentheses

That is the complete grammar. There are no statements, no operators with precedence, no special syntactic forms. Everything is a list.

```scheme
42                    ; atom: number
"hello"               ; atom: string
#t                    ; atom: boolean
x                     ; atom: symbol (identifier)
()                    ; empty list
(1 2 3)               ; list of three numbers
(+ 1 2)               ; list: symbol + followed by two numbers
(define x 10)         ; list: symbol define, symbol x, number 10
(if (> x 0) x (- x)) ; nested lists
```

The grammar expressed as a diagram:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    SE["S-expression"]
    A["Atom"]
    L["List\n'(' S-expr* ')'"]
    N["Number\n42, -7, 3.14"]
    S["Symbol\nx, +, define"]
    ST["String\nhello"]
    B["Boolean\n#t, #f"]

    SE --> A
    SE --> L
    L -->|"contains zero or more"| SE

    A --> N
    A --> S
    A --> ST
    A --> B

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class SE blue
    class A,L orange
    class N,S,ST,B teal
```

Parsing this grammar requires exactly two rules:

1. If you see `(`, read S-expressions until you see `)`, collect them as a list.
2. Otherwise, read characters until whitespace or `)` — that is an atom.

A complete parser is about 30 lines of Go.

## S-Expressions as Trees

Every S-expression is a tree. `(+ (* 2 3) (- 5 1))` parses into:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
graph LR
    root["List"]
    plus["Symbol '+'"]
    mul["List"]
    sub["List"]
    mulsym["Symbol '*'"]
    two["Number 2"]
    three["Number 3"]
    subsym["Symbol '-'"]
    five["Number 5"]
    one["Number 1"]

    root --> plus
    root --> mul
    root --> sub
    mul --> mulsym
    mul --> two
    mul --> three
    sub --> subsym
    sub --> five
    sub --> one

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class root blue
    class mul,sub orange
    class plus,mulsym,subsym,two,three,five,one teal
```

The tree structure encodes evaluation order: children are evaluated before parents. No precedence rules needed — the nesting _is_ the precedence.

## Prefix Notation Eliminates Ambiguity

Notice that `(+ 1 2)` places the operator _before_ the operands — this is called **prefix notation** (or Polish notation). It completely eliminates operator precedence as a parsing concern.

Infix: `3 + 4 * 2` — ambiguous without precedence rules.
Prefix: `(+ 3 (* 4 2))` — unambiguous. The nesting of parentheses encodes precedence explicitly.

The trade-off is verbose notation. The payoff is a parser that is trivially simple.

## Evaluation Follows Structure

Once parsed into nested lists, evaluation follows the structure directly:

- An atom evaluates to itself (numbers, strings, booleans) or looks up its value in the environment (symbols).
- A list is a **function call** by default: evaluate the first element to get a function, evaluate the remaining elements to get arguments, apply the function to the arguments.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    expr["(+ 1 2)\nList{Symbol+, Number 1, Number 2}"]
    e1["eval Symbol '+'\n→ builtin addition fn"]
    e2["eval Number 1\n→ 1"]
    e3["eval Number 2\n→ 2"]
    app["apply addition to (1, 2)"]
    res["Number 3"]

    expr --> e1
    expr --> e2
    expr --> e3
    e1 --> app
    e2 --> app
    e3 --> app
    app --> res

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class expr blue
    class e1,e2,e3 orange
    class app,res teal
```

This maps naturally to a Go function `eval` that uses a type switch on the input. No need for an abstract syntax tree separate from the parsed form — the parsed form _is_ the AST.

## Homoiconicity: Code as Data

In most languages, source code and runtime data are completely separate. A Go program cannot easily manipulate Go source code as a value at runtime.

Lisp programs are written in the same structure that Lisp uses for lists at runtime:

**Other languages** — code and data are completely separate:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    src["Source code\n(text)"] -. "completely separate" .-> rt["Runtime data\n(objects, arrays)"]

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    class src,rt blue
```

**Lisp (homoiconic)** — code and data share the same list structure:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    lsrc["(+ 1 2)\nSource code"] <-->|"same structure"| lrt["List{Symbol+ Number Number}\nRuntime data"]

    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    class lsrc,lrt teal
```

This property — code and data sharing the same representation — is called **homoiconicity**. For our interpreter, it means the data structure we produce during parsing and the data structure we manipulate during evaluation are identical. There is no "compile to AST" step distinct from "parse".

## What We Build: A Scheme Dialect

We implement a subset of **Scheme**, one of the two main Lisp dialects (alongside Common Lisp). Scheme is preferred for interpreter pedagogy because it is minimal and formally specified.

The Scheme standard (R5RS) mandates two properties that will shape our implementation:

1. **Lexical scope** — a function closes over the environment where it was _defined_, not where it is _called_.
2. **Tail-call optimization** — a function call in tail position must not consume additional stack space.

Both are correctness requirements, not optional features.

## The Read-Eval-Print Loop

Every Lisp system is traditionally structured as a REPL:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    R["READ\nparse one S-expression\nfrom input"]
    E["EVAL\nevaluate it in\ncurrent environment"]
    P["PRINT\ndisplay the\nresult"]
    L["LOOP\ngo back\nto READ"]

    R --> E --> P --> L --> R

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC

    class R blue
    class E orange
    class P teal
    class L purple
```

This structure is pedagogically valuable because it exposes each phase as a distinct, composable step. We will implement each phase separately before wiring them into the loop in Part 5.

## What We Will and Will Not Build

**In scope (Parts 1–6):**

- Tokenizer and recursive descent parser
- `LispVal` interface type (the AST/value type)
- Environment model with lexical scope
- `eval` / `apply` mutual recursion
- Special forms: `define`, `if`, `lambda`, `begin`, `quote`
- Derived forms: `let`, `cond`
- Numeric and list primitives
- Interactive REPL
- Tail-call optimization via loop transform

**Out of scope (explicitly excluded):**

- `call/cc` — continuations require a complete interpreter rewrite
- Hygienic macros — `define-syntax` / `syntax-rules` are the advanced follow-up
- Garbage collection — delegated to the Go runtime
- The full R5RS standard library

## Summary

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    subgraph Why["Why Lisp for interpreter theory"]
        R1["S-expression syntax\ntrivially parseable"]
        R2["Prefix notation\neliminates operator precedence"]
        R3["Evaluation follows\nparsed structure"]
        R4["Homoiconicity\ncode = data"]
        R5["Scheme's formal semantics\nforces correct lexical scope + TCO"]
    end

    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    class R1,R2,R3,R4,R5 teal
```

In [Part 2](/en/learn/software-engineering/compilers-and-interpreters/lisp-interpreter-in-golang/part-2-tokenizing-and-reading), we implement the tokenizer and recursive descent parser, producing the `LispVal` interface type that will carry values through all subsequent parts.
