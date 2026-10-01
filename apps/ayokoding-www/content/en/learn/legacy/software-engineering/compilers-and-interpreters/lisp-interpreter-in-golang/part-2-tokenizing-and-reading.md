---
title: "Part 2: Tokenizing and Reading"
weight: 200002
date: 2026-04-20T00:00:00+07:00
draft: false
description: "Lexical analysis and recursive descent parsing — turning raw text into structured S-expressions using Go interfaces and type switches"
tags: ["compilers", "interpreters", "lexical-analysis", "parsing", "recursive-descent", "golang", "interfaces"]
---

Every interpreter starts the same way: raw text goes in, structured data comes out. This phase has two stages — **tokenizing** (breaking text into tokens) and **reading** (assembling tokens into nested structures). Together they constitute the **front end** of our interpreter.

## The Front-End Pipeline

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: The Front-End Pipeline
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: (+ 1 2) raw string, Tokenizer lexical analysis, LPAREN · PLUS · 1 · 2 · RPAREN token list, Parser recursive descent, ListSymbol+, Number 1, Number 2 LispVal tree. Connections: (+ 1 2) raw string to Tokenizer lexical analysis, Tokenizer lexical analysis to LPAREN · PLUS · 1 · 2 · RPAREN token list, LPAREN · PLUS · 1 · 2 · RPAREN token list to Parser recursive descent, Parser recursive descent to ListSymbol+, Number 1, Number 2 LispVal tree.
    src["(+ 1 2)<br/>raw string"]
    tok["Tokenizer<br/>lexical analysis"]
    tokens["LPAREN · PLUS · 1 ·<br/>2 · RPAREN<br/>token list"]
    par["Parser<br/>recursive descent"]
    ast["List{Symbol+, Number<br/>1, Number 2}<br/>LispVal tree"]

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

Before parsing, we define the type that represents all Lisp values throughout the interpreter. In Go, we use an **interface** with a marker method — a technique for creating closed sum types without language-level discriminated unions.

```go
// LispVal is the sum type for all Scheme values.
// The lispVal() marker method prevents accidental implementations.
type LispVal interface {
    lispVal()
}

type Number  struct{ Value float64 }
type Symbol  struct{ Value string }
type Str     struct{ Value string }
type Bool    struct{ Value bool }
type List    struct{ Values []LispVal }
type Lambda  struct {
    Params []string
    Body   LispVal
    Env    *Env
}
type Builtin struct{ Fn func([]LispVal) (LispVal, error) }
type Nil     struct{}

func (Number)  lispVal() {}
func (Symbol)  lispVal() {}
func (Str)     lispVal() {}
func (Bool)    lispVal() {}
func (List)    lispVal() {}
func (Lambda)  lispVal() {}
func (Builtin) lispVal() {}
func (Nil)     lispVal() {}
```

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
graph LR
    accTitle: The LispVal Type
    accDescr: Graph with 9 nodes and 8 connections. Nodes: LispVal interface, Number Value float64, Str Value string, Bool Value bool, Symbol Value string, List Values []LispVal, Lambda Params []string Body LispVal Env *Env, Builtin Fn func([]LispVal) (LispVal, error), Nil empty list (). Connections: LispVal interface to Number Value float64, LispVal interface to Str Value string, LispVal interface to Bool Value bool, LispVal interface to Symbol Value string, LispVal interface to List Values []LispVal, LispVal interface to Lambda Params []string Body LispVal Env *Env, LispVal interface to Builtin Fn func([]LispVal) (LispVal, error), LispVal interface to Nil empty list ().
    LV["LispVal<br/>interface"]

    N["Number<br/>Value float64"]
    ST["Str<br/>Value string"]
    B["Bool<br/>Value bool"]
    SY["Symbol<br/>Value string"]
    LI["List<br/>Values []LispVal"]
    LA["Lambda<br/>Params []string<br/>Body LispVal<br/>Env *Env"]
    BU["Builtin<br/>Fn func([]LispVal)<br/>(LispVal, error)"]
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

**Why an interface with a marker method?** It restricts the type switch in `eval` to known cases. Any type that accidentally satisfies `LispVal` will only do so by explicitly implementing `lispVal()` — an intentional act. In F#, this exhaustiveness is enforced by the compiler on discriminated unions; in Go, we enforce it by convention.

## Tokenizer

The tokenizer takes a string and produces a flat list of token strings. Go's `strings` package makes this concise:

```go
func tokenize(input string) []string {
    // Insert spaces around parens so Split works uniformly
    s := strings.NewReplacer("(", " ( ", ")", " ) ").Replace(input)
    var tokens []string
    for _, tok := range strings.Fields(s) {
        tokens = append(tokens, tok)
    }
    return tokens
}
```

`strings.Fields` splits on any whitespace and discards empty strings — it handles tabs, newlines, and multiple spaces automatically.

**What the tokenizer does NOT do:** it does not assign types to tokens. The string `"42"` comes out as the string `"42"`, not as a number. Typing happens in the next stage.

For string literals with spaces (e.g., `"hello world"`), a more sophisticated tokenizer is needed. The version above handles the core Scheme subset covered in this series.

## Parser: Recursive Descent

The parser converts a flat list of token strings into a nested `LispVal`. The algorithm is a classic **recursive descent parser** — each grammar rule corresponds to a function.

```go
func parseAtom(token string) LispVal {
    if token == "#t" {
        return Bool{Value: true}
    }
    if token == "#f" {
        return Bool{Value: false}
    }
    if f, err := strconv.ParseFloat(token, 64); err == nil {
        return Number{Value: f}
    }
    return Symbol{Value: token}
}

func parseExpr(tokens []string, pos int) (LispVal, int, error) {
    if pos >= len(tokens) {
        return nil, pos, fmt.Errorf("unexpected end of input")
    }
    tok := tokens[pos]
    switch tok {
    case "(":
        return parseList(tokens, pos+1)
    case ")":
        return nil, pos, fmt.Errorf("unexpected ')'")
    default:
        return parseAtom(tok), pos + 1, nil
    }
}

func parseList(tokens []string, pos int) (LispVal, int, error) {
    var values []LispVal
    for pos < len(tokens) && tokens[pos] != ")" {
        val, newPos, err := parseExpr(tokens, pos)
        if err != nil {
            return nil, newPos, err
        }
        values = append(values, val)
        pos = newPos
    }
    if pos >= len(tokens) {
        return nil, pos, fmt.Errorf("missing closing ')'")
    }
    return List{Values: values}, pos + 1, nil
}
```

Unlike the F# version which returns `(LispVal, remaining tokens)`, the Go version passes a positional index through the token slice. This avoids allocating new slices at each recursive step.

## Parsing `(+ 1 2)` Step by Step

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
sequenceDiagram
    accTitle: Parsing Step by Step
    accDescr: Sequence diagram between Token Stream, parseExpr, parseList, parseAtom. Messages: Token Stream to parseExpr: LPAREN PLUS 1 2 RPAREN; parseExpr to parseList: sees LPAREN, delegate: PLUS 1 2 RPAREN; parseList to parseExpr: token PLUS (not RPAREN); parseExpr to parseAtom: PLUS; parseAtom to parseExpr: Symbol plus; parseExpr to parseList: Symbol plus, pos advances; parseList to parseExpr: token 1 (not RPAREN); parseExpr to parseAtom: 1; parseAtom to parseExpr: Number 1.0; parseExpr to parseList: Number 1.0, pos advances; parseList to parseExpr: token 2 (not RPAREN); parseExpr to parseAtom: 2; and 5 more.
    participant T as Token Stream
    participant PE as parseExpr
    participant PL as parseList
    participant PA as parseAtom

    T->>PE: LPAREN PLUS 1 2 RPAREN
    PE->>PL: sees LPAREN, delegate: PLUS 1 2 RPAREN

    PL->>PE: token PLUS (not RPAREN)
    PE->>PA: PLUS
    PA-->>PE: Symbol plus
    PE-->>PL: Symbol plus, pos advances

    PL->>PE: token 1 (not RPAREN)
    PE->>PA: 1
    PA-->>PE: Number 1.0
    PE-->>PL: Number 1.0, pos advances

    PL->>PE: token 2 (not RPAREN)
    PE->>PA: 2
    PA-->>PE: Number 2.0
    PE-->>PL: Number 2.0, pos advances

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

```go
func read(input string) (LispVal, error) {
    tokens := tokenize(input)
    if len(tokens) == 0 {
        return nil, fmt.Errorf("empty input")
    }
    expr, pos, err := parseExpr(tokens, 0)
    if err != nil {
        return nil, err
    }
    if pos != len(tokens) {
        return nil, fmt.Errorf("unexpected tokens after expression")
    }
    return expr, nil
}
```

Test it:

```go
v, _ := read("(+ 1 2)")
// → List{Values: []LispVal{Symbol{Value:"+"}, Number{Value:1}, Number{Value:2}}}

v, _ = read("(define x 10)")
// → List{Values: []LispVal{Symbol{"define"}, Symbol{"x"}, Number{10}}}

v, _ = read("(lambda (x y) (* x y))")
// → List{Values: []LispVal{Symbol{"lambda"}, List{[]LispVal{Symbol{"x"}, Symbol{"y"}}}, ...}}
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

In [Part 3](/en/learn/software-engineering/compilers-and-interpreters/lisp-interpreter-in-golang/part-3-environments-and-evaluation), we implement the environment model and the core `eval`/`apply` loop that gives these trees meaning.
