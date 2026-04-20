---
title: "Part 3: Environments and Evaluation"
weight: 100003
date: 2026-04-20T00:00:00+07:00
draft: false
description: "The environment model, eval/apply mutual recursion, and the core evaluation loop — the heart of every interpreter"
tags: ["compilers", "interpreters", "environment-model", "evaluation", "f-sharp", "computer-science"]
---

With parsing complete, we now have `LispVal` trees. The evaluator's job is to give them meaning. This part introduces the two foundational concepts that underlie every interpreter: the **environment model** and the **eval/apply** mutual recursion.

## CS Concept: Two Models of Evaluation

There are two mental models for how a programming language evaluates expressions.

**Substitution model** — replace names with values before evaluating:

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
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

```fsharp
type Env = Map<string, LispVal ref>

let envLookup (name: string) (envChain: Env list) : LispVal =
    let rec search = function
        | [] -> failwith $"Unbound variable: {name}"
        | frame :: rest ->
            match Map.tryFind name frame with
            | Some v -> !v
            | None -> search rest
    search envChain

let envDefine (name: string) (value: LispVal) (frame: Env ref) : unit =
    frame := Map.add name (ref value) !frame

let envExtend (bindings: (string * LispVal) list) (parent: Env list) : Env list =
    let frame = ref Map.empty
    List.iter (fun (k, v) -> envDefine k v frame) bindings
    !frame :: parent
```

The environment is represented as `Env list` — a list of frames, innermost first. `envExtend` creates a new frame and prepends it to the parent chain.

## CS Concept: Eval and Apply

The evaluator is structured as two mutually recursive functions: `eval` and `apply`. This pairing — discovered by John McCarthy in 1960 and formalized in SICP — is the canonical architecture for tree-walking interpreters.

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart LR
    EVAL["eval(expr, env)"]
    APPLY["apply(proc, args, env)"]

    SE["Self-evaluating\nNumber/Str/Bool\n→ return as-is"]
    SY["Symbol\n→ envLookup in chain"]
    SF["Special form\ndefine/if/lambda/begin\n→ handled directly"]
    GA["General application\n→ eval head + all args\nthen call apply"]

    BI["Builtin\n→ call F# fn directly"]
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

```fsharp
let rec eval (expr: LispVal) (env: Env list) : LispVal =
    match expr with
    | Number _ | Str _ | Bool _ -> expr
    | Symbol name -> envLookup name env
    | List [] -> Nil
    | List (head :: args) ->
        match head with
        | Symbol "quote" ->
            match args with
            | [x] -> x
            | _ -> failwith "quote: expects exactly one argument"
        | _ ->
            let proc = eval head env
            let evaluatedArgs = List.map (fun a -> eval a env) args
            apply proc evaluatedArgs env
    | _ -> failwith $"Cannot evaluate: {expr}"

and apply (proc: LispVal) (args: LispVal list) (env: Env list) : LispVal =
    match proc with
    | Builtin f -> f args
    | Lambda (parms, body, closureEnv) ->
        if parms.Length <> args.Length then
            failwith $"Arity mismatch: expected {parms.Length}, got {args.Length}"
        let extendedEnv = envExtend (List.zip parms args) closureEnv
        eval body extendedEnv
    | _ -> failwith $"Not a procedure: {proc}"
```

## Tracing `(* (+ 1 2) 4)`

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
sequenceDiagram
    participant C as Caller
    participant EV as eval
    participant AP as apply

    C->>EV: List [Symbol "*"; List [Symbol "+"; 1; 2]; Number 4]
    EV->>EV: eval Symbol "*" → Builtin multiply
    EV->>EV: eval List [Symbol "+"; 1; 2]
    note over EV: recursive call for inner expr
    EV->>EV: eval Symbol "+" → Builtin add
    EV->>EV: eval Number 1 → 1
    EV->>EV: eval Number 2 → 2
    EV->>AP: apply Builtin add [1; 2]
    AP-->>EV: Number 3
    EV->>EV: eval Number 4 → 4
    EV->>AP: apply Builtin multiply [3; 4]
    AP-->>EV: Number 12
    EV-->>C: Number 12
```

## The Substitution Model vs Environment Model: Why It Matters

Notice that `apply` for a `Lambda` extends `closureEnv` — the environment captured at the time the lambda was created — not the `env` argument to `apply`. This is **lexical scope**.

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
    DD["define f\nas lambda using n"] --> DE["Would look up n\nin caller's environment\npredictable!"]

    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    class DD,DE brown
```

If we extended `env` (the call-site environment) instead of `closureEnv`, we would get **dynamic scope**: a function's free variables resolve in the caller's environment. Scheme mandates lexical scope. The `closureEnv` field in `Lambda` is what enforces it.

## The Global Environment

```fsharp
let numericBinop (op: float -> float -> float) (args: LispVal list) : LispVal =
    match args with
    | [Number a; Number b] -> Number (op a b)
    | _ -> failwith "Expected two numbers"

let makeGlobalEnv () : Env list =
    let frame = ref Map.empty
    let define name value = envDefine name value frame

    define "+" (Builtin (numericBinop (+)))
    define "-" (Builtin (numericBinop (-)))
    define "*" (Builtin (numericBinop (*)))
    define "/" (Builtin (numericBinop (/)))
    define "=" (Builtin (fun args ->
        match args with
        | [Number a; Number b] -> Bool (a = b)
        | _ -> failwith "= expects two numbers"))
    define ">" (Builtin (fun args ->
        match args with
        | [Number a; Number b] -> Bool (a > b)
        | _ -> failwith "> expects two numbers"))
    define "car" (Builtin (fun args ->
        match args with
        | [List (h :: _)] -> h
        | _ -> failwith "car: not a non-empty list"))
    define "cdr" (Builtin (fun args ->
        match args with
        | [List (_ :: t)] -> List t
        | _ -> failwith "cdr: not a non-empty list"))
    define "cons" (Builtin (fun args ->
        match args with
        | [h; List t] -> List (h :: t)
        | _ -> failwith "cons: expects value and list"))
    define "null?" (Builtin (fun args ->
        match args with
        | [List []] | [Nil] -> Bool true
        | [_] -> Bool false
        | _ -> failwith "null?: expects one argument"))

    [!frame]
```

## Testing the Evaluator So Far

```fsharp
let env = makeGlobalEnv ()

eval (read "42") env
// → Number 42.0

eval (read "(+ 1 2)") env
// → Number 3.0

eval (read "(* (+ 1 2) (- 5 3))") env
// → Number 6.0

eval (read "(car (cons 1 (cons 2 (cons 3 ()))))") env
// → Number 1.0
```

We cannot yet evaluate `(define x 10)` or `(lambda (x) x)` — those require special form handling, which is Part 4.

## Summary

```mermaid
%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
flowchart TB
    A["LispVal tree\n(from Part 2)"]
    B["eval"]
    C["apply"]
    D["Env chain\n(frame list)"]
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

The environment model maintains a chain of frames mapping names to values. `eval` and `apply` form a mutually recursive pair. The closure's captured environment (not the call-site environment) is used when applying a lambda — this is what enforces lexical scope.

In [Part 4](/en/learn/software-engineering/compilers-and-interpreters/lisp-interpreter-in-fsharp/part-4-special-forms-and-closures), we add `define`, `if`, `lambda`, and `begin` — the forms that make the evaluator Turing-complete and introduce closures.
