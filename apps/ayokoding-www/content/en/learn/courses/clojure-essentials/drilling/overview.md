---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real translation mistakes, eight hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the details blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: read the starter and name the smell in one sentence, write your version without peeking at the solution, run it, then diff against the committed solution and account for every difference. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

### Q1 (co-01): When does `->` fit and when does `->>` fit, and what is the one-line test?

<details><summary>Answer</summary>

Thread-first fits when the threaded value leads each call, typically map and record updates where the thing changing comes first. Thread-last fits when the value trails, typically sequence pipelines where the collection is the last argument. The one-line test: read the pipeline aloud, and if every step sounds like it acts on the value from the front, take `->`, while steps that consume collections from the back take `->>`. Reaching for `as->` names the value explicitly for the awkward middle cases, which is also a signal the pipeline may want splitting. Example 7 proves both directions with identical values.

</details>

### Q2 (co-02): Why does `ex-info` beat a stringly exception, and what reads the data back?

<details><summary>Answer</summary>

A string message forces every handler to parse prose to learn what happened, which breaks the moment anyone rewords the text. `ex-info` attaches a data map of the values in play alongside the message, so handlers branch on facts with `ex-data` instead of matching substrings. The message still serves humans in logs while the map serves code in handlers, and the two evolve independently. Example 10 shows the throw site and the read-back side by side, with sorted keys keeping the map deterministic.

</details>

### Q3 (co-03): What single vocabulary works over vectors, lists, sets, strings, and maps, and why?

<details><summary>Answer</summary>

The sequence abstraction: `first`, `rest`, `map`, `filter`, `reduce`, `count`, and `take` operate on the seq view every collection provides rather than on concrete types. Writing to the abstraction keeps functions reusable across collection kinds their authors never anticipated, instead of multiplying type-specific loops. Example 47 maps, filters, and reduces across four collection kinds with three functions, and Example 2 shows both sequential types answering the same calls.

</details>

### Q4 (co-04): Before writing a string helper, which namespace do you read, and what does it promise?

<details><summary>Answer</summary>

`clojure.string` first: case changes, joins, splits, trims, replacements, and predicates, all pure functions taking the string first and returning a new one. The promise is coverage of everyday text work without a dependency, plus pipelines that read as value flow because nothing mutates. Example 18 exercises six functions in six lines, and Kata 03 replaces a hand-rolled join loop with one `str/join` call over mapped values.

</details>

### Q5 (co-05): Which types measure machine time and which measure human time, and what goes wrong crossing them?

<details><summary>Answer</summary>

`Instant` with `Duration` measures machine time: exact elapsed timestamps in UTC with ISO-printed spans like `PT1H30M`. `LocalDate` with `Period` measures human time: calendar distance in years, months, and days for expiries and schedules. Crossing them corrupts daylight-saving boundaries, where a duration across a spring-forward Sunday runs an hour short of a calendar day. Example 24 prints both side by side from fixed values, and no example in this course ever reads the clock.

</details>

### Q6 (co-06): What does `defn-` hide, and why does the dash matter to readers?

<details><summary>Answer</summary>

`defn-` defines a namespace-private helper that other namespaces should not call, marking the boundary between the public surface and implementation detail. The dash matters because readers learn the contract instantly: undashed names are promises kept across releases, dashed names are free to change. Example 26 defines both side by side, and testing still reaches privates through the public functions that use them, as Example 37 demonstrates.

</details>

### Q7 (co-07): What shape does every lock-file line take, and what fails the build?

<details><summary>Answer</summary>

Each line is a Maven coordinate, a SHA-256 hash, and nothing else, with an optional repository field only for lines Maven Central does not serve. Comments and blank lines carry human context and parse as skips. A hash mismatch fails the build naming the line, which is the tamper gate working as designed, and a coordinate neither repository serves stops the course as blocked. Example 30 parses a two-line fixture of the exact shape, and the course `jars.lock` carries nine such lines.

</details>

### Q8 (co-08): What are the three parts of the standard test shape, and what does `run-tests` return?

<details><summary>Answer</summary>

`deftest` names the behavior under test, `is` asserts one fact inside it, and `run-tests` executes the namespace and reports counts. The return value is a summary map with `:test`, `:pass`, `:fail`, and `:error` keys, which scripts destructure into a green predicate instead of parsing formatted text. Example 35 shows the full shape with two tests and three assertions, and Example 43 reads the summary map as data.

</details>

### Q9 (co-09): Why must the function inside `swap!` stay pure, and what happens if it is not?

<details><summary>Answer</summary>

`swap!` retries the update function against fresh values when contention intervenes, so the function may run more than once per logical update. Side effects inside repeat unpredictably: duplicate log lines, double-charged counters, repeated network calls. Pure functions make retries invisible, which is the entire safety argument for lock-free updates. Example 56 performs three swaps with arithmetic only, and Kata 05 moves a racy counter into an atom with `inc`.

</details>

### Q10 (co-10): What decides which method runs in a multimethod call, and how do you add a case?

<details><summary>Answer</summary>

The dispatch function named in `defmulti` computes a dispatch value from the arguments, and the `defmethod` matching that value runs, with `:default` catching the rest. Adding a case means one new `defmethod` and zero edits elsewhere, which keeps extension open without touching existing code. Dispatch can key on keywords, types, counts, or arbitrary predicates, serving polymorphism, routing, and rule tables alike. Example 45 dispatches greetings on a `:lang` key with an open fallback.

</details>

### Q11 (co-11): Why does `assoc` cost proportionally to the change rather than the size?

<details><summary>Answer</summary>

Structural sharing: the new map reuses every unchanged branch of the old value, allocating only along the changed path. Holders of the old value keep seeing it intact, which removes aliasing bugs and makes cross-thread sharing safe by default. The demo in Example 49 prints the original plus both updates to prove all three coexist. Transients drop even the path cost inside tight single-threaded builds, as Example 50 shows.

</details>

### Q12 (co-12): What do the two linter levels in the course fixture mean, and where does the linter run?

<details><summary>Answer</summary>

`unresolved-symbol` at `:error` fails on names nothing defines, catching typos and stale refers at edit time. `unused-binding` at `:warning` flags dead locals without blocking, inviting cleanup rather than demanding it. `clj-kondo` runs without executing code, in editors for immediacy and in CI for enforcement. Example 63 reads both levels back out of the fixture as data, proving the policy landed where the team can audit it.

</details>

### Q13 (co-13): How do you tell an instance call from a static call at a glance, and what chains setup calls?

<details><summary>Answer</summary>

Instance calls lead with a dot, `(.size items)`, naming the method on its target object. Static calls use the slash, `(Math/max 3 7)`, naming the class member outright. `doto` chains any number of setup calls against one object and returns the object, reading as a builder block without nesting. Example 74 shows all three against a Java list, with `vec` reading the result back into Clojure data afterward.

</details>

### Q14 (co-14): What do the `?`, `!`, and `->` name endings promise at call sites?

<details><summary>Answer</summary>

`?` promises a yes-no question answered by a boolean, so call sites read as conditions without type checks. `!` warns of dangerous side effects like resets, so callers notice the risk in the name. `->` names a conversion with both ends visible, so the direction never needs guessing. Kebab-case joins multi-word names throughout. Example 65 prints the convention table, and Example 67 lifts a `?` predicate over collections.

</details>

### Q15 (co-15): Why does one transducer pass beat three chained sequence steps, and when does it matter?

<details><summary>Answer</summary>

Chained sequence functions allocate an intermediate lazy sequence per step, paying per element per stage. A composed transducer fuses the steps into one pass with no intermediates, running the same recipe through `transduce`, `into`, or `sequence`. The win matters on hot paths over large collections; six-element vectors never notice. Example 48 sums through a three-step recipe in one pass, printing both the total and the collected vector.

</details>

### Q16 (co-16): What order reads an unfamiliar module, and what is the comprehension test?

<details><summary>Answer</summary>

Data definitions first, because everything below assumes their shapes; pure core functions next, checked with small mental evaluations; entry points after, stating the user-facing promises; the demo run last. The comprehension test is predicting the demo output before looking: two numbers stated from understanding rather than read from the transcript. Example 78 stages a rates module in exactly these layers with an eleven and a twelve to predict.

</details>

### Q17 (co-01): Where must `recur` sit, and what does the compiler do when it sits elsewhere?

<details><summary>Answer</summary>

`recur` must sit in tail position of its `loop` or function, the spot whose value becomes the whole result with nothing left to do. The compiler turns a well-placed `recur` into a jump that reuses the stack frame, giving iteration speed to recursion shape. Anywhere else it is a compile error rather than a slow path or a stack overflow, which makes misplacement loud at edit time. Example 5 gathers a countdown this way, and Example 15 budgets retries with the same skeleton.

</details>

### Q18 (co-02): How does `some->` handle a `nil` midway, and what continues after?

<details><summary>Answer</summary>

It stops threading immediately and returns `nil` without calling any further step, so no function ever receives the `nil` it cannot handle. Nothing continues after: the whole expression evaluates to `nil`, and callers branch on that like any other absent value. This turns nested presence checks into one linear form. Example 12 threads through a present map to `ada` and through a gapped map to `nil`, printing both.

</details>

### Q19 (co-03): When do you reach for `sorted-map` over a hash map, and what does `subseq` buy?

<details><summary>Answer</summary>

Reach for it when consumers need key-ordered traversal: reports, leaderboards, and range windows that would otherwise sort on every read. `subseq` with comparators slices the key range directly, skipping everything outside instead of filtering after the fact. The price is logarithmic updates against constant hash updates, paid once at construction rather than per read. Example 51 traverses by age and slices the senior window.

</details>

### Q20 (co-08): Why does every property test in this course pin its seed, and what replays a failure?

<details><summary>Answer</summary>

Generators draw random inputs by default, which would make transcripts wobble and failures unreproducible across machines. The fixed seed freezes the drawn sample, so the same hundred cases run everywhere and the golden output holds byte-stable. Replaying a failure means rerunning with the identical seed, which the `quick-check` call states outright. Examples 38 and 39 both pin `:seed 42` and neighboring seeds for their samples.

</details>

### Q21 (co-09): What ends a channel stream, and how does the consumer collect what remains?

<details><summary>Answer</summary>

`close!` ends the stream: no further puts allowed, while takes drain the buffered remainder and then return `nil`. The consumer collects with `async/into`, which delivers the whole remaining contents through its own channel for one final take. Closing the output after the input drains propagates the ending downstream stage by stage. Examples 59 and 60 close both channels and collect through `into` with sorted prints.

</details>

### Q22 (co-10): When does a protocol fit better than a multimethod, and when is it the reverse?

<details><summary>Answer</summary>

Protocols fit when types share named behavior with per-type implementations, especially with records carrying the data, because the call site stays a plain function call. Multimethods fit when dispatch keys on arbitrary functions of the arguments rather than types, or when cases must open without touching existing code. Example 46 answers `area` through two record types, while Example 45 routes greetings through an open keyword table.

</details>

### Q23 (co-11): How many elements realize when you `take` three from a mapped infinite series, and how do you know?

<details><summary>Answer</summary>

Exactly three, because lazy sequences compute only what consumers demand and `take` demands three. The call counter in Example 52 proves it observably: zero before the take, three after, with the mapped function running once per pulled element. Chunked sources would realize more, which is why the example builds on unchunked `iterate`. Holding the head pins realized elements, the one space caveat worth memorizing.

</details>

### Q24 (co-16): What does `macroexpand-1` show for `(when true 1 2)`, and why stop at one layer?

<details><summary>Answer</summary>

It shows `(if true (do 1 2))`: the `when` sugar peeled to its conditional core with nothing else hiding. One layer stays readable while full expansion recurses into every nested macro, burying the answer under implementation detail. Peeling a foreign macro one layer at a time turns magic-looking calls into plain calls a reviewer can verify. Example 72 prints this expansion plus a threading expansion for confirmation.

</details>

## Applied problems

### Problem 1: Rewrite the translated loop

A Java-trained colleague writes Clojure with indexed `dotimes` walks, manual accumulators, and `nth` calls into vectors. Rewrite their thirty-line summation-and-filter as a five-line threading pipeline over sequence functions, then state which collection operation replaced each loop element. Map to Examples 5-7 and 47.

Model approach: Name the transformation each loop performed, then pick the sequence function with the same shape: filtering loops become `filter`, mapping loops become `map`, totaling loops become `reduce` or `transduce`. Thread the collection through the stages with `->>` so the data flows last-to-result in reading order. Verify by running both versions on the fixture input and diffing the outputs byte for byte before deleting the original.

### Problem 2: Choose for a malformed CSV row

An importer meets a row with the wrong column count. The caller was always going to handle bad rows by logging and continuing. Choose the shape and defend it against the two alternatives. Map to Examples 9-13 and 17.

Model approach: Return `{:error ...}` with the row number and the expected count: the failure is expected, so it belongs in the return channel where the caller branches without ceremony. Throwing `ex-info` would suit a violated business rule, not routine dirt, and asserting would crash the import over data it was designed to survive. The caller destructures and continues, and the error maps aggregate into the import report.

### Problem 3: Choose for a missing database password

Startup finds no database password in configuration. Nothing downstream can possibly work. Choose the shape and defend it against the two alternatives. Map to Examples 10-11 and 17.

Model approach: Throw `ex-info` with the config key and the files searched: a broken deployment contract needs a loud failure with triage context, not a default that connects somewhere wrong. Returning an error map would push the decision onto callers unequipped to supply credentials, and asserting states too little about what to fix. Fail at the boundary with the data the operator needs.

### Problem 4: Choose for an impossible branch

A `cond` over an order status reaches its `:else` with a status the spec says cannot exist. The program state contradicts its own model. Choose the shape and defend it against the two alternatives. Map to Examples 11 and 17.

Model approach: Assert with the offending status in the message: a lie this deep means the model already broke, and continuing corrupts everything downstream. Returning an error map would normalize the impossible into routine handling, and throwing `ex-info` suggests a recoverable domain failure rather than a programmer error. Loud halt, fix the model, redeploy.

### Problem 5: Find the stdlib replacement

Three hand-rolled helpers lurk in the codebase: a `my-join` looping strings together, a `get-or` wrapping nil checks around lookups, and a `index-of-sub` scanning with `subs`. Name the standard replacement for each and delete the helper. Map to Examples 3, 12, and 18.

Model approach: `my-join` becomes `clojure.string/join`, `get-or` becomes `get` with a not-found default, and `index-of-sub` becomes `clojure.string/index-of`. Each replacement deletes the helper, its tests, and its future drift in one commit. Read the namespace docstrings before writing any helper: the standard library answers most text and lookup needs already.

### Problem 6: Thread the nested report builder

A report builder nests `assoc`, `update`, and keyword calls four deep, forcing readers to start innermost. Restructure it as a `->` pipeline with one stage per line and predict the output before running. Map to Examples 7 and 71.

Model approach: Thread the accumulator map through `assoc` and `update` stages in execution order, ending with the keyword extraction as the final stage. Annotate each stage with its input-to-output shape in a comment, then predict the printed map before running. The prediction step converts the restructuring from reformatting into verified understanding.

### Problem 7: Spec the signup boundary

Signup payloads arrive as maps with string emails, integer ages, and optional referral codes. Write `s/def` names for each field plus an `s/keys` row spec, then print `valid?` for one good payload and two broken ones. Map to Examples 14, 39, and 77.

Model approach: Name `::email` with a predicate combining `string?` and an `@` inclusion check, `::age` with a non-negative integer predicate, and `::referral` as optional string. The row spec requires email and age with referral optional. Print all three verdicts and the problem count for one failure, keeping library prose out of the transcript per the course determinism rule.

### Problem 8: Decide the dependency for histograms

The team needs histograms over event streams. One faction wants a charting library, another wants a statistics library, and the counts could come from `frequencies` plus `sort-by`. Apply the preference order and decide. Map to Examples 3, 34, and 51.

Model approach: Standard library first: `frequencies` plus `sort-by` answers the counting need with zero new supply-chain entries, proven in three lines against the event fixture. Add a library only when rendering or distributions enter the requirements, and then pinned and hashed through the lock file. The decision record states what the standard answer covered and what gap, if any, justified the addition.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: error handling and tests first, because failures and proofs underlie everything; threading and atoms next, because they train the two reflexes idiomatic code demands; specs, transducers, and channels last, because each isolates one intermediate judgement.

### Kata 01: Convert a Thrown String into ex-info Data

(Concepts: co-02.)

The starter throws a bare `RuntimeException` with the shortfall baked into a message string. Convert it so the failure carries its context as data, and read the shortfall back out with `ex-data`. Done looks like the happy-path print unchanged plus a data map naming balance, amount, and shortfall.

**Before** (`drilling/code/kata-01-exception-to-ex-info/before/starter.clj`):

```clojure
;; => Kata 1 starter: stringly failures force callers to parse messages.
(defn withdraw [balance amount] ;; => subtract or fail
  (if (>= balance amount) ;; => enough funds
    (- balance amount) ;; => the new balance
    (throw (RuntimeException. (str "need " amount " have " balance))))) ;; => message only
(println (withdraw 100 30)) ;; => prints 70, the happy path works
```

**After** (`drilling/code/kata-01-exception-to-ex-info/after/solution.clj`):

```clojure
;; => Kata 1 solution: ex-info carries the shortfall as data, not prose.
(defn withdraw [balance amount] ;; => subtract or fail with context
  (if (>= balance amount) ;; => enough funds
    (- balance amount) ;; => the new balance
    (throw (ex-info "insufficient funds" {:balance balance :amount amount :short (- amount balance)})))) ;; => data, not drama
(println (withdraw 100 30)) ;; => prints 70
(println (ex-data (try (withdraw 10 30) (catch clojure.lang.ExceptionInfo e e)))) ;; => prints the shortfall map
```

**Output** (`drilling/code/kata-01-exception-to-ex-info/expected/main.stdout.txt`):

```text
70
{:balance 10, :amount 30, :short 20}
```

### Kata 02: Write the First Standard Test

(Concepts: co-08.)

The starter defines a discount function with no tests. Add a `deftest` with two facts that pin its behavior, run the suite, and print the green verdict. Done looks like the standard report lines plus a `green: true` confirmation.

**Before** (`drilling/code/kata-02-first-standard-test/before/starter.clj`):

```clojure
;; => Kata 2 starter: a discount function with no tests at all.
(defn discount [price pct] ;; => ten percent off should be exact
  (* price (- 1 pct))) ;; => the implementation, unverified
(println (discount 100 0.1)) ;; => prints 90.0, trust without proof
```

**After** (`drilling/code/kata-02-first-standard-test/after/solution.clj`):

```clojure
(require '[clojure.test :refer [deftest is run-tests]]) ;; => the standard vocabulary
;; => Kata 2 solution: the test states the contract; the suite proves it.
(defn discount [price pct] ;; => the function under test
  (* price (- 1 pct))) ;; => unchanged implementation, now pinned
(deftest discount-maths ;; => two facts pin the behavior
  (is (= 90.0 (discount 100 0.1))) ;; => ten percent off one hundred
  (is (= 0.0 (discount 0 0.5)))) ;; => half off zero stays zero
(let [{:keys [fail error]} (run-tests)] ;; => run the suite
  (println "green:" (zero? (+ fail error)))) ;; => prints green: true
```

**Output** (`drilling/code/kata-02-first-standard-test/expected/main.stdout.txt`):

```text

Testing user

Ran 1 tests containing 2 assertions.
0 failures, 0 errors.
green: true
```

### Kata 03: Replace a Hand-Rolled Join with str/join

(Concepts: co-04, co-03.)

The starter builds comma-separated lines with an explicit loop and a mutable-feeling accumulator. Replace the loop with one `clojure.string` call over mapped values. Done looks like identical output from a third of the code.

**Before** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/before/starter.clj`):

```clojure
;; => Kata 3 starter: a hand-rolled join over an explicit loop.
(defn csv-line [cells] ;; => comma-separate anything printable
  (loop [left cells out ""] ;; => left consumes, out accumulates
    (if (empty? left) ;; => nothing left to add
      out ;; => the built line
      (recur (rest left) (str out (if (empty? out) "" ",") (str (first left))))))) ;; => glue then cell
(println (csv-line ["ada" 30])) ;; => prints ada,30
```

**After** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/after/solution.clj`):

```clojure
(require '[clojure.string :as str]) ;; => the standard text vocabulary
;; => Kata 3 solution: one stdlib call replaces the hand-rolled loop.
(defn csv-line [cells] (str/join "," (map str cells))) ;; => join with commas
(println (csv-line ["ada" 30 :dev])) ;; => prints ada,30,:dev
(println (str/upper-case (csv-line ["a" "b"]))) ;; => prints A,B
```

**Output** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/expected/main.stdout.txt`):

```text
ada,30,:dev
A,B
```

### Kata 04: Rewrite Nesting as Threading

(Concepts: co-01.)

The starter nests three updates inside out so readers start at the innermost call. Rewrite both expressions with threading macros that read in execution order. Done looks like identical values from pipelines that read top down.

**Before** (`drilling/code/kata-04-threading-rewrite/before/starter.clj`):

```clojure
;; => Kata 4 starter: inside-out nesting reads backwards from execution.
(println (:total (update (assoc {:total 0} :items 3) :total + 90))) ;; => prints 90, read inside out
(println (vec (map #(* % 2) (sort [5 1 4])))) ;; => prints [2 8 10], sort hides inside
```

**After** (`drilling/code/kata-04-threading-rewrite/after/solution.clj`):

```clojure
;; => Kata 4 solution: the pipeline reads top down instead of inside out.
(println (-> {:total 0} (assoc :items 3) (update :total + 90) (:total))) ;; => prints 90
(println (->> [5 1 4] sort (map #(* % 2)) vec)) ;; => prints [2 8 10]
```

**Output** (`drilling/code/kata-04-threading-rewrite/expected/main.stdout.txt`):

```text
90
[2 8 10]
```

### Kata 05: Guard a Counter with an Atom

(Concepts: co-09, co-11.)

The starter counts with a plain var mutation that races under concurrency. Move the counter into an atom and bump it with `swap!` and a pure function. Done looks like exactly one hundred bumps landing plus a printed return value.

**Before** (`drilling/code/kata-05-atom-safe-counter/before/starter.clj`):

```clojure
;; => Kata 5 starter: a var mutation that races under concurrency.
(def hits 0) ;; => shared counter, unguarded
(dotimes [_ 5] (def hits (inc hits))) ;; => rebind five times, races in threads
(println hits) ;; => prints 5, correct only while single-threaded
```

**After** (`drilling/code/kata-05-atom-safe-counter/after/solution.clj`):

```clojure
;; => Kata 5 solution: swap! with a pure function keeps concurrent bumps exact.
(def hits (atom 0)) ;; => shared counter, guarded
(dotimes [_ 100] (swap! hits inc)) ;; => one hundred atomic bumps
(println @hits) ;; => prints 100
(println (swap! hits + 50)) ;; => prints 150, swap! returns the new value
```

**Output** (`drilling/code/kata-05-atom-safe-counter/expected/main.stdout.txt`):

```text
100
150
```

### Kata 06: Gate Dirty Rows with a Spec

(Concepts: co-02.)

The starter trusts incoming row maps without checking them. Define id, quantity, and row specs and print the verdict for one good row, one negative quantity, and one missing key. Done looks like true, false, false with the shape named once.

**Before** (`drilling/code/kata-06-spec-gate-for-rows/before/starter.clj`):

```clojure
;; => Kata 6 starter: row maps enter unchecked and explode downstream.
(defn row-total [{id :user/id qty :user/qty}] ;; => trusts both keys blindly
  (* id qty)) ;; => multiplies whatever arrived
(println (row-total {:user/id 7 :user/qty 3})) ;; => prints 21, the one good case
```

**After** (`drilling/code/kata-06-spec-gate-for-rows/after/solution.clj`):

```clojure
(require '[clojure.spec.alpha :as s]) ;; => boundary validation vocabulary
;; => Kata 6 solution: specs gate the boundary; callers branch on booleans.
(s/def ::id int?) ;; => ids are ints
(s/def ::qty (s/and int? #(>= % 0))) ;; => quantities never negative
(s/def ::row (s/keys :req [::id ::qty])) ;; => the row shape, named once
(println (s/valid? ::row {:user/id 7 :user/qty 3})) ;; => prints true
(println (s/valid? ::row {:user/id 7 :user/qty -1})) ;; => prints false
(println (s/valid? ::row {:user/id 7})) ;; => prints false, qty missing
```

**Output** (`drilling/code/kata-06-spec-gate-for-rows/expected/main.stdout.txt`):

```text
true
false
false
```

### Kata 07: Replace a Hand Loop with a Transducer

(Concepts: co-10, co-15.)

The starter accumulates matching prices with an explicit loop and a conj accumulator. Replace the loop with one composed transducer run two ways. Done looks like identical totals from `transduce` and identical vectors from `into`.

**Before** (`drilling/code/kata-07-transducer-over-hand-loop/before/starter.clj`):

```clojure
;; => Kata 7 starter: an explicit accumulation loop over prices.
(defn total-over [min-price rows] ;; => sum prices above the floor
  (loop [left rows acc 0] ;; => left consumes, acc accumulates
    (if (empty? left) ;; => nothing left
      acc ;; => the total
      (let [p (:price (first left))] ;; => inspect the head row
        (recur (rest left) (if (and p (> p min-price)) (+ acc p) acc)))))) ;; => add or skip
(println (total-over 0 [{:price 10} {:price -5} {:price 20}])) ;; => prints 30
```

**After** (`drilling/code/kata-07-transducer-over-hand-loop/after/solution.clj`):

```clojure
;; => Kata 7 solution: one transducer replaces the hand-rolled loop.
(def xf-total (comp (map :price) (filter pos?) (take 100))) ;; => prices, positive, bounded
(println (transduce xf-total + [{:price 10} {:price -5} {:price 20}])) ;; => prints 30
(println (into [] xf-total [{:price 10} {:price -5} {:price 20}])) ;; => prints [10 20]
```

**Output** (`drilling/code/kata-07-transducer-over-hand-loop/expected/main.stdout.txt`):

```text
30
[10 20]
```

### Kata 08: Connect Two Stages with a Channel

(Concepts: co-09.)

The starter transforms a collection with a plain map. Rebuild it as two channel stages where a `go` block increments each fed value and the main thread collects through `into`. Done looks like a sorted transcript of incremented values.

**Before** (`drilling/code/kata-08-channel-pipeline-kata/before/starter.clj`):

```clojure
;; => Kata 8 starter: a plain map with no staging at all.
(println (map inc [1 2])) ;; => prints (2 3), no channel involved
```

**After** (`drilling/code/kata-08-channel-pipeline-kata/after/solution.clj`):

```clojure
(require '[clojure.core.async :as async]) ;; => channels, locked and pinned
;; => Kata 8 solution: stages connect through channels; into collects the result.
(let [in (async/chan 10) out (async/chan 10)] ;; => roomy buffers, no parking
  (async/go (loop [] (if-let [x (async/<! in)] (do (async/>! out (inc x)) (recur)) (async/close! out)))) ;; => add one per value
  (async/>!! in 1) ;; => feed the first value
  (async/>!! in 2) ;; => feed the second value
  (async/close! in) ;; => end the feed
  (println (sort (async/<!! (async/into [] out))))) ;; => prints (2 3)
```

**Output** (`drilling/code/kata-08-channel-pipeline-kata/expected/main.stdout.txt`):

```text
(2 3)
```

## Self-check checklist

- I can thread a three-stage transformation with `->` and `->>` in the right positions (co-01).
- I can erase interop reflection with type hints and speed hot loops with transients (co-15).
- I can throw `ex-info` with context and read it back with `ex-data` (co-02).
- I can choose error maps, `ex-info`, or `assert` by failure kind (co-02).
- I can process vectors, maps, and strings with shared seq functions (co-03).
- I can order results with `sorted-map`, `subseq`, and `sort-by` (co-03).
- I can handle text, regex, files, and EDN with the standard library only (co-04).
- I can read an unfamiliar namespace in layers and expand one macro layer (co-16).
- I can model machine time with `Instant` and `Duration` and human time with `LocalDate` and `Period` (co-05).
- I can format and parse dates with a pinned locale and a proven round trip (co-05).
- I can lay out a namespace with `ns`, public `defn`, and private `defn-` (co-06).
- I can translate dashed namespaces to underscored file paths without thinking (co-06).
- I can read a `deps.edn` plus hash lock and state what each line guarantees (co-07).
- I can pin exact versions and verify them back out of data (co-07).
- I can write `deftest` suites with fixtures, stubs, and a failing-test-first loop (co-08).
- I can state a property with `for-all` and run it seeded with `quick-check` (co-08).
- I can pick atoms, refs, agents, futures, or channels by the need at hand (co-09).
- I can connect two `core.async` stages through channels with a clean close (co-09).
- I can dispatch openly with multimethods and share behavior with protocols (co-10).
- I can fuse a pipeline into one transducer pass with `comp` (co-10).
- I can update persistently with `assoc` and `update` while originals survive (co-11).
- I can state the linter policy and bound printed output with print controls (co-12).
- I can drive Java objects with dots, statics with slashes, and setup with `doto` (co-13).
- I can name functions, predicates, and conversions in community style (co-14).

That list holds twenty-four checks; the floor is twenty-four and every concept appears at least once.

## Elaborative interrogation & self-explanation

1. **Why `ex-info` maps instead of richer exception hierarchies?**
   Rejected alternative: a taxonomy of exception classes, one per failure kind, caught by class. Hierarchies ossify: every new failure needs a new class, handlers catch ancestors too broadly or descendants too narrowly, and data still travels as untyped fields. `ex-info` keeps one throwable type with open data, so handlers branch on facts present in this failure rather than on classes imagined last year. The model answer: prefer open data on one type over closed types with hidden fields.
   Model answer: Hierarchies centralize what data can say; maps decentralize it to the throw site that knows. New context arrives as a key, not a release, and old handlers ignore keys they never heard of instead of misrouting. Catch by the one class, branch by the data.

2. **Why immutable values when mutation is faster to write?**
   Rejected alternative: mutable maps and loops with counters, the expedient first draft. Mutation hides data flow in time: the value a function receives depends on who touched it last, which defeats local reasoning and makes concurrency a locking discipline. Persistent values cost allocation along the changed path and repay it in reasoning, sharing, and lock-freedom everywhere downstream. The model answer: optimize the hot path with transients, keep values everywhere else.
   Model answer: Write the common case immutable so every function means what its arguments say. When profiling names a build loop, scope a transient inside it and freeze at the boundary. Speed where measured, values everywhere.

3. **Why fixed seeds instead of letting generators roam?**
   Rejected alternative: unseeded property runs that explore fresh inputs every execution, maximizing coverage per run. Roaming inputs wobble transcripts, so golden files fail spuriously, and a found failure may never reproduce on the machine that must fix it. Fixed seeds trade novel coverage per run for exact replay: the same hundred cases everywhere, with seed rotation across releases recovering the exploration. The model answer: determinism first, rotation across time, never randomness in the transcript.
   Model answer: Pin the seed so the suite is a function of the code, not of the run. Rotate seeds deliberately between releases and record which seed found what. Reproducibility is a feature of the test, not a constraint on it.

4. **Why channels here instead of shared atoms with watchers?**
   Rejected alternative: atoms holding queues with `add-watch` callbacks pushing work between stages. Watchers fire synchronously inside the swap, coupling producer speed to consumer speed with no buffer and no backpressure: a slow consumer stalls every producer. Channels separate the stages with bounded buffers, letting each pace independently while memory stays capped. The model answer: share memory by communicating, and bound the queue between different speeds.
   Model answer: Atoms coordinate state, channels connect stages. When the problem is flow rather than facts, the buffer is the design: fixed size, blocking puts, clean close. Watchers observe state; they are not a transport.

5. **Why specs at the boundary instead of deep inside the logic?**
   Rejected alternative: validating at every function entry, wrapping the whole program in checks. Interior checks duplicate the boundary's work while taxing every call, and they scatter the shape definition across dozens of preconditions. One spec at the entry states the shape once, rejects dirt immediately, and lets interior functions trust their inputs by construction. The model answer: validate where dirt enters, trust where specs guard.
   Model answer: Boundaries are few and dirt is certain there; interiors are many and clean by induction. Name each boundary shape once as a spec, check on entry, and keep the core free of defensive repetition.

6. **Why threading over a well-named helper function?**
   Rejected alternative: extracting the nested calls into a named helper that hides the stages. Helpers earn their keep when the composition repeats or deserves a name, but a one-off pipeline wrapped in a helper merely moves the nesting behind an indirection. Threading shows the stages in order at the use site, keeping one-off flow visible where readers already look. The model answer: thread the one-off, name the repeated.
   Model answer: Count the uses before extracting: one use threads inline with stage comments, three uses take a name with tests. Premature helpers scatter simple flows across definitions; premature nesting hides them. The pipeline form is the honest middle.
