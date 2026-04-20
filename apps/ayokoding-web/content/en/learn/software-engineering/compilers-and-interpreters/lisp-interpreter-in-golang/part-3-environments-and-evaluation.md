---
title: "Part 3: Environments and Evaluation"
weight: 200003
date: 2026-04-20T00:00:00+07:00
draft: false
description: "The environment model, eval/apply mutual recursion, and the core evaluation loop — the heart of every interpreter"
tags: ["compilers", "interpreters", "environment-model", "evaluation", "golang", "computer-science"]
---

With parsing complete, we now have `LispVal` trees. The evaluator's job is to give them meaning. This part introduces the two foundational concepts that underlie every interpreter: the **environment model** and the **eval/apply** mutual recursion.

## CS Concept: Two Models of Evaluation

There are two mental models for how a programming language evaluates expressions.

**Substitution model** — replace names with values before evaluating:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    S1["(define x 5)\n(+ x 3)"] --> S2["Substitute x → 5\n(+ 5 3)"] --> S3["Result: 8"]

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    class S1,S2,S3 blue
```

**Environment model** — look up names in an environment chain at runtime:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    E1["(+ x 3)"]
    E2["Environment\nx → 5"]
    E3["Look up x → 5\nApply + to (5, 3)"]
    E4["Result: 8"]
    E1 --> E3
    E2 --> E3
    E3 --> E4

    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    class E1,E2,E3,E4 teal
```

**The substitution model** — a name is replaced by its value before evaluation. Intuitive, but breaks down for mutation and closures.

**The environment model** — maintain a data structure (the **environment**) that maps names to their current values. Evaluation looks up names in this structure. This is what real interpreters use.

## CS Concept: The Environment as a Chain of Frames

An environment is not a single flat dictionary. It is a **chain of frames**, where each frame is a dictionary of bindings and each frame has a pointer to its enclosing (parent) frame.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    G["Global Frame\n+ → builtin\n- → builtin\n* → builtin\ndefine → special"]
    L["Local Frame\nn → 5\nx → 10"]
    I["Inner Frame\nz → 15"]

    L -->|"parent"| G
    I -->|"parent"| L

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class G blue
    class L orange
    class I teal
```

Variable lookup traverses this chain: check the innermost frame first; if not found, check the parent; repeat until the global frame.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    Q["Look up 'n'"]
    F1{"In Inner\nFrame?"}
    F2{"In Local\nFrame?"}
    F3{"In Global\nFrame?"}
    E["Error:\nUnbound variable"]
    R["Return value"]

    Q --> F1
    F1 -->|"yes"| R
    F1 -->|"no"| F2
    F2 -->|"yes"| R
    F2 -->|"no"| F3
    F3 -->|"yes"| R
    F3 -->|"no"| E

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161

    class Q blue
    class F1,F2,F3 orange
    class R teal
    class E brown
```

This chain structure is what implements **lexical scope**: a function's free variables resolve in the frame where the function was _defined_, not where it is _called_.

## Implementing the Environment

In Go, the environment is a struct with a `map` of bindings and a pointer to the parent frame. The chain is formed by following `parent` pointers — no need for a list of maps as in the F# version.

```go
type Env struct {
    bindings map[string]LispVal
    parent   *Env
}

func newEnv(parent *Env) *Env {
    return &Env{bindings: make(map[string]LispVal), parent: parent}
}

func (e *Env) lookup(name string) (LispVal, error) {
    if v, ok := e.bindings[name]; ok {
        return v, nil
    }
    if e.parent != nil {
        return e.parent.lookup(name)
    }
    return nil, fmt.Errorf("unbound variable: %s", name)
}

func (e *Env) define(name string, val LispVal) {
    e.bindings[name] = val
}

func extendEnv(params []string, args []LispVal, parent *Env) *Env {
    env := newEnv(parent)
    for i, param := range params {
        env.define(param, args[i])
    }
    return env
}
```

The `*Env` pointer in `Lambda` (Part 4) is what makes closures work: a lambda captures the `*Env` at definition time, and `extendEnv` extends that captured env — not the call-site env — when the lambda is applied.

## CS Concept: Eval and Apply

The evaluator is structured as two mutually recursive functions: `eval` and `apply`. This pairing — discovered by John McCarthy in 1960 and formalized in SICP — is the canonical architecture for tree-walking interpreters.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    EVAL["eval(expr, env)"]
    APPLY["apply(proc, args)"]

    SE["Self-evaluating\nNumber/Str/Bool\n→ return as-is"]
    SY["Symbol\n→ env.lookup in chain"]
    SF["Special form\ndefine/if/lambda/begin\n→ handled directly"]
    GA["General application\n→ eval head + all args\nthen call apply"]

    BI["Builtin\n→ call Go fn directly"]
    LA["Lambda\n→ extend closureEnv\nwith args\n→ eval body"]

    EVAL --> SE
    EVAL --> SY
    EVAL --> SF
    EVAL --> GA

    GA -->|"calls"| APPLY
    LA -->|"calls back"| EVAL

    APPLY --> BI
    APPLY --> LA

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC

    class EVAL blue
    class APPLY orange
    class SE,SY,SF,GA teal
    class BI,LA purple
```

Neither `eval` nor `apply` is simpler than the other. They are symmetric: `eval` produces values from expressions; `apply` produces values from procedures and argument values.

## The Evaluator

In Go, pattern matching on the `LispVal` interface is done with a **type switch**:

```go
func eval(expr LispVal, env *Env) (LispVal, error) {
    switch e := expr.(type) {
    case Number, Str, Bool:
        return expr, nil

    case Symbol:
        return env.lookup(e.Value)

    case List:
        if len(e.Values) == 0 {
            return Nil{}, nil
        }
        head := e.Values[0]
        args := e.Values[1:]

        // Check for special forms
        if sym, ok := head.(Symbol); ok {
            switch sym.Value {
            case "quote":
                if len(args) != 1 {
                    return nil, fmt.Errorf("quote: expects 1 argument")
                }
                return args[0], nil
            }
        }

        // General application
        proc, err := eval(head, env)
        if err != nil {
            return nil, err
        }
        evaluatedArgs := make([]LispVal, len(args))
        for i, arg := range args {
            v, err := eval(arg, env)
            if err != nil {
                return nil, err
            }
            evaluatedArgs[i] = v
        }
        return apply(proc, evaluatedArgs)

    default:
        return nil, fmt.Errorf("cannot evaluate: %T", expr)
    }
}

func apply(proc LispVal, args []LispVal) (LispVal, error) {
    switch p := proc.(type) {
    case Builtin:
        return p.Fn(args)
    case Lambda:
        if len(p.Params) != len(args) {
            return nil, fmt.Errorf("arity mismatch: expected %d, got %d",
                len(p.Params), len(args))
        }
        extended := extendEnv(p.Params, args, p.Env)
        return eval(p.Body, extended)
    default:
        return nil, fmt.Errorf("not a procedure: %T", proc)
    }
}
```

## Tracing `(* (+ 1 2) 4)`

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
sequenceDiagram
    participant C as Caller
    participant EV as eval
    participant AP as apply

    C->>EV: List{Symbol*, List{Symbol+, 1, 2}, Number 4}
    EV->>EV: eval Symbol "*" → Builtin multiply
    EV->>EV: eval List{Symbol+, 1, 2}
    note over EV: recursive call for inner expr
    EV->>EV: eval Symbol "+" → Builtin add
    EV->>EV: eval Number 1 → 1
    EV->>EV: eval Number 2 → 2
    EV->>AP: apply Builtin add [1, 2]
    AP-->>EV: Number 3
    EV->>EV: eval Number 4 → 4
    EV->>AP: apply Builtin multiply [3, 4]
    AP-->>EV: Number 12
    EV-->>C: Number 12
```

## The Substitution Model vs Environment Model: Why It Matters

Notice that `apply` for a `Lambda` extends `p.Env` — the environment captured at the time the lambda was created — not the `env` argument at the call site. This is **lexical scope**.

**Lexical scope** (Scheme — correct) — closure captures env at definition site:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    LD["define f\nas lambda using n"] --> LE["Closure captures env\nwhere lambda was defined\nwhere n is bound"]

    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    class LD,LE teal
```

**Dynamic scope** (wrong for Scheme) — would look up n in caller's environment:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    DD["define f\nas lambda using n"] --> DE["Would look up n\nin caller's environment\nunpredictable!"]

    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    class DD,DE brown
```

If we extended `env` (the call-site environment) instead of `p.Env`, we would get **dynamic scope**: a function's free variables resolve in the caller's environment. Scheme mandates lexical scope. The `Env *Env` field in `Lambda` is what enforces it.

## The Global Environment

```go
func makeGlobalEnv() *Env {
    env := newEnv(nil)

    numericBinop := func(op func(float64, float64) float64) LispVal {
        return Builtin{Fn: func(args []LispVal) (LispVal, error) {
            if len(args) != 2 {
                return nil, fmt.Errorf("expected 2 arguments, got %d", len(args))
            }
            a, ok1 := args[0].(Number)
            b, ok2 := args[1].(Number)
            if !ok1 || !ok2 {
                return nil, fmt.Errorf("expected two numbers")
            }
            return Number{Value: op(a.Value, b.Value)}, nil
        }}
    }

    env.define("+", numericBinop(func(a, b float64) float64 { return a + b }))
    env.define("-", numericBinop(func(a, b float64) float64 { return a - b }))
    env.define("*", numericBinop(func(a, b float64) float64 { return a * b }))
    env.define("/", numericBinop(func(a, b float64) float64 { return a / b }))

    env.define("=", Builtin{Fn: func(args []LispVal) (LispVal, error) {
        a, ok1 := args[0].(Number)
        b, ok2 := args[1].(Number)
        if !ok1 || !ok2 {
            return nil, fmt.Errorf("=: expects two numbers")
        }
        return Bool{Value: a.Value == b.Value}, nil
    }})

    env.define(">", Builtin{Fn: func(args []LispVal) (LispVal, error) {
        a, ok1 := args[0].(Number)
        b, ok2 := args[1].(Number)
        if !ok1 || !ok2 {
            return nil, fmt.Errorf(">: expects two numbers")
        }
        return Bool{Value: a.Value > b.Value}, nil
    }})

    env.define("car", Builtin{Fn: func(args []LispVal) (LispVal, error) {
        lst, ok := args[0].(List)
        if !ok || len(lst.Values) == 0 {
            return nil, fmt.Errorf("car: not a non-empty list")
        }
        return lst.Values[0], nil
    }})

    env.define("cdr", Builtin{Fn: func(args []LispVal) (LispVal, error) {
        lst, ok := args[0].(List)
        if !ok || len(lst.Values) == 0 {
            return nil, fmt.Errorf("cdr: not a non-empty list")
        }
        return List{Values: lst.Values[1:]}, nil
    }})

    env.define("cons", Builtin{Fn: func(args []LispVal) (LispVal, error) {
        lst, ok := args[1].(List)
        if !ok {
            return nil, fmt.Errorf("cons: second argument must be a list")
        }
        return List{Values: append([]LispVal{args[0]}, lst.Values...)}, nil
    }})

    env.define("null?", Builtin{Fn: func(args []LispVal) (LispVal, error) {
        switch v := args[0].(type) {
        case List:
            return Bool{Value: len(v.Values) == 0}, nil
        case Nil:
            return Bool{Value: true}, nil
        default:
            return Bool{Value: false}, nil
        }
    }})

    return env
}
```

## Testing the Evaluator So Far

The examples below use a small `mustRead` helper that panics on parse errors — convenient for inline test expressions:

```go
func mustRead(s string) LispVal {
    v, err := read(s)
    if err != nil { panic(err) }
    return v
}
```

```go
env := makeGlobalEnv()

v, _ := eval(mustRead("42"), env)
// → Number{Value: 42}

v, _ = eval(mustRead("(+ 1 2)"), env)
// → Number{Value: 3}

v, _ = eval(mustRead("(* (+ 1 2) (- 5 3))"), env)
// → Number{Value: 6}

v, _ = eval(mustRead("(car (cons 1 (cons 2 (cons 3 ()))))"), env)
// → Number{Value: 1}
```

We cannot yet evaluate `(define x 10)` or `(lambda (x) x)` — those require special form handling, which is Part 4.

## Summary

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    A["LispVal tree\n(from Part 2)"]
    B["eval"]
    C["apply"]
    D["*Env chain\n(struct with parent pointer)"]
    E["LispVal result"]

    A --> B
    D --> B
    B <-->|"mutual recursion"| C
    C --> E

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class A,D blue
    class B,C orange
    class E teal
```

The environment model maintains a chain of `*Env` frames mapping names to values. `eval` and `apply` form a mutually recursive pair. The closure's captured `*Env` (not the call-site env) is used when applying a lambda — this is what enforces lexical scope.

In [Part 4](/en/learn/software-engineering/compilers-and-interpreters/lisp-interpreter-in-golang/part-4-special-forms-and-closures), we add `define`, `if`, `lambda`, and `begin` — the forms that make the evaluator Turing-complete and introduce closures.
