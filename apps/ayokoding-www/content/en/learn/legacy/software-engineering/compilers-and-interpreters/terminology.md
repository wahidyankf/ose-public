---
title: "Terminology: Compilers and Interpreters"
weight: 100001
date: 2026-04-20T00:00:00+07:00
draft: false
description: "Precise definitions for compiler and interpreter theory terms — from token and lexeme through closure, tail call, and homoiconicity"
tags: ["compilers", "interpreters", "terminology", "glossary", "computer-science", "programming-languages"]
---

This glossary defines the terms used throughout the [Building a Lisp Interpreter in F#](/en/learn/software-engineering/compilers-and-interpreters/lisp-interpreter-in-fsharp) series. Terms appear in the order they are encountered when building an interpreter — from raw source text through to execution semantics.

## How the Pieces Fit Together

Before diving into individual definitions, here is how all the terms relate to each other in the overall pipeline of taking source text to a running program:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: How the Pieces Fit Together
    accDescr: Flowchart with 8 nodes and 7 connections. Nodes: characters e.g. ( + 1 2 ), Lexer, Tokens LPAREN · PLUS · INT · RPAREN, Parser, AST List: Symbol · Number · Number, Interpreter eval / apply, Environment frame chain, Result: Number 3. Connections: characters e.g. ( + 1 2 ) to Lexer, Lexer to Tokens LPAREN · PLUS · INT · RPAREN, Tokens LPAREN · PLUS · INT · RPAREN to Parser, Parser to AST List: Symbol · Number · Number, AST List: Symbol · Number · Number to Interpreter eval / apply, Environment frame chain to Interpreter eval / apply, Interpreter eval / apply to Result: Number 3.
    subgraph Input["Source text"]
        SRC["characters<br/>e.g. ( + 1 2 )"]
    end

    subgraph Lexing["Lexical analysis"]
        LEX["Lexer"]
        TOK["Tokens<br/>LPAREN · PLUS · INT<br/>· RPAREN"]
        SRC --> LEX --> TOK
    end

    subgraph Parsing["Syntax analysis"]
        PAR["Parser"]
        AST["AST<br/>List: Symbol ·<br/>Number · Number"]
        TOK --> PAR --> AST
    end

    subgraph Execution["Execution"]
        EV["Interpreter<br/>eval / apply"]
        ENV["Environment<br/>frame chain"]
        RES["Result: Number 3"]
        AST --> EV
        ENV --> EV
        EV --> RES
    end

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef purple fill:#CC78BC,color:#000000,stroke:#000000

    class SRC,LEX,TOK blue
    class PAR,AST orange
    class EV,ENV,RES teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

---

## The Compilation Pipeline

### Character

The smallest input unit — a single Unicode code point. Characters are what the lexer reads one at a time. A character is not yet meaningful on its own.

### Lexeme

The actual substring of source text matched by the lexer — the raw string `"if"`, `"velocityX"`, or `"42"`. The lexer identifies a lexeme and emits a corresponding token.

**Lexeme vs token**: the lexeme is _what was matched_ (the raw text); the token is _the classification of what was matched_ (the abstract category plus any needed value). The string `"42"` is a lexeme; the pair `(INTEGER_LITERAL, 42)` is the token.

### Token

A pair `(token-name, attribute-value)` produced by the lexer. The token-name is an abstract symbol representing a class of lexical unit (`IDENTIFIER`, `INTEGER_LITERAL`, `LPAREN`). The attribute-value carries any instance-specific information needed later (`42`, a symbol-table pointer).

_Source: Aho, Lam, Sethi, Ullman — "Compilers: Principles, Techniques, and Tools" (Dragon Book), §3.1_

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: Token
    accDescr: Flowchart with 6 nodes and 5 connections. Nodes: Characters ( + 4 2 ), Lexer, Token: LPAREN, Token: SYMBOL +, Token: NUMBER 42, Token: RPAREN. Connections: Characters ( + 4 2 ) to Lexer, Lexer to Token: LPAREN, Lexer to Token: SYMBOL +, Lexer to Token: NUMBER 42, Lexer to Token: RPAREN.
    CH["Characters<br/>( + 4 2 )"]
    LX["Lexer"]
    T1["Token: LPAREN"]
    T2["Token: SYMBOL '+'"]
    T3["Token: NUMBER 42"]
    T4["Token: RPAREN"]

    CH --> LX --> T1
    LX --> T2
    LX --> T3
    LX --> T4

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class CH,LX blue
    class T1,T2,T3,T4 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

### Lexer / Tokenizer / Scanner

All three names refer to the same phase — the component that reads raw characters, groups them into lexemes, and emits tokens.

- **Scanner** emphasises the left-to-right character-by-character reading
- **Tokenizer** emphasises the output (tokens)
- **Lexer** / **Lexical analyser** is the formal term used in compiler literature

These are synonyms in standard usage. The Dragon Book uses "lexical analyser" as the canonical term.

### Parser

The component that takes a flat stream of tokens as input and produces a hierarchical syntactic structure (AST or parse tree) as output, verifying the token sequence conforms to the language's grammar.

**What the parser does not do**: it does not read characters (that is the lexer); it does not determine meaning (that is semantic analysis or the evaluator).

_Common parser algorithms: LL(k), LR(k), LALR, Earley, Pratt (operator-precedence), recursive descent._

### Parse Tree / Concrete Syntax Tree (CST)

A tree that directly reflects the grammar derivation — every grammar rule application produces a node, including intermediate nonterminals and all tokens including punctuation. Faithful but verbose.

### Abstract Syntax Tree (AST)

A tree representing the _meaningful_ syntactic structure of source code, where concrete syntactic details (parentheses, commas, semicolons, grammar helper nonterminals) are omitted because they are implicit in the tree's shape.

The word "abstract" means the tree omits nodes present in the CST that are syntactically necessary but semantically redundant.

For the expression `(+ 1 2)`:

**CST** — every syntax token preserved, including punctuation:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: Abstract Syntax Tree
    accDescr: Flowchart with 6 nodes and 5 connections. Nodes: expr, LPAREN, SYMBOL: plus, NUMBER: 1, NUMBER: 2, RPAREN. Connections: expr to LPAREN, expr to SYMBOL: plus, expr to NUMBER: 1, expr to NUMBER: 2, expr to RPAREN.
    C1["expr"] --> C2["LPAREN"]
    C1 --> C3["SYMBOL: plus"]
    C1 --> C4["NUMBER: 1"]
    C1 --> C5["NUMBER: 2"]
    C1 --> C6["RPAREN"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    class C1,C2,C3,C4,C5,C6 blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**AST** — only meaningful structure, punctuation dropped:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: Abstract Syntax Tree
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: apply, op: plus, arg: 1, arg: 2. Connections: apply to op: plus, apply to arg: 1, apply to arg: 2.
    A1["apply"] --> A2["op: plus"]
    A1 --> A3["arg: 1"]
    A1 --> A4["arg: 2"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class A1,A2,A3,A4 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Source: Dragon Book, §5; Wikipedia: Abstract syntax tree_

### Context-Free Grammar (CFG)

A formal grammar G = (V, Σ, R, S) where every production rule has exactly one nonterminal on the left-hand side: `A → α`. **Context-free** means a nonterminal can be replaced by its right-hand side regardless of what surrounds it — no context conditions.

Programming languages use CFGs because they are expressive enough to describe block structure and recursion, yet simple enough to allow efficient O(n) parsing (for deterministic subclasses). Context-sensitive features like "a variable must be declared before use" are handled separately in semantic analysis.

_BNF notation was invented for Algol 60 (1960) by Backus and Naur — the first formal CFG-described programming language._

---

## Programs That Process Programs

### Compiler

A program that translates source code in one language into an equivalent program in another language (typically lower-level machine or assembly code) as a **complete, standalone, offline transformation** — the output program runs independently of the compiler.

The key property: translation happens _before_ execution, and the resulting artifact runs without the compiler being present.

### Interpreter

A program that directly executes source code or an intermediate representation, interleaving translation and execution at runtime.

**Compiler** — translates offline, output runs independently:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Interpreter
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Source code, Compiler (offline), Binary / machine code, Runs independently. Connections: Source code to Compiler (offline), Compiler (offline) to Binary / machine code, Binary / machine code to Runs independently.
    CS["Source code"] --> CC["Compiler<br/>(offline)"] --> CA["Binary /<br/>machine code"] --> CR["Runs<br/>independently"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    class CS,CC,CA,CR blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Interpreter** — translates and executes together at runtime:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Interpreter
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Source code, Interpreter (reads + executes), Result. Connections: Source code to Interpreter (reads + executes), Interpreter (reads + executes) to Result.
    IS["Source code"] --> II["Interpreter<br/>(reads + executes)"] --> IR["Result"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class IS,II,IR teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Spectrum of interpretation** — interpreters exist on a spectrum:

| Style        | How it works                                         | Examples                           |
| ------------ | ---------------------------------------------------- | ---------------------------------- |
| Tree-walking | Parse to AST; walk and execute nodes                 | Early Ruby, our Scheme interpreter |
| Bytecode VM  | Compile to compact bytecode; VM executes             | CPython, Lua, JVM before JIT       |
| JIT          | Compile hot bytecode paths to native code at runtime | V8, JVM HotSpot, PyPy              |

JIT compilation blurs the compiler/interpreter boundary — translation still happens at runtime, so the user ships bytecode, not machine code.

### Transpiler / Source-to-Source Compiler

A compiler whose output is source code in the same or a different high-level language, rather than machine code or bytecode.

Examples: TypeScript → JavaScript (`tsc`), CoffeeScript → JavaScript, C++ → C (Cfront, 1983), modern JS → ES5 (Babel).

**Is "transpiler" a real CS term?** Yes — coined by Dick Pountain in 1989, documented in technical literature. It is more common in developer culture than in academic compiler textbooks, which prefer "source-to-source compiler." Both terms are correct.

---

## Lisp-Specific Concepts

### S-expression

A **symbolic expression** (sexp) — Lisp's recursive data notation, defined by John McCarthy in 1960:

> An S-expression is either an atom (a symbol or number) or a dotted pair `(x . y)` where x and y are S-expressions.

In practice, Lisp uses a shorthand: `(a b c)` for the chain `(a . (b . (c . nil)))`. S-expressions were originally the _data_ format; programmers never adopted a separate code format, yielding homoiconicity.

_Primary source: McCarthy (1960), "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I." CACM 3(4)._

### Homoiconicity

The property of a language in which programs are represented in the **primary data structure of the language itself**, allowing programs to be inspected and transformed as data using the same language.

In Lisp: both code and data are S-expressions (lists). A macro receives its arguments as unevaluated lists and can transform them using the same list operations used on any data.

**Most languages** — code and data are separate representations:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Homoiconicity
    accDescr: Flowchart with 1 nodes and 0 connections. Nodes: Source code (text)] -. separate representations .-> OD[Runtime data (objects).
    OC["Source code<br/>(text)"] -. "separate\nrepresentations" .-> OD["Runtime data<br/>(objects)"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    class OC,OD blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Lisp** — code and data share the same S-expression structure:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Homoiconicity
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Code: (+ 1 2), Data: List of Symbol and Numbers. Connections: Code: (+ 1 2) to Data: List of Symbol and Numbers (same structure).
    LC["Code:<br/>(+ 1 2)"] <-->|"same structure"| LD["Data:<br/>List of Symbol and<br/>Numbers"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class LC,LD teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Caveat**: no single consensus definition exists. The strongest claim applies to Lisp dialects where the parser's native output _is_ the primary data type. Julia (`Expr`), Prolog (terms), and Elixir (`quote`) have weaker forms of the same property.

### Special Form

A syntactic construct evaluated **differently from standard function application** — its arguments are not all evaluated in the normal way before the construct executes.

Standard function calls evaluate all arguments first, then pass the values. Special forms need control over _which_ arguments are evaluated and _when_:

- `if` must evaluate the condition first, then exactly one branch
- `quote` must not evaluate its argument at all
- `define` must create a binding rather than look up the name

Special forms are implemented as primitives in the evaluator. Users cannot add new special forms — that requires extending the interpreter itself (unlike macros).

_Source: Kent Pitman (1980), "Special Forms in Lisp"; Common Lisp HyperSpec §3.1.2.1.2.1_

### Syntactic Sugar / Derived Form

**Syntactic sugar** is syntax that adds no expressive power — anything written with it can be written without it — but makes programs more readable or convenient.

A **derived form** (Scheme terminology, R5RS §7.3) is a form whose semantics are defined by a source-to-source transformation to core forms:

```
(let ((x 5)) body)  →  ((lambda (x) body) 5)
(cond (t1 e1) ...)  →  (if t1 e1 (cond ...))
```

The evaluator never sees the derived form — it only processes the expanded core form. In Scheme, `let`, `cond`, `case`, `and`, `or`, `when`, `unless`, and `do` are all derived expressions.

_Source: R5RS §7.3; Wikipedia: Syntactic sugar_

### REPL

**Read–Eval–Print Loop** — an interactive programming environment that cyclically:

1. **Reads** a user expression (parses one S-expression from stdin)
2. **Evaluates** it in the current environment
3. **Prints** the result to stdout
4. **Loops** back to step 1

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: REPL
    accDescr: Flowchart with 4 nodes and 4 connections. Nodes: READ parse one S-expression, EVAL evaluate in current env, PRINT display result, LOOP back to READ. Connections: READ parse one S-expression to EVAL evaluate in current env, EVAL evaluate in current env to PRINT display result, PRINT display result to LOOP back to READ, LOOP back to READ to READ parse one S-expression.
    R["READ<br/>parse one<br/>S-expression"] --> E["EVAL<br/>evaluate in<br/>current env"] --> P["PRINT<br/>display<br/>result"] --> L["LOOP<br/>back to READ"] --> R

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef purple fill:#CC78BC,color:#000000,stroke:#000000

    class R blue
    class E orange
    class P teal
    class L purple
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Each letter names a Lisp primitive function. The REPL does not terminate between inputs — it returns to `read` after each `print`.

_First documented usage: Deutsch & Berkeley (1964), Lisp on PDP-1. Acronym standardised in Scheme communities by the early 1980s._

---

## The Runtime Model

### Environment

In PL theory: a **mapping from variable names to their values** (or to storage locations). In SICP's environment model: an environment is a _sequence of frames_, where each frame is a table of name→value bindings, and variable lookup proceeds from the current frame outward.

### Frame

A single table of bindings for one scope — the local variables of one function call. A frame always has a pointer to its enclosing (parent) frame, forming the environment chain.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Frame
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Global Frame + → builtin define → special fact → Lambda, Call Frame n → 5, Inner Frame acc → 120. Connections: Global Frame + → builtin define → special fact → Lambda to Call Frame n → 5 (enclosed by), Call Frame n → 5 to Inner Frame acc → 120 (enclosed by).
    GF["Global Frame<br/>+ → builtin<br/>define → special<br/>fact → Lambda"]
    LF["Call Frame<br/>n → 5"]
    IF["Inner Frame<br/>acc → 120"]

    GF -->|"enclosed by"| LF -->|"enclosed by"| IF

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class GF blue
    class LF orange
    class IF teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Source: SICP §3.2_

### Closure

A runtime value pairing a function's code (parameter list + body) with the **lexical environment in which it was defined** — capturing all free variable bindings so the function can access those variables even when called from outside their original scope.

Peter Landin coined the term in 1964: a closure has "an environment part and a control part." Sussman and Steele popularised it in their 1975 Scheme paper.

**Precise answer to "function + env, or just captured variables?"**: A closure is the function paired with the _entire captured environment chain_ — not just the individual variable values. Because the environment is captured by reference (not by copy), mutations to captured variables via `set!` are visible through the closure.

**Anonymous function vs closure**: an anonymous function is a function literal without a name. A closure is the _runtime instance_ of a function that has captured an environment. All closures are functions; not all anonymous functions are closures (only those that reference free variables from an enclosing scope).

_Source: Landin (1964); Sussman & Steele (1975) "SCHEME: An interpreter for extended lambda calculus"_

### Lexical Scope

A scoping rule where a variable's binding is determined by the **textual structure of the source code** — a name always refers to the definition that lexically encloses it, determined at parse time, independent of the runtime call stack.

Synonym: **static scope** (emphasises compile-time determination).

Scheme, Python, JavaScript, Go, Rust, C, Java, and most modern languages use lexical scope.

### Dynamic Scope

A scoping rule where a variable's binding is determined by the **runtime call stack** — a name resolves to the most recent binding active at the time of the call, regardless of where the calling or called function was defined in source code.

**Lexical scope** — name resolves at definition site:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Dynamic Scope
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: n=1, define f, redefine n=100, f sees n=1 (definition env). Connections: n=1, define f, redefine n=100 to f sees n=1 (definition env).
    LS1["n=1, define f,<br/>redefine n=100"] --> LS2["f sees n=1<br/>(definition env)"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class LS1,LS2 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Dynamic scope** — name resolves at call site:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Dynamic Scope
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: n=1, define f, redefine n=100, call f, f sees n=100 (callers env). Connections: n=1, define f, redefine n=100, call f to f sees n=100 (callers env).
    DS1["n=1, define f,<br/>redefine n=100, call<br/>f"] --> DS2["f sees n=100<br/>(caller's env)"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class DS1,DS2 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Where dynamic scope appears today**: Emacs Lisp (default, opt-in lexical since 2012), Bash/POSIX shell variables, Perl's `local`, Common Lisp's `special` declarations.

---

## Evaluation

### Evaluation Strategy

A rule determining _when_ function arguments are evaluated and _how_ they are passed.

| Strategy              | When evaluated              | Re-evaluated?  | Languages                         |
| --------------------- | --------------------------- | -------------- | --------------------------------- |
| Call-by-value (eager) | Before the call             | No             | C, Java, Python, Go, Rust, Scheme |
| Call-by-name          | On each use                 | Yes, each time | ALGOL 60, Scala `=>` params       |
| Call-by-need (lazy)   | On first use, then cached   | No (memoised)  | Haskell, Miranda                  |
| Call-by-sharing       | By-value but objects shared | No             | Python, Java, Ruby (for objects)  |

**Common misconception**: "lazy evaluation" ≠ "call-by-name." Call-by-name re-evaluates arguments on every use; call-by-need (true laziness) evaluates at most once. Haskell uses call-by-need.

_Scheme uses call-by-value: all arguments are fully evaluated before the function is called._

### Tail Call

A function call in **tail position** — the final operation performed before a function returns, such that the caller contributes no further computation to the result after the call completes.

**NOT a tail call** — result is used further after the call returns:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Tail Call
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: return foo() + 1, foo() returns then + 1 must still happen caller frame stays alive. Connections: return foo() + 1 to foo() returns then + 1 must still happen caller frame stays alive.
    NT1["return foo() + 1"] --> NT2["foo() returns<br/>then + 1 must still<br/>happen<br/>caller frame stays<br/>alive"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class NT1,NT2 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**IS a tail call** — result is returned directly, caller frame is immediately useless:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Tail Call
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: return foo(), foo() result IS the callers result caller frame immediately useless. Connections: return foo() to foo() result IS the callers result caller frame immediately useless.
    T1["return foo()"] --> T2["foo() result IS<br/>the caller's result<br/>caller frame<br/>immediately useless"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class T1,T2 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Tail position is a syntactic property**, not a property of what function is called. A recursive call, a call to a different function, and a builtin call can all be in tail position.

### Tail-Call Optimization (TCO) vs Proper Tail Calls (PTC)

- **TCO**: A compiler or runtime _optimisation_ that replaces a tail call with a jump, reusing the current stack frame rather than allocating a new one. An optional quality-of-implementation feature.

- **Proper tail calls (PTC)**: A _language specification requirement_ that all tail calls execute in constant stack space. R5RS mandates PTC for all Scheme implementations.

**Without TCO** — each tail call pushes a new frame, stack grows O(n):

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Tail-Call Optimization vs Proper Tail Calls
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: call f(n), call f(n-1), call f(n-2), ... n frames ..., stack overflow. Connections: call f(n) to call f(n-1), call f(n-1) to call f(n-2), call f(n-2) to ... n frames ..., ... n frames ... to stack overflow.
    W1["call f(n)"] --> W2["call f(n-1)"] --> W3["call f(n-2)"] --> Wd["... n frames ..."] --> We["stack overflow"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class W1,W2,W3,Wd,We brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**With TCO** — tail call reuses the same frame, stack stays O(1):

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Tail-Call Optimization vs Proper Tail Calls
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: call f(n) reuse frame, update args, update args, done. Connections: call f(n) reuse frame to update args, update args to update args, update args to done.
    T1["call f(n)<br/>reuse frame"] --> T2["update args"] --> T3["update args"] --> T4["done"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class T1,T2,T3,T4 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Key distinction**: TCO is something a compiler _may_ do. PTC is something a language _requires_ — making unbounded tail recursion semantically equivalent to iteration. R5RS §3.5 states: "Implementations of Scheme are required to be properly tail-recursive."

_Languages with PTC: Scheme (R5RS/R6RS/R7RS), Lua 5.x, ECMAScript 2015 (specified but not universally implemented). Languages with TCO as optimisation: F#, Kotlin (`tailrec`), GHC Haskell (via lazy evaluation, different mechanism)._
