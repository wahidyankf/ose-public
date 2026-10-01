---
title: "Part 6: Tail-Call Optimization"
weight: 200006
date: 2026-04-20T00:00:00+07:00
draft: false
description: "Tail position, tail-call optimization, the loop-based evaluator transform, and the trampoline pattern — stack-safe recursion in Go"
tags: ["compilers", "interpreters", "tail-call-optimization", "tco", "trampoline", "golang", "computer-science"]
---

The interpreter from Part 5 is correct but fragile: deep recursion overflows the Go call stack. This is not an implementation detail — Scheme's R5RS standard mandates that tail calls must not consume stack space. This part explains why, and implements TCO by transforming the evaluator into a `for` loop.

## CS Concept: The Call Stack

When a function calls another function, the runtime pushes a **stack frame** onto the call stack. The frame stores the caller's local variables and the return address — where execution should resume after the callee returns.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: CS Concept: The Call Stack
    accDescr: Flowchart with 6 nodes and 5 connections. Nodes: fact(0) n=0, return 1 ← top of stack, fact(1) n=1, waiting for fact(0), fact(2) n=2, waiting for fact(1), fact(3) n=3, waiting for fact(2), fact(4) n=4, waiting for fact(3), main ← bottom of stack. Connections: fact(0) n=0, return 1 ← top of stack to fact(1) n=1, waiting for fact(0), fact(1) n=1, waiting for fact(0) to fact(2) n=2, waiting for fact(1), fact(2) n=2, waiting for fact(1) to fact(3) n=3, waiting for fact(2), fact(3) n=3, waiting for fact(2) to fact(4) n=4, waiting for fact(3), fact(4) n=4, waiting for fact(3) to main ← bottom of stack.
    subgraph Stack["Call stack for (fact<br/>4)"]
        direction TB
        F0["fact(0)<br/>n=0, return 1<br/>← top of stack"]
        F1["fact(1)<br/>n=1, waiting for<br/>fact(0)"]
        F2["fact(2)<br/>n=2, waiting for<br/>fact(1)"]
        F3["fact(3)<br/>n=3, waiting for<br/>fact(2)"]
        F4["fact(4)<br/>n=4, waiting for<br/>fact(3)"]
        Main["main<br/>← bottom of stack"]

        F0 --- F1 --- F2 --- F3 --- F4 --- Main
    end

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000

    class F0 blue
    class F1,F2,F3,F4,Main orange
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

For `fact(5)` that is 6 frames. For `fact(1000000)`, it is one million frames — and a stack overflow.

## CS Concept: Tail Position

A **tail call** is a function call that is the _last thing a function does before returning_. Its result becomes the caller's result with no further computation.

**NOT a tail call** — result of recursive call is used in a further multiplication:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Tail Position
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: fact uses (* n (fact (- n 1))), fact returns then multiply by n caller frame stays alive. Connections: fact uses (* n (fact (- n 1))) to fact returns then multiply by n caller frame stays alive.
    NT1["fact uses<br/>(* n (fact (- n 1)))"] --> NT2["fact returns<br/>then multiply by n<br/>caller frame stays<br/>alive"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class NT1,NT2 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Tail call** — recursive call is the last thing; result returned directly:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Tail Position
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: fact-iter uses (fact-iter (- n 1) (* n acc)), result IS the return value caller frame immediately useless. Connections: fact-iter uses (fact-iter (- n 1) (* n acc)) to result IS the return value caller frame immediately useless.
    T1["fact-iter uses<br/>(fact-iter (- n 1)<br/>(* n acc))"] --> T2["result IS the return<br/>value<br/>caller frame<br/>immediately useless"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class T1,T2 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Tail-call optimization** replaces the recursive call with a jump back to the start of the function, reusing the existing frame. Stack depth stays constant regardless of iteration count.

**Without TCO** — each call pushes a new frame, O(n) stack:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Tail Position
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: fact-iter(5,1), fact-iter(4,5), fact-iter(3,20), ..., fact-iter(0,120). Connections: fact-iter(5,1) to fact-iter(4,5), fact-iter(4,5) to fact-iter(3,20), fact-iter(3,20) to ..., ... to fact-iter(0,120).
    A1["fact-iter(5,1)"] --> A2["fact-iter(4,5)"] --> A3["fact-iter(3,20)"] --> A4["..."] --> A5["fact-iter(0,120)"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class A1,A2,A3,A4,A5 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**With TCO** — same frame reused each iteration, O(1) stack:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Tail Position
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: frame: n=5 acc=1, frame: n=4 acc=5, frame: n=3 acc=20, ...done. Connections: frame: n=5 acc=1 to frame: n=4 acc=5, frame: n=4 acc=5 to frame: n=3 acc=20, frame: n=3 acc=20 to ...done.
    B1["frame: n=5 acc=1"] --> B2["frame: n=4 acc=5"] --> B3["frame: n=3 acc=20"] --> B4["...done"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class B1,B2,B3,B4 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Why Go's Runtime Gives Us No Help

Go does not perform tail-call optimization. Every function call — including a tail call — pushes a new goroutine stack frame. Go's goroutine stacks _grow dynamically_ (starting at 8KB, growing as needed), so you won't see a stack overflow as quickly as in languages with fixed stacks. But a loop over one million tail calls still allocates one million frames on the heap — memory, not immediate overflow.

**Go function call** — no TCO, every call grows the goroutine stack:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: Why Gos Runtime Gives Us No Help
    accDescr: Flowchart with 1 nodes and 0 connections. Nodes: eval calls apply apply calls eval Go runtime grows stack no optimization possible.
    FS1["eval calls apply<br/>apply calls eval<br/>Go runtime grows<br/>stack<br/>no optimization<br/>possible"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class FS1 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Scheme tail call** — must be implemented explicitly in the interpreter:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: Why Gos Runtime Gives Us No Help
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: eval calls apply apply calls eval, each call = new Go frame not a direct tail call. Connections: eval calls apply apply calls eval to each call = new Go frame not a direct tail call.
    SC1["eval calls apply<br/>apply calls eval"] --> SC2["each call = new Go<br/>frame<br/>not a direct tail<br/>call"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class SC1,SC2 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Unlike F# (which emits a `tail.` IL instruction for tail-recursive `let rec` functions), Go provides **no TCO at any level**. Every function call in Go — whether it is `eval` calling itself, `eval` calling `apply`, or `apply` calling back to `eval` — pushes a new goroutine stack frame. Scheme's TCO guarantee must therefore be implemented entirely by the interpreter itself. It is a property of the _hosted_ language (Scheme), not the _host_ language (Go).

## Identifying Tail Positions in the Evaluator

Before transforming the evaluator, we must identify which `eval` calls are in tail position — those whose result is returned directly without further computation.

**NOT tail position** — `eval` result is used for further computation:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: Identifying Tail Positions in the Evaluator
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: eval, test in (if test ...) result used to branch, operator in (f a b) result used as procedure, each arg in (f a b) result collected into slice. Connections: eval to test in (if test ...) result used to branch, eval to operator in (f a b) result used as procedure, eval to each arg in (f a b) result collected into slice.
    EV["eval"] --> NT1["test in (if test<br/>...)<br/>result used to<br/>branch"]
    EV --> NT2["operator in (f a b)<br/>result used as<br/>procedure"]
    EV --> NT3["each arg in (f a b)<br/>result collected<br/>into slice"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class EV blue
    class NT1,NT2,NT3 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Tail position** — `eval` result is returned directly, no further computation:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: Identifying Tail Positions in the Evaluator
    accDescr: Flowchart with 6 nodes and 5 connections. Nodes: eval, consequent in (if t ...), alternate in (if f ...), last expr in (begin ...), body in lambda application, expanded form in let /cond. Connections: eval to consequent in (if t ...), eval to alternate in (if f ...), eval to last expr in (begin ...), eval to body in lambda application, eval to expanded form in let /cond.
    EV["eval"] --> TP1["consequent in (if #t<br/>...)"]
    EV --> TP2["alternate in (if #f<br/>...)"]
    EV --> TP3["last expr in (begin<br/>...)"]
    EV --> TP4["body in lambda<br/>application"]
    EV --> TP5["expanded form in let<br/>/cond"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class EV blue
    class TP1,TP2,TP3,TP4,TP5 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## The Loop Transform

Instead of calling `eval` recursively at tail positions, we update `expr` and `env` variables and `continue` the `for` loop. No new Go stack frame is created.

**Before** — recursive call creates a new Go stack frame:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: The Loop Transform
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: return eval(body, extendedEnv), new Go goroutine stack frame. Connections: return eval(body, extendedEnv) to new Go goroutine stack frame.
    B1["return eval(body,<br/>extendedEnv)"] --> B2["new Go goroutine<br/>stack frame"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class B1,B2 brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**After** — update variables and `continue` the `for` loop instead:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: The Loop Transform
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: expr = body, env = extendedEnv, continue (jump to top of for loop). Connections: expr = body to env = extendedEnv, env = extendedEnv to continue (jump to top of for loop).
    A1["expr = body"] --> A2["env = extendedEnv"] --> A3["continue (jump to<br/>top of for loop)"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class A1,A2,A3 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```go
func eval(expr LispVal, env *Env) (LispVal, error) {
    for {
        switch e := expr.(type) {
        case Number, Str, Bool, Nil:
            return expr, nil

        case Symbol:
            return env.lookup(e.Value)

        case List:
            if len(e.Values) == 0 {
                return Nil{}, nil
            }
            head := e.Values[0]
            args := e.Values[1:]

            if sym, ok := head.(Symbol); ok {
                switch sym.Value {
                case "if":
                    test, err := eval(args[0], env)  // NOT tail position
                    if err != nil {
                        return nil, err
                    }
                    if b, ok := test.(Bool); ok && !b.Value {
                        if len(args) < 3 {
                            return Nil{}, nil
                        }
                        expr = args[2]  // LOOP ← tail call
                    } else {
                        expr = args[1]  // LOOP ← tail call
                    }
                    continue

                case "begin":
                    if len(args) == 0 {
                        return Nil{}, nil
                    }
                    for _, subExpr := range args[:len(args)-1] {
                        _, err := eval(subExpr, env)  // NOT tail position
                        if err != nil {
                            return nil, err
                        }
                    }
                    expr = args[len(args)-1]  // LOOP ← tail call
                    continue

                case "define":
                    return evalDefine(args, env)

                case "lambda":
                    return evalLambda(args, env)

                case "let":
                    expanded, err := desugarLet(args)
                    if err != nil {
                        return nil, err
                    }
                    expr = expanded  // LOOP ← tail call
                    continue

                case "cond":
                    expanded, err := desugarCond(args)
                    if err != nil {
                        return nil, err
                    }
                    expr = expanded  // LOOP ← tail call
                    continue

                case "quote":
                    return args[0], nil
                }
            }

            // General application
            proc, err := eval(head, env)  // NOT tail position
            if err != nil {
                return nil, err
            }
            evaluatedArgs := make([]LispVal, len(args))
            for i, arg := range args {
                evaluatedArgs[i], err = eval(arg, env)  // NOT tail position
                if err != nil {
                    return nil, err
                }
            }

            switch p := proc.(type) {
            case Builtin:
                return p.Fn(evaluatedArgs)
            case Lambda:
                if len(p.Params) != len(evaluatedArgs) {
                    return nil, fmt.Errorf("arity mismatch: expected %d, got %d",
                        len(p.Params), len(evaluatedArgs))
                }
                env = extendEnv(p.Params, evaluatedArgs, p.Env)
                expr = p.Body  // LOOP ← the key tail call!
                continue
            default:
                return nil, fmt.Errorf("not a procedure: %T", proc)
            }

        default:
            return nil, fmt.Errorf("cannot evaluate: %T", expr)
        }
    }
}
```

The critical lines are:

- `expr = args[1]; continue` — `if` consequent tail call
- `expr = args[len(args)-1]; continue` — `begin` last expression
- `expr = p.Body; continue` — lambda body, the most important one

None of these create a Go stack frame. The `for` loop restarts with new values of `expr` and `env`.

## The Trampoline Pattern

The loop transform keeps `eval` iterative internally. An alternative that keeps `eval` recursive is the **trampoline**: a loop that repeatedly calls a function as long as it returns a deferred computation (a thunk) rather than a final value.

**The trampoline loop** — keeps calling until a `Done` value, not a `Bounce` thunk:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: The Trampoline Pattern
    accDescr: Flowchart with 4 nodes and 4 connections. Nodes: Call f(), Result?, Done: return value, Bounce: call thunk(). Connections: Call f() to Result?, Result? to Done: return value (Done), Result? to Bounce: call thunk() (Bounce), Bounce: call thunk() to Result? (loop).
    T1["Call f()"] --> T2{"Result?"}
    T2 -->|"Done"| T3["Done: return value"]
    T2 -->|"Bounce"| T4["Bounce: call thunk()"]
    T4 -->|"loop"| T2

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    class T1,T2,T3,T4 blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Tail call in eval with trampoline** — return a thunk instead of recursing:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: The Trampoline Pattern
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Instead of: eval(body, extendedEnv), Return: ThunkExpr: body, Env: extendedEnv. Connections: Instead of: eval(body, extendedEnv) to Return: ThunkExpr: body, Env: extendedEnv.
    TC1["Instead of:<br/>eval(body,<br/>extendedEnv)"] --> TC2["Return:<br/>Thunk{Expr: body,<br/>Env: extendedEnv}"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class TC1,TC2 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```go
type Thunk struct {
    Expr LispVal
    Env  *Env
}

func trampoline(expr LispVal, env *Env) (LispVal, error) {
    current := expr
    currentEnv := env
    for {
        result, thunk, err := evalStep(current, currentEnv)
        if err != nil {
            return nil, err
        }
        if thunk == nil {
            return result, nil
        }
        current = thunk.Expr
        currentEnv = thunk.Env
    }
}
```

In this approach, `evalStep` returns either a final `LispVal` (with `thunk == nil`) or a `*Thunk` (indicating "continue from here"). The trampoline loop drives the computation without growing the call stack.

## Loop Transform vs Trampoline

**Loop transform:**

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Loop Transform vs Trampoline
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Stack depth: O(1), Style: for loop + continue, Allocation: none, Idiomatic Go. Connections: Stack depth: O(1) to Style: for loop + continue, Style: for loop + continue to Allocation: none, Allocation: none to Idiomatic Go.
    LT1["Stack depth: O(1)"] --> LT2["Style: for loop +<br/>continue"] --> LT3["Allocation: none"] --> LT4["Idiomatic Go"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class LT1,LT2,LT3,LT4 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Trampoline:**

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Loop Transform vs Trampoline
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Stack depth: O(1), Style: thunk + driver loop, One Thunk per bounce, Elegant pattern. Connections: Stack depth: O(1) to Style: thunk + driver loop, Style: thunk + driver loop to One Thunk per bounce, One Thunk per bounce to Elegant pattern.
    TR1["Stack depth: O(1)"] --> TR2["Style: thunk +<br/>driver loop"] --> TR3["One Thunk per bounce"] --> TR4["Elegant pattern"]

    classDef purple fill:#CC78BC,color:#000000,stroke:#000000
    class TR1,TR2,TR3,TR4 purple
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Both are correct. The loop transform is idiomatic Go; the trampoline is more common in functional language implementations and directly mirrors the CPS transform.

## Demonstrating Stack Safety

Without TCO:

```scheme
(define count-down
  (lambda (n)
    (if (= n 0) "done"
      (count-down (- n 1)))))

(count-down 1000000)  ; Stack overflow without TCO
```

With the loop transform, `count-down` runs in O(1) stack space:

**Without TCO** — each call creates a new frame, 1,000,000 frames total:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Demonstrating Stack Safety
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: count-down(1000000), count-down(999999), count-down(999998), ... 999,997 more ..., Out of memory / goroutine stack exhausted. Connections: count-down(1000000) to count-down(999999), count-down(999999) to count-down(999998), count-down(999998) to ... 999,997 more ..., ... 999,997 more ... to Out of memory / goroutine stack exhausted.
    W1["count-down(1000000)"] --> W2["count-down(999999)"] --> W3["count-down(999998)"] --> Wd["... 999,997 more ..."] --> We["Out of memory /<br/>goroutine stack<br/>exhausted"]

    classDef brown fill:#CA9161,color:#000000,stroke:#000000
    class W1,W2,W3,Wd,We brown
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**With TCO** — for loop updates one frame 1,000,000 times:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: Demonstrating Stack Safety
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: expr=(count-down 999999) n=999999, expr=(count-down 999998) n=999998, 1,000,000 iterations still ONE frame, done. Connections: expr=(count-down 999999) n=999999 to expr=(count-down 999998) n=999998, expr=(count-down 999998) n=999998 to 1,000,000 iterations still ONE frame, 1,000,000 iterations still ONE frame to done.
    T1["expr=(count-down<br/>999999)<br/>n=999999"] --> T2["expr=(count-down<br/>999998)<br/>n=999998"] --> T3["1,000,000 iterations<br/>still ONE frame"] --> T4["done"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class T1,T2,T3,T4 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

```scheme
(count-down 1000000)
; → "done"  (no overflow, O(1) stack)
```

## CS Concept: Continuation-Passing Style

The trampoline is closely related to **continuation-passing style** (CPS) — a program transformation where every function takes an extra argument (the continuation) representing "what to do next". CPS makes all calls tail calls by construction.

**Direct style** — result flows backward through the call stack:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    accTitle: CS Concept: Continuation-Passing Style
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: fact(n) = n * fact(n-1), result flows back through call stack. Connections: fact(n) = n * fact(n-1) to result flows back through call stack.
    D1["fact(n) = n *<br/>fact(n-1)"] --> D2["result flows back<br/>through call stack"]

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    class D1,D2 blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Continuation-passing style** — result passed forward to a continuation:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Continuation-Passing Style
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: fact_cps(n, k) = fact_cps(n-1, func(r) k(n*r) ), result passed forward to continuation k, no stack growth all calls are tail calls. Connections: fact_cps(n, k) = fact_cps(n-1, func(r) k(n*r) ) to result passed forward to continuation k, result passed forward to continuation k to no stack growth all calls are tail calls.
    C1["fact_cps(n, k)<br/>= fact_cps(n-1,<br/>func(r) { k(n*r) })"] --> C2["result passed<br/>forward<br/>to continuation k"] --> C3["no stack growth<br/>all calls are tail<br/>calls"]

    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    class C1,C2,C3 orange
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**CPS enables:**

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: CS Concept: Continuation-Passing Style
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: call/cc capture + resume, async/await desugared CPS, Coroutines generators, Compiler IR CPS intermediate repr. Connections: call/cc capture + resume to async/await desugared CPS, async/await desugared CPS to Coroutines generators, Coroutines generators to Compiler IR CPS intermediate repr.
    U1["call/cc<br/>capture + resume"] --> U2["async/await<br/>desugared CPS"] --> U3["Coroutines<br/>generators"] --> U4["Compiler IR<br/>CPS intermediate<br/>repr"]

    classDef teal fill:#029E73,color:#000000,stroke:#000000
    class U1,U2,U3,U4 teal
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Our interpreter does not implement `call/cc`, but the trampoline pattern gives a taste of the underlying idea: instead of returning a value, you return a description of what to compute next.

## The Complete Interpreter: All Six Parts

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    accTitle: The Complete Interpreter: All Six Parts
    accDescr: Flowchart with 18 nodes and 12 connections. Nodes: (fact 5), tokenize, parse, LispVal tree, eval, apply, *Env chain, define · if · lambda · begin, Closures capture *Env, let · cond (desugar), REPL loop read→eval→print, for loop + continue replace tail eval calls, and 6 more. Connections: (fact 5) to tokenize, tokenize to parse, parse to LispVal tree, eval to apply (mutual recursion), *Env chain to eval, define · if · lambda · begin to Closures capture *Env, let · cond (desugar) to REPL loop read→eval→print, for loop + continue replace tail eval calls to O(1) stack for tail calls, P2 to P3, P3 to P4, P4 to P5, P5 to P6.
    subgraph P2["Part 2: Front End"]
        direction LR
        src["(fact 5)"] --> tok["tokenize"] --> par["parse"] --> ast["LispVal tree"]
    end

    subgraph P3["Part 3: Eval/Apply<br/>Core"]
        direction LR
        ev["eval"] <-->|"mutual recursion"| ap["apply"]
        en["*Env chain"] --> ev
    end

    subgraph P4["Part 4: Special<br/>Forms"]
        direction LR
        sf["define · if · lambda<br/>· begin"] --> cl["Closures<br/>capture *Env"]
    end

    subgraph P5["Part 5: Sugar + REPL"]
        direction LR
        ds["let · cond<br/>(desugar)"] --> rp["REPL loop<br/>read→eval→print"]
    end

    subgraph P6["Part 6: TCO"]
        direction LR
        lp["for loop + continue<br/>replace tail eval<br/>calls"] --> ss["O(1) stack<br/>for tail calls"]
    end

    P2 --> P3 --> P4 --> P5 --> P6

    classDef blue fill:#0173B2,color:#FFFFFF,stroke:#000000
    classDef orange fill:#DE8F05,color:#000000,stroke:#000000
    classDef teal fill:#029E73,color:#000000,stroke:#000000
    classDef purple fill:#CC78BC,color:#000000,stroke:#000000
    classDef gray fill:#808080,color:#000000,stroke:#000000

    class P2 blue
    class P3 orange
    class P4 teal
    class P5 purple
    class P6 gray
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Summary

| Concept        | What it means                                                         | How we implemented it                                       |
| -------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Tail position  | A call whose result is returned directly, with no further computation | Identified in `if`, `begin`, lambda application             |
| TCO obligation | R5RS requires tail calls not grow the stack                           | Loop transform in `eval`                                    |
| Host vs hosted | Go's own stack growth ≠ Scheme's TCO                                  | Explicit `for` loop; Go runtime can't do this automatically |
| Loop transform | Replace tail-position `eval` calls with variable updates + continue   | `expr = body; continue` instead of `return eval(body, env)` |
| Trampoline     | Return thunks at tail positions; driver loop re-invokes them          | Alternative; same O(1) depth, more functional style         |

**Next steps** (not covered in this series):

- **Macros** — `define-macro` or `define-syntax`: user-defined syntactic transformations
- **Continuations** — `call/cc`: capture and resume the call stack as a first-class value
- **The full R5RS library** — strings, characters, vectors, ports, I/O procedures
- **Proper tail recursion in `map`** — the builtin `map` above is not itself tail-recursive
