---
title: "Advanced"
weight: 10000003
date: 2025-12-30T03:00:00+07:00
draft: false
description: "Examples 55-80: Advanced macros, component architecture, web dev, performance (75-95% coverage)"
tags: ["clojure", "tutorial", "by-example", "advanced", "macros", "component", "ring", "performance"]
---

This section covers advanced Clojure techniques from examples 55-80, achieving 75-95% topic coverage.

## Example 55: Advanced Macros - Code Walking

Macros can recursively transform nested code structures by traversing the Clojure AST as data. Code walking enables powerful transformations like auto-instrumenting all function calls in a body or rewriting specific patterns across arbitrary nesting. This technique underpins tools like `clojure.walk`, `clojure.tools.trace`, and debugger libraries that need to inspect or modify arbitrary code forms.

```mermaid
%% Macro code walking process
graph TD
    A[Code Form] --> B{Is Seq?}
    B -->|Yes| C[Map Walk Over Elements]
    B -->|No| D{Is Vector?}
    D -->|Yes| E[Vec Map Walk]
    D -->|No| F{Is Map?}
    F -->|Yes| G[Map Walk K/V Pairs]
    F -->|No| H[Transform Leaf Node]
    C --> I[Recursive Walk]
    E --> I
    G --> I
    H --> J[Return Transformed]
    I --> J

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style D fill:#DE8F05,color:#fff
    style F fill:#DE8F05,color:#fff
    style H fill:#029E73,color:#fff
    style J fill:#CC78BC,color:#fff
```

```clojure
(defmacro debug-all [& forms]                ;; => Macro accepts variadic forms
  `(do                                       ;; => Syntax-quote: template for code generation
     ~@(map (fn [form]                       ;; => map transforms each form
              `(let [result# ~form]          ;; => Eval once, gensym prevents capture collisions
                                             ;; => Unquote form for runtime eval
                 (println '~form "=>" result#)
                                             ;; => Quote form for literal display
                 result#))                   ;; => Return result from let
            forms)))                         ;; => Unquote-splice inlines mapped expressions

(debug-all
  (+ 1 2)                                    ;; => First form to debug
  (* 3 4)                                    ;; => Second form
  (/ 10 2))                                  ;; => Third form
;; => Output: (+ 1 2) => 3
;; => Output: (* 3 4) => 12
;; => Output: (/ 10 2) => 5
;; => Returns: 5 (last result from do block)

;; Recursive code walker for AST transformation
(defn walk-expr [form transform]             ;; => Takes form and transform fn
  (cond                                      ;; => Type-based dispatch
    (seq? form) (map #(walk-expr % transform) form)    ;; => Recursively walk, preserves structure
                                             ;; => Returns lazy seq of transformed elements
    (vector? form) (vec (map #(walk-expr % transform) form))  ;; => Coerce back to vector type
                                             ;; => Maintains vector semantics
    (map? form) (into {} (map (fn [[k v]] [k (walk-expr v transform)]) form))  ;; => Reconstruct map
                                             ;; => Transforms values, preserves keys
    :else (transform form)))                 ;; => Leaf node: apply transformation
                                             ;; => Base case for recursion

(walk-expr '(+ 1 (* 2 3)) #(if (number? %) (* % 10) %))
                                             ;; => Input: nested list with numbers
                                             ;; => Transform: multiply numbers by 10
;; => (+ 10 (* 20 30)) (all numeric leaves scaled, structure preserved)
                                             ;; => Non-numbers (symbols) unchanged
```

**Key Takeaway**: Code walkers enable deep transformation of arbitrarily nested code structures.

**Why It Matters**: Recursive code walking enables AST manipulation for advanced macro systems—powering DSL compilers that transform domain notation into efficient runtime code. Unlike string-based templating, code walkers preserve Clojure's data structure semantics ensuring macro transformations remain composable. Production configuration DSLs use code walkers to transform business rules into optimized query plans, achieving significant speedups by eliminating runtime interpretation overhead through compile-time optimization.

## Example 56: Macro Debugging with macroexpand

Debug macros by expanding to see generated code before evaluation. `macroexpand-1` performs a single expansion step while `macroexpand` fully expands all nested macros, letting you verify your macro produces the code you intend. This is essential for diagnosing macro bugs—comparing expansion output to handwritten code reveals hygiene issues, missing unquotes, and incorrect splicing.

```mermaid
%% Macro expansion process
graph TD
    A[Macro Form] --> B[macroexpand-1]
    B --> C[First Level Expansion]
    C --> D{More Macros?}
    D -->|Yes| E[macroexpand]
    D -->|No| F[Final Code]
    E --> G[Recursive Expansion]
    G --> F

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style E fill:#DE8F05,color:#fff
    style F fill:#CC78BC,color:#fff
```

```clojure
(defmacro when-valid [test & body]
  `(if ~test                             ;; => Syntax-quote + unquote test for runtime eval
     (do ~@body)                         ;; => Unquote-splice inlines body list
     (println "Validation failed")))

;; Expand once to see first level
(macroexpand-1 '(when-valid (pos? 5) (println "Valid")))
;; => (if (pos? 5) (do (println "Valid")) (println "Validation failed"))
                                         ;; => Expands when-valid only (inner macros not touched)

;; Expand all nested macros recursively
(macroexpand '(when-valid (pos? 5) (println "Valid")))
;; => (if (pos? 5) (do (println "Valid")) (println "Validation failed"))
                                         ;; => No nested macros in this case

;; Nested macro example showing multi-level expansion
(defmacro unless [test & body]
  `(when-valid (not ~test) ~@body))      ;; => Delegates to when-valid

(macroexpand-1 '(unless false (println "OK")))
;; => (when-valid (not false) (println "OK"))
                                         ;; => Expands unless only (when-valid remains)

(macroexpand '(unless false (println "OK")))
;; => (if (not false) (do (println "OK")) (println "Validation failed"))
                                         ;; => Fully expands both macro layers
```

**Key Takeaway**: macroexpand/macroexpand-1 reveal generated code for debugging macro behavior.

**Why It Matters**: Macro expansion tools enable REPL-driven macro development where you iteratively refine transformations by inspecting generated code—critical for debugging complex macros producing hundreds of lines. Unlike compiled languages requiring recompilation cycles, `macroexpand` provides instant feedback making macro development interactive. Production build DSL macros use expansion debugging to ensure generated code matches performance expectations, catching inefficient expansions before deployment.

## Example 57: Reader Conditionals for Multiplatform

Write portable code targeting Clojure and ClojureScript using reader conditional syntax (`#?` and `#?@`). Reader conditionals are processed before compilation, allowing platform-specific implementations of the same function in a single `.cljc` file. Use reader conditionals to share business logic between server (Clojure/JVM) and client (ClojureScript/JS) without code duplication.

```clojure
;; .cljc file (Clojure common - cross-platform source)
(ns myapp.utils)                         ;; => Works in both Clojure and ClojureScript
                                         ;; => Reader selects code branches at compile-time

(defn current-time []                    ;; => Returns current time in milliseconds
  #?(:clj  (System/currentTimeMillis)    ;; => JVM: Java System call returns millis since epoch
                                         ;; => Reader processes :clj branch on JVM
     :cljs (.getTime (js/Date.))))       ;; => JS: JavaScript Date method (reader selects at compile-time)
                                         ;; => Reader processes :cljs branch in JS

(defn log [message]                      ;; => Platform-agnostic logging interface
  #?(:clj  (println message)             ;; => JVM: outputs to *out* stream
                                         ;; => Uses Java System.out
     :cljs (.log js/console message)))   ;; => JS: browser console API
                                         ;; => Uses browser console object

;; Reader conditional splice for variadic expansion
(defn process-data [data]                ;; => Processes data with platform tag
  [data                                  ;; => First element: original data
   #?@(:clj  [(str "JVM: " data)]        ;; => JVM: #?@ splices vector CONTENTS (not nested)
                                         ;; => Result: [data "JVM: ..."]
       :cljs [(str "JS: " data)])])      ;; => JS: alternative string (returns 2-element vector)
                                         ;; => Result: [data "JS: ..."]

;; Feature expressions for platform-specific imports
#?(:clj (import 'java.util.Date)         ;; => JVM: import Java class at compile-time
                                         ;; => Makes java.util.Date available
   :cljs (def Date js/Date))             ;; => JS: bind to JS Date (enables uniform reference)
                                         ;; => Creates var pointing to JS Date constructor
```

**Key Takeaway**: Reader conditionals enable shared code with platform-specific implementations.

**Why It Matters**: Reader conditionals enable isomorphic applications sharing most logic between JVM backend and ClojureScript frontend—eliminating duplicate business logic across platforms. Unlike platform abstraction layers adding runtime overhead, reader conditionals compile to platform-native code with zero performance penalty. Production validation logic uses `.cljc` files sharing complex business rules between server-side processing and client-side validation, ensuring consistency without maintaining duplicate implementations.

## Example 58: Type Hints for Performance

Add type hints to eliminate reflection for performance in numeric and Java interop-heavy code. Without hints, the JVM uses reflection to determine types at runtime, which can be 10-100x slower than direct method dispatch. Apply hints at function boundaries and in hot loops; use `*warn-on-reflection*` to identify where reflection occurs before optimizing.

```mermaid
%% Type hint performance impact
graph TD
    A[Method Call] --> B{Type Hinted?}
    B -->|No| C[Runtime Reflection]
    B -->|Yes| D[Direct Method Call]
    C --> E[Slow: Class Lookup]
    E --> F[Slow: Method Search]
    F --> G[Finally Execute]
    D --> H[Fast: Direct Invoke]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#CA9161,color:#fff
    style D fill:#029E73,color:#fff
    style G fill:#CA9161,color:#fff
    style H fill:#029E73,color:#fff
```

```clojure
;; Without type hints (causes reflection warning)
(defn slow-add [a b]                     ;; => Parameters: no type information
                                         ;; => Compiler doesn't know a/b types
  (.add a b))                            ;; => Method call: .add requires runtime lookup
                                         ;; => JVM searches class hierarchy at runtime
                                         ;; => Reflection overhead: 10-100x slower
                                         ;; => #'user/slow-add (defined with warning)

;; With type hints (eliminates reflection)
(defn fast-add [^java.math.BigDecimal a ^java.math.BigDecimal b]
                                         ;; => Type hints: metadata on parameters
                                         ;; => Compiler knows exact types at compile-time
  (.add a b))                            ;; => Direct method invocation
                                         ;; => No reflection: JVM invokes exact method
                                         ;; => Bytecode contains direct method reference
                                         ;; => #'user/fast-add (optimized, no warning)

;; Return type hint for primitive optimization
(defn compute ^long []                   ;; => Return type hint: primitive long
                                         ;; => Prevents boxing to java.lang.Long
  (+ 1 2))                               ;; => Addition returns primitive long
                                         ;; => Result stays unboxed
                                         ;; => #'user/compute (no boxing overhead)

;; Array type hints for fast array access
(defn sum-array ^long [^longs arr]       ;; => Parameter hint: long[] primitive array
                                         ;; => Return hint: unboxed long
  (aget arr 0))                          ;; => Fast primitive array access
                                         ;; => No array type check at runtime
                                         ;; => Direct memory access
                                         ;; => #'user/sum-array (fully optimized)

;; Enable compiler warnings for reflection
(set! *warn-on-reflection* true)         ;; => Sets dynamic var to true
                                         ;; => Compiler now emits warnings
                                         ;; => Helps identify reflection hotspots
;; => true (reflection warnings enabled)

;; Measure performance difference
(time (dotimes [_ 1000000] (fast-add (bigdec 1) (bigdec 2))))
                                         ;; => Benchmark: 1 million iterations
                                         ;; => dotimes: zero-overhead loop
                                         ;; => Each iteration: fast direct invocation
;; => Output: "Elapsed time: ~X msecs" (with type hints)
                                         ;; => Compare to slow-add: 10-50x faster
```

**Key Takeaway**: Type hints eliminate reflection overhead for significant performance improvements.

**Why It Matters**: Reflection introduces significant overhead on method calls as the JVM must dynamically resolve method signatures at runtime—problematic in hot loops processing large volumes. Type hints provide compiler directives enabling direct method invocation without sacrificing dynamic typing benefits. Production calculation engines use type hints on mathematical operations achieving substantial throughput improvements on critical paths, making real-time processing viable.

## Example 59: Stateful Transducers

Transducers can maintain state across transformation steps using a mutable container held in the transducer closure. This enables stateful operations like `dedupe` (removing consecutive duplicates) or sliding-window aggregations that require memory of previous elements. Unlike stateless transducers, stateful ones use volatile mutable state (`volatile!`) for performance, following the transducer protocol for initialization and completion.

```mermaid
%% Stateful transducer flow
sequenceDiagram
    participant C as Collection
    participant T as Transducer
    participant V as Volatile State
    participant R as Reducing Function

    C->>T: Input 1
    T->>V: Read State
    V-->>T: Previous Value
    T->>V: Update State
    T->>R: Transform & Emit
    C->>T: Input 2
    T->>V: Read State
    V-->>T: Updated Value
    T->>V: Update State
    T->>R: Transform & Emit

    Note over T,V: State persists across steps
```

```clojure
(defn dedupe-consecutive []              ;; => Returns transducer removing consecutive dupes
  (fn [rf]                               ;; => Takes reducing function
    (let [prev (volatile! ::none)]       ;; => Volatile: zero CAS overhead, thread-local mutable cell
                                         ;; => Initialized to sentinel value ::none
      (fn                                ;; => Returns 3-arity reducing function
        ([] (rf))                        ;; => 0-arity: init accumulator
                                         ;; => Forwards to wrapped rf
        ([result] (rf result))           ;; => 1-arity: completion step
                                         ;; => Forwards final result
        ([result input]                  ;; => 2-arity: main reducing step
         (let [p @prev]                  ;; => Dereference volatile to get previous value
                                         ;; => First time: p is ::none
           (vreset! prev input)          ;; => Update prev to current input
                                         ;; => Side effect: stores for next iteration
           (if (= p input)               ;; => Skip consecutive duplicates
             result                      ;; => Don't call rf (skip this input)
             (rf result input))))))))    ;; => Process non-duplicate input

(into [] (dedupe-consecutive) [1 1 2 2 2 3 3 1])
                                         ;; => Applies transducer to vector
;; => [1 2 3 1] (consecutive duplicates removed, non-consecutive kept)
                                         ;; => Second 1 kept (not consecutive with first)

;; Running average stateful transducer
(defn running-average []                 ;; => Returns transducer computing running averages
  (fn [rf]                               ;; => Takes reducing function
    (let [sum (volatile! 0)              ;; => Volatile state: cumulative sum
                                         ;; => Starts at 0
          count (volatile! 0)]           ;; => Volatile state: element count
                                         ;; => Starts at 0
      (fn                                ;; => Returns 3-arity reducing function
        ([] (rf))                        ;; => 0-arity: init accumulator
        ([result] (rf result))           ;; => 1-arity: completion step
        ([result input]                  ;; => 2-arity: main reducing step
         (vswap! sum + input)            ;; => Update sum atomically
                                         ;; => vswap!: apply function to volatile
         (vswap! count inc)              ;; => Increment count
                                         ;; => count tracks number of elements seen
         (rf result (/ @sum @count)))))))
                                         ;; => Emit current average

(into [] (running-average) [1 2 3 4 5])
                                         ;; => Applies running-average transducer
;; => [1 3/2 2 5/2 3] (running averages as rationals, each element is cumulative average)
                                         ;; => 1st: 1/1, 2nd: (1+2)/2=3/2, 3rd: (1+2+3)/3=2
```

**Key Takeaway**: Volatile refs enable efficient mutable state within transducers.

**Why It Matters**: Volatile refs provide zero-overhead mutable cells for transducer-local state enabling stateful transformations (running averages, deduplication) without breaking transducer composition. Unlike atoms requiring CAS overhead, volatiles offer raw memory access for single-threaded contexts—perfect for per-thread state in parallel pipelines. Production log deduplication uses stateful transducers with volatiles processing high-volume streams with substantial memory reduction compared to storing seen entries externally.

## Example 60: Reducers with Fork-Join

Leverage reducers for parallel processing on large datasets using JVM's fork-join framework. Reducers split collections recursively until chunks are small enough to process sequentially, then merge results up the call tree. Use reducers when the reduction function is associative and the dataset is large enough that parallelism overhead is worthwhile—typically datasets with hundreds of thousands of elements.

```mermaid
%% Fork-join parallel processing
graph TD
    A[Large Collection] --> B[Split into Chunks]
    B --> C[Chunk 1]
    B --> D[Chunk 2]
    B --> E[Chunk 3]
    B --> F[Chunk 4]
    C --> G[Process in Parallel]
    D --> G
    E --> G
    F --> G
    G --> H[Combine Results]
    H --> I[Final Result]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style G fill:#029E73,color:#fff
    style H fill:#CC78BC,color:#fff
    style I fill:#029E73,color:#fff
```

```clojure
(require '[clojure.core.reducers :as r])
                                         ;; => Load reducers: parallel processing via fork-join
                                         ;; => Uses Java's ForkJoinPool

;; Transform large collection in parallel
(defn parallel-process [n]               ;; => Takes collection size
  (->> (range n)                        ;; => Generate lazy sequence 0 to n-1
                                         ;; => Lazy: not realized yet
       vec                              ;; => Convert to vector (required for fold)
                                         ;; => Fold needs indexed collection
       (r/map inc)                      ;; => Increment each element, returns reducer
                                         ;; => Reducer: lazy parallel transformation
       (r/filter even?)                 ;; => Keep only even numbers
                                         ;; => Chained reducer transformation
       (r/fold +)))                     ;; => Fork-join parallel sum, uses + as reduce fn
                                         ;; => Splits work across cores

(time (parallel-process 10000000))      ;; => Benchmark with 10 million elements
                                        ;; => time macro measures elapsed time
                                        ;; => Output: "Elapsed time: X msecs", utilizes all cores
                                        ;; => Returns sum of even numbers after inc

;; Custom combiner for parallel max
(defn parallel-max [coll]               ;; => Find max value in parallel
                                         ;; => coll must be vector (indexed)
                                         ;; => Returns maximum element
  (r/fold                                ;; => Fork-join parallel reduction
    max                                 ;; => Combine function: merges chunk results
                                         ;; => max of chunk maxes is global max
                                         ;; => Associative operation required
    (fn ([acc x] (max acc x)))          ;; => Reduce function: max within chunk
                                         ;; => 2-arity: accumulator and element
                                         ;; => Finds max sequentially per chunk
    coll))                              ;; => Input collection to process
                                        ;; => #'user/parallel-max (defined)

(parallel-max (vec (shuffle (range 1000000))))
                                        ;; => Find max of shuffled million elements
                                        ;; => shuffle randomizes order
                                        ;; => vec converts to indexed collection
;; => 999999 (max value found in parallel)
                                        ;; => Fork-join splits work across cores
                                        ;; => Work-stealing balances load

;; Control parallelism with explicit chunk size
(r/fold 512                             ;; => First arg: chunk size in elements
                                         ;; => Each task processes 512 elements
                                         ;; => Smaller chunks: more parallelism overhead
                                         ;; => Larger chunks: less parallelism
        +                               ;; => Combine function: sum chunk results
                                         ;; => Merges results from parallel tasks
                                         ;; => Must be associative
        (fn [acc x] (+ acc x))          ;; => Reduce function: sum within chunk
                                         ;; => Sequential processing per chunk
                                         ;; => Accumulates partial sum
        (vec (range 1000000)))          ;; => Process 1M element vector
                                         ;; => Creates ~1953 tasks (1M / 512)
                                         ;; => Vector enables indexed splitting
;; => Returns sum with controlled chunking
                                         ;; => Chunk size tunes parallelism granularity
                                         ;; => Tradeoff: overhead vs parallelism
```

**Key Takeaway**: Reducers enable automatic parallelization with fork-join for CPU-bound operations.

**Why It Matters**: Fork-join parallelism provides work-stealing load balancing achieving near-linear speedup on multi-core CPUs without manual thread management—critical for data-intensive analytics. Reducers automatically partition work and merge results handling load imbalance transparently. Production inventory aggregations use reducer-based parallel processing achieving significant speedup on multi-core machines, processing large update volumes efficiently versus sequential code.

## Example 61: Protocols for Polymorphism

Define protocols for extensible polymorphic operations that work across different types, including third-party Java classes. `extend-protocol` and `extend-type` add protocol implementations to existing types without modifying their source code—this is open/closed extension. Use protocols to define clean interfaces for domain abstractions and to provide consistent Clojure-style APIs for Java library types.

```mermaid
%% Protocol polymorphism
graph TD
    A[Protocol Definition] --> B[Serializable]
    B --> C[serialize method]
    B --> D[deserialize method]
    E[String Type] --> F[extend-protocol]
    G[Vector Type] --> F
    H[Date Type] --> I[extend-type]
    F --> C
    F --> D
    I --> C
    I --> D

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style F fill:#029E73,color:#fff
    style I fill:#029E73,color:#fff
```

```clojure
(defprotocol Serializable                ;; => Define protocol with two methods
  (serialize [this])                     ;; => Convert to serialized form
                                         ;; => One-arity method
  (deserialize [this data]))             ;; => Reconstruct from data
                                         ;; => Two-arity method (this ignored for deserialization)

;; Extend protocol to existing types
(extend-protocol Serializable            ;; => Extend multiple types at once
  java.lang.String                       ;; => First type: Java String
  (serialize [s] (.getBytes s))          ;; => String to byte array
                                         ;; => Uses Java String method
  (deserialize [_ data] (String. data))  ;; => byte[] to String
                                         ;; => _ ignores first arg

  clojure.lang.PersistentVector          ;; => Second type: Clojure vector
  (serialize [v] (pr-str v))             ;; => Vector to string "[1 2 3]"
                                         ;; => pr-str: print readable format
  (deserialize [_ data] (read-string data)))
                                         ;; => String to vector
                                         ;; => read-string evaluates EDN

(serialize "Hello")                      ;; => Calls String implementation
;; => #<byte[] [B@...> (byte array: "Hello")
                                         ;; => Returns byte array object

(serialize [1 2 3])                      ;; => Calls Vector implementation
;; => "[1 2 3]" (string representation)
                                         ;; => Returns EDN string

;; Inline single-type extension
(extend-type java.util.Date              ;; => Extend single type
  Serializable                           ;; => Protocol name
  (serialize [d] (.getTime d))           ;; => Date to epoch milliseconds
                                         ;; => Returns long timestamp
  (deserialize [_ data] (java.util.Date. data)))
                                         ;; => Long to Date object
                                         ;; => Date constructor takes millis

;; Check protocol implementation at runtime
(satisfies? Serializable "text")         ;; => true
                                         ;; => String implements Serializable
(satisfies? Serializable 42)             ;; => false (Integer not extended)
                                         ;; => No implementation for Integer
```

**Key Takeaway**: Protocols enable extensible polymorphism for existing and new types.

**Why It Matters**: Protocol extension to existing types (Java classes, third-party records) enables retrofitting interfaces without wrapper objects or inheritance—impossible in class-based languages. This open extension powers adapter patterns where Clojure code unifies disparate Java libraries under common protocols. Production data access layers use protocols to provide uniform interfaces over JDBC, Redis, and other clients, enabling implementation swapping without touching business logic across large codebases.

## Example 62: Multimethods with Hierarchies

Define custom type hierarchies for multimethod dispatch using `derive` and `isa?`. Custom hierarchies separate dispatch logic from code—you can define that `:cat` `isa?` `:animal` without modifying either class or record definition. This enables polymorphism that mirrors domain concepts rather than implementation inheritance, useful for message dispatch systems where message types form a natural taxonomy.

```mermaid
%% Type hierarchy for multimethods
graph TD
    A[::animal] --> B[::dog]
    A --> C[::cat]
    A --> D[::parrot]
    E[::bird] --> D

    F[speak multimethod] --> G{Dispatch on :type}
    G -->|::dog| H[Woof!]
    G -->|::cat| I[Meow!]
    G -->|::parrot| J[Inherits ::animal]
    J --> K[Some sound]

    style A fill:#0173B2,color:#fff
    style E fill:#0173B2,color:#fff
    style F fill:#DE8F05,color:#fff
    style G fill:#029E73,color:#fff
```

```clojure
;; Define custom type hierarchy
(derive ::dog ::animal)                  ;; => ::dog is-a ::animal (creates hierarchy edge)
                                         ;; => Global hierarchy modified
(derive ::cat ::animal)                  ;; => ::cat is-a ::animal
                                         ;; => Another ::animal child
(derive ::parrot ::animal)               ;; => ::parrot is-a ::animal
                                         ;; => Third ::animal child
(derive ::parrot ::bird)                 ;; => Multiple inheritance: ::parrot is bird AND animal
                                         ;; => ::parrot has two parents

;; Multimethod dispatching on hierarchy
(defmulti speak (fn [animal] (:type animal)))
                                         ;; => Dispatch on :type field, selects method by keyword
                                         ;; => Dispatch fn extracts :type from map

(defmethod speak ::dog [_] "Woof!")      ;; => Method for ::dog type
                                         ;; => _ ignores argument
(defmethod speak ::cat [_] "Meow!")      ;; => Method for ::cat type
(defmethod speak ::animal [_] "Some sound")
                                         ;; => Fallback: matches any ::animal subtype via hierarchy
                                         ;; => Used when no specific method exists

(speak {:type ::dog})                    ;; => Dispatches to ::dog method
;; => "Woof!" (specific implementation)
                                         ;; => Exact match on ::dog

(speak {:type ::parrot})                 ;; => No ::parrot method defined
                                         ;; => Searches hierarchy for match
;; => "Some sound" (inherits from ::animal via hierarchy)
                                         ;; => Falls back to ::animal method

;; Check type relationships
(isa? ::dog ::animal)                    ;; => true
                                         ;; => Checks hierarchy relationship
(isa? ::parrot ::bird)                   ;; => true (multiple inheritance verified)
                                         ;; => ::parrot inherits from ::bird

;; Inspect hierarchy structure
(parents ::parrot)                       ;; => Returns set of direct parents
;; => #{:user/animal :user/bird} (direct parents only)
                                         ;; => Two immediate parents

(ancestors ::dog)                        ;; => Returns all ancestors
;; => #{:user/animal} (all ancestors via transitive closure)
                                         ;; => Includes indirect ancestors
```

**Key Takeaway**: Hierarchies enable rich inheritance relationships for multimethod dispatch.

**Why It Matters**: Explicit hierarchies (`derive`, `isa?`) provide multiple inheritance without diamond problem ambiguity—enabling taxonomy-based dispatch where business domains naturally form hierarchies. Unlike single-inheritance languages requiring interface proliferation, Clojure hierarchies allow one type inheriting multiple classifications. Production financial systems use hierarchical multimethods dispatching product types across regulatory categories, features, and risk profiles simultaneously without code duplication.

## Example 63: Component Architecture

Structure applications using component lifecycle management with Stuart Sierra's component library. Components are records implementing `Lifecycle` (start/stop), and the system map wires them together with explicit dependency declarations. **Core alternative**: You could manage lifecycle with atoms and plain startup/shutdown functions, but component provides a systematic framework with dependency injection and ordered teardown—use it when your application has multiple stateful services that must start and stop in order.

```mermaid
%% Component dependency graph
graph TD
    A[System] --> B[Database Component]
    A --> C[Web Server Component]
    C -.depends on.-> B

    B --> D[start: connect]
    B --> E[stop: disconnect]
    C --> F[start: bind port]
    C --> G[stop: unbind]

    H[Start System] --> D
    D --> F
    I[Stop System] --> G
    G --> E

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#DE8F05,color:#fff
    style D fill:#029E73,color:#fff
    style F fill:#029E73,color:#fff
```

```clojure
(require '[com.stuartsierra.component :as component])
                                         ;; => Load component library
                                         ;; => Provides Lifecycle protocol

(defrecord Database [host port connection]
                                         ;; => Record with three fields
  component/Lifecycle                    ;; => Implement Lifecycle protocol
  (start [this]                          ;; => Start method initializes component
    (println "Starting database connection")
                                         ;; => Side effect: log startup
    (assoc this :connection {:host host :port port}))
                                         ;; => Simulates DB connection handle
                                         ;; => Returns new record with :connection
  (stop [this]                           ;; => Stop method tears down component
    (println "Stopping database connection")
                                         ;; => Side effect: log shutdown
    (assoc this :connection nil)))       ;; => Returns record with nil connection

(defrecord WebServer [port database handler]
                                         ;; => Record depends on database
  component/Lifecycle                    ;; => Implement Lifecycle protocol
  (start [this]                          ;; => Start method initializes server
    (println "Starting web server on port" port)
                                         ;; => Side effect: log startup
    (assoc this :handler {:port port :db (:connection database)}))
                                         ;; => Accesses injected database's connection
                                         ;; => Dependency injection provides :database field
  (stop [this]                           ;; => Stop method tears down server
    (println "Stopping web server")     ;; => Side effect: log shutdown
    (assoc this :handler nil)))          ;; => Returns record with nil handler

;; Build system with dependency injection
(defn create-system []                   ;; => Factory function builds system
  (component/system-map                  ;; => Creates component system
    :database (map->Database {:host "localhost" :port 5432})
                                         ;; => No dependencies
                                         ;; => map->Database converts map to record
    :web-server (component/using         ;; => Declares dependencies
                  (map->WebServer {:port 8080})
                                         ;; => Component to inject deps into
                  {:database :database})))
                                         ;; => Dependency injection: :database field populated from system
                                         ;; => Key in component : key in system

(def system (create-system))             ;; => Create stopped system
                                         ;; => Components not started yet
(alter-var-root #'system component/start-system)
                                         ;; => Start all components in dependency order
;; => Starting database connection
;; => Starting web server on port 8080
                                         ;; => Database starts first (no deps), then WebServer
                                         ;; => Topological sort determines order

(alter-var-root #'system component/stop-system)
                                         ;; => Stop all components in reverse order
;; => Stopping web server
;; => Stopping database connection
                                         ;; => Reverse dependency order
                                         ;; => Ensures cleanup safety
```

**Key Takeaway**: Component pattern provides dependency injection and lifecycle management for applications.

**Why It Matters**: Component library provides explicit lifecycle management (start/stop order) and dependency injection without reflection magic—critical for REPL-driven development where subsystems must reload cleanly. Dependency graphs ensure proper initialization order automatically preventing subtle startup bugs. Production microservices use Component architecture managing multiple subsystems (databases, caches, HTTP servers, message queues) with guaranteed teardown ordering preventing resource leaks during hot code reloading.

## Example 64: Mount for State Management

Alternative to Component using global state with lifecycle, where states are defined at the namespace level using `defstate`. Mount uses Clojure's var system for state management, making states accessible without threading through function signatures. **Core alternative**: Component requires explicit dependency injection; Mount trades that discipline for ease of use—choose Mount when you want simpler code at the cost of hidden global state, Component when testability and explicit wiring matter.

```clojure
(require '[mount.core :refer [defstate start stop]])
                                         ;; => Load mount: global state management

(defstate database                       ;; => Define stateful component
  :start (do                             ;; => Start lifecycle phase
           (println "Connecting to database")
                                         ;; => Side effect: log startup
           {:connection "db-conn"})      ;; => Return value becomes @database
                                         ;; => Simulated connection handle
  :stop (do                              ;; => Stop lifecycle phase
          (println "Closing database")  ;; => Side effect: log shutdown
          nil))                          ;; => Return value ignored

(defstate web-server                     ;; => Define dependent component
  :start (do                             ;; => Start lifecycle phase
           (println "Starting server with" database)
                                         ;; => References database var
           {:server "running" :db database})
                                         ;; => Dependency on database var (implicit)
                                         ;; => Mount detects via var reference
  :stop (do                              ;; => Stop lifecycle phase
          (println "Stopping server")   ;; => Side effect: log shutdown
          nil))                          ;; => Return value ignored

;; Start all states in dependency order
(start)                                  ;; => Starts all defstate components
;; => Connects DB, starts server
                                         ;; => Mount analyzes namespace dependencies for order
                                         ;; => Database starts first, then web-server

;; Access state via deref
@web-server                              ;; => Dereference to get current value
;; => {:server "running" :db {...}} (started state)
                                         ;; => Shows runtime state value

;; Stop all states in reverse dependency order
(stop)                                   ;; => Stops all running components
;; => Stops server, closes DB (reverse order)
                                         ;; => Reverse of startup order

;; Start specific state selectively
(start #'database)                       ;; => Start single component
;; => Only database starts, other states remain stopped
                                         ;; => Selective startup for testing
```

**Key Takeaway**: Mount provides simpler state management than Component with global state vars.

**Why It Matters**: Mount's defstate provides namespace-scoped lifecycle without explicit dependency graphs—reducing boilerplate for applications with simple dependency patterns. Global state vars enable direct access without threading context objects through function parameters. Internal tools use Mount for rapid prototyping where Component's explicit dependency injection adds overhead without proportional value, achieving less configuration code for microservices with linear dependency chains.

## Example 65: Ring Middleware

Build HTTP middleware for request/response transformation using Ring's simple handler/middleware pattern. Ring handlers are plain functions from request map to response map, and middleware are higher-order functions that wrap handlers—composing cleanly with `comp` or `->`. **Core alternative**: You could compose pure functions directly without Ring, but Ring provides a standard interface that the entire Clojure web ecosystem (compojure, liberator, reitit) builds on, making it the right choice for any real web application.

```mermaid
%% Ring middleware stack
sequenceDiagram
    participant R as Request
    participant L as wrap-logging
    participant A as wrap-auth
    participant H as Handler
    participant Res as Response

    R->>L: Incoming Request
    L->>L: Log request URI
    L->>A: Forward request
    A->>A: Check authorization
    A->>H: Authorized request
    H->>H: Process request
    H-->>A: Generate response
    A-->>L: Pass response
    L->>L: Log response status
    L-->>Res: Final response

    Note over L,A: Middleware applied bottom-up
```

```clojure
(require '[ring.adapter.jetty :refer [run-jetty]])
                                         ;; => Load Jetty adapter for Ring

(defn wrap-logging [handler]            ;; => Logging middleware wrapper
  (fn [request]                          ;; => Returns wrapped handler function
    (println "Request:" (:uri request))  ;; => Side effect: log request URI
    (let [response (handler request)]    ;; => Call wrapped handler
                                         ;; => Stores response for inspection
      (println "Response:" (:status response))
                                         ;; => Side effect: log response status
      response)))                        ;; => Logs before and after handler
                                         ;; => Returns response unchanged

(defn wrap-auth [handler]               ;; => Authentication middleware wrapper
  (fn [request]                          ;; => Returns wrapped handler function
    (if (get-in request [:headers "authorization"])
                                         ;; => Check for auth header
      (handler request)                  ;; => Authorized: continue
                                         ;; => Calls wrapped handler
      {:status 401 :body "Unauthorized"})))
                                         ;; => Unauthorized: short-circuit
                                         ;; => Never calls handler

;; Base handler
(defn app [request]                      ;; => Application logic handler
  {:status 200 :body "Hello, World!"})   ;; => Ring response map

;; Compose middleware (execution order: logging → auth → app)
(def wrapped-app                         ;; => Composed handler with middleware
  (-> app                                ;; => Start with base handler
      wrap-auth                          ;; => Inner layer
                                         ;; => Applied second (closer to handler)
      wrap-logging))                     ;; => Outer layer
                                         ;; => Applied first (furthest from handler)

;; Start server
;; (run-jetty wrapped-app {:port 8080})
                                         ;; => Starts Jetty on port 8080
                                         ;; => wrapped-app handles all requests
```

**Key Takeaway**: Ring middleware wraps handlers for cross-cutting concerns like auth and logging.

**Why It Matters**: Ring's middleware composition via function wrapping provides zero-overhead request pipeline building—each middleware is a simple function eliminating framework dispatch overhead. Composability enables mixing third-party and custom middleware without configuration files or annotations. Production API gateways use Ring middleware stacks processing high request volumes with minimal overhead for authentication, rate limiting, logging, and metrics—performance impossible with reflection-based frameworks.

## Example 66: Compojure Routing

Define routes with Compojure DSL for web applications built on top of Ring. Compojure provides macro-based route definitions (`GET`, `POST`, `context`) that compile to Ring handler functions, enabling readable routing tables with destructured parameters. **Core alternative**: You could pattern-match on `:uri` and `:request-method` in plain Ring handlers, but Compojure's DSL is significantly more concise and is the most widely used Clojure routing library.

```clojure
(require '[compojure.core :refer [defroutes GET POST]]
                                         ;; => Load routing macros
         '[compojure.route :as route])   ;; => Load route helpers

(defroutes app-routes                    ;; => Define all application routes
  (GET "/" [] "Home page")               ;; => Route: GET /
                                         ;; => Route: GET / (automatically wrapped in Ring response)
                                         ;; => [] means no path/query params
                                         ;; => Returns {:status 200 :body "Home page"}
  (GET "/users/:id" [id]                 ;; => Route: GET /users/:id
    (str "User ID: " id))                ;; => Route: GET /users/:id (id extracted from path)
                                         ;; => :id is path parameter
                                         ;; => [id] destructures params map

  (GET "/search" [q limit]               ;; => Route: GET /search
    (str "Search: " q " (limit: " limit ")"))
                                         ;; => Route: GET /search?q=...&limit=... (query params)
                                         ;; => [q limit] destructures query string

  (POST "/users" [name email]            ;; => Route: POST /users
                                         ;; => Expects form params or JSON
    {:status 201                         ;; => Explicit status code
     :body (str "Created user: " name)}) ;; => Route: POST /users (explicit 201 response)
                                         ;; => Returns Ring response map

  (route/not-found "Not found"))         ;; => Fallback 404 for unmatched routes
                                         ;; => Catches all unmatched requests

;; Ring request/response contract
;; Request: {:uri "/users/123" :request-method :get :headers {...} ...}
                                         ;; => Clojure map representing HTTP request
;; Response: {:status 200 :body "..." :headers {...}}
                                         ;; => Clojure map representing HTTP response
```

**Key Takeaway**: Compojure provides concise DSL for HTTP routing with parameter extraction.

**Why It Matters**: Compojure's routing DSL compiles to efficient Clojure functions without runtime pattern matching overhead—providing Rails-like expressiveness with zero performance penalty. Destructuring syntax in routes enables parameter extraction without manual parsing. Production webhook handlers use Compojure routing managing many endpoints with pattern matching, parameter validation, and content negotiation in concise code versus verbose imperative routing logic.

## Example 67: HTTP Client with clj-http

Make HTTP requests using clj-http library, which wraps Apache HttpClient with a Clojure-friendly data-driven API. Requests are configured via plain maps and responses are returned as maps with `:status`, `:headers`, and `:body`. **Core alternative**: `java.net.http.HttpClient` (Java 11+) or `clojure.java.io` work for simple cases, but clj-http provides automatic JSON decoding, cookie management, connection pooling, and proxy support that would require significant boilerplate with raw Java APIs.

```clojure
(require '[clj-http.client :as http])    ;; => Load HTTP client library

;; Simple GET request
(let [response (http/get "https://api.example.com/users/1")]
                                         ;; => Makes HTTP GET request
                                         ;; => Returns Ring response map
  (println (:status response))           ;; => HTTP status (200, etc.)
                                         ;; => Extract status code from response
  (println (:body response)))            ;; => Response body string
                                         ;; => Extract body content

;; GET with query parameters
(http/get "https://api.example.com/search"
                                         ;; => Base URL without query string
          {:query-params {:q "clojure" :limit 10}})
                                         ;; => Automatic URL encoding (?q=clojure&limit=10)
                                         ;; => Map converted to query string

;; POST with JSON body
(http/post "https://api.example.com/users"
                                         ;; => Makes HTTP POST request
           {:content-type :json          ;; => Sets Content-Type header
            :body (json/write-str {:name "Alice" :email "alice@example.com"})})
                                         ;; => Serializes map to JSON string
                                         ;; => json/write-str converts to JSON

;; Automatic JSON parsing
(http/get "https://api.example.com/users/1"
                                         ;; => Makes HTTP GET request
          {:as :json})                   ;; => :as :json enables JSON parsing
                                         ;; => Parses JSON to Clojure map
                                         ;; => Response body is Clojure map

;; Headers and authentication with error handling
(http/get "https://api.example.com/private"
                                         ;; => Makes authenticated request
          {:headers {"Authorization" "Bearer TOKEN"}
                                         ;; => Custom headers map
           :throw-exceptions false})     ;; => Disables exception throwing
                                         ;; => Returns response even for 4xx/5xx errors
                                         ;; => Default: throws on non-2xx status
```

**Key Takeaway**: clj-http simplifies HTTP requests with automatic JSON handling and configuration.

**Why It Matters**: clj-http provides declarative HTTP with automatic content negotiation, connection pooling, and retry logic—eliminating boilerplate for most API integration use cases. Automatic JSON parsing integrates seamlessly with Clojure's data-driven architecture avoiding DTO serialization overhead. Production origination systems use clj-http for external integrations with automatic retry, timeout, and circuit breaker patterns reducing integration code significantly.

## Example 68: Database Access with next.jdbc

Access relational databases using next.jdbc, the modern Clojure JDBC wrapper designed for performance and simplicity. next.jdbc returns results as plain Clojure maps, integrates with HikariCP connection pooling, and supports both SQL strings and parameterized queries. **Core alternative**: Raw `java.sql.Connection` and `PreparedStatement` work but require verbose resource management; next.jdbc provides automatic resource cleanup, reducible result sets for large queries, and idiomatic Clojure data return.

```clojure
(require '[next.jdbc :as jdbc]           ;; => Load JDBC wrapper
         '[next.jdbc.sql :as sql])       ;; => Load SQL convenience functions

(def db {:dbtype "postgresql"            ;; => Database config map
         :dbname "myapp"                 ;; => Database name
         :host "localhost"               ;; => Database host
         :user "postgres"                ;; => Username
         :password "secret"})            ;; => Password

;; Query with parameterized SQL
(sql/query db ["SELECT * FROM users WHERE id = ?" 1])
                                         ;; => Parameterized query (? placeholder)
                                         ;; => 1 fills ? placeholder
;; => [{:users/id 1 :users/name "Alice" :users/email "..."}]
                                         ;; => Returns vector of maps, prevents SQL injection
                                         ;; => Qualified keywords (:users/id) prevent collisions

;; Insert row into table
(sql/insert! db :users {:name "Bob" :email "bob@example.com"})
                                         ;; => :users is table name
                                         ;; => Map keys become columns
;; => {:users/id 2 :users/name "Bob" :users/email "bob@example.com"}
                                         ;; => Returns inserted row with generated ID
                                         ;; => Auto-incremented ID returned

;; Update existing row
(sql/update! db :users {:email "newemail@example.com"} ["id = ?" 1])
                                         ;; => :users is table name
                                         ;; => First map: columns to update
                                         ;; => Second arg: WHERE clause
;; => {:next.jdbc/update-count 1}
                                         ;; => Returns update count (1 row modified)
                                         ;; => Count indicates affected rows

;; Delete row from table
(sql/delete! db :users ["id = ?" 2])     ;; => :users is table name
                                         ;; => WHERE clause with parameter
;; => {:next.jdbc/update-count 1}
                                         ;; => Returns delete count (1 row removed)
                                         ;; => Count indicates deleted rows

;; Transaction: all-or-nothing semantics
(jdbc/with-transaction [tx db]           ;; => tx is transactional connection
                                         ;; => Begins transaction
  (sql/insert! tx :users {:name "Charlie"})
                                         ;; => First insert in transaction
  (sql/insert! tx :orders {:user_id 3 :amount 100}))
                                         ;; => Second insert in transaction
;; => All-or-nothing commit (both inserts or rollback both)
                                         ;; => Commits if no exception
                                         ;; => Rollbacks if exception thrown
```

**Key Takeaway**: next.jdbc provides modern JDBC wrapper with transactions and named parameters.

**Why It Matters**: next.jdbc provides zero-overhead JDBC access returning native Clojure maps without ORM complexity—achieving bare-metal database performance while maintaining functional programming benefits. Qualified keywords for columns (`:users/id`) prevent naming collisions across joined tables. Production transaction processing uses next.jdbc achieving high database operation throughput with connection pooling and prepared statements, matching hand-tuned Java JDBC performance while remaining more concise.

## Example 69: Spec Generative Testing

Generate test data automatically from specs using `clojure.spec.gen.alpha` and `test.check`. Generators infer from spec predicates how to produce valid random values—`pos-int?` generates positive integers, `string?` generates strings, and composite specs generate matching maps. Property-based testing runs the same property assertion against hundreds of random inputs, finding edge cases that manually written examples miss.

```mermaid
%% Spec generative testing flow
graph TD
    A[Spec Definition] --> B[s/def specs]
    B --> C[s/gen Generator]
    C --> D[gen/sample]
    D --> E[Random Valid Data]

    A --> F[s/fdef Function Spec]
    F --> G[stest/check]
    G --> H[Generate Inputs]
    H --> I[Run Function]
    I --> J[Validate Output]
    J --> K{Valid?}
    K -->|Yes| L[Test Passes]
    K -->|No| M[Counterexample Found]

    style A fill:#0173B2,color:#fff
    style C fill:#DE8F05,color:#fff
    style G fill:#DE8F05,color:#fff
    style L fill:#029E73,color:#fff
    style M fill:#CC78BC,color:#fff
```

```clojure
(require '[clojure.spec.alpha :as s]    ;; => Load spec library
         '[clojure.spec.gen.alpha :as gen]
                                         ;; => Load spec generators
         '[clojure.spec.test.alpha :as stest])
                                         ;; => Load spec testing

(s/def ::age (s/and int? #(<= 0 % 120)))
                                         ;; => Spec: integer between 0-120
                                         ;; => s/and: both predicates must pass
(s/def ::name (s/and string? #(< 0 (count %) 50)))
                                         ;; => Spec: non-empty string max 50 chars
                                         ;; => Anonymous fn checks length
(s/def ::email (s/and string? #(re-matches #".+@.+\..+" %)))
                                         ;; => Spec: email pattern (text@text.text)
                                         ;; => re-matches validates format

(s/def ::user (s/keys :req [::name ::age ::email]))
                                         ;; => Spec: map with three required keys
                                         ;; => :req specifies mandatory keys

;; Generate sample data from spec
(gen/sample (s/gen ::age))               ;; => Generate 10 random ages
;; => [0 1 0 0 2 ...] (random valid ages)
                                         ;; => All satisfy ::age spec

(gen/sample (s/gen ::user))              ;; => Generate 10 random users
;; => [{::name "a" ::age 0 ::email "a@b.c"} ...]
                                         ;; => All satisfy ::user spec

;; Property-based testing with specs
(s/fdef create-user                      ;; => Function spec
  :args (s/cat :name ::name :age ::age :email ::email)
                                         ;; => Args spec: named sequence
  :ret ::user)                           ;; => Return spec: ::user map

(defn create-user [name age email]       ;; => Function to test
  {::name name ::age age ::email email}) ;; => Constructs user map

(stest/check `create-user {:num-tests 100})
                                         ;; => Run generative tests
;; => Run 100 generated tests with pass/fail and counterexamples
                                         ;; => Generates random args satisfying :args spec
                                         ;; => Validates return satisfies :ret spec
```

**Key Takeaway**: Spec generators enable automatic property-based testing from specifications.

**Why It Matters**: Generative testing from specs discovers edge cases by generating thousands of valid inputs exercising code paths manual tests miss—critical for financial systems where rare conditions cause monetary errors. Specs serve dual purpose as runtime validation and test data generators eliminating separate mock data infrastructure. Production systems have discovered critical edge cases in financial calculations via spec generative testing that manual unit tests with high code coverage completely missed.

## Example 70: test.check for Property Testing

Write generative property-based tests using test.check, Clojure's port of QuickCheck. Properties are universally quantified assertions that must hold for all generated inputs, and test.check provides shrinking—when a failing input is found, it automatically reduces it to the minimal failing example. Property-based tests complement unit tests by exploring the input space systematically rather than testing specific handpicked cases.

```clojure
(require '[clojure.test.check :as tc]   ;; => Load test.check framework
         '[clojure.test.check.generators :as gen]
                                         ;; => Load generators
         '[clojure.test.check.properties :as prop])
                                         ;; => Load property macros

;; Property: reverse twice equals original (involution)
(def reverse-property                    ;; => Define property to test
  (prop/for-all [v (gen/vector gen/int)]
                                         ;; => Generates random vectors
                                         ;; => gen/vector: random size vectors
                                         ;; => gen/int: random integers
    (= v (reverse (reverse v)))))        ;; => Property: reversing twice is identity
                                         ;; => Mathematical property: (reverse ∘ reverse) = id

(tc/quick-check 100 reverse-property)    ;; => Run 100 random tests
;; => {:result true :num-tests 100 :seed 1234567890}
                                         ;; => All 100 tests passed
                                         ;; => Seed enables reproducibility

;; Property: sort is idempotent
(def sort-property                       ;; => Define idempotence property
  (prop/for-all [v (gen/vector gen/int)]
                                         ;; => Generates random integer vectors
    (= (sort v) (sort (sort v)))))       ;; => Sorting twice equals sorting once
                                         ;; => Idempotence: f(f(x)) = f(x)

(tc/quick-check 100 sort-property)       ;; => Run 100 random tests
;; => {:result true :num-tests 100}
                                         ;; => Property holds for all inputs

;; Custom generator for domain-specific data
(def email-gen                           ;; => Custom email generator
  (gen/fmap                              ;; => Transform generated data
    (fn [[name domain]] (str name "@" domain ".com"))
                                         ;; => Combine parts into email
    (gen/tuple                           ;; => Generate tuple of strings
      (gen/not-empty gen/string-alphanumeric)
                                         ;; => Username part
                                         ;; => Ensures non-empty
      (gen/not-empty gen/string-alphanumeric))))
                                         ;; => Domain part
                                         ;; => Ensures non-empty

(gen/sample email-gen)                   ;; => Generate 10 sample emails
;; => ["a@b.com" "c@d.com" ...] (valid email formats)
                                         ;; => All match email pattern
```

**Key Takeaway**: test.check enables property-based testing with custom generators.

**Why It Matters**: Property-based testing shifts focus from example-based assertions to invariant validation—testing "sort is idempotent" rather than "sort([3,1,2]) = [1,2,3]". Custom generators enable domain-specific test data (valid email formats, business rule constraints) impossible with random data. Production configuration validators use property-based testing generating many random valid configs discovering parsing bugs that example-based tests with high coverage never triggered.

## Example 71: Performance Profiling

Profile code to identify performance bottlenecks using criterium, the Clojure benchmarking library. Criterium accounts for JVM warmup by running the code repeatedly until the JIT compiler stabilizes, then measures statistically sound results with mean, standard deviation, and percentiles. **Core alternative**: Clojure's built-in `time` macro measures wall-clock time for quick checks, but criterium provides JVM-accurate benchmarks essential for performance optimization decisions—use `time` for rough estimates, criterium for rigorous comparisons.

```mermaid
%% Performance profiling workflow
graph TD
    A[Code to Profile] --> B[crit/bench]
    B --> C[JVM Warmup]
    C --> D[Multiple Iterations]
    D --> E[Statistical Analysis]
    E --> F[Timing Report]

    A --> G[time macro]
    G --> H[Single Execution]
    H --> I[Elapsed Time]

    A --> J[Memory Profiling]
    J --> K[Before Memory]
    K --> L[Execute Function]
    L --> M[After Memory]
    M --> N[Memory Delta]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style F fill:#029E73,color:#fff
    style I fill:#029E73,color:#fff
    style N fill:#029E73,color:#fff
```

```clojure
(require '[criterium.core :as crit])     ;; => Load benchmarking library

;; Function to benchmark: recursive fibonacci
(defn fib [n]                            ;; => Naive recursive implementation
  (if (<= n 1)                           ;; => Base cases: fib(0)=0, fib(1)=1
    n
    (+ (fib (- n 1)) (fib (- n 2)))))    ;; => Exponential time complexity
                                         ;; => O(2^n) due to redundant calculations

(crit/bench (fib 20))                    ;; => Comprehensive benchmark
;; => Detailed timing statistics (mean, std dev, percentiles, CI)
                                         ;; => JVM warmup + multiple iterations
                                         ;; => Accounts for JIT compilation

;; Quick benchmark (fewer iterations)
(crit/quick-bench (reduce + (range 10000)))
                                         ;; => Faster benchmark, still accounts for JIT
                                         ;; => Less statistical rigor than bench

;; Simple timing with time macro
(time (reduce + (range 1000000)))        ;; => Measure elapsed time
;; => "Elapsed time: X msecs"
                                         ;; => Single execution measurement
                                         ;; => Not statistically rigorous

;; Memory profiling function
(defn measure-memory [f]                 ;; => Takes function to profile
  (let [runtime (Runtime/getRuntime)     ;; => Get JVM runtime
        before (.totalMemory runtime)]   ;; => Memory before execution
    (f)                                  ;; => Execute function
    (let [after (.totalMemory runtime)]  ;; => Memory after execution
      (- after before))))                ;; => Returns memory delta in bytes
                                         ;; => Approximate heap change

(measure-memory #(vec (range 1000000)))  ;; => Profile vector creation
;; => Memory used in bytes (approximate heap allocation)
                                         ;; => Shows heap usage for 1M element vector
```

**Key Takeaway**: Criterium provides accurate benchmarking accounting for JVM warmup and GC.

**Why It Matters**: JVM's JIT compiler and GC introduce measurement variance making simple timing unreliable—early measurements may be significantly slower than steady-state performance. Criterium performs statistical analysis over thousands of iterations after warmup providing confidence intervals. Production performance testing uses Criterium detecting small regressions reliably where naive timing shows high variance, enabling continuous performance monitoring catching optimization regressions before deployment.

## Example 72: Memoization for Performance

Cache function results for repeated calls with same arguments using `memoize`. Clojure's `memoize` creates a new function that caches results in an atom-backed map, returning cached values on subsequent calls with identical arguments. Use memoization for pure functions with expensive computation and repeated inputs; be aware that the cache grows unboundedly—for production use, consider libraries like core.memoize that provide eviction policies.

```mermaid
%% Memoization cache flow
graph TD
    A[Function Call] --> B{In Cache?}
    B -->|Yes| C[Return Cached Result]
    B -->|No| D[Compute Result]
    D --> E[Store in Cache]
    E --> F[Return Result]

    G[First Call fib 35] --> D
    D --> H[~5 seconds]
    H --> E
    I[Second Call fib 35] --> B
    B --> C
    C --> J[Instant: 0ms]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style D fill:#CA9161,color:#fff
    style F fill:#029E73,color:#fff
```

```clojure
(defn slow-fib [n]                       ;; => Naive recursive fibonacci
  (if (<= n 1)                           ;; => Base case: fib(0)=0, fib(1)=1
    n
    (+ (slow-fib (- n 1)) (slow-fib (- n 2)))))
                                         ;; => Exponential time O(2^n)
                                         ;; => Recalculates same values repeatedly

(time (slow-fib 35))                     ;; => Measure execution time
;; => ~5 seconds (millions of redundant calculations)
                                         ;; => fib(35) calls fib(34) + fib(33), etc.

;; Memoized version with automatic caching
(def fast-fib (memoize slow-fib))        ;; => Cache: args → result map, thread-safe
                                         ;; => memoize wraps function with caching

(time (fast-fib 35))                     ;; => First call populates cache
;; => ~5 seconds first time (populates cache during recursion)
                                         ;; => Each unique n cached once

(time (fast-fib 35))                     ;; => Second call uses cache
;; => Instant (~0ms) (cached, no recomputation)
                                         ;; => Cache lookup, not computation

;; Custom memoization with bounded cache size
(defn memoize-limited [f limit]          ;; => Custom memoization with size limit
  (let [cache (atom {})]                 ;; => Mutable cache, thread-safe via atom
    (fn [& args]                         ;; => Variadic wrapper function
      (if-let [result (get @cache args)] ;; => Check cache for args
        result                           ;; => Cache hit
                                         ;; => Return cached result
        (let [result (apply f args)]     ;; => Cache miss: compute
          (swap! cache (fn [c]           ;; => Update cache atomically
                        (if (>= (count c) limit)
                                         ;; => Cache full check
                          {args result}  ;; => Evict all, keep only new entry
                                         ;; => Simple eviction strategy
                          (assoc c args result))))
                                         ;; => Add to cache
          result)))))                    ;; => Return computed result

(def limited-fib (memoize-limited slow-fib 10))
                                         ;; => Max 10 cached entries (prevents memory growth)
                                         ;; => Bounded cache for long-running processes
```

**Key Takeaway**: Memoization trades memory for speed caching expensive computation results.

**Why It Matters**: Automatic memoization via `memoize` provides transparent caching for pure functions eliminating manual cache management—critical for recursive algorithms with overlapping subproblems. Thread-safe cache ensures concurrent access correctness without explicit synchronization. Production pricing engines use memoization for regulatory calculations invoked many times with identical inputs, reducing computation time substantially while maintaining referential transparency enabling easy testing and debugging.

## Example 73: AOT Compilation

Ahead-of-time compile for faster startup and deployment by converting Clojure namespaces to JVM bytecode before runtime. AOT compilation eliminates the Clojure compiler startup overhead and enables tools like GraalVM native-image to create small native executables. AOT is primarily needed for deployment artifacts (uberjars, Docker images) and rarely needed during development where the REPL handles compilation incrementally.

```clojure
;; project.clj (Leiningen configuration)
{:aot [myapp.core]                       ;; => Ahead-of-time compile, generates .class files
                                         ;; => Lists namespaces to AOT compile
 :main myapp.core                        ;; => Entry point namespace
                                         ;; => Specifies -main function location
 :uberjar-name "myapp-standalone.jar"}   ;; => Output JAR filename
                                         ;; => Self-contained deployment artifact

;; myapp/core.clj (Application entry point)
(ns myapp.core                           ;; => Define namespace
  (:gen-class))                          ;; => Generate Java class for java -jar execution
                                         ;; => Creates main class with static main method

(defn -main [& args]                     ;; => Entry point function
                                         ;; => - prefix indicates Java interop
  (println "Starting application...")    ;; => Startup message
  (println "Args:" args))                ;; => Print command-line arguments

;; Build commands (shell)
;; lein compile
                                         ;; => AOT compiles, generates .class files
                                         ;; => Creates target/classes/myapp/core.class

;; lein uberjar
                                         ;; => Creates standalone JAR with all deps
                                         ;; => Bundles Clojure runtime and dependencies

;; Run compiled application
;; java -jar target/myapp-standalone.jar arg1 arg2
                                         ;; => Runs standalone JAR (no Clojure required)
                                         ;; => arg1 arg2 passed to -main as args
```

**Key Takeaway**: AOT compilation produces standalone JARs with faster startup times.

**Why It Matters**: AOT compilation eliminates runtime compilation overhead reducing startup time significantly—critical for serverless deployments where cold start latency impacts user experience. Compiled bytecode enables Java tooling integration (profilers, debuggers) and deployment to restricted environments prohibiting dynamic code generation. Production containerized agents use AOT-compiled uberjars achieving fast startup versus slow dynamic compilation, enabling rapid autoscaling responding to traffic spikes.

## Example 74: Logging with timbre

Structured logging with timbre library provides flexible, data-rich log output configurable at runtime. Timbre logs Clojure data structures directly, supports custom appenders (file, database, email), and enables per-namespace log level configuration. **Core alternative**: `clojure.tools.logging` wraps SLF4J/Logback for interoperability with Java logging infrastructure; `println` works for scripts—use timbre when you want Clojure-native structured logging, tools.logging when your organization requires Java logging standards.

```clojure
(require '[taoensso.timbre :as log])     ;; => Load timbre logging library

;; Configure global logging level
(log/set-level! :info)                   ;; => Set minimum log level
                                         ;; => Levels: :trace, :debug, :info, :warn, :error, :fatal
                                         ;; => Only :info and above logged

;; Log messages at different levels
(log/info "Application started")         ;; => Info-level log
;; => [INFO] Application started
                                         ;; => Timestamp, level, message

(log/warn "Low memory" {:free-mb 50})    ;; => Warning with data
;; => [WARN] Low memory {:free-mb 50}
                                         ;; => Structured data in log

(log/error "Connection failed" (Exception. "Timeout"))
                                         ;; => Error with exception
                                         ;; => Exception with stack trace
                                         ;; => Full stack trace printed

;; Structured logging with pure data
(log/info {:event :user-login            ;; => Log as pure data map
           :user-id 123                  ;; => Structured fields
           :ip "192.168.1.1"})           ;; => IP address field
                                         ;; => Machine-parseable data for log aggregation
                                         ;; => JSON-compatible output

;; Conditional logging with spy
(log/spy (* 2 3))                        ;; => Log expression and result
;; => Returns 6 (logs expression and result)
                                         ;; => Logs: "(* 2 3) => 6"
                                         ;; => Non-invasive debugging

;; Custom appenders for output destinations
(log/merge-config!                       ;; => Merge config with defaults
  {:appenders                            ;; => Appender configuration
   {:file {:enabled? true                ;; => Enable file appender
           :fn (fn [data]                ;; => Appender function
                 (spit "app.log"         ;; => Write to file
                       (str (:output_ data) "\n")
                                         ;; => Formatted log message
                       :append true))}}})
                                         ;; => Logs to app.log file (appends to existing)
                                         ;; => Multiple appenders supported
```

**Key Takeaway**: Timbre provides flexible logging with structured data and custom appenders.

**Why It Matters**: Structured logging with data maps enables machine parsing for log aggregation and alerting—critical for production debugging where grep-based log analysis fails at scale. Custom appenders enable simultaneous console, file, and remote logging without code changes. Production microservices use Timbre structured logging processing high-volume log events with automatic correlation IDs, enabling distributed request tracing across many services where traditional string logs would require complex parsing.

## Example 75: JSON and EDN Parsing

Parse and generate JSON and EDN data formats using clojure.data.json and the built-in clojure.edn. JSON is the universal external interchange format; EDN is Clojure's native extensible data notation that preserves keywords, symbols, and tagged literals. **Core alternative**: For pure Clojure services, prefer EDN over JSON—it round-trips Clojure data structures losslessly (preserving keyword vs string distinction) and supports custom tagged literals; use JSON only when interoperating with non-Clojure clients.

```clojure
(require '[clojure.data.json :as json]  ;; => Load JSON library
         '[clojure.edn :as edn])         ;; => Load EDN library

;; JSON parsing and generation
(def json-str "{\"name\":\"Alice\",\"age\":30}")
                                         ;; => JSON string to parse

(json/read-str json-str)                 ;; => Parse JSON with string keys
;; => {"name" "Alice" "age" 30} (string keys)
                                         ;; => Default: string keys

(json/read-str json-str :key-fn keyword) ;; => Parse with keyword conversion
;; => {:name "Alice" :age 30} (keyword keys)
                                         ;; => :key-fn transforms keys

(json/write-str {:name "Bob" :age 25})   ;; => Serialize map to JSON
;; => "{\"name\":\"Bob\",\"age\":25}"
                                         ;; => Keywords become strings

;; EDN parsing (Clojure's native data format)
(def edn-str "{:name \"Alice\" :age 30 :roles #{:admin :user}}")
                                         ;; => EDN string with keywords and set

(edn/read-string edn-str)                ;; => Parse EDN to Clojure data
;; => {:name "Alice" :age 30 :roles #{:admin :user}}
                                         ;; => Preserves keywords and sets (round-trips perfectly)
                                         ;; => Sets preserved (JSON can't)

(pr-str {:name "Bob" :age 25})           ;; => Serialize to EDN
;; => "{:name \"Bob\", :age 25}"
                                         ;; => Preserves Clojure types

;; EDN supports types unavailable in JSON
(pr-str {:date #inst "2025-12-30"        ;; => Instant literal
         :uuid #uuid "550e8400-e29b-41d4-a716-446655440000"
                                         ;; => UUID literal
         :tags #{:clojure :lisp}})       ;; => Set literal
                                         ;; => EDN tags preserve Clojure types
                                         ;; => #inst, #uuid are tagged literals
```

**Key Takeaway**: EDN preserves Clojure types better than JSON for Clojure-to-Clojure communication.

**Why It Matters**: EDN as data interchange format preserves Clojure types (keywords, sets, UUIDs, instants) eliminating serialization boilerplate required with JSON—critical for microservice communication where type fidelity matters. EDN's extensibility enables custom type serialization via tagged literals without schema evolution complexity. Production build systems use EDN preserving semantic types (dates, UUIDs) avoiding the string-to-type conversion bugs plaguing JSON-based systems processing many configurations.

## Example 76: Building Uberjars

Package application with all dependencies into standalone JAR for simple, portable deployment. An uberjar bundles the Clojure runtime, all library JARs, and your compiled application into a single executable file—no classpath configuration or dependency installation required on the target machine. Both deps.edn (with depstar/tools.build) and Leiningen support uberjar creation; deps.edn is the modern approach for new projects.

```clojure
;; deps.edn approach (tools.deps configuration)
{:aliases                                ;; => Alias definitions
 {:uberjar                               ;; => Uberjar build alias
  {:replace-deps {com.github.seancorfield/depstar {:mvn/version "2.1.303"}}
                                         ;; => Build tool dependency
   :exec-fn hf.depstar/uberjar           ;; => Function to execute
   :exec-args {:jar "target/myapp.jar"   ;; => Output JAR path
               :main-class myapp.core    ;; => Entry point class
               :aot true}}}}             ;; => Enable AOT compilation

;; Build uberjar command (shell)
;; clj -X:uberjar
                                         ;; => Compiles and packages standalone JAR
                                         ;; => -X executes alias function

;; Run standalone JAR (shell)
;; java -jar target/myapp.jar
                                         ;; => Self-contained deployment
                                         ;; => No Clojure installation required

;; Leiningen approach (project.clj)
{:main myapp.core                        ;; => Main namespace
 :aot [myapp.core]                       ;; => AOT compile namespace
 :uberjar-name "myapp-standalone.jar"}   ;; => Output JAR name

;; Build uberjar with Leiningen (shell)
;; lein uberjar
                                         ;; => Creates standalone JAR with all deps
                                         ;; => Bundles Clojure runtime
```

**Key Takeaway**: Uberjars bundle application and dependencies for simple deployment.

**Why It Matters**: Uberjars provide single-file deployment artifacts containing application and all dependencies—eliminating classpath hell and dependency conflicts in production environments. Zero-dependency deployment simplifies container images reducing image sizes compared to exploded classpaths. Production microservices use uberjar deployment achieving smaller container images with separate dependency management, enabling faster deployment cycles and reliable rollback operations.

## Example 77: Environment Configuration

Manage environment-specific configuration using environment variables and the environ library for a clean twelve-factor app approach. environ reads environment variables and .lein-env/profiles.clj files, providing a unified configuration source regardless of deployment environment. Use environment variables for secrets and deployment-specific settings (database URLs, API keys) and default values in code for optional configuration.

```clojure
(require '[environ.core :refer [env]])   ;; => Load environ library

;; Read from environment variables
(def db-url (env :database-url))         ;; => Reads DATABASE_URL env var
                                         ;; => Returns string value or nil
(def port (Integer/parseInt (env :port "8080")))
                                         ;; => PORT env var with default "8080"
                                         ;; => Converts string to integer

;; Development config file: .lein-env
;; {:database-url "jdbc:postgresql://localhost/dev"
;;  :port "3000"}
                                         ;; => Dev mode: environ loads this file
                                         ;; => EDN map with config values

;; Production environment variables (shell)
;; export DATABASE_URL=jdbc:postgresql://prod-host/db
                                         ;; => Set DATABASE_URL env var
;; export PORT=8080
                                         ;; => Set PORT env var

;; Config map pattern (structured configuration)
(defn load-config []                     ;; => Config loader function
  {:database {:url (env :database-url)   ;; => Database config section
              :user (env :db-user)       ;; => Username from env
              :password (env :db-password)}
                                         ;; => Password from env
   :server {:port (Integer/parseInt (env :port "8080"))
                                         ;; => Server port with default
            :host (env :host "0.0.0.0")} ;; => Server host with default
   :logging {:level (keyword (env :log-level "info"))}})
                                         ;; => Log level with default

(def config (load-config))               ;; => Load config at startup
                                         ;; => Prevents runtime env changes
                                         ;; => Config immutable after load
```

**Key Takeaway**: Environment variables enable configuration without code changes across environments.

**Why It Matters**: Environment-based configuration enables 12-factor app compliance where config lives outside code—critical for promoting identical artifacts across dev/staging/production. Runtime configuration eliminates recompilation for environment changes reducing deployment risk. Production deployment pipelines use environment variables for many configuration parameters enabling zero-downtime canary deployments where config changes apply without code redeployment, reducing change-related incidents.

## Example 78: Production Deployment Checklist

Best practices for deploying Clojure applications to production cover JVM tuning, health checks, graceful shutdown, and observability. Production Clojure applications run as uberjars in containers with explicit JVM memory limits, structured logging to stdout, and liveness/readiness endpoints for orchestration platforms. These practices apply whether deploying to bare metal, VMs, or Kubernetes—the patterns are consistent across environments.

```mermaid
%% Production deployment pipeline
graph TD
    A[Development] --> B[AOT Compilation]
    B --> C[Build Uberjar]
    C --> D[JVM Tuning]
    D --> E[Configure Logging]
    E --> F[Health Checks]
    F --> G[Graceful Shutdown]
    G --> H[Error Handling]
    H --> I[Connection Pooling]
    I --> J[Deploy to Production]
    J --> K[Monitor & Alert]

    style A fill:#0173B2,color:#fff
    style C fill:#DE8F05,color:#fff
    style F fill:#029E73,color:#fff
    style J fill:#029E73,color:#fff
    style K fill:#CC78BC,color:#fff
```

```clojure
;; 1. AOT compilation for faster startup
;;    :aot [myapp.core] in project.clj
                                         ;; => Compiles to .class files, millisecond startup

;; 2. Uberjar for standalone deployment
;;    lein uberjar or clj -X:uberjar
                                         ;; => Packages app + all dependencies

;; 3. JVM tuning for production
;;    java -Xmx2g -server -jar myapp.jar
                                         ;; => -Xmx2g: max heap, -server: optimized JIT

;; 4. Logging configuration from environment
(log/set-level! (keyword (env :log-level "info")))
(log/merge-config!
  {:appenders {:file {:enabled? true}}})
                                         ;; => File appender persists logs for debugging

;; 5. Health check endpoint for monitoring
(GET "/health" []
  {:status 200 :body "OK"})              ;; => Load balancer polls this endpoint

;; 6. Graceful shutdown for clean resource cleanup
(defn shutdown-hook []
  (println "Shutting down...")
  (stop))                                ;; => Stop components (DB, servers, etc.)

(.addShutdownHook (Runtime/getRuntime)
                  (Thread. shutdown-hook))
                                         ;; => Triggered on SIGTERM, SIGINT, JVM exit

;; 7. Error handling middleware for reliability
(defn wrap-error-handling [handler]
  (fn [request]
    (try
      (handler request)
      (catch Exception e
        (log/error e "Request failed")
        {:status 500 :body "Internal error"}))))
                                         ;; => Prevents unhandled exceptions crashing app

;; 8. Database connection pooling for performance
;; Use HikariCP with next.jdbc
                                         ;; => Connection pool: reuse DB connections
```

**Key Takeaway**: Production deployment requires AOT compilation, proper JVM tuning, logging, and error handling.

**Why It Matters**: Production readiness checklist prevents common deployment failures—startup time optimization, graceful shutdown, health checks, and error handling are foundational for reliability. JVM tuning (heap size, GC settings) prevents OutOfMemoryErrors and pauses impacting user experience. Production deployments use comprehensive checklists reducing incidents significantly, achieving high uptime through systematic verification of logging, monitoring, connection pooling, and graceful degradation before traffic exposure.

## Example 79: ClojureScript Basics

Write frontend code in ClojureScript compiling to JavaScript while sharing code and libraries with Clojure server code. ClojureScript uses the Google Closure Compiler for advanced dead-code elimination, producing optimized JavaScript bundles. Reagent (React wrapper) and re-frame (state management) are the dominant ClojureScript frontend frameworks, enabling full-stack Clojure development with a single language across server and browser.

```clojure
;; src/myapp/core.cljs (ClojureScript source file)
(ns myapp.core                           ;; => ClojureScript namespace
  (:require [reagent.core :as r]))       ;; => Load Reagent (React wrapper)

;; Reagent component using React
(defn counter []                         ;; => Reagent component function
  (let [count (r/atom 0)]                ;; => Reactive state, changes trigger re-render
                                         ;; => r/atom creates reactive atom
    (fn []                               ;; => Render function (called on each render)
      [:div                              ;; => Hiccup syntax (Clojure vectors as HTML)
       [:h1 "Count: " @count]            ;; => Dereference atom to subscribe to changes
                                         ;; => @ creates subscription to atom
       [:button {:on-click #(swap! count inc)} "Increment"]])))
                                         ;; => swap! updates atom, triggers re-render
                                         ;; => #(...) is anonymous function

(defn mount-app []                       ;; => App initialization function
  (r/render [counter]                    ;; => Render component to DOM
                                         ;; => [counter] invokes component
            (.getElementById js/document "app")))
                                         ;; => Mounts to DOM element with id="app"
                                         ;; => JS interop to find DOM element

(mount-app)                              ;; => Initialize app on page load
                                         ;; => Starts React rendering

;; JavaScript interop examples
(.log js/console "Hello from ClojureScript")
                                         ;; => Call JS method (. prefix)
                                         ;; => js/console is global console object

(set! (.-title js/document) "My App")    ;; => Set JS property (.- prefix)
                                         ;; => .- accesses property
                                         ;; => set! mutates JS object
```

**Key Takeaway**: ClojureScript brings Clojure to browser with React integration via Reagent.

**Why It Matters**: ClojureScript enables isomorphic applications sharing validation logic, data transformations, and business rules between frontend and backend—eliminating duplicate implementations causing consistency bugs. Reagent's reactive atoms provide React integration without JSX overhead or virtual DOM performance pitfalls. Production customer portals use ClojureScript sharing most data validation logic with backend services, ensuring form validation matches server-side rules while maintaining low UI update latency.

## Example 80: Best Practices - Immutability and Pure Functions

Embrace functional programming with immutability and purity as the foundation of idiomatic Clojure design. Pure functions with immutable data compose freely, test trivially, and parallelize safely—the "functional core, imperative shell" pattern confines side effects to the application boundaries. These practices accumulate into a programming style that produces systems that are fundamentally easier to reason about, debug, and scale.

```clojure
;; Pure functions: no side effects, deterministic
(defn calculate-total [items]            ;; => Pure function (no side effects)
  (reduce + (map :price items)))         ;; => Computes total, no mutations or I/O
                                         ;; => Same inputs always produce same output

;; Immutable updates: original data never modified
(def user {:name "Alice" :age 30})       ;; => Original user map

(assoc user :email "alice@example.com")  ;; => Add :email key
                                         ;; => Returns NEW map (original unchanged)
                                         ;; => user still {:name "Alice" :age 30}

(update user :age inc)                   ;; => Increment :age value
                                         ;; => Returns NEW map with :age incremented
                                         ;; => Original user unchanged

;; Threading macros for pipeline readability
(->> users                               ;; => Thread-last macro
     (filter :active)                    ;; => Data flows as LAST argument
                                         ;; => (filter :active users)
     (map :email)                        ;; => (map :email (filter :active users))
     (take 10))                          ;; => (take 10 (map :email ...))

(-> request                              ;; => Thread-first macro
    (assoc :user current-user)           ;; => Data flows as FIRST argument
                                         ;; => (assoc request :user current-user)
    (update :headers merge auth-headers))
                                         ;; => (update (assoc request ...) :headers ...)

;; Avoid mutations: mutability breaks referential transparency
(defn bad-add! [coll item]               ;; => Anti-pattern function
  (.add coll item))                      ;; => Anti-pattern: mutates collection
                                         ;; => Side effect, not functional

(defn good-add [coll item]               ;; => Functional approach
  (conj coll item))                      ;; => Functional: returns new collection
                                         ;; => Original collection unchanged

;; Persistent data structures: structural sharing
(def v [1 2 3])                          ;; => Original vector
(def v2 (conj v 4))                      ;; => New vector shares structure with v (efficient)
                                         ;; => [1 2 3 4], v remains [1 2 3]
                                         ;; => Structural sharing: O(1) time/space

(identical? (pop v2) v)                  ;; => Check reference equality
;; => false (different object references)
                                         ;; => Different objects in memory

(= (pop v2) v)                           ;; => Check value equality
;; => true (value equality)
                                         ;; => Same content [1 2 3]
```

**Key Takeaway**: Immutability and pure functions eliminate entire categories of bugs and enable safe concurrency.

**Why It Matters**: Immutability-by-default prevents entire bug classes (race conditions, unintended side effects, temporal coupling) that plague imperative codebases—Clojure programs have significantly fewer concurrency bugs than equivalent imperative systems. Pure functions enable fearless refactoring, trivial testing, and automatic parallelization impossible with stateful code. Production inventory systems process large concurrent update volumes using immutable data structures achieving linear scalability to many cores without explicit locking—performance and correctness unattainable with mutable state.

## Summary

Advanced Clojure (examples 55-80) covers expert-level techniques: advanced macros with code walking, multiplatform development with reader conditionals, performance optimization through type hints and reducers, component architecture for application structure, web development with Ring/Compojure, database access, property-based testing, profiling and optimization, deployment best practices, ClojureScript for frontend development, and functional programming principles. Master these techniques to write production-grade Clojure systems operating at 95% language coverage.
