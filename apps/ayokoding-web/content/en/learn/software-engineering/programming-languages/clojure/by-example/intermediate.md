---
title: "Intermediate"
weight: 10000002
date: 2025-12-30T03:00:00+07:00
draft: false
description: "Examples 28-54: Multimethods, protocols, macros, STM, core.async, spec (40-75% coverage)"
tags: ["clojure", "tutorial", "by-example", "intermediate", "protocols", "macros", "core.async", "spec"]
---

This section covers production Clojure patterns from examples 28-54, achieving 40-75% topic coverage.

## Example 28: Multimethods

Multimethods enable polymorphism based on arbitrary dispatch functions. Unlike class-based polymorphism, dispatch can use any computed value—a map key, a combination of argument types, or a custom predicate—making multimethods ideal for open, extensible systems. Use multimethods when dispatch logic is complex or data-driven; use protocols when you need type-based dispatch with better performance.

```mermaid
%% Multimethod dispatch flow
graph TD
    A[area shape] --> B{Dispatch on :shape}
    B -->|:circle| C[Circle Method]
    B -->|:rectangle| D[Rectangle Method]
    B -->|:triangle| E[:default Method]
    C --> F[π × r²]
    D --> G[width × height]
    E --> H[Exception]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style D fill:#029E73,color:#fff
    style E fill:#029E73,color:#fff
    style F fill:#CC78BC,color:#fff
    style G fill:#CC78BC,color:#fff
    style H fill:#CA9161,color:#fff
```

```clojure
(defmulti area :shape)                       ;; => Define multimethod dispatching on :shape key
                                             ;; => #'user/area (var created)

(defmethod area :circle [shape]              ;; => Implementation for :circle dispatch value
  (* Math/PI (:radius shape) (:radius shape))) ;; => Calculates π × r²
                                             ;; => #function[...] (method registered for :circle)

(defmethod area :rectangle [shape]           ;; => Implementation for :rectangle dispatch value
  (* (:width shape) (:height shape)))        ;; => Calculates width × height
                                             ;; => #function[...] (method registered for :rectangle)

(defmethod area :default [shape]             ;; => Default implementation for unknown shapes
  (throw (ex-info "Unknown shape" {:shape shape}))) ;; => Throws ExceptionInfo with context map
                                             ;; => #function[...] (default method registered)

(area {:shape :circle :radius 5})            ;; => Dispatch key :shape has value :circle
                                             ;; => Invokes :circle method
                                             ;; => Returns 78.54 (π × 5²)

(area {:shape :rectangle :width 4 :height 3}) ;; => Dispatch key :shape has value :rectangle
                                             ;; => Invokes :rectangle method
                                             ;; => Returns 12 (4 × 3)
```

**Key Takeaway**: Multimethods dispatch on computed values enabling flexible polymorphism beyond type hierarchies.

**Why It Matters**: Multimethods provide open polymorphism where dispatch logic can be arbitrary functions (not just types)—enabling pattern matching on multiple arguments, data values, or runtime conditions. Unlike Java's closed class hierarchies requiring modification for new types, Clojure multimethods allow adding implementations without touching original code—pricing engines can extend discount rules via multimethods without recompiling core logic. Dispatch flexibility enables domain-driven design where business rules dictate polymorphism, not inheritance hierarchies.

## Example 29: Protocols

Protocols define interfaces for polymorphic functions with type-based dispatch. They compile to JVM interfaces, enabling zero-overhead polymorphism via direct method dispatch—significantly faster than multimethod hash lookups in hot code paths. Choose protocols over multimethods when dispatch is purely by type and performance matters; use multimethods when dispatch logic involves data values or multiple arguments.

```mermaid
%% Protocol implementation flow
graph TD
    A[IDrawable Protocol] --> B[draw method]
    A --> C[resize method]
    B --> D[Circle Implementation]
    B --> E[Square Implementation]
    C --> F[Circle resize]
    C --> G[Square resize]
    D --> H[String Output]
    E --> I[String Output]
    F --> J[New Circle Instance]
    G --> K[New Square Instance]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#DE8F05,color:#fff
    style D fill:#029E73,color:#fff
    style E fill:#029E73,color:#fff
    style F fill:#029E73,color:#fff
    style G fill:#029E73,color:#fff
    style H fill:#CC78BC,color:#fff
    style I fill:#CC78BC,color:#fff
    style J fill:#CC78BC,color:#fff
    style K fill:#CC78BC,color:#fff
```

```clojure
(defprotocol IDrawable                       ;; => Define protocol with two methods
  (draw [this])                              ;; => draw method signature (single arg)
  (resize [this factor]))                    ;; => resize method signature (two args)
                                             ;; => IDrawable protocol created

(defrecord Circle [radius]                   ;; => Define Circle record with radius field
  IDrawable                                  ;; => Implement IDrawable protocol
  (draw [this]                               ;; => draw implementation for Circle
    (str "Drawing circle with radius " radius)) ;; => Returns descriptive string
                                             ;; => "Drawing circle with radius <radius>"
  (resize [this factor]                      ;; => resize implementation for Circle
    (Circle. (* radius factor))))            ;; => Create new Circle with scaled radius
                                             ;; => Returns new Circle instance

(defrecord Square [side]                     ;; => Define Square record with side field
  IDrawable                                  ;; => Implement IDrawable protocol
  (draw [this]                               ;; => draw implementation for Square
    (str "Drawing square with side " side))  ;; => Returns descriptive string
                                             ;; => "Drawing square with side <side>"
  (resize [this factor]                      ;; => resize implementation for Square
    (Square. (* side factor))))              ;; => Create new Square with scaled side
                                             ;; => Returns new Square instance

(let [c (Circle. 5)                          ;; => Create Circle with radius 5
      s (Square. 10)]                        ;; => Create Square with side 10
  (println (draw c))                         ;; => Output: Drawing circle with radius 5
                                             ;; => nil (println returns nil)
  (println (draw (resize s 2))))             ;; => resize s by factor 2: Square with side 20
                                             ;; => draw returns "Drawing square with side 20"
                                             ;; => Output: Drawing square with side 20
                                             ;; => nil (println returns nil)
```

**Key Takeaway**: Protocols provide interface-based polymorphism with better performance than multimethods for type dispatch.

**Why It Matters**: Protocols compile to JVM interfaces enabling zero-overhead polymorphic dispatch via invokeinterface bytecode—significantly faster than multimethod hash lookups in hot paths. This performance makes protocols ideal for low-level abstractions in high-throughput systems: transaction processing can use protocol-based data access for high TPS without overhead. Extending protocols to existing types (`extend-protocol String`) enables retrofitting third-party Java classes with Clojure interfaces without wrapper objects.

## Example 30: Records and Types

Records provide efficient map-like data structures with type identity. They implement protocol dispatch, support map operations (assoc, dissoc, keys), and offer direct JVM field access—combining the convenience of plain maps with the performance of Java POJOs. Use records when you need named fields with type identity and protocol implementations; use plain maps when schema flexibility matters more.

```clojure
(defrecord User [id name email])             ;; => Auto-generates ->User and map->User constructors

(def user (->User 1 "Alice" "alice@example.com")) ;; => Positional constructor call
                                             ;; => user is User{:id 1 :name "Alice" :email "..."}
(def user2 (map->User {:id 2 :name "Bob" :email "bob@example.com"})) ;; => Map constructor call
                                             ;; => user2 is User{:id 2 :name "Bob" :email "..."}

;; Records are maps
(println (:name user))                       ;; => Map access works on records
                                             ;; => Output: Alice
(println (assoc user :role "admin"))         ;; => assoc adds :role key to record
                                             ;; => Output: User{:id 1 :name "Alice" :email "..." :role "admin"}
(println (keys user))                        ;; => keys returns record field names
                                             ;; => Output: (:id :name :email)

;; But have type identity
(println (instance? User user))              ;; => Type check returns true for User record
                                             ;; => Output: true
(println (= user {:id 1 :name "Alice" :email "alice@example.com"})) ;; => Records equal to maps with same content
                                             ;; => Output: true (structural equality)

;; deftype for lower-level control
(deftype Point [x y]
  Object
  (toString [this]                           ;; => Override Object.toString method
    (str "Point(" x ", " y ")")))            ;; => Returns formatted string like "Point(3, 4)"

(let [p (Point. 3 4)]                        ;; => Create Point instance with x=3, y=4
  (println (.toString p)))                   ;; => Call toString method on Point
                                             ;; => Output: Point(3, 4)
```

**Key Takeaway**: Records combine map convenience with type identity and performance; types offer full control.

**Why It Matters**: Records provide significantly faster field access than plain maps via direct JVM field access while retaining map interfaces—ideal for performance-critical data structures in high-frequency processing. Type identity enables protocol dispatch and spec validation without runtime type checks. Unlike Java POJOs requiring getters/setters, records are immutable by default and participate in Clojure's persistent data structure ecosystem—build state records can leverage both map convenience and protocol performance.

## Example 31: Basic Macros

Macros transform code at compile time enabling custom syntax. Because Clojure code is data (homoiconicity), macros receive unevaluated forms and return transformed forms, allowing you to create new control structures indistinguishable from built-ins. Unlike functions which evaluate all arguments before execution, macros control evaluation order—use them sparingly for cases where functions cannot solve the problem.

```clojure
(defmacro unless [test then-form]            ;; => Define macro inverting if condition
  `(if (not ~test) ~then-form))             ;; => Syntax quote constructs code at compile time

(unless false (println "Executed"))          ;; => test is false, so (not false) is true
                                             ;; => Executes then-form
                                             ;; => Output: Executed
(unless true (println "Not executed"))       ;; => test is true, so (not true) is false
                                             ;; => Doesn't execute then-form
                                             ;; => Returns nil (no output)

;; Macro with multiple forms
(defmacro with-timing [expr]                 ;; => Macro to measure expression execution time
  `(let [start# (System/nanoTime)            ;; => Capture start time in nanoseconds
         result# ~expr                        ;; => Evaluate expression and store result
         end# (System/nanoTime)]              ;; => Capture end time
     (println "Elapsed:" (/ (- end# start#) 1e6) "ms")
     result#))                                ;; => Return expression result

(with-timing (reduce + (range 1000000)))     ;; => Measures time to sum 0..999999
                                             ;; => Output: Elapsed: ~5 ms
                                             ;; => 499999500000 (sum of 0 to 999999)
```

**Key Takeaway**: Macros enable metaprogramming by manipulating code as data before evaluation.

**Why It Matters**: Macros operate at compile-time transforming code before evaluation, enabling zero-runtime-cost abstractions impossible in languages without homoiconicity. This power creates DSLs that feel native: Clojure's threading macros, core.async's `go` blocks, and spec's validation are all macros providing syntax that seems built-in. Unlike C macros doing text substitution or Python decorators adding runtime wrappers, Clojure macros safely transform AST with full language access—powering configuration DSLs processing complex rule sets.

## Example 32: Macro Hygiene and Gensym

Avoid variable capture in macros using gensym or auto-gensym. Variable capture occurs when a macro-introduced binding accidentally shadows a variable in the calling scope, causing subtle bugs that only surface in specific usage contexts. Clojure's auto-gensym syntax (using \`#\` suffix like \`x#\`) generates unique symbols at macro-expansion time, making hygiene the default rather than an afterthought.

```clojure
;; Pattern: auto-gensym prevents variable capture
(defmacro safe-twice [expr]                  ;; => Macro doubling expression value
  `(let [x# ~expr]                           ;; => x# auto-generates unique variable name
     (+ x# x#)))                             ;; => Sums the value twice
                                             ;; => #'user/safe-twice (macro created)

;; Outer x doesn't conflict with macro's x#
(let [x 10]                                  ;; => x is 10 in outer scope
  (safe-twice 5))                            ;; => Macro expands to (let [x__123# 5] (+ x__123# x__123#))
                                             ;; => x__123# is unique generated symbol
                                             ;; => No capture of outer x
                                             ;; => Returns 10 (5 + 5, correct)

;; Explicit gensym for more control
(defmacro explicit-twice [expr]
  (let [result (gensym "result")]            ;; => Create unique symbol "result__123"
    `(let [~result ~expr]                    ;; => Unquote to insert generated symbol
       (+ ~result ~result))))                ;; => Add result twice

(explicit-twice 5)                           ;; => Expands with generated symbol
                                             ;; => Returns 10 (5 + 5)

;; Auto-gensym with # suffix (preferred)
(defmacro auto-twice [expr]
  `(let [result# ~expr]                      ;; => # suffix auto-generates unique name
     (+ result# result#)))                   ;; => Variables with # stay in sync

(auto-twice 5)                               ;; => Expands to unique symbol automatically
                                             ;; => Returns 10 (5 + 5)
```

**Key Takeaway**: Use auto-gensym (#) or explicit gensym to prevent variable capture in macros.

**Why It Matters**: Variable capture bugs in macros can create subtle production issues where macro-introduced bindings shadow user variables, causing incorrect behavior that only surfaces in specific call contexts. Auto-gensym (`#`) guarantees unique symbols eliminating an entire class of macro bugs—critical for library authors where macros run in unknown contexts. This hygiene enables Clojure's macro safety exceeding Common Lisp's gensym manual management, making macro composition reliable for production frameworks.

## Example 33: Atoms for Synchronous State

Atoms provide thread-safe synchronous mutable references using Compare-And-Swap (CAS) hardware instructions. They are ideal for managing independent state that changes via pure functions—no coordination with other state needed. Use atoms for simple counters, caches, and application state; use refs when multiple pieces of state must change together atomically.

```mermaid
%% Atom state transitions
stateDiagram-v2
    [*] --> atom_0: Create atom 0
    atom_0 --> atom_1: swap! inc
    atom_1 --> atom_6: swap! + 5
    atom_6 --> atom_0: reset! 0
    atom_0 --> complex: Create map with users and count
    complex --> updated: swap! update count inc
    updated --> final: swap! update users conj

    note right of atom_0: Deref with @
    note right of atom_1: Atomic increment
    note right of atom_6: Atomic addition
    note right of atom_0: Direct set
    note right of final: Nested state updates
```

```clojure
(def counter (atom 0))               ;; => Creates atom wrapping initial value 0
                                     ;; => Atom provides thread-safe mutable reference

(println @counter)                   ;; => Dereferences atom to get current value
                                     ;; => Output: 0
@counter                             ;; => Current value is 0
(swap! counter inc)                  ;; => Applies inc function to current value atomically
                                     ;; => 1 (atomically increments 0 to 1)
(println @counter)                   ;; => Dereferences to verify state change
                                     ;; => Output: 1
@counter                             ;; => Current value is now 1
(swap! counter + 5)                  ;; => Applies (+ current-value 5) atomically
                                     ;; => 6 (atomically adds 5 to current value of 1)
(println @counter)                   ;; => Dereferences to verify addition
                                     ;; => Output: 6
@counter                             ;; => Current value is now 6
(reset! counter 0)                   ;; => Sets atom to exact value 0 (not function-based)
                                     ;; => 0 (direct assignment, ignores previous value)

;; Atoms with complex state
(def app-state (atom {:users [] :count 0}))
                                     ;; => Creates atom wrapping map with two keys
                                     ;; => Initial state: empty users vector, count 0

(swap! app-state update :count inc)  ;; => Atomically updates :count key using inc
                                     ;; => {:users [], :count 1} (increments count 0 to 1)
(swap! app-state update :users conj {:name "Alice"})
                                     ;; => Atomically updates :users vector
                                     ;; => Adds {:name "Alice"} to users collection
                                     ;; => {:users [{:name "Alice"}], :count 1}
(println @app-state)                 ;; => Dereferences to show final state
                                     ;; => Output: {:users [{:name "Alice"}], :count 1}
```

**Key Takeaway**: Atoms provide lock-free atomic updates for independent synchronous state changes.

**Why It Matters**: Atoms use Compare-And-Swap (CAS) hardware instructions for wait-free concurrency significantly outperforming lock-based synchronization in high-contention scenarios. `swap!` with pure functions enables optimistic concurrency where contention triggers automatic retry without deadlock risk—job queue updates can handle massive concurrent swaps across distributed agents. Validators catch invariant violations at runtime (e.g., "account balance >= 0") preventing invalid states that compile-time types can't express.

## Example 34: Refs and Software Transactional Memory

Refs enable coordinated synchronous updates across multiple references using Software Transactional Memory (STM). STM provides ACID semantics for in-memory state—all changes within a \`dosync\` block commit together or roll back entirely, preventing partial updates. Use refs when multiple state changes must be atomic (e.g., bank transfers); use atoms for independent state changes.

```mermaid
%% STM transaction flow
sequenceDiagram
    participant T as Transaction
    participant A as "account-a (ref)"
    participant B as "account-b (ref)"

    Note over T,B: Initial: A=1000, B=500
    T->>A: dosync start
    T->>A: alter - 200
    A-->>T: 800 (tentative)
    T->>B: alter + 200
    B-->>T: 700 (tentative)
    T->>T: Commit transaction
    T-->>A: Committed: 800
    T-->>B: Committed: 700
    Note over T,B: Final: A=800, B=700

    Note over T,B: Transaction Failure
    T->>A: dosync start
    T->>A: alter - 100
    T->>T: Exception thrown
    T->>T: Rollback
    Note over A,B: State unchanged
```

```clojure
(def account-a (ref 1000))                   ;; => Create ref with initial value 1000
                                             ;; => Ref: coordinated synchronous mutable reference
(def account-b (ref 500))                    ;; => Create ref with initial value 500
                                             ;; => Both refs managed by STM system

(defn transfer [from to amount]              ;; => Define transfer function (from/to are refs)
  (dosync                                    ;; => Start STM transaction (atomic block)
                                             ;; => All alters coordinated via MVCC
    (alter from - amount)                    ;; => Queues mutation: subtract from source
    (alter to + amount)))                    ;; => Queues mutation: add to destination
                                             ;; => Both alters commit together atomically
                                             ;; => #'user/transfer

(println @account-a @account-b)              ;; => Dereference refs with @
                                             ;; => Output: 1000 500 (initial state)

(transfer account-a account-b 200)           ;; => Atomically transfer 200 from a to b
                                             ;; => dosync: alter a (1000-200=800), alter b (500+200=700)
                                             ;; => Transaction commits both changes
(println @account-a @account-b)              ;; => Output: 800 700 (transfer succeeded)

;; Transactions are atomic - all succeed or all fail
(try                                         ;; => Exception handling around transaction
  (dosync                                    ;; => Start new STM transaction
    (alter account-a - 100)                  ;; => Tentative change: a becomes 700 (in-flight)
    (throw (Exception. "Error!"))            ;; => Exception thrown mid-transaction
                                             ;; => All changes rolled back (a stays 800)
    (alter account-b + 100))                 ;; => Never executed (unreachable after throw)
  (catch Exception e                         ;; => Catch exception
    (println "Transaction failed")))         ;; => Output: Transaction failed

(println @account-a @account-b)              ;; => Verify refs unchanged after rollback
                                             ;; => Output: 800 700 (unchanged)
                                             ;; => ACID atomicity: all-or-nothing
```

**Key Takeaway**: Refs with STM provide coordinated atomic transactions across multiple state changes.

**Why It Matters**: STM provides ACID transactions for in-memory state eliminating deadlock/race conditions from manual locking—critical for financial systems where coordinated updates must be all-or-nothing. Account transfer logic can use ref transactions ensuring money never disappears mid-transfer even under high concurrent load. Unlike database transactions with network overhead, STM operates entirely in-memory at microsecond latencies, making it viable for real-time coordination impossible with traditional RDBMS transactions.

## Example 35: Agents for Asynchronous State

Agents handle asynchronous state changes with guaranteed sequential processing. Send actions are queued and executed on a shared thread pool; each agent processes its queue serially, preventing race conditions without explicit locking. Use agents for fire-and-forget async work like logging, metrics, or background I/O where you want sequential consistency but don't need immediate results.

```mermaid
%% Agent asynchronous processing
graph TD
    A[send action 1] --> Q[Agent Queue]
    B[send action 2] --> Q
    C[send action 3] --> Q
    Q --> T[Thread Pool]
    T --> S1[Sequential Execution]
    S1 --> S2[Action 1]
    S2 --> S3[Action 2]
    S3 --> S4[Action 3]
    S4 --> R[Agent State Updated]

    style A fill:#0173B2,color:#fff
    style B fill:#0173B2,color:#fff
    style C fill:#0173B2,color:#fff
    style Q fill:#DE8F05,color:#fff
    style T fill:#029E73,color:#fff
    style S1 fill:#CC78BC,color:#fff
    style R fill:#CA9161,color:#fff
```

```clojure
(def logger (agent []))                      ;; => Create agent with empty vector initial state

(send logger conj "First log")               ;; => Queue conj action asynchronously
                                             ;; => action added to thread pool queue
(send logger conj "Second log")              ;; => Queue second action
                                             ;; => Executes after first action completes

(Thread/sleep 100)                           ;; => Wait for async actions to complete
(println @logger)                            ;; => Dereference agent to see final state
                                             ;; => Output: ["First log" "Second log"]

;; send-off for blocking I/O operations
(def file-writer (agent nil))                ;; => Create agent for async I/O

(send-off file-writer                        ;; => Queue blocking operation (send-off for slow tasks)
  (fn [_]
    (Thread/sleep 1000)                      ;; => Simulate long I/O operation
    (println "File written")                 ;; => Side effect: print to console
                                             ;; => Output: File written
    :done))                                  ;; => Return :done (new agent state)

;; Error handling in agents
(def error-agent (agent 0))                  ;; => Create agent with initial value 0

(send error-agent / 0)                       ;; => Queue division by zero (error)
                                             ;; => Throws ArithmeticException
(Thread/sleep 100)                           ;; => Wait for error to propagate

(println (agent-error error-agent))          ;; => Retrieve error from agent
                                             ;; => Output: exception object
(restart-agent error-agent 0)                ;; => Clear error and reset to 0
(send error-agent inc)                       ;; => Queue new action
                                             ;; => Now works since error cleared
```

**Key Takeaway**: Agents provide asynchronous state updates with sequential processing guarantees.

**Why It Matters**: Agents serialize updates via thread pool queueing eliminating explicit coordination overhead while guaranteeing sequential consistency—perfect for async logging or background processing where order matters but latency doesn't. Unlike actors requiring explicit message passing syntax, agents use familiar `send`/`send-off` making async state management approachable. Production systems use agents for fire-and-forget async writes without blocking application threads.

## Example 36: core.async Channels

Channels enable CSP-style communication between async processes. Unlike Java's threading APIs, core.async provides lightweight CSP primitives (go blocks, channels) that park rather than block threads, enabling highly concurrent systems on a small thread pool. **Requires dependency**: add `org.clojure/core.async {:mvn/version "1.6.673"}` to your deps.edn `:deps` map—core.async is a separately distributed library maintained by the Clojure team, not part of the base Clojure jar.

```mermaid
%% Channel communication pattern
graph TD
    P1[Producer go block] -->|>! put| C[Channel]
    P2[Producer go block] -->|>! put| C
    C -->|<! take| C1[Consumer go block 1]
    C -->|<! take| C2[Consumer go block 2]
    C1 --> O1[Process Value]
    C2 --> O2[Process Value]

    B[Buffered Channel] -->|Size 10| BUF[Buffer]
    BUF -->|Full?| PARK[Park Producer]

    style P1 fill:#0173B2,color:#fff
    style P2 fill:#0173B2,color:#fff
    style C fill:#DE8F05,color:#fff
    style C1 fill:#029E73,color:#fff
    style C2 fill:#029E73,color:#fff
    style B fill:#CC78BC,color:#fff
    style BUF fill:#CA9161,color:#fff
```

```clojure
(require '[clojure.core.async :refer [chan go >! <! >!! <!! timeout close!]])
                                             ;; => Import async primitives from core.async

(def ch (chan))                              ;; => Create unbuffered channel (0-size buffer)

;; Producer go block
(go
  (>! ch "Hello")                            ;; => Put "Hello" on channel (parks if no taker)
                                             ;; => Resumes when consumer takes value
  (>! ch "World"))                           ;; => Put "World" on channel

;; Consumer go block
(go
  (println (<! ch))                          ;; => Take from channel (blocks/parks)
                                             ;; => Resumes when "Hello" available
                                             ;; => Output: Hello
  (println (<! ch)))                         ;; => Take next value from channel
                                             ;; => Output: World
                                             ;; => go block returns channel

;; Blocking put/take (outside go blocks)
(def ch2 (chan))                             ;; => Create another channel

(future (>!! ch2 "Data"))                    ;; => Blocking put in separate thread
                                             ;; => >!! blocks thread until taken
(println (<!! ch2))                          ;; => Blocking take (blocks main thread)
                                             ;; => Waits for future to put "Data"
                                             ;; => Output: Data

;; Buffered channels
(def buffered (chan 10))                     ;; => Create channel with size-10 buffer

(>!! buffered 1)                             ;; => Blocking put (doesn't block, buffer has space)
                                             ;; => Returns nil immediately
(>!! buffered 2)                             ;; => Another put (buffer now has [1 2])
(println (<!! buffered))                     ;; => Take first value from buffer
                                             ;; => Output: 1 (FIFO order maintained)
```

**Key Takeaway**: Channels decouple producers from consumers enabling async coordination.

**Why It Matters**: Channels implement CSP (Communicating Sequential Processes) providing safe async communication without callback hell or future composition complexity. Buffered channels with backpressure prevent producer overrun in event streaming systems to absorb traffic spikes without dropping events. Unlike RxJS streams requiring operator mastery or async/await adding await boilerplate, channels provide uniform put/take operations making async pipelines as readable as synchronous code.

## Example 37: core.async go Blocks

go blocks execute code asynchronously with automatic channel parking. The `go` macro compiles sequential-looking code into a state machine that parks (yields) instead of blocks, enabling thousands of concurrent logical threads on a small JVM thread pool. **Requires dependency**: add `org.clojure/core.async {:mvn/version "1.6.673"}` to your deps.edn `:deps` map before running these examples.

```mermaid
%% go block execution timeline
sequenceDiagram
    participant M as Main Thread
    participant G1 as go block 1
    participant G2 as go block 2
    participant CH as Channel

    M->>G1: Launch go block
    M->>G2: Launch go block
    Note over M: Main continues...

    G1->>G1: println "Starting..."
    G1->>G1: timeout 1000ms (park)
    Note over G1: Thread released
    G2->>G2: println "Waiting..."
    G2->>CH: <! (park, waiting)
    Note over G2: Thread released

    Note over G1: 1000ms elapsed
    G1->>CH: >! "Task complete"
    CH->>G2: Value delivered
    G2->>G2: println "Result"
```

```clojure
(require '[clojure.core.async :refer [go chan >! <! timeout]])
                                     ;; => Imports core.async functions for async programming
                                     ;; => go, chan, >!, <!, timeout are now available

(def ch (chan))                      ;; => Creates unbuffered channel
                                     ;; => Channel for communicating between go blocks

(go                                  ;; => Launches first go block (asynchronous)
                                     ;; => Returns channel immediately (non-blocking)
  (println "Starting task...")       ;; => Executes immediately in go block
                                     ;; => Output: Starting task...
  (<! (timeout 1000))                ;; => Parks go block for 1000ms
                                     ;; => Thread released back to pool during wait
                                     ;; => After 1000ms, go block resumes
  (>! ch "Task complete")            ;; => Puts string on channel
                                     ;; => Parks if channel full (unbuffered)
                                     ;; => Unblocks waiting receiver
  (println "Task done"))             ;; => Executes after channel put completes
                                     ;; => Output: Task done (after 1000ms delay)

(go                                  ;; => Launches second go block (asynchronous)
                                     ;; => Runs concurrently with first go block
  (println "Waiting for result...")  ;; => Executes immediately
                                     ;; => Output: Waiting for result...
  (println "Result:" (<! ch)))       ;; => Takes value from channel (parks until available)
                                     ;; => Thread released during wait
                                     ;; => When value available, resumes and prints
                                     ;; => Output: Result: Task complete

;; Multiple parallel tasks function
(defn async-task [id delay-ms]       ;; => Defines function returning async computation
  (go                                ;; => Returns channel (handle to async result)
                                     ;; => Caller can take from channel to get result
    (println "Task" id "starting")   ;; => Output: Task [id] starting (immediately)
    (<! (timeout delay-ms))          ;; => Parks for delay-ms milliseconds
                                     ;; => Thread released during timeout
    (println "Task" id "completed")  ;; => Output: Task [id] completed (after delay)
    id))                             ;; => Returns id as final value
                                     ;; => Value delivered to channel

(go                                  ;; => Coordinator go block for parallel execution
  (let [results (doall (map #(async-task % (* % 100)) (range 5)))]
                                     ;; => Creates 5 async-task channels immediately
                                     ;; => Task 0: 0ms delay, Task 1: 100ms, Task 2: 200ms, etc.
                                     ;; => doall forces immediate channel creation (not lazy)
                                     ;; => results is vector of 5 channels
    (doseq [result results]          ;; => Iterates over 5 result channels sequentially
      (println "Completed:" (<! result)))))
                                     ;; => Takes from each channel in order
                                     ;; => Parks until each task completes
                                     ;; => Output: Completed: 0, Completed: 1, etc.
```

**Key Takeaway**: go blocks enable lightweight async computation with automatic channel coordination.

**Why It Matters**: go blocks compile to state machines enabling massive concurrent lightweight threads on a single JVM versus limited OS threads. Parking on channel operations (`<!`) releases threads back to the pool making go blocks highly efficient compared to Thread-per-request. Microservices can use go blocks for async API calls achieving high concurrent request throughput without OS thread exhaustion—impossible with traditional threading models.

## Example 38: clojure.spec Validation

spec defines data shape specifications for validation and generation. It provides a unified system for declaring constraints, validating data, and generating random test inputs—capabilities that go far beyond what static type systems can express at runtime. **Requires dependency**: add `org.clojure/spec.alpha {:mvn/version "0.5.238"}` to your deps.edn `:deps` map—clojure.spec.alpha is a separately distributed library, not bundled in the base Clojure jar despite the similar package namespace.

```clojure
(require '[clojure.spec.alpha :as s])

;; Define simple predicate specs
(s/def ::age pos-int?)                       ;; => Spec: age must be positive integer
(s/def ::name string?)                       ;; => Spec: name must be string

;; Validate simple values
(s/valid? ::age 25)                          ;; => Tests if 25 matches ::age spec
                                             ;; => true (25 is positive int)
(s/valid? ::age -5)                          ;; => Tests if -5 matches ::age spec
                                             ;; => false (-5 is not positive)

;; Composite specs from multiple predicates
(s/def ::user (s/keys :req [::name ::age])) ;; => Spec: map with required ::name and ::age

(s/valid? ::user {::name "Alice" ::age 30})  ;; => Tests map against ::user spec
                                             ;; => true (has both required keys with valid values)
(s/valid? ::user {::name "Bob"})             ;; => Missing ::age key
                                             ;; => false (missing required key)

;; Explain validation errors
(s/explain ::user {::name "Bob"})            ;; => Print detailed validation error
                                             ;; => Shows missing ::age requirement

;; Conform transforms data during validation
(s/def ::number-string (s/conformer #(Integer/parseInt %))) ;; => Parse string to int
(s/conform ::number-string "42")             ;; => Validate and transform "42"
                                             ;; => 42 (parsed to integer)
```

**Key Takeaway**: spec provides declarative validation with rich error messages and data transformation.

**Why It Matters**: Spec enables runtime validation with richer expressiveness than static typing—constraints like "age between 0-120" or "email format" exceed what type systems can verify. Unlike JSON Schema requiring separate validation logic, spec integrates into function contracts and data pipelines providing validation, generation, and conformance in one system. Production build systems use spec to validate configuration structures providing detailed error messages while catching semantic errors static types miss.

## Example 39: Function Specs

Define specs for function arguments and return values. Function specs enable both instrumentation (runtime contract checking) and generative testing (automatic property-based testing), catching edge cases that manual unit tests never reach. **Requires dependency**: add `org.clojure/spec.alpha {:mvn/version "0.5.238"}` to your deps.edn—both `clojure.spec.alpha` and `clojure.spec.test.alpha` come from this single artifact.

```clojure
(require '[clojure.spec.alpha :as s])
(require '[clojure.spec.test.alpha :as stest])

(s/def ::x number?)                          ;; => Spec: x is a number
(s/def ::y number?)                          ;; => Spec: y is a number

(defn add [x y]                              ;; => Function to add two numbers
  (+ x y))                                   ;; => Returns sum of x and y

(s/fdef add                                  ;; => Define function spec for add
  :args (s/cat :x ::x :y ::y)              ;; => Args: two numbers named x and y
  :ret number?)                              ;; => Return: must be a number

;; Instrument for runtime checking
(stest/instrument `add)                      ;; => Enable runtime validation on add function
                                             ;; => Now checks arguments and return value

(add 2 3)                                    ;; => Call add with valid arguments
                                             ;; => 5 (valid, returns number)

;; Generative testing with random values
(stest/check `add)                           ;; => Run 1000 random tests on add
                                             ;; => Generates random valid inputs matching :args spec
                                             ;; => {:result true, :num-tests 1000, :seed 123...}
                                             ;; => Tests pass because add correctly returns number
```

**Key Takeaway**: Function specs enable runtime validation and generative testing of function contracts.

**Why It Matters**: Function specs with instrumentation catch contract violations at API boundaries where static typing is insufficient—validating that returned users have valid email formats, not just User types. Generative testing (`stest/check`) automatically discovers edge cases by generating thousands of random valid inputs, finding bugs traditional unit tests miss. Production financial systems have discovered critical calculation edge cases via spec generative testing that manual testing never covered.

## Example 40: Transducers

Transducers compose transformations without creating intermediate collections, processing each element once through the entire transformation pipeline. They are reusable across different contexts—the same transducer works with `into`, `sequence`, `transduce`, core.async channels, and any custom reducing context. Use transducers when transforming large collections and memory pressure from intermediate sequences matters, or when reusing the same transformation logic across different data sources.

**Regular Sequences (Creates Intermediates):**

```mermaid
graph TD
    R1[range 10] --> R2[map inc]
    R2 --> R3[Lazy Seq 1]
    R3 --> R4[filter even?]
    R4 --> R5[Lazy Seq 2]
    R5 --> R6[Final Result]

    style R3 fill:#CA9161,color:#fff
    style R5 fill:#CA9161,color:#fff
```

**Transducers (Single Pass, No Intermediates):**

```mermaid
graph TD
    T1[range 10] --> TX[Transducer comp]
    TX --> T2[map inc + filter even?]
    T2 --> T3[Single Pass]
    T3 --> T4[Final Result]

    style TX fill:#029E73,color:#fff
    style T2 fill:#0173B2,color:#fff
    style T3 fill:#DE8F05,color:#fff
```

```clojure
;; Regular sequence operations (create intermediates)
(->> (range 1000000)                         ;; => Create lazy sequence 0..999999
     (map inc)                               ;; => INTERMEDIATE lazy seq with each+1
     (filter even?)                          ;; => ANOTHER intermediate lazy seq
     (take 10))                              ;; => (2 4 6 8 10 12 14 16 18 20)
                                             ;; => Multiple lazy sequences chained

;; Transducer (no intermediate sequences)
(def xf                                      ;; => Define transducer composition
  (comp                                      ;; => comp combines transducers right-to-left
    (map inc)                                ;; => Increment transformation (no intermediate)
    (filter even?)))                         ;; => Even filter (composed into single pass)
                                             ;; => xf is function returning reducing fn

(into [] xf (range 10))                      ;; => Apply transducer to range 0..9
                                             ;; => Single pass: inc [1..10], filter even [2 4 6 8 10]
                                             ;; => [2 4 6 8 10] (zero intermediate allocations)

(sequence xf (range 10))                     ;; => Apply transducer, return lazy seq
                                             ;; => (2 4 6 8 10) (still single-pass)

;; With transduce (reduce-like)
(transduce xf + (range 10))                  ;; => Combine transducer with reduction
                                             ;; => Transforms: inc→filter, reduces: sum
                                             ;; => 30 (sum of 2+4+6+8+10)
                                             ;; => Single pass, no collection built

;; Custom transducer
(defn take-while-xf [pred]                   ;; => Custom transducer factory
  (fn [rf]                                   ;; => Returns fn taking reducing fn (rf)
    (fn                                      ;; => Returns 3-arity reducing fn
      ([] (rf))                              ;; => 0-arity: init call
      ([result] (rf result))                 ;; => 1-arity: completion
      ([result input]                        ;; => 2-arity: main reduction step
       (if (pred input)                      ;; => Test predicate
         (rf result input)                   ;; => Continue if true
         (reduced result))))))               ;; => Stop (early termination) if false

(into [] (take-while-xf #(< % 5)) (range 10)) ;; => Apply custom transducer
                                             ;; => Takes while < 5: [0 1 2 3 4]
                                             ;; => Stops at 5, reduced called
                                             ;; => [0 1 2 3 4] (early termination)
```

**Key Takeaway**: Transducers eliminate intermediate collections providing efficient composable transformations.

**Why It Matters**: Transducers compose transformations without creating intermediate sequences reducing memory allocation compared to chained lazy sequences—critical for processing large event volumes in analytics pipelines. Unlike Java Streams tied to stream sources, transducers are context-independent working on collections, channels, or observables with identical composition logic. Single-pass processing eliminates cache misses from multi-pass lazy sequences providing improved throughput on large datasets.

## Example 41: Exception Handling

Handle errors with try/catch and ex-info for custom exceptions. \`ex-info\` creates exceptions with attached data maps, enabling rich error context beyond string messages—you can attach user IDs, request data, and timestamps to exceptions for immediate debugging without log correlation. Unlike Java's exception hierarchies requiring new classes per error type, Clojure uses data maps for flexible error categorization.

```clojure
(defn divide [a b]                           ;; => Defines function to divide a by b
  (if (zero? b)                              ;; => Checks if divisor is zero
    (throw (ex-info "Division by zero" {:a a :b b}))
                                             ;; => Throws exception with message and data map
                                             ;; => ex-info creates ExceptionInfo with metadata
    (/ a b)))                                ;; => Performs division if b is not zero
                                             ;; => Returns result
                                             ;; => #'user/divide

(try                                         ;; => try block wraps code that may throw
  (divide 10 0)                              ;; => Calls divide with b=0
                                             ;; => Throws exception from divide function
  (catch Exception e                         ;; => Catches any Exception type
                                             ;; => e is bound to caught exception
    (println "Error:" (.getMessage e))       ;; => Extracts error message
                                             ;; => Output: Error: Division by zero
    (println "Data:" (ex-data e))))          ;; => Extracts attached data map
                                             ;; => Output: Data: {:a 10, :b 0}
                                             ;; => Returns nil

;; Multiple catch blocks
(try
  (Integer/parseInt "not-a-number")          ;; => Attempts to parse invalid string
                                             ;; => Throws NumberFormatException
  (catch NumberFormatException e             ;; => Catches specific exception type first
                                             ;; => More specific catches go first
    (println "Invalid number"))              ;; => Handles number format errors
                                             ;; => Output: Invalid number
                                             ;; => nil (this catch executed)
  (catch Exception e                         ;; => Catches general exceptions (fallback)
                                             ;; => Not reached for NumberFormatException
    (println "Other error")))                ;; => Would handle other exception types
                                             ;; => nil

;; finally
(try                                         ;; => try with finally block
  (println "Opening resource")               ;; => Executes in try block
                                             ;; => Output: Opening resource
  (/ 1 0)                                    ;; => Division by zero operation
                                             ;; => Throws ArithmeticException
  (catch Exception e                         ;; => Catches the exception
    (println "Error occurred"))              ;; => Executes error handling
                                             ;; => Output: Error occurred
  (finally                                   ;; => finally ALWAYS executes
                                             ;; => Runs even if exception thrown or caught
    (println "Cleanup")))                    ;; => Cleanup code guaranteed to run
                                             ;; => Output: Cleanup
                                             ;; => nil (entire try expression returns nil)
```

**Key Takeaway**: ex-info attaches structured data to exceptions for rich error context.

**Why It Matters**: `ex-info` embeds arbitrary data maps into exceptions enabling rich error context beyond string messages—critical for debugging production failures where stack traces alone are insufficient. Unlike Java's exception hierarchies requiring new classes for each error type, Clojure uses data providing flexible error categorization. Production transaction processing can attach user IDs, transaction amounts, and timestamps to exceptions enabling immediate root cause analysis without log correlation.

## Example 42: Lazy Sequences

Lazy sequences compute elements on demand enabling infinite sequences. Only the elements actually consumed are realized, making it possible to model unbounded streams (like sensor data or event logs) and process datasets larger than available RAM. Most core sequence functions (\`map\`, \`filter\`, \`range\`) return lazy sequences by default; use \`doall\` or \`into\` when you need to force full realization.

```mermaid
%% Lazy sequence evaluation
graph TD
    A[Infinite Sequence] --> B[naturals iterate inc]
    B --> C[Not Computed]
    C --> D{take 5}
    D -->|Demand| E[Compute 0]
    E --> F[Compute 1]
    F --> G[Compute 2]
    G --> H[Compute 3]
    H --> I[Compute 4]
    I --> J[Return 0 1 2 3 4]
    C -.->|Rest| K[Still Lazy]

    style A fill:#0173B2,color:#fff
    style C fill:#CA9161,color:#fff
    style D fill:#DE8F05,color:#fff
    style E fill:#029E73,color:#fff
    style F fill:#029E73,color:#fff
    style G fill:#029E73,color:#fff
    style H fill:#029E73,color:#fff
    style I fill:#029E73,color:#fff
    style J fill:#CC78BC,color:#fff
    style K fill:#CA9161,color:#fff
```

```clojure
;; Infinite sequence (not computed until accessed)
(def naturals (iterate inc 0))               ;; => Create infinite lazy sequence: 0, 1, 2, 3...
                                             ;; => Not computed yet (lazy)

(take 5 naturals)                            ;; => Request first 5 elements
                                             ;; => Forces lazy evaluation of first 5 items only
                                             ;; => Returns (0 1 2 3 4) as lazy sequence

;; Lazy filter on infinite sequence
(def evens (filter even? naturals))          ;; => Define lazy filter over infinite sequence
                                             ;; => Still not computed
(take 5 evens)                               ;; => Take first 5 evens from filter
                                             ;; => Lazily computes: 0 (even), 2 (even), 4, 6, 8
                                             ;; => Returns (0 2 4 6 8)

;; Custom lazy sequence with recursion
(defn fib-seq
  ([] (fib-seq 0 1))                         ;; => Default: start fibonacci at 0, 1
  ([a b]
   (lazy-seq                                 ;; => Wrap in lazy-seq for lazy computation
     (cons a (fib-seq b (+ a b))))))         ;; => Return current number, recurse for next

(take 10 (fib-seq))                          ;; => Get first 10 fibonacci numbers
                                             ;; => Computed lazily as needed
                                             ;; => Returns (0 1 1 2 3 5 8 13 21 34)

;; Force full realization into memory
(def realized (doall (take 5 naturals)))     ;; => doall forces full evaluation
                                             ;; => Takes first 5, realizes all into vector
                                             ;; => realized is [0 1 2 3 4] (not lazy)
```

**Key Takeaway**: Lazy sequences enable memory-efficient processing of large or infinite data.

**Why It Matters**: Lazy evaluation defers computation enabling processing of datasets exceeding available RAM—production log aggregation can process terabytes using lazy sequences without loading files into memory. Infinite sequences (`iterate`, `repeat`) model unbounded streams naturally, matching real-world scenarios like event processing or sensor data. Unlike eager evaluation causing OutOfMemoryErrors on large datasets, lazy sequences compose transformations with O(1) memory overhead regardless of data size.

## Example 43: Testing with clojure.test

Write unit tests using clojure.test framework, Clojure's built-in testing library with minimal syntax and strong tooling integration. Tests are organized into named groups with `deftest` and `testing` blocks, and fixtures handle setup/teardown around individual tests or the entire suite. Unlike JUnit's annotation model, clojure.test's functions are plain Clojure—test groups are functions and can be composed programmatically.

```clojure
(ns myapp.core-test                          ;; => Test namespace
  (:require [clojure.test :refer :all]      ;; => Import test macros
            [myapp.core :refer :all]))       ;; => Import code under test

(deftest addition-test                       ;; => Define test named addition-test
  (testing "Addition of positive numbers"    ;; => Group assertions with description
    (is (= 5 (+ 2 3)))                       ;; => Assert 2 + 3 = 5
                                             ;; => Test passes
    (is (= 10 (+ 4 6)))))                    ;; => Assert 4 + 6 = 10

(deftest division-test                       ;; => Define test named division-test
  (testing "Division"
    (is (= 2 (/ 10 5)))                      ;; => Assert 10 / 5 = 2
    (is (thrown? ArithmeticException (/ 1 0))))) ;; => Assert exception on divide by zero

;; Fixtures provide setup/teardown
(defn database-fixture [f]                   ;; => Fixture wraps test function f
  (println "Setup database")                 ;; => Run before test
                                             ;; => Output: Setup database
  (f)                                        ;; => Execute actual test function
                                             ;; => f runs here (test code executes)
  (println "Teardown database"))             ;; => Run after test (always)
                                             ;; => Output: Teardown database

(use-fixtures :each database-fixture)        ;; => Register fixture for all tests
                                             ;; => :each = runs before/after each test
                                             ;; => (vs :once for before/after all tests)

;; Execute all tests
(run-tests)                                  ;; => Run all deftest-defined tests
                                             ;; => Prints test results to console
                                             ;; => Returns map {:test N, :pass P, :fail F, :error E}
```

**Key Takeaway**: clojure.test provides simple assertion-based testing with fixtures.

**Why It Matters**: Minimal test syntax reduces friction making TDD practical—tests read like specifications without framework boilerplate. Fixtures enable setup/teardown logic matching production patterns (database connections, HTTP servers). Unlike JUnit's annotation complexity or pytest's magic fixtures, clojure.test's explicit fixture functions make test initialization transparent—production test suites use database fixtures managing large numbers of integration tests with clear lifecycle semantics.

## Example 44: deps.edn Dependencies

Modern dependency management with deps.edn instead of leiningen. deps.edn uses the Clojure CLI tools (clj/clojure) and the tools.deps library for data-driven dependency resolution directly from Maven coordinates—no build tool plugins or complex configuration required. Unlike Leiningen's Ant-based build model, deps.edn treats dependencies as pure data, making it simpler to compose and share configurations. This example includes http-kit and compojure as external library dependencies; you will need exactly this deps.edn configuration to run subsequent web examples.

```clojure
;; deps.edn - Clojure CLI dependency configuration

{:paths ["src" "resources"]                  ;; => Source and resource directories

 :deps {org.clojure/clojure {:mvn/version "1.11.1"}  ;; => Core Clojure dependency
        http-kit/http-kit {:mvn/version "2.7.0"}     ;; => HTTP server library
        compojure/compojure {:mvn/version "1.7.0"}}  ;; => Web routing library

 :aliases
 {:dev {:extra-paths ["dev"]                ;; => Add dev directory to classpath
        :extra-deps {org.clojure/tools.namespace {:mvn/version "1.4.4"}}}  ;; => REPL reload support

  :test {:extra-paths ["test"]              ;; => Add test directory to classpath
         :extra-deps {org.clojure/test.check {:mvn/version "1.1.1"}}}     ;; => Property testing library

  :uberjar {:replace-deps {com.github.seancorfield/depstar {:mvn/version "2.1.303"}}
            :exec-fn hf.depstar/uberjar    ;; => Execute depstar uberjar function
            :exec-args {:jar "app.jar"}}}} ;; => Output file for uberjar

;; Run REPL with dev alias
;; clj -A:dev                              ;; => Start REPL with dev alias loaded

;; Run tests
;; clj -A:test -M -m clojure.test          ;; => Run tests with test alias

;; Build uberjar
;; clj -X:uberjar                          ;; => Execute uberjar alias to build app.jar
```

**Key Takeaway**: deps.edn provides declarative dependency management with aliases for environments.

**Why It Matters**: deps.edn eliminates build tool lock-in (Leiningen, Boot) providing simple data-driven dependency resolution compatible with standard Maven repositories. Aliases enable environment-specific tooling (dev REPL, test runners, uberjar builders) without polluting production dependencies—large monorepos can use multiple aliases for different deployment targets. Unlike npm's package.json mixing dev and prod dependencies, deps.edn's alias system provides clear separation reducing production bundle sizes.

## Example 45: Namespace Organization

Organize code into namespaces with proper require/refer patterns. Namespaces map to files on disk, and the \`ns\` declaration's \`:require\` section makes all dependencies explicit—there are no hidden global imports. Use \`:as\` for aliases (the idiomatic approach), \`:refer\` for specific functions, and avoid \`:refer :all\` which obscures where functions come from.

```clojure
(ns myapp.user                               ;; => Define namespace myapp.user
  (:require [clojure.string :as str]        ;; => Import with alias str
            [clojure.set :refer [union intersection]] ;; => Import specific functions
            [myapp.database :as db]))        ;; => Import myapp.database as db

(defn create-user [name email]               ;; => Public function to create user map
  {:id (random-uuid)                         ;; => Generate random unique ID
   :name (str/upper-case name)               ;; => Use str/upper-case via alias
                                             ;; => Converts name to uppercase
   :email email})                            ;; => Store email as-is

(defn find-common-roles [user1 user2]        ;; => Find intersection of user roles
  (intersection (:roles user1) (:roles user2))) ;; => Uses intersection from clojure.set
                                             ;; => Returns set of roles both users have

;; Private functions not exported
(defn- validate-email [email]                ;; => Private function (defn- prefix)
  (str/includes? email "@"))                 ;; => Check if email contains @
                                             ;; => Returns true if @ found

;; Load from file (uncomment to use)
;; (load "myapp/utils")                     ;; => Load code from myapp/utils.clj
```

**Key Takeaway**: Namespaces organize code with explicit dependencies via require/refer.

**Why It Matters**: Explicit namespace management eliminates hidden dependencies and version conflicts from wildcard imports—every dependency is traceable enhancing code comprehension. Private functions (`defn-`) provide encapsulation without access modifier keywords, maintaining API boundaries in large codebases. Large production systems with hundreds of namespaces remain navigable through consistent aliasing patterns where `[clojure.string :as str]` appears identically across the codebase.

## Example 46: Metadata

Attach metadata to values for documentation and tools. Metadata is out-of-band information that does not affect value equality or hash codes, making it safe to attach documentation, type hints, and deprecation notices without changing program semantics. Type hints (\`^long\`, \`^String\`) are the most performance-critical metadata use case, eliminating JVM reflection costs that can slow numeric operations by 10-100x.

```clojure
;; Function metadata in docstring and map
(defn greet
  "Greets a person by name"                  ;; => Docstring (first string in defn)
  {:added "1.0" :author "Alice"}             ;; => Metadata map (optional)
  [name]
  (str "Hello, " name))

(meta #'greet)                               ;; => Get metadata of function var
                                             ;; => Returns {:added "1.0" :author "Alice" :doc "Greets..." ...}

;; Value metadata with ^ reader syntax
(def config ^{:private true} {:host "localhost"})  ;; => Attach metadata map to value
(meta #'config)                              ;; => Get metadata
                                             ;; => Returns {:private true, ...}

;; Type hints for performance optimization
(defn fast-add ^long [^long a ^long b]       ;; => ^long type hint on args and return
  (+ a b))                                   ;; => Hints eliminate reflection
                                             ;; => 10-100x faster for numeric operations

;; Reader metadata shortcuts
(def data ^:dynamic *db-conn*)               ;; => ^:dynamic shorthand for {:dynamic true}
                                             ;; => Creates thread-local dynamic variable
(with-meta {:name "Alice"} {:timestamp 123}) ;; => Attach metadata to value
                                             ;; => Returns value with metadata attached
```

**Key Takeaway**: Metadata provides out-of-band information without affecting value equality.

**Why It Matters**: Metadata enables attaching auxiliary information (documentation, type hints, deprecation notices) without polluting data values—metadata doesn't affect equality checks or hash codes. Type hints eliminate reflection overhead providing significant speedups on critical paths while remaining invisible to pure functions. Dynamic vars (`^:dynamic`) enable thread-local bindings for context propagation (user identity, request IDs) without passing parameters through every function—production request tracing uses dynamic vars for distributed tracing context.

## Example 47: Destructuring Advanced

Advanced destructuring patterns for complex data extraction. Nested destructuring extracts values from arbitrarily deep structures in a single binding form, and \`:or\` provides defaults for missing keys without nil-checking boilerplate. \`:strs\` and \`:syms\` extend destructuring to string-keyed and symbol-keyed maps, enabling clean handling of JSON data and namespace-qualified symbols.

```clojure
;; Nested destructuring extracts nested values
(let [{:keys [name address]} {:name "Alice" :address {:city "NYC" :zip 10001}}
                              ;; => Extract name and address from map
      {city :city} address]   ;; => Extract city from address map
  (println name city))                       ;; => Output: Alice NYC

;; :as binds original value while destructuring
(let [[a b :as all] [1 2 3 4]]
  (println "a:" a "b:" b "all:" all))        ;; => a binds to 1, b binds to 2
                                             ;; => all binds to original [1 2 3 4]
                                             ;; => Output: a: 1 b: 2 all: [1 2 3 4]

;; :or provides default values for missing keys
(let [{:keys [x y] :or {x 0 y 0}} {:y 5}]
  (println "x:" x "y:" y))                   ;; => y found (5), x missing (uses default 0)
                                             ;; => Output: x: 0 y: 5

;; String keys destructuring
(let [{:strs [name age]} {"name" "Bob" "age" 25}]
  (println name age))                        ;; => :strs for string keys (not keywords)
                                             ;; => Output: Bob 25

;; Symbol keys destructuring
(let [{:syms [x y]} {'x 10 'y 20}]
  (println x y))                             ;; => :syms for symbol keys
                                             ;; => Output: 10 20

;; Function argument destructuring
(defn print-point [{:keys [x y] :or {x 0 y 0}}]  ;; => Destructure map argument
  (println "Point:" x y))

(print-point {:x 3 :y 4})                    ;; => Both x and y provided
                                             ;; => Output: Point: 3 4
(print-point {})                             ;; => Neither provided, use defaults
                                             ;; => Output: Point: 0 0
```

````

**Key Takeaway**: Advanced destructuring enables concise extraction from nested complex structures.

**Why It Matters**: Nested destructuring with defaults eliminates defensive null checking reducing boilerplate compared to imperative extraction. String/symbol key destructuring (`:strs`, `:syms`) handles heterogeneous data from JSON APIs or database rows without conversion overhead. Unlike TypeScript's optional chaining requiring `?.` at each level, Clojure's `:or` defaults apply declaratively across entire structures—production config parsing uses nested destructuring with defaults handling many optional fields cleanly.

## Example 48: Java Interop Advanced

Advanced Java interoperability patterns bridge Clojure's functional style with Java's object-oriented ecosystem. \`reify\` creates anonymous interface implementations inline without class files, enabling adapter patterns for Java callbacks. \`doto\` chains multiple method calls on a mutable Java object while returning the object, making fluent builder APIs readable in functional Clojure code.

```clojure
;; Static methods and fields from Java classes
(Math/pow 2 3)                               ;; => Call static Math.pow method
                                             ;; => Returns 8.0
Math/PI                                      ;; => Access static Math.PI field
                                             ;; => Returns 3.141592653589793

;; Instance method calls
(.toUpperCase "hello")                       ;; => Call toUpperCase on String instance
                                             ;; => Returns "HELLO"
(.length "world")                            ;; => Call length on String instance
                                             ;; => Returns 5

;; Constructor calls
(java.util.Date.)                            ;; => Create new Date() instance
                                             ;; => Returns current Date object

;; Chaining method calls with (..)
(.. (java.util.Date.) (toString) (toUpperCase)) ;; => Date.toString().toUpperCase()
                                             ;; => Returns "WED DEC 30..."

;; doto for multiple mutations in sequence
(doto (java.util.ArrayList.)                 ;; => Create ArrayList
  (.add "first")                             ;; => Call add method, return ArrayList
  (.add "second")                            ;; => Call add again, return ArrayList
  (.add "third"))                            ;; => Final call returns the ArrayList
                                             ;; => ArrayList contains ["first" "second" "third"]

;; Type hints for performance on array operations
(defn fast-array-sum ^long [^"[J" arr]       ;; => Type hints eliminate reflection cost
  (aget arr 0))                              ;; => Get first element from long array
                                             ;; => 10-100x faster than without hints

;; Implementing Java interfaces with reify
(defn create-runnable [f]
  (reify java.lang.Runnable                  ;; => Create anonymous Runnable instance
    (run [this] (f))))                       ;; => Implement run method calling f

(let [task (create-runnable #(println "Running!"))]
  (.start (Thread. task)))                   ;; => Create Thread with Runnable
                                             ;; => Start thread to run Runnable
                                             ;; => Output: Running!
```

**Key Takeaway**: Clojure provides seamless Java interop with concise syntax for methods, fields, and interfaces.

**Why It Matters**: `reify` creates anonymous interface implementations without class files enabling inline adapter pattern—perfect for Java callbacks and listeners without ceremony. `doto` threading applies multiple mutations to Java builders making fluent APIs usable from functional code. Unlike Scala's Java interop requiring implicits or Python's JNI overhead, Clojure's zero-cost interop enables leveraging enterprise Java libraries (JDBC pools, messaging systems) while writing functional business logic.

## Example 49: Reducers

Reducers enable parallel fold operations on collections using JVM's ForkJoinPool. Unlike sequential \`reduce\`, \`r/fold\` recursively splits the collection and processes chunks on multiple CPU cores, achieving near-linear speedup on multi-core machines for embarrassingly parallel reductions. Use reducers for CPU-intensive aggregations on large vectors where thread overhead is worth the parallelism benefit.

```clojure
(require '[clojure.core.reducers :as r])    ;; => Import reducers library

;; Sequential reduce (single-threaded)
(reduce + (range 1000000))                   ;; => Single-threaded sum
                                             ;; => Returns 499999500000

;; Parallel fold (multi-threaded)
(r/fold + (vec (range 1000000)))             ;; => Parallel fold on vector
                                             ;; => Uses ForkJoinPool for parallelism
                                             ;; => Returns 499999500000 (8x faster on 8-core)

;; Reducer transformations (parallel)
(->> (range 1000000)                         ;; => Create range
     vec                                     ;; => Convert to vector (required for fold)
     (r/map inc)                             ;; => Parallel map each to inc
                                             ;; => Adds 1 to each element in parallel
     (r/filter even?)                        ;; => Parallel filter for even numbers
                                             ;; => Filters in parallel
     (r/fold +))                             ;; => Parallel fold to sum
                                             ;; => Returns 250000500000 (sum of even incremented numbers)

;; Custom folder with combine and reduce functions
(defn parallel-count [coll]
  (r/fold
    (fn ([] 0) ([a b] (+ a b)))              ;; => Combine function (adds two counts)
                                             ;; => ([] 0) is identity for combine
    (fn ([acc _] (inc acc)))                 ;; => Reduce function (count)
                                             ;; => Increments count for each element
    coll))                                   ;; => Apply to collection

(parallel-count (vec (range 1000000)))       ;; => Count elements in parallel
                                             ;; => Returns 1000000
```

**Key Takeaway**: Reducers enable parallel processing with fork-join for performance-critical reductions.

**Why It Matters**: Reducers automatically parallelize fold operations using JVM's ForkJoinPool achieving near-linear speedup on multi-core CPUs—inventory aggregations can process large record sets significantly faster on multi-core machines. Unlike explicit parallelism requiring partition logic, reducers handle work stealing and load balancing transparently. Reducer transformations compose identically to sequence operations maintaining code clarity while gaining parallelism—changing `reduce` to `r/fold` adds parallelism with zero algorithm changes.

## Example 50: Futures and Promises

Futures run async computations in a thread pool and return a dereferenced value when complete; promises are single-delivery coordination primitives that block until explicitly delivered. Futures start immediately and model independent background work; promises model a value that will be available later from an external event. Together they cover the most common async coordination patterns without callback nesting or reactive stream complexity.

```mermaid
%% Futures and Promises coordination
sequenceDiagram
    participant M as Main Thread
    participant F as Future Thread
    participant P as Promise

    M->>F: Create future
    Note over F: Computing...
    M->>M: println "Computing..."
    M->>F: Deref @ (blocks)
    Note over M: Waiting...
    F->>F: Thread/sleep 1000
    F->>F: (+ 1 2)
    F-->>M: Return 3
    M->>M: println 3

    M->>P: Create promise
    M->>F: Launch future
    M->>M: println "Waiting..."
    M->>P: Deref @ (blocks)
    F->>F: Thread/sleep 1000
    F->>P: deliver "Async result"
    P-->>M: Return value
    M->>M: println result

```

```clojure
;; Future for async computation
(def result (future                          ;; => Creates future, runs computation in thread pool
                                             ;; => Execution starts immediately in background thread
              (Thread/sleep 1000)            ;; => Simulates 1-second delay (expensive operation)
                                             ;; => Main thread continues, not blocked here
              (+ 1 2)))                      ;; => Computes and returns 3
                                             ;; => Future captures this value
                                             ;; => #'user/result (var holds future object)

(println "Computing...")                     ;; => Executes immediately (main thread not blocked)
                                             ;; => Output: Computing...
(println @result)                            ;; => Dereferences future (blocks until ready)
                                             ;; => Waits ~1000ms for computation to complete
                                             ;; => Output: 3 (prints computed value)
(println (realized? result))                 ;; => Checks if future computation completed
                                             ;; => true (already dereferenced, so realized)
                                             ;; => Output: true

;; Promise for manual delivery
(def p (promise))                            ;; => Creates empty promise (placeholder for value)
                                             ;; => No value yet, will be delivered later
                                             ;; => #'user/p

(future                                      ;; => Launches background thread
  (Thread/sleep 1000)                        ;; => Waits 1 second in background thread
                                             ;; => Main thread continues immediately
  (deliver p "Async result"))                ;; => Delivers value to promise after delay
                                             ;; => Promise becomes realized with this value

(println "Waiting...")                       ;; => Executes immediately (main thread)
                                             ;; => Output: Waiting...
(println @p)                                 ;; => Dereferences promise (blocks until delivered)
                                             ;; => Waits ~1000ms for deliver to execute
                                             ;; => Output: Async result

;; Combining futures and promises for async patterns
(defn async-add [a b]                        ;; => Defines async addition function
  (let [p (promise)]                         ;; => Creates promise for result coordination
                                             ;; => Promise used to communicate result
    (future                                  ;; => Launches async computation in thread pool
      (Thread/sleep 500)                     ;; => Simulates 500ms work delay
      (deliver p (+ a b)))                   ;; => Computes sum and delivers to promise
                                             ;; => (+ 10 20) = 30 delivered to p
    p))                                      ;; => Returns promise immediately (not blocking)
                                             ;; => Caller can deref when ready
                                             ;; => #'user/async-add

(println @(async-add 10 20))                 ;; => Calls async-add with args 10, 20
                                             ;; => Function returns promise immediately
                                             ;; => @ blocks until promise delivered (~500ms)
                                             ;; => Output: 30 (prints sum)
```

**Key Takeaway**: Futures enable fire-and-forget async; promises enable result coordination.

**Why It Matters**: Futures provide thread pool-backed async computation without callback complexity—simple `@future` blocks until result available eliminating Promise.then chains. Promises enable coordination patterns like producer-consumer handoff or timeout-based cancellation that are otherwise impossible with simple threading. Build systems use future/promise coordination for parallel artifact uploads with aggregated completion tracking across distributed storage backends.

## Example 51: Delays

Delays defer computation until first dereference with caching. The computation runs exactly once—subsequent dereferences return the cached result without re-executing, thread-safely. Use delays for expensive initialization (database connections, config loading) that may not always be needed; unlike \`future\` which starts immediately, \`delay\` starts only when first dereferenced.

```clojure
(def expensive (delay                        ;; => Create delay (computation not yet run)
                 (println "Computing...")    ;; => Print on first dereference
                 (Thread/sleep 1000)         ;; => Sleep 1 second on first dereference
                 42))                        ;; => Result is 42

(println "Created delay")                    ;; => Output: Created delay
(println @expensive)                         ;; => Dereference triggers computation
                                             ;; => Output: Computing... (then) 42
(println @expensive)                         ;; => Dereference again
                                             ;; => Output: 42 (no "Computing..." this time)
                                             ;; => Result cached from first dereference
(println (realized? expensive))              ;; => Check if computation done
                                             ;; => Output: true

;; Delays useful for lazy expensive initialization
(defn load-config []
  (delay                                     ;; => Return delay, not config
    (println "Loading config...")            ;; => Load only when accessed
    {:db "localhost" :port 5432}))           ;; => Config data

(def config (load-config))                   ;; => Create delay for config
                                             ;; => "Loading config..." NOT printed yet

(when-let [db (:db @config)]                 ;; => Dereference triggers loading
                                             ;; => Output: Loading config...
  (println "Connecting to" db))              ;; => Output: Connecting to localhost
                                             ;; => db extracted from loaded config
```

**Key Takeaway**: Delays provide lazy initialization with memoization for expensive one-time computations.

**Why It Matters**: Delays defer expensive initialization (database connections, config parsing) until actually needed, reducing startup time by avoiding eager resource allocation. Memoization ensures computation runs exactly once even with concurrent dereferences—thread-safe singleton pattern without explicit synchronization. Production configuration systems use delays for optional features loading heavyweight dependencies only when enabled, reducing baseline memory footprint.

## Example 52: File I/O

Read and write files using clojure.java.io, which provides a Clojure-friendly wrapper around Java's I/O system. `spit` and `slurp` handle simple whole-file operations, while `with-open` and line-seq enable memory-efficient streaming for large files. `with-open` implements try-with-resources semantics, ensuring file handles are always closed even when exceptions occur.

```clojure
(require '[clojure.java.io :as io])          ;; => Import java.io wrapper

;; Write to file (overwrites)
(spit "data.txt" "Hello, World!")            ;; => Write string to file
                                             ;; => Creates or overwrites data.txt

;; Append to file
(spit "data.txt" "\nNew line" :append true)  ;; => Append string to file
                                             ;; => data.txt now contains both lines

;; Read entire file into string
(println (slurp "data.txt"))                 ;; => Read full file content
                                             ;; => Output: Hello, World!
                                             ;; => Output: New line

;; Line-by-line reading (memory efficient)
(with-open [rdr (io/reader "data.txt")]      ;; => Open reader (auto-closes after block)
  (doseq [line (line-seq rdr)]               ;; => Lazy sequence of lines
    (println "Line:" line)))                 ;; => Iterate each line
                                             ;; => Output: Line: Hello, World!
                                             ;; => Output: Line: New line

;; Write lines with redirected output
(with-open [wtr (io/writer "output.txt")]    ;; => Open writer (BufferedWriter)
                                             ;; => Auto-closes when block exits
  (binding [*out* wtr]                       ;; => Redirect *out* to file writer
                                             ;; => println now writes to file, not console
    (println "Line 1")                       ;; => Writes "Line 1\n" to output.txt
    (println "Line 2")))                     ;; => Writes "Line 2\n" to output.txt
                                             ;; => binding ends, wtr auto-closed
                                             ;; => File contains: "Line 1\nLine 2\n"

;; Read from classpath resources
(slurp (io/resource "config.edn"))           ;; => Find file in classpath resources/
                                             ;; => io/resource returns URL object
                                             ;; => slurp reads entire URL content
                                             ;; => Returns string of config.edn content
```

**Key Takeaway**: spit/slurp for simple I/O; with-open ensures resource cleanup.

**Why It Matters**: `with-open` provides automatic resource management via Java's try-with-resources eliminating manual close() calls preventing resource leaks. Lazy `line-seq` enables memory-efficient processing of gigabyte log files without loading entire content. Unlike Python's file handling requiring explicit context managers or Java's verbose try-finally, Clojure's `with-open` ensures cleanup even with exceptions—production log processing handles large data volumes using line-by-line streaming without memory issues.

## Example 53: Atoms Advanced Patterns

Advanced atom usage patterns for complex state management beyond basic \`swap!\` and \`reset!\`. Validators enforce data integrity by rejecting updates that violate predicates, providing runtime constraint checking impossible with static types. Watchers enable reactive programming by triggering side effects on state changes, while \`compare-and-set!\` provides low-level CAS for implementing custom lock-free algorithms.

```clojure
;; Atom with validators enforce constraints
(def positive-count
  (atom 0 :validator pos-int?))              ;; => Only positive integers allowed
                                             ;; => Validator predicate is pos-int?

(reset! positive-count 5)                    ;; => Set to 5 (passes validation)
                                             ;; => Returns 5

;; (reset! positive-count -1)                ;; => Uncommenting throws ExceptionInfo
                                             ;; => Validator rejects negative values

;; Atom with watchers for reactive updates
(def watched-atom (atom 0))                  ;; => Create atom to watch

(add-watch watched-atom :logger              ;; => Register watcher named :logger
  (fn [key ref old-val new-val]              ;; => Callback gets key, atom-ref, old, new values
    (println "Changed from" old-val "to" new-val)))

(reset! watched-atom 10)                     ;; => Change triggers watcher
                                             ;; => Output: Changed from 0 to 10
(swap! watched-atom inc)                     ;; => Increment also triggers watcher
                                             ;; => Output: Changed from 10 to 11
(remove-watch watched-atom :logger)          ;; => Unregister watcher by key

;; Compare and set for optimistic concurrency
(def counter (atom 0))                       ;; => Create counter atom

(compare-and-set! counter 0 1)               ;; => Check if value is 0, set to 1 if true
                                             ;; => true (value was 0, now 1)
(compare-and-set! counter 0 2)               ;; => Check if value is 0, set to 2 if true
                                             ;; => false (value is 1, not 0, so no change)
```

**Key Takeaway**: Validators enforce constraints; watchers enable reactive updates; compare-and-set provides CAS semantics.

**Why It Matters**: Atom validators provide runtime invariant checking preventing invalid state transitions that compile-time types can't express—critical for business rules like "account balance >= minimum". Watchers enable reactive programming where state changes trigger side effects (logging, metrics, notifications) without polling. `compare-and-set!` provides low-level CAS for implementing lock-free algorithms—production balance updates use CAS for optimistic concurrency handling high transaction throughput without blocking.

## Example 54: Set Operations

Clojure sets support relational algebra operations from \`clojure.set\`. Beyond basic union, intersection, and difference, the library provides SQL-like operations: \`join\` correlates sets of maps on common keys, \`select\` filters by predicate, and \`project\` reduces to specified fields. These operations enable in-memory relational data manipulation without SQL strings or ORM overhead.

```clojure
(require '[clojure.set :as set])             ;; => Import set operations

(def set1 #{1 2 3 4})                        ;; => Set with elements 1-4
(def set2 #{3 4 5 6})                        ;; => Set with elements 3-6

;; Union combines all elements
(set/union set1 set2)                        ;; => All unique elements from both sets
                                             ;; => #{1 2 3 4 5 6}

;; Intersection finds common elements
(set/intersection set1 set2)                 ;; => Elements in both sets
                                             ;; => #{3 4}

;; Difference finds unique to first set
(set/difference set1 set2)                   ;; => Elements in set1 but not set2
                                             ;; => #{1 2}

;; Relational operations on sets of maps
(def users #{{:id 1 :name "Alice" :dept "IT"}     ;; => Set of user maps
             {:id 2 :name "Bob" :dept "HR"}
             {:id 3 :name "Charlie" :dept "IT"}})

(def depts #{{:dept "IT" :budget 100000}           ;; => Set of department maps
             {:dept "HR" :budget 50000}})

;; Join combines sets on common key
(set/join users depts)                       ;; => Join on :dept key
                                             ;; => Returns users with dept budgets

;; Select filters set by predicate
(set/select #(= (:dept %) "IT") users)       ;; => Filter to IT department users
                                             ;; => Returns Alice and Charlie

;; Project keeps only specified keys
(set/project users [:name :dept])            ;; => Reduce maps to name and dept only
                                             ;; => Returns #{["Alice" "IT"] ["Bob" "HR"] ...}

;; Rename transforms keys
(set/rename users {:name :full-name})        ;; => Replace :name with :full-name
                                             ;; => Returns users with :full-name instead
```

**Key Takeaway**: Set operations provide relational algebra for in-memory data manipulation.

**Why It Matters**: Set relational operations (join, select, project) enable SQL-like data manipulation in-memory without database overhead—perfect for data transformations on modest datasets. Natural joins eliminate explicit foreign key matching providing declarative data composition. Unlike SQL requiring string-based queries, Clojure's set operations are typesafe functions composable in pipelines—production risk analysis uses set joins combining customer data, transaction history, and credit scores from multiple services.

## Summary

Intermediate Clojure (examples 28-54) covers production patterns for real-world development: multimethods and protocols for polymorphism, macros for metaprogramming, STM and async coordination, core.async for CSP-style concurrency, spec for validation, transducers for efficient transformations, comprehensive error handling, lazy sequences, testing, dependency management, and advanced Java interop. Master these patterns to write maintainable, concurrent Clojure applications operating at 75% language coverage.
````
