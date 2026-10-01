---
title: "Part 5: Derived Forms and the REPL"
weight: 100005
date: 2026-04-20T00:00:00+07:00
draft: false
description: "Syntactic sugar as source transformation, implementing let and cond as derived forms, and wiring up the interactive REPL"
tags: ["compilers", "interpreters", "syntactic-sugar", "macros", "repl", "f-sharp", "computer-science"]
---

The interpreter from Part 4 is complete — it can express any computable function. But it is inconvenient to use. `let` bindings and `cond` branches are patterns programmers reach for constantly. This part adds them as **derived forms**: transformations that rewrite surface syntax into the core forms the evaluator already handles.

## CS Concept: Syntactic Sugar and Derived Forms

**Syntactic sugar** is syntax that adds no expressive power — anything written with it can be written without it — but makes programs easier to read and write.

**Derived forms** implement syntactic sugar by transforming the sugared form into a desugared equivalent _before_ evaluation. The evaluator never sees the sugared form.

**Without derived forms** — `eval` must handle every surface form directly:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Syntactic Sugar and Derived Forms
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Source, eval (handles everything). Connections: Source to eval (handles everything).
    W1["Source"] --> W2["eval<br/>(handles everything)"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    class W1,W2 blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**With derived forms** — an expansion phase rewrites sugar before `eval` ever sees it:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Syntactic Sugar and Derived Forms
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Source (surface language), Expander let · cond → core, eval (core forms only). Connections: Source (surface language) to Expander let · cond → core, Expander let · cond → core to eval (core forms only).
    S1["Source<br/>(surface language)"] --> S2["Expander<br/>let · cond → core"] --> S3["eval<br/>(core forms only)"]

    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class S1 orange
    class S2,S3 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

The insight from SICP Chapter 4: you can define an arbitrarily rich surface language on top of a tiny primitive core, as long as every surface form can be mechanically rewritten into primitive forms. This is the foundation of Lisp's macro systems and of how languages like Haskell (`do` notation), Rust (procedural macros), and Kotlin (coroutines) implement syntactic extensions.

## `let` as a Derived Form

`let` introduces local bindings:

```scheme
(let ((x 5) (y 3))
  (+ x y))
```

This is identical in meaning to immediately invoking a lambda:

```scheme
((lambda (x y) (+ x y)) 5 3)
```

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: let as a Derived Form
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: (let ((x 5) (y 3)) (+ x y)), Transformation rule: (let ((v1 e1) (v2 e2)) body) → ((lambda (v1 v2) body) e1 e2), ((lambda (x y) (+ x y)) 5 3), eval (normal application). Connections: (let ((x 5) (y 3)) (+ x y)) to Transformation rule: (let ((v1 e1) (v2 e2)) body) → ((lambda (v1 v2) body) e1 e2) (desugar), Transformation rule: (let ((v1 e1) (v2 e2)) body) → ((lambda (v1 v2) body) e1 e2) to ((lambda (x y) (+ x y)) 5 3), ((lambda (x y) (+ x y)) 5 3) to eval (normal application).
    Let["(let ((x 5) (y 3))<br/>  (+ x y))"]
    Rule["Transformation rule:<br/>(let ((v1 e1) (v2<br/>e2)) body)<br/>→<br/>((lambda (v1 v2)<br/>body) e1 e2)"]
    Lambda["((lambda (x y)<br/>   (+ x y)) 5 3)"]
    Eval["eval<br/>(normal application)"]

    Let -->|"desugar"| Rule
    Rule --> Lambda
    Lambda --> Eval

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class Let blue
    class Rule orange
    class Lambda,Eval teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

In F#:

```fsharp
let desugarLet (args: LispVal list) : LispVal =
    match args with
    | List bindings :: body ->
        let parms, vals =
            bindings
            |> List.map (function
                | List [Symbol name; valueExpr] -> Symbol name, valueExpr
                | _ -> failwith "let: malformed binding")
            |> List.unzip
        List (List (Symbol "lambda" :: List parms :: body) :: vals)
    | _ -> failwith "let: expects (let ((var val) ...) body)"
```

This produces a `LispVal` representing the lambda application, which `eval` then processes normally. The evaluator never learns that `let` existed.

## `cond` as a Derived Form

`cond` is a multi-branch conditional:

```scheme
(cond
  ((= x 0) "zero")
  ((< x 0) "negative")
  (else    "positive"))
```

This desugars to nested `if` expressions:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: cond as a Derived Form
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: cond: (= x 0) → zero (lt x 0) → negative else → positive, if (= x 0) zero else ..., if (lt x 0) negative else ..., positive. Connections: cond: (= x 0) → zero (lt x 0) → negative else → positive to if (= x 0) zero else ... (desugar), if (= x 0) zero else ... to if (lt x 0) negative else ... (alternate branch), if (lt x 0) negative else ... to positive (else branch).
    Cond["cond:<br/>  (= x 0) → zero<br/>(lt x 0) → negative<br/>  else → positive"]

    If1["if (= x 0) zero<br/>  else ..."]
    If2["if (lt x 0) negative<br/>  else ..."]
    Else["positive"]

    Cond -->|"desugar"| If1
    If1 -->|"alternate branch"| If2
    If2 -->|"else branch"| Else

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class Cond blue
    class If1,If2 orange
    class Else teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

In F#:

```fsharp
let rec desugarCond (clauses: LispVal list) : LispVal =
    match clauses with
    | [] -> Nil
    | List (Symbol "else" :: body) :: _ ->
        List (Symbol "begin" :: body)
    | List (test :: body) :: rest ->
        List [Symbol "if"; test; List (Symbol "begin" :: body); desugarCond rest]
    | _ -> failwith "cond: malformed clause"
```

## Hooking Derived Forms into the Evaluator

Add pattern matches _before_ the general application case in `eval`:

```fsharp
| List (Symbol "let" :: rest) ->
    eval (desugarLet rest) env      // expand then re-enter eval

| List (Symbol "cond" :: clauses) ->
    eval (desugarCond clauses) env  // expand then re-enter eval
```

The desugared form is passed back to `eval` recursively. The evaluator processes only core forms; all surface syntax is rewritten away.

## CS Concept: The Expansion Phase

**The phases:**

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: The Expansion Phase
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: read text → LispVal, expand derived → core, eval core → value, print value → text. Connections: read text → LispVal to expand derived → core, expand derived → core to eval core → value, eval core → value to print value → text.
    R["read<br/>text → LispVal"] --> E["expand<br/>derived → core"] --> V["eval<br/>core → value"] --> P["print<br/>value → text"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef purple fill:#CC78BC,color:#000000,stroke:#000000
    class R blue
    class E orange
    class V teal
    class P purple
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**What each phase processes:**

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: The Expansion Phase
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: (let ((x 5)) (cond ...)), ((lambda (x) (if ...)) 5), Number 42, 42. Connections: (let ((x 5)) (cond ...)) to ((lambda (x) (if ...)) 5), ((lambda (x) (if ...)) 5) to Number 42, Number 42 to 42.
    RF["(let ((x 5))<br/>  (cond ...))"] --> EF["((lambda (x)<br/>  (if ...)) 5)"] --> VF["Number 42"] --> PF["42"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef purple fill:#CC78BC,color:#000000,stroke:#000000
    class RF blue
    class EF orange
    class VF teal
    class PF purple
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

What we have implemented manually is a rudimentary **expansion phase**. Production Lisp implementations (Racket, Guile, SBCL) have a full macro expander as a separate phase between parsing and evaluation. A macro expander can apply user-defined transformations (`define-syntax`, `syntax-rules`), not just built-in ones.

## Adding More Primitives

Before wiring up the REPL, we add more primitives to `makeGlobalEnv`:

```fsharp
define "list"   (Builtin (fun args -> List args))

define "length" (Builtin (fun args ->
    match args with
    | [List xs] -> Number (float xs.Length)
    | _ -> failwith "length: expects a list"))

define "append" (Builtin (fun args ->
    match args with
    | [List a; List b] -> List (a @ b)
    | _ -> failwith "append: expects two lists"))

define "map" (Builtin (fun args ->
    match args with
    | [proc; List xs] ->
        List (List.map (fun x -> apply proc [x] []) xs)
    | _ -> failwith "map: expects procedure and list"))

define "not" (Builtin (fun args ->
    match args with
    | [Bool false] -> Bool true
    | [_]          -> Bool false
    | _ -> failwith "not: expects one argument"))

define "display"  (Builtin (fun args ->
    match args with
    | [v] -> printf "%s" (printVal v); Nil
    | _ -> failwith "display: expects one argument"))

define "newline" (Builtin (fun _ -> printfn ""; Nil))
```

## The REPL

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: The REPL
    accDescr: Flowchart with 10 nodes and 11 connections. Nodes: repl() Create global env, Print prompt, read input from stdin, EOF or null?, read input text → LispVal, eval expr env, Error?, print result, print error message, exit. Connections: repl() Create global env to Print prompt, Print prompt to read input from stdin, read input from stdin to EOF or null?, EOF or null? to exit (yes), EOF or null? to read input text → LispVal (no), read input text → LispVal to eval expr env, eval expr env to Error?, Error? to print result (no), Error? to print error message (yes), print result to Print prompt, print error message to Print prompt.
    Start["repl()<br/>Create global env"]
    Prompt["Print prompt"]
    Read["read input<br/>from stdin"]
    EOF{"EOF or<br/>null?"}
    Parse["read input<br/>text → LispVal"]
    Eval["eval expr env"]
    Err{"Error?"}
    Print["print result"]
    PrintErr["print error message"]

    Start --> Prompt
    Prompt --> Read
    Read --> EOF
    EOF -->|"yes"| Exit["exit"]
    EOF -->|"no"| Parse
    Parse --> Eval
    Eval --> Err
    Err -->|"no"| Print
    Err -->|"yes"| PrintErr
    Print --> Prompt
    PrintErr --> Prompt

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef brown fill:#CA9161,color:#000000,stroke:#000000

    class Start,Prompt blue
    class Read,EOF orange
    class Parse,Eval teal
    class Err,Print,PrintErr,Exit brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```fsharp
let printVal (v: LispVal) : string =
    let rec show = function
        | Number n  -> if n = System.Math.Floor n then string (int n) else string n
        | Str s     -> $"\"{s}\""
        | Bool true -> "#t"
        | Bool false -> "#f"
        | Symbol s  -> s
        | List vs   -> $"({String.concat " " (List.map show vs)})"
        | Lambda _  -> "#<procedure>"
        | Builtin _ -> "#<builtin>"
        | Nil       -> "()"
    show v

let repl () =
    let env = makeGlobalEnv ()
    printfn "Scheme interpreter. Ctrl+C to exit."
    let rec loop () =
        printf "> "
        let input = System.Console.ReadLine()
        if input <> null then
            try
                let expr = read input
                let result = eval expr env
                printfn "%s" (printVal result)
            with ex ->
                printfn "Error: %s" ex.Message
            loop ()
    loop ()
```

The REPL maintains a single `env` across iterations — definitions made in one iteration persist to the next.

## Testing a Complete Session

```scheme
> (define fib
    (lambda (n)
      (cond
        ((= n 0) 0)
        ((= n 1) 1)
        (else (+ (fib (- n 1)) (fib (- n 2)))))))
fib

> (fib 10)
55

> (let ((x 3) (y 4))
    (* x y))
12

> (map (lambda (x) (* x x)) (list 1 2 3 4 5))
(1 4 9 16 25)
```

## What We Have Built After Part 5

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: What We Have Built After Part 5
    accDescr: Flowchart with 6 nodes and 5 connections. Nodes: Part 6 (next) Tail-call optimization, Part 5 ← you are here Derived forms + REPL, Part 4 Special forms + closures, Part 3 Environments + eval/apply, Part 2 Tokenizer + parser, Part 1 Foundation. Connections: Part 6 (next) Tail-call optimization to Part 5 ← you are here Derived forms + REPL, Part 5 ← you are here Derived forms + REPL to Part 4 Special forms + closures, Part 4 Special forms + closures to Part 3 Environments + eval/apply, Part 3 Environments + eval/apply to Part 2 Tokenizer + parser, Part 2 Tokenizer + parser to Part 1 Foundation.
    subgraph Stack["Interpreter stack"]
        direction TB
        L6["Part 6 (next)<br/>Tail-call<br/>optimization"]
        L5["Part 5 ← you are<br/>here<br/>Derived forms + REPL"]
        L4["Part 4<br/>Special forms +<br/>closures"]
        L3["Part 3<br/>Environments +<br/>eval/apply"]
        L2["Part 2<br/>Tokenizer + parser"]
        L1["Part 1<br/>Foundation"]

        L6 --> L5 --> L4 --> L3 --> L2 --> L1
    end

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef purple fill:#CC78BC,color:#000000,stroke:#000000
    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    classDef gray fill:#808080,color:#000000,stroke:#000000

    class L6 gray
    class L5 blue
    class L4 orange
    class L3 teal
    class L2 purple
    class L1 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

One correctness property is still missing: **tail-call optimization**. A deeply recursive program using tail calls will overflow the F# call stack. Scheme's R5RS standard mandates that tail calls must not consume stack space.

In [Part 6](/en/learn/software-engineering/compilers-and-interpreters/lisp-interpreter-in-fsharp/part-6-tail-call-optimization), we implement TCO by transforming the evaluator's tail positions into a loop.
