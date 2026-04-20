---
title: "Part 6: Tail-Call Optimization"
weight: 100006
date: 2026-04-20T00:00:00+07:00
draft: false
description: "Tail position, tail-call optimization, the loop-based evaluator transform, and the trampoline pattern — stack-safe recursion without cheating"
tags: ["compilers", "interpreters", "tail-call-optimization", "tco", "trampoline", "f-sharp", "computer-science"]
---

The interpreter from Part 5 is correct but fragile: deep recursion overflows the F# call stack. This is not an implementation detail — Scheme's R5RS standard mandates that tail calls must not consume stack space. This part explains why, and implements TCO by transforming the evaluator into a loop.

## CS Concept: The Call Stack

When a function calls another function, the runtime pushes a **stack frame** onto the call stack. The frame stores the caller's local variables and the return address — where execution should resume after the callee returns.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph Stack["Call stack for (fact 4)"]
        direction TB
        F0["fact(0)\nn=0, return 1\n← top of stack"]
        F1["fact(1)\nn=1, waiting for fact(0)"]
        F2["fact(2)\nn=2, waiting for fact(1)"]
        F3["fact(3)\nn=3, waiting for fact(2)"]
        F4["fact(4)\nn=4, waiting for fact(3)"]
        Main["main\n← bottom of stack"]

        F0 --- F1 --- F2 --- F3 --- F4 --- Main
    end

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05

    class F0 blue
    class F1,F2,F3,F4,Main orange
```

For `fact(5)` that is 6 frames. For `fact(1000000)`, it is one million frames — and a stack overflow.

## CS Concept: Tail Position

A **tail call** is a function call that is the _last thing a function does before returning_. Its result becomes the caller's result with no further computation.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph NotTail["NOT a tail call — result is used further"]
        NT1["(define fact (lambda (n)\n  (if (= n 0) 1\n    (* n (fact (- n 1))))))"]
        NT2["(fact (- n 1)) returns\nthen multiply by n\n→ caller frame must stay alive"]
        NT1 --> NT2
    end

    subgraph Tail["Tail call — result returned directly"]
        T1["(define fact-iter (lambda (n acc)\n  (if (= n 0) acc\n    (fact-iter (- n 1) (* n acc)))))"]
        T2["(fact-iter ...) result IS\nthe return value\n→ caller frame is useless immediately"]
        T1 --> T2
    end

    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class NT1,NT2 brown
    class T1,T2 teal
```

**Tail-call optimization** replaces the recursive call with a jump back to the start of the function, reusing the existing frame. Stack depth stays constant regardless of iteration count.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph NoTCO["Without TCO — stack grows"]
        direction TB
        A1["fact-iter(5,1)"]
        A2["fact-iter(4,5)"]
        A3["fact-iter(3,20)"]
        A4["fact-iter(2,60)"]
        A5["fact-iter(1,120)"]
        A6["fact-iter(0,120)"]
        A1 --> A2 --> A3 --> A4 --> A5 --> A6
    end

    subgraph TCO["With TCO — constant stack"]
        direction TB
        B1["fact-iter frame\nn=5, acc=1"]
        B2["update n=4, acc=5\n(same frame reused)"]
        B3["update n=3, acc=20"]
        B4["...120 iterations...\nstill ONE frame"]
        B1 --> B2 --> B3 --> B4
    end

    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class A1,A2,A3,A4,A5,A6 brown
    class B1,B2,B3,B4 teal
```

## Why F# TCO Is Not Enough

F# natively supports tail recursion — the compiler emits a `tail.` IL instruction for tail-recursive `let rec` functions. So why does our Scheme interpreter still overflow?

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph FSharp["F# tail call (handled automatically)"]
        FS1["eval calls itself\nin tail position\n→ F# optimizes this"]
    end

    subgraph Scheme["Scheme tail call (must be handled explicitly)"]
        SC1["eval calls apply\napply calls eval\n→ NOT a direct F# tail call"]
        SC2["eval → apply → eval → apply → ...\neach arrow = new F# stack frame"]
        SC1 --> SC2
    end

    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161

    class FS1 teal
    class SC1,SC2 brown
```

F# TCO operates on _F# functions_. Scheme's TCO guarantee must be implemented explicitly by the interpreter — it is a property of the _hosted_ language, not the _host_ language. Both F# and Scheme have TCO, but they are different guarantees at different levels of abstraction.

## Identifying Tail Positions in the Evaluator

Before transforming the evaluator, we must identify which `eval` calls are in tail position — those whose result is returned directly without further computation.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    EV["eval(expr, env)"]

    subgraph NotTailPos["NOT tail position — result used further"]
        NT1["eval test in (if test ...)\n→ result used to branch"]
        NT2["eval operator in (f a b)\n→ result used as procedure"]
        NT3["eval each arg in (f a b)\n→ result collected into list"]
    end

    subgraph TailPos["Tail position — result returned directly"]
        TP1["eval consequent in\n(if #t consequent alt)"]
        TP2["eval alternate in\n(if #f conseq alternate)"]
        TP3["eval last expr in\n(begin e1 e2 ... last)"]
        TP4["eval body in\n(lambda ...) application"]
        TP5["eval expanded form in\n(let ...) / (cond ...)"]
    end

    EV --> NotTailPos
    EV --> TailPos

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class EV blue
    class NT1,NT2,NT3 brown
    class TP1,TP2,TP3,TP4,TP5 teal
```

## The Loop Transform

Instead of calling `eval` recursively at tail positions, we update `currentExpr` and `currentEnv` and let the `while` loop restart. No new stack frame is created.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph Before["Before: recursive (creates stack frames)"]
        B1["eval consequent env"]
        B2["→ new F# stack frame"]
        B1 --> B2
    end

    subgraph After["After: loop (reuses frame)"]
        A1["currentExpr ← consequent"]
        A2["currentEnv ← env"]
        A3["continue while loop"]
        A1 --> A2 --> A3
    end

    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class B1,B2 brown
    class A1,A2,A3 teal
```

```fsharp
let rec eval (expr: LispVal) (env: Env list) : LispVal =
    let mutable currentExpr = expr
    let mutable currentEnv  = env
    let mutable result      = None

    while result.IsNone do
        match currentExpr with
        | Number _ | Str _ | Bool _ ->
            result <- Some currentExpr

        | Symbol name ->
            result <- Some (envLookup name currentEnv)

        | List [] -> result <- Some Nil

        | List (Symbol "if" :: rest) ->
            match rest with
            | [test; consequent; alternate] ->
                match eval test currentEnv with   // test: NOT tail position
                | Bool false -> currentExpr <- alternate    // LOOP
                | _          -> currentExpr <- consequent   // LOOP
            | [test; consequent] ->
                match eval test currentEnv with
                | Bool false -> result <- Some Nil
                | _          -> currentExpr <- consequent   // LOOP
            | _ -> failwith "if: bad syntax"

        | List (Symbol "begin" :: exprs) ->
            match exprs with
            | [] -> result <- Some Nil
            | _  ->
                List.take (exprs.Length - 1) exprs
                |> List.iter (fun e -> eval e currentEnv |> ignore)
                currentExpr <- List.last exprs              // LOOP

        | List (Symbol "define" :: rest) ->
            evalDefine rest currentEnv |> ignore
            result <- Some Nil

        | List (Symbol "lambda" :: rest) ->
            result <- Some (evalLambda rest currentEnv)

        | List (Symbol "let"  :: rest)    -> currentExpr <- desugarLet rest    // LOOP
        | List (Symbol "cond" :: clauses) -> currentExpr <- desugarCond clauses // LOOP

        | List (Symbol "quote" :: [x]) -> result <- Some x

        | List (head :: args) ->
            let proc          = eval head currentEnv
            let evaluatedArgs = List.map (fun a -> eval a currentEnv) args
            match proc with
            | Builtin f -> result <- Some (f evaluatedArgs)
            | Lambda (parms, body, closureEnv) ->
                if parms.Length <> evaluatedArgs.Length then
                    failwith $"Arity mismatch: expected {parms.Length}, got {evaluatedArgs.Length}"
                currentEnv  <- envExtend (List.zip parms evaluatedArgs) closureEnv
                currentExpr <- body                          // LOOP — the key!
            | _ -> failwith $"Not a procedure: {proc}"

        | _ -> failwith $"Cannot evaluate: {currentExpr}"

    result.Value
```

## The Trampoline Pattern

The loop transform keeps `eval` iterative internally. An alternative that keeps `eval` recursive is the **trampoline**: a loop that repeatedly calls a function as long as it returns a deferred computation (a thunk) rather than a final value.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph Trampoline["Trampoline loop"]
        T1["Call f()"]
        T2{"Result?"}
        T3["Done(value)\n→ return value"]
        T4["Bounce(thunk)\n→ call thunk()"]
        T1 --> T2
        T2 -->|"Done"| T3
        T2 -->|"Bounce"| T4
        T4 -->|"loop"| T2
    end

    subgraph TailCase["Tail call in eval"]
        TC1["Instead of:\neval body closureEnv"]
        TC2["Return:\nBounce (fun () → eval body closureEnv)"]
        TC1 --> TC2
    end

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class T1,T2,T3,T4 blue
    class TC1,TC2 teal
```

```fsharp
type EvalResult =
    | Done   of LispVal
    | Bounce of (unit -> EvalResult)

let trampoline (f: unit -> EvalResult) : LispVal =
    let mutable result = f ()
    while (match result with Bounce _ -> true | _ -> false) do
        result <- match result with Bounce thunk -> thunk () | r -> r
    match result with Done v -> v | _ -> failwith "impossible"
```

## Loop Transform vs Trampoline

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph LT["Loop transform"]
        LT1["Stack depth: O(1) for tail calls"]
        LT2["Style: imperative while loop"]
        LT3["Allocation: none per iteration"]
        LT4["Clarity: explicit, easy to audit"]
    end

    subgraph TR["Trampoline"]
        TR1["Stack depth: O(1) for tail calls"]
        TR2["Style: functional, type-safe"]
        TR3["Allocation: one thunk per bounce"]
        TR4["Clarity: elegant pattern"]
    end

    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC

    class LT1,LT2,LT3,LT4 teal
    class TR1,TR2,TR3,TR4 purple
```

Both are correct. The loop transform is what Norvig uses in lispy2; the trampoline is more common in functional language implementations.

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

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph WithoutTCO["Without TCO — 1,000,000 frames"]
        W1["count-down(1000000)"]
        W2["count-down(999999)"]
        W3["count-down(999998)"]
        Wd["... 999,997 more frames ..."]
        We["Stack overflow 💥"]
        W1 --> W2 --> W3 --> Wd --> We
    end

    subgraph WithTCO["With TCO — 1 frame (while loop iterates)"]
        T1["currentExpr = (count-down 999999)\ncurrentEnv  = {n→999999}"]
        T2["currentExpr = (count-down 999998)\ncurrentEnv  = {n→999998}"]
        T3["... 1,000,000 iterations ...\nstill ONE frame"]
        T4["\"done\""]
        T1 --> T2 --> T3 --> T4
    end

    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class W1,W2,W3,Wd,We brown
    class T1,T2,T3,T4 teal
```

```scheme
(count-down 1000000)
; → "done"  (no overflow, O(1) stack)
```

## CS Concept: Continuation-Passing Style

The trampoline is closely related to **continuation-passing style** (CPS) — a program transformation where every function takes an extra argument (the continuation) representing "what to do next". CPS makes all calls tail calls by construction.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph Direct["Direct style"]
        D1["fact(n)\n= n * fact(n-1)"]
        D2["Result flows back\nthrough call stack"]
        D1 --> D2
    end

    subgraph CPS["Continuation-passing style"]
        C1["fact_cps(n, k)\n= fact_cps(n-1, fun r → k(n*r))"]
        C2["Result passed forward\nto continuation k"]
        C3["No stack growth\nfor tail calls"]
        C1 --> C2 --> C3
    end

    subgraph Uses["CPS enables"]
        U1["call/cc\n(capture + resume continuations)"]
        U2["async/await\n(desugared CPS)"]
        U3["Coroutines & generators"]
        U4["Compiler IR\n(CPS is a common intermediate repr)"]
    end

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73

    class D1,D2 blue
    class C1,C2,C3 orange
    class U1,U2,U3,U4 teal
```

Our interpreter does not implement `call/cc`, but the trampoline pattern gives a taste of the underlying idea: instead of returning a value, you return a description of what to compute next.

## The Complete Interpreter: All Six Parts

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    subgraph P2["Part 2: Front End"]
        direction LR
        src["(fact 5)"] --> tok["tokenize"] --> par["parse"] --> ast["LispVal tree"]
    end

    subgraph P3["Part 3: Eval/Apply Core"]
        direction LR
        ev["eval"] <-->|"mutual recursion"| ap["apply"]
        en["Env chain"] --> ev
    end

    subgraph P4["Part 4: Special Forms"]
        direction LR
        sf["define · if · lambda · begin"] --> cl["Closures\ncapture env"]
    end

    subgraph P5["Part 5: Sugar + REPL"]
        direction LR
        ds["let · cond\n(desugar)"] --> rp["REPL loop\nread→eval→print"]
    end

    subgraph P6["Part 6: TCO"]
        direction LR
        lp["while loop\nreplace tail eval calls"] --> ss["O(1) stack\nfor tail calls"]
    end

    P2 --> P3 --> P4 --> P5 --> P6

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC
    classDef gray fill:#808080,color:#fff,stroke:#808080

    class P2 blue
    class P3 orange
    class P4 teal
    class P5 purple
    class P6 gray
```

## Summary

| Concept        | What it means                                                         | How we implemented it                                 |
| -------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Tail position  | A call whose result is returned directly, with no further computation | Identified in `if`, `begin`, `lambda` application     |
| TCO obligation | R5RS requires tail calls not grow the stack                           | Loop transform in `eval`                              |
| Host vs hosted | F#'s own TCO ≠ Scheme's TCO                                           | Explicit `while` loop; F# can't do this automatically |
| Loop transform | Replace tail-position `eval` calls with variable updates + loop       | `currentExpr <- body` instead of `eval body env`      |
| Trampoline     | Return thunks at tail positions; loop re-invokes them                 | Alternative functional approach; same O(1) depth      |

**Next steps** (not covered in this series):

- **Macros** — `define-macro` or `define-syntax`: user-defined syntactic transformations
- **Continuations** — `call/cc`: capture and resume the call stack as a first-class value
- **The full R5RS library** — strings, characters, vectors, ports, I/O procedures
- **Proper tail recursion in `map`** — the builtin `map` above is not itself tail-recursive
