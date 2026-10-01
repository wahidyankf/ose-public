---
title: "Part 2: Tokenizing and Reading"
weight: 100002
date: 2026-04-20T00:00:00+07:00
draft: false
description: "Lexical analysis and recursive descent parsing — turning raw text into structured S-expressions using F# discriminated unions"
tags:
  ["compilers", "interpreters", "lexical-analysis", "parsing", "recursive-descent", "f-sharp", "discriminated-unions"]
---

Every interpreter starts the same way: raw text goes in, structured data comes out. This phase has two stages — **tokenizing** (breaking text into tokens) and **reading** (assembling tokens into nested structures). Together they constitute the **front end** of our interpreter.

## The Front-End Pipeline

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: The Front-End Pipeline
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: (+ 1 2) raw string, Tokenizer lexical analysis, LPAREN · PLUS · 1 · 2 · RPAREN token list, Parser recursive descent, List [Symbol + Number 1 Number 2] LispVal tree. Connections: (+ 1 2) raw string to Tokenizer lexical analysis, Tokenizer lexical analysis to LPAREN · PLUS · 1 · 2 · RPAREN token list, LPAREN · PLUS · 1 · 2 · RPAREN token list to Parser recursive descent, Parser recursive descent to List [Symbol + Number 1 Number 2] LispVal tree.
    src["(+ 1 2)<br/>raw string"]
    tok["Tokenizer<br/>lexical analysis"]
    tokens["LPAREN · PLUS · 1 ·<br/>2 · RPAREN<br/>token list"]
    par["Parser<br/>recursive descent"]
    ast["List [Symbol '+';<br/>Number 1; Number 2]<br/>LispVal tree"]

    src --> tok --> tokens --> par --> ast

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class src blue
    class tok,par orange
    class tokens,ast teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## CS Concept: Lexical Analysis

**Lexical analysis** (or lexing, or tokenizing) is the process of grouping a stream of characters into meaningful units called **tokens**. A token is the smallest unit of syntax — a number, a string, a symbol, a parenthesis.

Lexical analysis answers: "what are the words?"
Parsing answers: "what do the words mean structurally?"

For Scheme, the token types are:

| Token       | Examples                     |
| ----------- | ---------------------------- |
| Left paren  | `(`                          |
| Right paren | `)`                          |
| Number      | `42`, `-7`, `3.14`           |
| String      | `"hello"`, `"world"`         |
| Boolean     | `#t`, `#f`                   |
| Symbol      | `+`, `define`, `x`, `my-var` |

No keywords — `define`, `if`, `lambda` are just symbols. The interpreter, not the lexer, gives them special meaning.

## CS Concept: Context-Free Grammars

The structure of S-expressions can be described as a **context-free grammar** (CFG):

```
s-expr  ::= atom | list
list    ::= '(' s-expr* ')'
atom    ::= number | string | boolean | symbol
```

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: CS Concept: Context-Free Grammars
    accDescr: Flowchart with 7 nodes and 7 connections. Nodes: s-expr, atom, list ( s-expr* ), number, symbol, string, boolean. Connections: s-expr to atom (is either), s-expr to list ( s-expr* ) (or), list ( s-expr* ) to s-expr (contains zero or more), atom to number, atom to symbol, atom to string, atom to boolean.
    SE["s-expr"]
    A["atom"]
    L["list<br/>'(' s-expr* ')'"]
    N["number"]
    S["symbol"]
    ST["string"]
    B["boolean"]

    SE -->|"is either"| A
    SE -->|"or"| L
    L -->|"contains zero or<br/>more"| SE

    A --> N
    A --> S
    A --> ST
    A --> B

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class SE blue
    class A,L orange
    class N,S,ST,B teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

This grammar is recursive: a list contains zero or more S-expressions, each of which may itself be a list. This recursive structure is what makes a recursive descent parser the natural implementation strategy.

**Context-free** means the rule for expanding a non-terminal does not depend on what surrounds it. This is a weaker requirement than natural languages but sufficient for all programming languages.

## The LispVal Type

Before parsing, we define the type that represents all Lisp values throughout the interpreter. In F#, this is a **discriminated union** — a sum type with named cases.

```fsharp
type Env = Map<string, LispVal ref>

and LispVal =
    | Number of float
    | Str of string
    | Bool of bool
    | Symbol of string
    | List of LispVal list
    | Lambda of string list * LispVal * Env
    | Builtin of (LispVal list -> LispVal)
    | Nil
```

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
graph LR
    accTitle: The LispVal Type
    accDescr: Graph with 9 nodes and 8 connections. Nodes: LispVal discriminated union, Number of float e.g. Number 42.0, Str of string e.g. Str hello, Bool of bool Bool true /Bool false, Symbol of string e.g. Symbol x, List of LispVal list e.g. List [Symbol + Number 1], Lambda of string list × LispVal × Env params · body · captured env, Builtin of (LispVal list → LispVal) F function directly, Nil empty list (). Connections: LispVal discriminated union to Number of float e.g. Number 42.0, LispVal discriminated union to Str of string e.g. Str hello, LispVal discriminated union to Bool of bool Bool true /Bool false, LispVal discriminated union to Symbol of string e.g. Symbol x, LispVal discriminated union to List of LispVal list e.g. List [Symbol + Number 1], LispVal discriminated union to Lambda of string list × LispVal × Env params · body · captured env, LispVal discriminated union to Builtin of (LispVal list → LispVal) F function directly, LispVal discriminated union to Nil empty list ().
    LV["LispVal<br/>discriminated union"]

    N["Number of float<br/>e.g. Number 42.0"]
    ST["Str of string<br/>e.g. Str 'hello'"]
    B["Bool of bool<br/>Bool true /Bool<br/>false"]
    SY["Symbol of string<br/>e.g. Symbol 'x'"]
    LI["List of LispVal list<br/>e.g. List [Symbol<br/>'+'; Number 1]"]
    LA["Lambda of<br/>string list ×<br/>LispVal × Env<br/>params · body ·<br/>captured env"]
    BU["Builtin of<br/>(LispVal list →<br/>LispVal)<br/>F# function directly"]
    NL["Nil<br/>empty list ()"]

    LV --> N
    LV --> ST
    LV --> B
    LV --> SY
    LV --> LI
    LV --> LA
    LV --> BU
    LV --> NL

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef purple fill:#CC78BC,color:#000000,stroke:#000000

    class LV blue
    class N,ST,B,SY orange
    class LI,LA teal
    class BU,NL purple
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Why discriminated unions?** A DU forces the evaluator to handle every case. Pattern matching on a `LispVal` that misses a case produces a compile-time warning. This compiler-enforced exhaustiveness is a genuine correctness tool.

## Tokenizer

The tokenizer takes a string and produces a list of token strings.

```fsharp
let tokenize (input: string) : string list =
    let spaced =
        input
            .Replace("(", " ( ")
            .Replace(")", " ) ")

    spaced.Split([| ' '; '\t'; '\n'; '\r' |], System.StringSplitOptions.RemoveEmptyEntries)
    |> Array.toList
```

**What the tokenizer does NOT do:** it does not assign types to tokens. The string `"42"` comes out as the string `"42"`, not as a number. Typing happens in the next stage.

## Parser: Recursive Descent

The parser converts a flat list of token strings into a nested `LispVal`. The algorithm is a classic **recursive descent parser** — each grammar rule corresponds to a function.

```fsharp
let parseAtom (token: string) : LispVal =
    match token with
    | "#t" -> Bool true
    | "#f" -> Bool false
    | _ ->
        match System.Double.TryParse(token) with
        | true, n -> Number n
        | _ -> Symbol token

let rec parseExpr (tokens: string list) : LispVal * string list =
    match tokens with
    | [] -> failwith "Unexpected end of input"
    | "(" :: rest ->
        let vals, remaining = parseList rest []
        List vals, remaining
    | ")" :: _ -> failwith "Unexpected ')'"
    | token :: rest -> parseAtom token, rest

and parseList (tokens: string list) (acc: LispVal list) : LispVal list * string list =
    match tokens with
    | [] -> failwith "Missing closing ')'"
    | ")" :: rest -> List.rev acc, rest
    | _ ->
        let expr, remaining = parseExpr tokens
        parseList remaining (expr :: acc)
```

## Parsing `(+ 1 2)` Step by Step

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
sequenceDiagram
    accTitle: Parsing Step by Step
    accDescr: Sequence diagram between Token Stream, parseExpr, parseList, parseAtom. Messages: Token Stream to parseExpr: LPAREN PLUS 1 2 RPAREN; parseExpr to parseList: sees LPAREN, delegate: PLUS 1 2 RPAREN; parseList to parseExpr: token PLUS (not RPAREN); parseExpr to parseAtom: PLUS; parseAtom to parseExpr: Symbol plus; parseExpr to parseList: Symbol plus, remaining: 1 2 RPAREN; parseList to parseExpr: token 1 (not RPAREN); parseExpr to parseAtom: 1; parseAtom to parseExpr: Number 1.0; parseExpr to parseList: Number 1.0, remaining: 2 RPAREN; parseList to parseExpr: token 2 (not RPAREN); parseExpr to parseAtom: 2; and 5 more.
    participant T as Token Stream
    participant PE as parseExpr
    participant PL as parseList
    participant PA as parseAtom

    T->>PE: LPAREN PLUS 1 2 RPAREN
    PE->>PL: sees LPAREN, delegate: PLUS 1 2 RPAREN

    PL->>PE: token PLUS (not RPAREN)
    PE->>PA: PLUS
    PA-->>PE: Symbol plus
    PE-->>PL: Symbol plus, remaining: 1 2 RPAREN

    PL->>PE: token 1 (not RPAREN)
    PE->>PA: 1
    PA-->>PE: Number 1.0
    PE-->>PL: Number 1.0, remaining: 2 RPAREN

    PL->>PE: token 2 (not RPAREN)
    PE->>PA: 2
    PA-->>PE: Number 2.0
    PE-->>PL: Number 2.0, remaining: RPAREN

    PL->>PE: token RPAREN, done
    PL-->>PE: List of Symbol-plus Number-1 Number-2
    PE-->>T: List of Symbol-plus Number-1 Number-2
```

## Recursive Descent = Grammar as Code

The mutual recursion between `parseExpr` and `parseList` mirrors the grammar's mutual recursion between `s-expr` and `list`:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Recursive Descent = Grammar as Code
    accDescr: Flowchart with 6 nodes and 6 connections. Nodes: s-expr, list, atom, parseExpr, parseList, parseAtom. Connections: s-expr to list (is a), s-expr to atom (or), list to s-expr (contains), parseExpr to parseList (calls), parseExpr to parseAtom (calls), parseList to parseExpr (calls).
    subgraph Grammar
        SE2["s-expr"]
        L2["list"]
        A2["atom"]
        SE2 -->|"is a"| L2
        SE2 -->|"or"| A2
        L2 -->|"contains"| SE2
    end

    subgraph Code
        PE["parseExpr"]
        PL["parseList"]
        PA["parseAtom"]
        PE -->|"calls"| PL
        PE -->|"calls"| PA
        PL -->|"calls"| PE
    end

    SE2 -. "implemented by" .-> PE
    L2 -. "implemented by" .-> PL
    A2 -. "implemented by" .-> PA

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class SE2,L2,A2 blue
    class PE,PL,PA teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Putting It Together: The Read Function

```fsharp
let read (input: string) : LispVal =
    let tokens = tokenize input
    let expr, remaining = parseExpr tokens
    if remaining <> [] then
        failwith $"Unexpected tokens after expression: {remaining}"
    expr
```

Test it:

```fsharp
read "(+ 1 2)"
// → List [Symbol "+"; Number 1.0; Number 2.0]

read "(define x 10)"
// → List [Symbol "define"; Symbol "x"; Number 10.0]

read "(lambda (x y) (* x y))"
// → List [Symbol "lambda"; List [Symbol "x"; Symbol "y"]; List [Symbol "*"; Symbol "x"; Symbol "y"]]
```

The parser has no knowledge of what `define` or `lambda` mean — those are just symbols. The evaluator (Part 3) gives them meaning.

## CS Concept: Why Recursive Descent?

Recursive descent is not the only parsing algorithm. There are table-driven parsers (LL, LR, LALR) used by most production compiler generators. Why recursive descent here?

1. **Simplicity** — each grammar rule is a function. The code structure mirrors the grammar exactly.
2. **Scheme's grammar is LL(1)** — at every point, one token of lookahead is sufficient to decide which rule applies.
3. **Good error messages** — the call stack tells you exactly where in the grammar parsing failed.
4. **Hand-written = transparent** — reading a hand-written recursive descent parser is much more instructive than reading a generated parser.

## What We Have

After Part 2, we can transform any valid Scheme expression from text into a structured `LispVal` tree:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
%% Parses: (if (> x 0) x (- 0 x))
graph LR
    accTitle: What We Have
    accDescr: Graph with 11 nodes and 10 connections. Nodes: List, Symbol: if, List - test, Symbol: gt, Symbol: x, Number: 0, Symbol: x, List - alternate, Symbol: minus, Number: 0, Symbol: x. Connections: List to Symbol: if, List to List - test, List to Symbol: x, List to List - alternate, List - test to Symbol: gt, List - test to Symbol: x, List - test to Number: 0, List - alternate to Symbol: minus, List - alternate to Number: 0, List - alternate to Symbol: x.
    root["List"]
    if_sym["Symbol: if"]
    test["List - test"]
    gt_sym["Symbol: gt"]
    x1["Symbol: x"]
    zero1["Number: 0"]
    conseq["Symbol: x"]
    alt["List - alternate"]
    minus["Symbol: minus"]
    zero2["Number: 0"]
    x3["Symbol: x"]

    root --> if_sym
    root --> test
    root --> conseq
    root --> alt
    test --> gt_sym
    test --> x1
    test --> zero1
    alt --> minus
    alt --> zero2
    alt --> x3

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000

    class root blue
    class test,alt orange
    class if_sym,gt_sym,x1,conseq,x3,minus,zero1,zero2 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

In [Part 3](/en/learn/software-engineering/compilers-and-interpreters/lisp-interpreter-in-fsharp/part-3-environments-and-evaluation), we implement the environment model and the core `eval`/`apply` loop that gives these trees meaning.
