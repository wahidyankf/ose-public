---
title: "Part 4: Special Forms and Closures"
weight: 100004
date: 2026-04-20T00:00:00+07:00
draft: false
description: "Why special forms bypass normal evaluation, how closures capture their environment, and what lexical scope really means"
tags: ["compilers", "interpreters", "closures", "lexical-scope", "special-forms", "f-sharp", "computer-science"]
---

Part 3's evaluator handles function application and symbol lookup. It cannot yet define variables, branch conditionally, or create functions. This part adds the four **special forms** that make the interpreter Turing-complete: `define`, `if`, `lambda`, and `begin`.

## CS Concept: Why Special Forms Are Special

In Part 3, general application follows one rule: evaluate every subexpression, then apply the operator. This rule breaks for some constructs.

**Normal application** — evaluates ALL arguments before calling:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Why Special Forms Are Special
    accDescr: Flowchart with 4 nodes and 4 connections. Nodes: (+ x y), eval x, eval y, apply + to values. Connections: (+ x y) to eval x, eval x to apply + to values, (+ x y) to eval y, eval y to apply + to values.
    N1["(+ x y)"]
    N2["eval x"]
    N3["eval y"]
    N4["apply + to values"]
    N1 --> N2 --> N4
    N1 --> N3 --> N4

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    class N1,N2,N3,N4 blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`if` special form** — evaluates test first, then exactly one branch:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Why Special Forms Are Special
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: if test consequent alternate, eval test only, eval consequent OR alternate never both. Connections: if test consequent alternate to eval test only, eval test only to eval consequent OR alternate never both.
    I1["if test consequent<br/>alternate"] --> I2["eval test only"] --> I3["eval consequent<br/>OR alternate<br/>never both"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class I1,I2,I3 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`define` special form** — binds a name, never evaluates it as a lookup:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Why Special Forms Are Special
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: (define x 10), x is a name to BIND not a value to LOOK UP. Connections: (define x 10) to x is a name to BIND not a value to LOOK UP.
    D1["(define x 10)"] --> D2["x is a name to BIND<br/>not a value to LOOK<br/>UP"]

    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    class D1,D2 orange
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

These forms are **special** because they require control over _which_ subexpressions are evaluated and _when_. Every programming language has them, though they go by different names: keywords, reserved words, syntax forms.

## Extending the Evaluator

We extend the `eval` function's `List (head :: args)` branch to check for special form keywords before falling through to general application:

```fsharp
| List (Symbol "define" :: rest) -> evalDefine rest env
| List (Symbol "if" :: rest)     -> evalIf rest env
| List (Symbol "lambda" :: rest) -> evalLambda rest env
| List (Symbol "begin" :: rest)  -> evalBegin rest env
| List (head :: args) ->
    // General application (unchanged from Part 3)
    let proc = eval head env
    let evaluatedArgs = List.map (fun a -> eval a env) args
    apply proc evaluatedArgs env
```

The pattern match on `Symbol "define"` fires before the general case, so `define` is never treated as a variable lookup.

## Implementing `define`

```fsharp
and evalDefine (args: LispVal list) (env: Env list) : LispVal =
    match args, env with
    | [Symbol name; valueExpr], currentFrame :: _ ->
        let value = eval valueExpr env
        envDefine name value (ref currentFrame)
        Symbol name
    | _ -> failwith "define: expects (define <name> <expr>)"
```

`define` binds a name in the _current_ (innermost) frame. It does not look up or evaluate the name — it creates a new binding.

## Implementing `if`

```fsharp
and evalIf (args: LispVal list) (env: Env list) : LispVal =
    match args with
    | [test; consequent; alternate] ->
        match eval test env with
        | Bool false -> eval alternate env
        | _          -> eval consequent env  // anything except #f is truthy
    | [test; consequent] ->
        match eval test env with
        | Bool false -> Nil
        | _          -> eval consequent env
    | _ -> failwith "if: expects (if <test> <consequent> [<alternate>])"
```

Scheme's truthiness rule: only `#f` is false. Every other value — including `0`, `""`, and `()` — is truthy.

## CS Concept: Closures

A **closure** is a function paired with the environment in which it was defined. When a `lambda` is evaluated, it captures a snapshot of the current environment chain.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
sequenceDiagram
    accTitle: CS Concept: Closures
    accDescr: Sequence diagram between Caller, eval, Environment. Messages: Caller to eval: (define make-adder (lambda (n) (lambda (x) (+ n x)))); eval to Environment: bind make-adder in global frame; Caller to eval: (define add5 (make-adder 5)); eval to Environment: extend env with n → 5; eval to eval: Lambda captures n→5 + global frame; eval to Environment: bind add5 → Closure[body=(+ n x), env=n→5]; Caller to eval: (add5 3); eval to Environment: extend closures env with x → 3; eval to eval: eval (+ n x) → look up n=5, x=3 → 8; eval to Caller: Number 8.
    participant C as Caller
    participant EV as eval
    participant ENV as Environment

    C->>EV: (define make-adder (lambda (n) (lambda (x) (+ n x))))
    EV->>ENV: bind make-adder in global frame

    C->>EV: (define add5 (make-adder 5))
    EV->>ENV: extend env with { n → 5 }
    note over EV,ENV: eval inner lambda in this extended env
    EV->>EV: Lambda captures { n→5 } + global frame
    EV->>ENV: bind add5 → Closure[body=(+ n x), env={n→5}]

    C->>EV: (add5 3)
    EV->>ENV: extend closure's env with { x → 3 }
    note over EV,ENV: env chain: {x→3} → {n→5} → global
    EV->>EV: eval (+ n x) → look up n=5, x=3 → 8
    EV-->>C: Number 8
```

## How a Closure Captures Its Environment

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: How a Closure Captures Its Environment
    accDescr: Flowchart with 4 nodes and 5 connections. Nodes: Global Frame make-adder → Lambda add5 → Closure, Closure Frame n → 5 (created when make-adder was called), Call Frame x → 3 (created when add5 is called), Lambda body (+ n x). Connections: Call Frame x → 3 (created when add5 is called) to Closure Frame n → 5 (created when make-adder was called) (parent), Closure Frame n → 5 (created when make-adder was called) to Global Frame make-adder → Lambda add5 → Closure (parent), Lambda body (+ n x) to Call Frame x → 3 (created when add5 is called) (evaluates in), Lambda body (+ n x) to Closure Frame n → 5 (created when make-adder was called) (n found in), Lambda body (+ n x) to Global Frame make-adder → Lambda add5 → Closure (+ found in).
    G["Global Frame<br/>make-adder → Lambda<br/>add5 → Closure"]
    C["Closure Frame<br/>n → 5<br/>(created when<br/>make-adder was<br/>called)"]
    I["Call Frame<br/>x → 3<br/>(created when add5<br/>is called)"]
    LA["Lambda body<br/>(+ n x)"]

    I -->|"parent"| C
    C -->|"parent"| G

    LA -->|"evaluates in"| I
    LA -->|"n found in"| C
    LA -->|"+ found in"| G

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class G blue
    class C orange
    class I,LA teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**The critical point**: the captured environment is the environment at _definition_ time, not at _call_ time. If `make-adder` has returned, the frame where `n = 5` lives is still alive — referenced by the closure — even though `make-adder`'s call has completed.

## Implementing `lambda`

```fsharp
and evalLambda (args: LispVal list) (env: Env list) : LispVal =
    match args with
    | List parms :: body :: [] ->
        let paramNames =
            parms
            |> List.map (function
                | Symbol s -> s
                | _ -> failwith "lambda: parameters must be symbols")
        Lambda (paramNames, body, env)  // capture env at definition time
    | _ -> failwith "lambda: expects (lambda (<params>) <body>)"
```

The key is `Lambda (paramNames, body, env)` — `env` here is the environment at the point where `lambda` is evaluated. When `apply` later invokes this `Lambda`, it extends `closureEnv`, not the caller's environment.

## CS Concept: Lexical vs Dynamic Scope

**Lexical scope** (Scheme — correct) — f closes over n=1 at definition time:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Lexical vs Dynamic Scope
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: n=1, define f using n, redefine n=100, call f 5, Result: 6 f sees n=1 from definition env. Connections: n=1, define f using n, redefine n=100, call f 5 to Result: 6 f sees n=1 from definition env.
    LS1["n=1, define f using<br/>n,<br/>redefine n=100, call<br/>f 5"] --> LS2["Result: 6<br/>f sees n=1<br/>from definition env"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class LS1,LS2 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Dynamic scope** (not Scheme) — f would see the caller's n=100:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Lexical vs Dynamic Scope
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: n=1, define f using n, redefine n=100, call f 5, Result: 105 f would see n=100 from callers env. Connections: n=1, define f using n, redefine n=100, call f 5 to Result: 105 f would see n=100 from callers env.
    DS1["n=1, define f using<br/>n,<br/>redefine n=100, call<br/>f 5"] --> DS2["Result: 105<br/>f would see n=100<br/>from caller's env"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class DS1,DS2 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## CS Concept: Free Variables and Variable Capture

A **free variable** in a function body is one not in the parameter list — it must be looked up in an enclosing scope.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: CS Concept: Free Variables and Variable Capture
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: (lambda (x) (+ x n)), Bound variable x — in parameter list, Free variable n — from enclosing scope, Free variable + — from global frame. Connections: (lambda (x) (+ x n)) to Bound variable x — in parameter list, (lambda (x) (+ x n)) to Free variable n — from enclosing scope, (lambda (x) (+ x n)) to Free variable + — from global frame.
    Body["(lambda (x) (+ x n))"]
    Bound["Bound variable<br/>x — in parameter<br/>list"]
    Free1["Free variable<br/>n — from enclosing<br/>scope"]
    Free2["Free variable<br/>+ — from global<br/>frame"]

    Body --> Bound
    Body --> Free1
    Body --> Free2

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000

    class Body blue
    class Bound teal
    class Free1,Free2 orange
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

When a closure is created, all free variables become "captured" — accessible via the closure's environment chain for as long as the closure lives.

## Implementing `begin`

```fsharp
and evalBegin (args: LispVal list) (env: Env list) : LispVal =
    match args with
    | [] -> Nil
    | _  ->
        args
        |> List.map (fun e -> eval e env)
        |> List.last
```

`begin` sequences expressions and returns the value of the last one. Essential for function bodies that need side effects before returning.

## Testing Closures

```fsharp
let env = makeGlobalEnv ()

// Simple function
eval (read "(define square (lambda (x) (* x x)))") env
eval (read "(square 5)") env
// → Number 25.0

// Closure over a free variable
eval (read "(define make-adder (lambda (n) (lambda (x) (+ n x))))") env
eval (read "(define add10 (make-adder 10))") env
eval (read "(add10 7)") env
// → Number 17.0

// Recursive function
eval (read "(define fact (lambda (n) (if (= n 0) 1 (* n (fact (- n 1))))))") env
eval (read "(fact 5)") env
// → Number 120.0
```

## What the Evaluator Can Now Do

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: What the Evaluator Can Now Do
    accDescr: Flowchart with 9 nodes and 8 connections. Nodes: eval, Self-evaluating atoms Number · Str · Bool, Symbol lookup env chain traversal, quote return unevaluated, define bind in current frame, if short-circuit branch, lambda create closure, begin sequence expressions, General application eval all → apply. Connections: eval to Self-evaluating atoms Number · Str · Bool, eval to Symbol lookup env chain traversal, eval to quote return unevaluated, eval to define bind in current frame, eval to if short-circuit branch, eval to lambda create closure, eval to begin sequence expressions, eval to General application eval all → apply.
    EV["eval"]

    A["Self-evaluating<br/>atoms<br/>Number · Str · Bool"]
    B["Symbol lookup<br/>env chain traversal"]
    C["quote<br/>return unevaluated"]
    D["define<br/>bind in current<br/>frame"]
    E["if<br/>short-circuit branch"]
    F["lambda<br/>create closure"]
    G["begin<br/>sequence expressions"]
    H["General application<br/>eval all → apply"]

    EV --> A
    EV --> B
    EV --> C
    EV --> D
    EV --> E
    EV --> F
    EV --> G
    EV --> H

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class EV blue
    class A,B,C,D orange
    class E,F,G,H teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

This is a complete interpreter — it can express any computable function. What it lacks is convenience (`let`, `cond`) and stack safety (TCO). Parts 5 and 6 address these.

In [Part 5](/en/learn/software-engineering/compilers-and-interpreters/lisp-interpreter-in-fsharp/part-5-derived-forms-and-repl), we add `let` and `cond` as **derived forms** — showing how macro expansion reduces language surface area — and wire up the REPL.
