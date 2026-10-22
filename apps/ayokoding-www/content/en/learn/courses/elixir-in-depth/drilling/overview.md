---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns the sixteen concepts into reflexes: recall questions that test memory, applied problems that test judgment, katas that test hands, checklists that test coverage, and interrogation that tests understanding of why each idiom won. Work them in order: recall first so the vocabulary is present, applied problems next so judgment forms, katas after so the hands learn what the head already knows, then the checklist and interrogation to close the gaps the first three exposed.

## Recall Q&A

Twenty-four questions, at least one for each of co-01 to co-16. Answer aloud before opening the detail block; a hesitation is a gap, not a failure.

### Q1: What does `=` do in Elixir, and how does `^` change it?

<details>
<summary>Answer</summary>

`=` is the match operator: it checks that the right side fits the shape on the left and binds the names it finds. `x = 1` binds; `%{name: n} = user` destructures. Rebinding points a name at a new value without touching the old one. `^` turns a match into a comparison against the current binding, so `^name = "ada"` succeeds only when the value already equals `"ada"`. A shape that cannot fit raises `MatchError` instead of producing a null. (Concepts: co-01.)

</details>

### Q2: When does `with` jump to `else`, and what do `else` clauses match?

<details>
<summary>Answer</summary>

`with` runs its `<-` steps top to bottom; the first step whose value fails to match its left pattern stops the chain and jumps to `else`. The `else` clauses match the short-circuit value itself — `{:error, :missing}` from a fetch, `false` from a guard — never a bare fallback. The `do` block runs only when every step matched. Order `else` clauses specific-first because a bare `_` swallows the specific failures below it. (Concepts: co-01.)

</details>

### Q3: When do failures travel as tuples, and when do they raise?

<details>
<summary>Answer</summary>

Expected failures travel as `{:error, reason}` tuples that callers match on: missing keys, bad input, parse failures. Broken contracts raise: a zero divisor in a function whose contract forbids it, a missing struct key under dot access. Library code returns tuples across boundaries so callers can branch; application edges call bangs and let them raise loudly. Supervised workers crash and let the supervisor decide. The consumer of the failure chooses the shape. (Concepts: co-02.)

</details>

### Q4: Why does a retry loop carry its budget as an argument?

<details>
<summary>Answer</summary>

A countdown in the signature makes the bound reviewable and the exhaustion path testable: `retry.(retry, 1, 3)` succeeds on the last attempt while `retry.(retry, 1, 1)` gives up at once and returns `{:error, :gave_up}`. Retry without a bound is an outage with extra steps, because a permanently failing dependency turns the loop into an infinite hang. Budgets are arguments, not comments, so the transcript proves they bind. (Concepts: co-02.)

</details>

### Q5: How do you choose between `Enum` functions for one question?

<details>
<summary>Answer</summary>

Name the question first: membership is a `MapSet` question, first match is `find`, full counting is `frequencies`, boolean questions are `any?` and `all?`, and measured subsets are `count` with a predicate. `find` stops at the first witness while `filter` walks the whole list. Reaching for the exact function states the question in the code, so reviewers check the answer instead of simulating a loop. (Concepts: co-03.)

</details>

### Q6: Maps, keywords, or structs — which container for which job?

<details>
<summary>Answer</summary>

Maps hold open data, keyword lists hold options where duplicate keys are legal, and structs fix the key set at compile time for domain shapes. `Map.put` returns a new map while the old binding keeps the old value. `struct!` raises on unknown keys so typos fail at construction. Dot access raises on missing keys by design. The container's contract — open, optional, or fixed — tells readers how the data may evolve. (Concepts: co-03, co-11.)

</details>

### Q7: Why build output as IO lists, and where do fixtures live?

<details>
<summary>Answer</summary>

IO lists nest freely and flatten once at the boundary, which keeps output linear instead of the quadratic work string concatenation in a loop hides. `:io_lib.format` owns fixed-width columns. Fixtures ship beside the script under `learning/code/ex-NN-*/` because the harness runs each unit from its own folder; scratch goes to fixed `/tmp` paths with fixed content and is removed afterwards; only sorted, committed values print. (Concepts: co-04.)

</details>

### Q8: What is the small-regex discipline?

<details>
<summary>Answer</summary>

One small pattern per job: named captures to extract, `scan` to find every occurrence, `replace` to rewrite, `split` to tokenize — composition over a single monster pattern. Plain `String` functions come first; regex is the second tool. A regex that parses, validates, and rewrites at once is write-only, while small patterns each stay testable in isolation and compose into the same result. (Concepts: co-04.)

</details>

### Q9: Why do course scripts never read the clock?

<details>
<summary>Answer</summary>

Clock reads make outputs unrepeatable, so harness transcripts would differ between runs and the golden files could never match. Dates arrive as constructed sigils like `~D[2026-01-15]`, arithmetic runs on those fixed values, and `Date.diff` proves the inverse exactly. Production code reads clocks at its edges; course code constructs dates so every assertion is byte-stable. (Concepts: co-05.)

</details>

### Q10: What do `alias`, `import`, and `require` each do?

<details>
<summary>Answer</summary>

`alias` shortens a module name to a namespace shorthand. `import` injects named functions into local scope — with `only:` keeping the injection tight and auditable. `require` enables macros, which is why `Integer.is_odd` needs it before use in guards. A bare `import Enum` pollutes every call site with ambiguity; the three directives used precisely keep each name's origin obvious. (Concepts: co-06.)

</details>

### Q11: What do `@enforce_keys` and `struct!` buy you?

<details>
<summary>Answer</summary>

`@enforce_keys` turns missing fields into construction-time errors instead of nils discovered three calls later. `struct!` raises on unknown keys, so a typo in a field name fails at the build site rather than silently adding a key that nothing reads. Update syntax `%{item | qty: 10}` keeps the struct tag while replacing named fields. Together they make illegal states unrepresentable at construction. (Concepts: co-06.)

</details>

### Q12: What is the difference between a requirement and a pin?

<details>
<summary>Answer</summary>

Requirements in `mix.exs` express intent with ranges like `~> 1.4.0`; pins in `mix.lock` record the exact resolved closure with versions and checksums per package. Floating requirements resolve differently on every machine, so the lock is the deploy contract and the file to read when asking what actually ships. This course's own units are stdlib-only and carry no lockfile; the sample locks teach the read path. (Concepts: co-07.)

</details>

### Q13: What does `~> 1.4.0` admit and refuse?

<details>
<summary>Answer</summary>

Three-segment tilde admits patch releases inside the same minor line — `1.4.10` matches — and refuses the next minor line — `1.5.0` does not. `Version.match?/2` tests admission without installing anything, `Version.parse!/1` turns a pinned string into a comparable struct, and `Version.compare/2` answers with atoms for matching. The requirement states the policy; the lock records the decision. (Concepts: co-07.)

</details>

### Q14: How do course test scripts keep ExUnit output deterministic?

<details>
<summary>Answer</summary>

Start ExUnit with `auto_run: false, seed: 0, formatters: []`: no timing lines, no at-exit rerun noise, no formatter output at all. `ExUnit.run/0` returns the summary as a map — total, failures, excluded, skipped — and the script prints its own fixed line like `suite: 2 tests, 0 failures`. Assertion math stays in integers to dodge float noise. The transcript then depends only on the code, never on the machine or the wall clock. (Concepts: co-08.)

</details>

### Q15: What does red-green mean in one file?

<details>
<summary>Answer</summary>

Red first proves the test can fail: assert the requirement against a stub and rescue the `ExUnit.AssertionError`, printing the proof it failed. Green then proves the fix: a suite pinning all branches of the real implementation runs with zero failures. A test that never failed never proved it checks anything, so the red-green pair is the cheapest proof that test and code actually disagree when they should. (Concepts: co-08.)

</details>

### Q16: Task, Agent, or GenServer — which primitive for which need?

<details>
<summary>Answer</summary>

One-shot parallel work with no sharing is a `Task` that awaits and vanishes. Plain shared state with no restart story is an `Agent` behind a function API. State that must survive crashes needs a supervised `GenServer` with `handle_call` for replies and `handle_cast` for silent updates. Named access across restarts goes through a `Registry`. Four needs, four answers, decided from the failure story before any code. (Concepts: co-09.)

</details>

### Q17: Why do course scripts never print process identifiers?

<details>
<summary>Answer</summary>

Pids vary between runs, so any transcript containing one can never match its golden file. Scripts print computed values — replies, counts, sorted names — and assert routes through lookups and via tuples instead of captured pids. The same rule bans clock reads, timings, and paths: the transcript carries only values the script fully determines. (Concepts: co-09.)

</details>

### Q18: Protocol or behaviour — which abstraction for which job?

<details>
<summary>Answer</summary>

Protocols dispatch on the value's type so callers never branch: one call site, new types adding implementations without edits. Behaviours declare callbacks that modules opt into with `@behaviour`, the compiler warning on gaps and `@impl` tying each function to its callback. Dispatch for polymorphism over data; behaviours for contracts over modules. `impl_for/1` recovers which module answers any protocol call. (Concepts: co-10.)

</details>

### Q19: When does a Stream beat Enum, and how do you prove it?

<details>
<summary>Answer</summary>

Streams win when work must fuse or stop early: infinite inputs, large collections, take-bounded pulls. `Enum` between stages allocates intermediate lists; a fused stream touches only demanded elements. Proof beats belief: a `:counters`-measured recipe shows three runs for `take(3)`, not ten. Default to `Enum` for finite work, reach for `Stream` where laziness is measured, and count to confirm. (Concepts: co-10, co-15.)

</details>

### Q20: What is the difference between `==` and `===`, and what does immutability cost?

<details>
<summary>Answer</summary>

`==` compares value across types so `1 == 1.0` holds; `===` demands the same type so `1 === 1.0` fails. Default to strict, reach for loose only across numeric types on purpose. Immutability costs nothing extra because structure is shared: prepending shares the whole tail and map updates rebuild only the edited path, provable by equality on the untouched branch. Updates return new values while old bindings keep the old data. (Concepts: co-11.)

</details>

### Q21: How do format and warnings become checks instead of eyeballing?

<details>
<summary>Answer</summary>

`mix format --check-formatted` passes or fails in CI, and `Code.format_string!/1` proves idempotence by round-tripping. `Code.with_diagnostics/1` captures compiler output as data — severity, message, line-column position — so editors and gates consume warnings structurally instead of humans scanning terminal text. The alias-order kata shows the pattern at its smallest: the script checks its own source on every run. (Concepts: co-12.)

</details>

### Q22: What lives across the Erlang boundary, and how do ports correlate?

<details>
<summary>Answer</summary>

The BEAM standard library is one colon away: `:math` for transcendental functions, `:lists` under `Enum`, `:crypto` for NIF-speed hashing, `:maps` matching the Elixir twins. Ports talk to OS processes with bytes; the reply arrives as a port message the receiver pins on the port so no other message can match. Terms cross as bytes through `term_to_binary` and back through `binary_to_term`. (Concepts: co-13.)

</details>

### Q23: How do pipes, names, and docs share one style contract?

<details>
<summary>Answer</summary>

Pipes past two stages read in execution order; `then/2` inserts the one stage needing a closure. Names carry contracts in their suffixes: `?` asks with true or false, `!` demands with raise, plain handles with tuples. `@doc` states each public entry's contract while comments explain why, and a script can count the attributes to prove coverage. The formatter owns spacing; humans own naming and structure. (Concepts: co-14.)

</details>

### Q24: What is the five-step reading method, and why that order?

<details>
<summary>Answer</summary>

Kind, surface, dependencies, flow, question: name the unit kind first, count the public surface through indentation, note dependencies through module calls, state the data flow as input-type in and output-type out, and record the one open question. Types before code because readers who start with implementation details drown; the skeleton first gives the details somewhere to hang. The same order reads pipes, `with` chains, servers, protocols, and macros. (Concepts: co-16.)

</details>

## Applied problems

Eight judgment problems. Write the answer as code or as a named choice with the reason; the themes are rewriting translated code, choosing error shapes, and finding the stdlib function.

### AP-1: Rewrite the loop into a pipeline

The sample below translates another language's loop into Elixir. Rewrite it as an idiomatic pipeline with no accumulator variable, then state which example each stage comes from.

<!-- harness: illustration -->

```elixir
total = 0
for row <- [%{item: "book", qty: 2}, %{item: "pen", qty: 5}] do
  total = total + row.qty
end
```

Reference answer: `orders |> Enum.map(fn o -> o.qty end) |> Enum.sum()` (Examples 6 and 47). The loop variable reassignment fights single-assignment style; the pipeline names the question — project then sum — and the transcript prints `7`.

### AP-2: Rewrite the nil check into a match

The sample below defends with nil checks. Rewrite it with a `with` chain over ok-tuples, then state the else branches.

<!-- harness: illustration -->

```elixir
def price(name, store) do
  item = Map.get(store, name)
  if item == nil do
    "missing"
  else
    item.price * 2
  end
end
```

Reference answer: match `Map.fetch(store, name)` in a `<-` step, compute in `do`, and answer `:error` with `"missing"` in `else` (Examples 3 and 14). The nil check pushes the missing case into every downstream function; the tuple keeps the failure where it happened, named and matchable.

### AP-3: Rewrite the stringly error into data

The sample below raises a message string. Convert it so the failure carries its context as data, and state what the caller matches on.

<!-- harness: illustration -->

```elixir
def withdraw(balance, amount) do
  if balance >= amount do
    balance - amount
  else
    raise "need #{amount} have #{balance}"
  end
end
```

Reference answer: return `{:error, %{balance: balance, amount: amount, short: amount - balance}}` (Examples 10 and 17, Kata 01). The caller matches the tuple shape instead of parsing prose, and the context fields survive every layer the message string would cross.

### AP-4: Choose the shape for three failure scenarios

For each scenario, name the idiomatic shape — tuple, bang, or exit — and the reason in one sentence: (a) parsing user-typed configuration at startup, (b) a helper whose contract forbids zero divisors, (c) a worker process whose state file vanished mid-run.

Reference answer: (a) tuples — user input is expected to be wrong, so callers branch on `{:error, reason}` (Examples 9, 17). (b) bang — the contract forbids the input, so the caller wants a loud raise, never a tuple to ignore (Examples 10, 17). (c) crash — the supervisor owns the failure policy, so the worker exits and restarts clean (Examples 13, 59).

### AP-5: Choose the primitive for three concurrency needs

For each need, name the primitive and the reason in one sentence: (a) summing one hundred ranges in parallel and collecting the total, (b) holding a counter two processes increment, (c) holding session state that must survive the process crashing.

Reference answer: (a) `Task.async_stream` — one-shot parallel work that awaits and vanishes with bounded concurrency (Examples 57, 61). (b) `Agent` — plain shared state with no restart story behind a function API (Examples 56, 61). (c) supervised `GenServer` — serialized calls with a supervisor replaying the start argument on crash (Examples 58, 59, 61).

### AP-6: Choose the collection for three lookup needs

For each need, name the structure and the reason in one sentence: (a) testing whether a username appears in ten thousand rows, (b) counting occurrences per level in a log file, (c) traversing rows in name order regardless of insertion order.

Reference answer: (a) `MapSet` — membership without scanning (Example 8). (b) `Enum.frequencies` — one pass counting instead of grouping then counting (Examples 8, 49). (c) `Enum.sort_by` over tuples or a `:gb_trees` traversal — term or key order made explicit (Example 51).

### AP-7: Find the stdlib function for three hand-rolled helpers

For each helper, name the stdlib replacement and what changes: (a) a recursive comma-join over a list of strings, (b) a loop that trims, splits, and uppercases each line, (c) a hand-rolled retry counter with a sleep between attempts.

Reference answer: (a) `Enum.join/2` — one call replaces the recursion and its empty-list clause (Kata 03). (b) a pipe through `String.trim/1`, `String.split/2`, and `String.upcase/1` or one `for` comprehension with `into` — the stages name themselves (Examples 7, 68). (c) recursion with a countdown argument returning `{:error, :gave_up}` at zero — the budget becomes reviewable and the sleep, if any, stays out of the transcript (Example 15).

### AP-8: Find the tool for three style questions

For each question, name the tool and the check: (a) is this file formatted, (b) where exactly does the compiler warn, (c) is the alias block sorted.

Reference answer: (a) `mix format --check-formatted` plus a `format_string!` idempotence proof — the formatter owns spacing (Example 62). (b) `Code.with_diagnostics/1` filtered to warnings with line-column positions — diagnostics as data (Example 63). (c) a self-read comparing alias lines against their sorted form — small rules deserve small checkers (Example 69).

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: error handling and tests first, because failures and proofs underlie everything; pipes and agents next, because they train the two reflexes idiomatic code demands; streams and protocols last, because each isolates one intermediate judgement.

### Kata 01: Convert a Raised String into an ok/error Tuple

(Concepts: co-02.)

The starter raises a bare message string with the shortfall baked in. Convert it so the failure carries its context as data, and read the shortfall back out field by field. Done looks like the happy-path print unchanged plus explicit shortfall, balance, and amount fields.

**Before** (`drilling/code/kata-01-raise-to-ok-tuple/before/starter.exs`):

```elixir
# => Kata 1 starter: stringly failures force callers to parse messages.
withdraw = fn balance, amount -> # => two-argument closure; both paths live inside.
  # => Happy path subtracts; the failure path raises a bare message.
  if balance >= amount do # => the guard decides value versus raise.
    balance - amount # => happy path answers with the remainder.
  else # => the shortfall branch.
    raise "need #{amount} have #{balance}" # => stringly failure callers must parse.
  end # => the if closes; one branch always runs.
end # => the closure closes; withdraw is now callable.
# => The happy path works; the failing call would raise instead of answering.
IO.puts("left=#{withdraw.(100, 30)}") # => prints 70; the raise path stays unprinted.
```

**After** (`drilling/code/kata-01-raise-to-ok-tuple/after/solution.exs`):

```elixir
# => Kata 1 solution: ok/error tuples carry the shortfall as data, not prose.
withdraw = fn balance, amount -> # => same shape as the starter, tuples instead of raise.
  # => Compare first; both branches return the same tuple shape.
  if balance >= amount do # => the guard decides ok versus error.
    {:ok, balance - amount} # => happy path wraps the remainder.
  else # => the shortfall branch.
    {:error, %{balance: balance, amount: amount, short: amount - balance}} # => shortfall as data, not prose.
  end # => the if closes; one tuple comes out either way.
end # => the closure closes; withdraw is now callable.
# => The happy path prints through the same match the failure path uses.
IO.puts("left=#{inspect(withdraw.(100, 30))}") # => prints {:ok, 70} through inspect.
# => Fields print explicitly: map key order is not part of the contract.
{:error, ctx} = withdraw.(10, 30) # => destructure the failure into ctx.
IO.puts("short=#{ctx.short} balance=#{ctx.balance} amount=#{ctx.amount}") # => short=20 balance=10 amount=30.
```

**Output** (`drilling/code/kata-01-raise-to-ok-tuple/expected/main.stdout.txt`):

```text
left={:ok, 70}
short=20 balance=10 amount=30
```

### Kata 02: Write the First ExUnit Test

(Concepts: co-08.)

The starter defines a discount function with no tests. Add a suite with two facts that pin its behavior, run it with suppressed formatters, and print the fixed summary. Done looks like the standard summary line with two tests and zero failures.

**Before** (`drilling/code/kata-02-first-exunit-test/before/starter.exs`):

```elixir
# => Kata 2 starter: a discount function with no tests pinning it.
discount = fn total -> if total > 100, do: div(total * 9, 10), else: total end
# => The function works; nothing proves it stays working.
IO.puts("large=#{discount.(200)} small=#{discount.(50)}")
```

**After** (`drilling/code/kata-02-first-exunit-test/after/solution.exs`):

```elixir
# => Kata 2 solution: the first suite pins the discount with two facts.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => manual run, fixed seed, silent formatter.
# => The function under test, unchanged from the starter, as a module.
defmodule DiscountFn do # => the module under test.
  def apply(total) when total > 100, do: div(total * 9, 10) # => large totals take ten percent off.
  def apply(total), do: total # => small totals pass through.
end # => the module closes.
# => ExUnit modules group facts; tests call the module, never a closure.
defmodule DiscountKata do # => the test module.
  use ExUnit.Case, async: false # => synchronous cases; order is fixed.
  test "discounts large totals" do # => first fact: 200 becomes 180.
    assert DiscountFn.apply(200) == 180 # => the large-total pin.
  end # => first test closes.
  test "leaves small totals alone" do # => second fact: 50 stays 50.
    assert DiscountFn.apply(50) == 50 # => the small-total pin.
  end # => second test closes.
end # => the test module closes.
# => The summary as data closes the kata: two tests, zero failures.
stats = ExUnit.run() # => run returns the summary map, prints nothing.
# => Print the fixed summary line the lesson asserts on.
IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => suite: 2 tests, 0 failures.
```

**Output** (`drilling/code/kata-02-first-exunit-test/expected/main.stdout.txt`):

```text
suite: 2 tests, 0 failures
```

### Kata 03: Replace a Hand-Rolled Utility with Its Standard-Library Equivalent

(Concepts: co-04.)

The starter joins with a hand-rolled recursive reducer. Replace it with the one stdlib call, then prove the same vocabulary covers the next transform. Done looks like the identical CSV line plus an uppercased pair from the same function family.

**Before** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/before/starter.exs`):

```elixir
# => Kata 3 starter: a hand-rolled join that Enum already provides.
join = fn # => multi-clause closure; one clause per input shape.
  # => Empty input returns empty output without a special caller branch.
  [] -> "" # => the empty clause.
  # => Reduce threads the separator through every non-empty tail.
  [h | t] -> Enum.reduce(t, h, fn x, acc -> acc <> "," <> x end) # => the cons clause folds the tail.
end # => the closure closes.
# => The helper works; the standard library makes it one call.
IO.puts("csv=#{join.(["ada", "30", "dev"])}") # => csv=ada,30,dev through the hand roll.
```

**After** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/after/solution.exs`):

```elixir
# => Kata 3 solution: one stdlib call replaces the hand-rolled loop.
line = Enum.join(["ada", "30", "dev"], ",") # => csv=ada,30,dev in one call.
# => upper proves the same vocabulary covers the next transform too.
upper = Enum.join(["a", "b"], ",") |> String.upcase() # => join then upcase: A,B.
# => Print both stdlib results with fixed labels.
IO.puts("csv=#{line}") # => the join proof.
IO.puts("upper=#{upper}") # => the pipeline proof.
```

**Output** (`drilling/code/kata-03-stdlib-replaces-hand-rolled/expected/main.stdout.txt`):

```text
csv=ada,30,dev
upper=A,B
```

### Kata 04: Rewrite Nesting as a Pipe

(Concepts: co-14.)

The starter nests three transforms inside out. Rewrite it so the data flows down the left edge in reading order. Done looks like the identical cleaned value rendered as the split list it always was.

**Before** (`drilling/code/kata-04-pipe-rewrite/before/starter.exs`):

```elixir
# => Kata 4 starter: nesting reads inside out and hides the order.
raw = "  ada,36  "
# => Three transforms in one expression; the data flow hides inside.
cleaned = String.downcase(String.trim(raw))
# => The nesting works; the reading order fights the execution order.
IO.puts("cleaned=#{cleaned}")
```

**After** (`drilling/code/kata-04-pipe-rewrite/after/solution.exs`):

```elixir
# => Kata 4 solution: the pipe lists the same transforms in reading order.
raw = "  ada,36  "
# => Each stage names one transform; the data flows down the left edge.
cleaned = raw |> String.trim() |> String.downcase() |> String.split(",")
# => The pipeline reads as the procedure: trim, case-fold, then split.
IO.puts("cleaned=#{inspect(cleaned)}")
```

**Output** (`drilling/code/kata-04-pipe-rewrite/expected/main.stdout.txt`):

```text
cleaned=["ada", "36"]
```

### Kata 05: Flatten a Nested Case into with

(Concepts: co-01.)

The starter nests a sign check inside a parse check. Flatten both levels into one `with` with two else branches, specific-first. Done looks like three labeled outcomes: good, bad input, and negative.

**Before** (`drilling/code/kata-05-with-for-nested-case/before/starter.exs`):

```elixir
# => Kata 5 starter: nested cases push the happy path to the far right.
parse = fn text -> # => one closure; two nesting levels inside.
  # => Outer case handles the parse; inner case guards the sign.
  case Integer.parse(text) do # => the outer case on the parse result.
    {n, ""} -> # => full parse binds n.
      case n > 0 do # => the inner case on the sign.
        true -> {:ok, n} # => positive parses succeed.
        false -> {:error, :not_positive} # => zero and negatives fail loudly.
      end # => the inner case closes.
    _ -> {:error, :not_a_number} # => partial parses fail here.
  end # => the outer case closes.
end # => the closure closes.
# => Both branches work; the nesting bills every future reader.
IO.puts("good=#{inspect(parse.("21"))} bad=#{inspect(parse.("x"))}") # => ok 21 plus the not_a_number error.
```

**After** (`drilling/code/kata-05-with-for-nested-case/after/solution.exs`):

```elixir
# => Kata 5 solution: with flattens the nesting into one left edge.
parse = fn text -> # => one closure; arrows replace the nesting.
  # => Each left arrow is one old nesting level, now at the same indent.
  with {n, ""} <- Integer.parse(text), # => first arrow: the old outer case.
       true <- n > 0 do # => second arrow: the old inner case.
    {:ok, n} # => both arrows match: success.
  else # => any arrow misses: land here.
    # => false comes first: the bare wildcard below would swallow it.
    false -> {:error, :not_positive} # => the sign failure.
    _ -> {:error, :not_a_number} # => the parse failure.
  end # => the with closes.
end # => the closure closes.
# => Good input doubles through; bad and negative take separate branches.
IO.puts("good=#{inspect(parse.("21"))} bad=#{inspect(parse.("x"))} neg=#{inspect(parse.("-3"))}") # => ok, parse error, sign error.
```

**Output** (`drilling/code/kata-05-with-for-nested-case/expected/main.stdout.txt`):

```text
good={:ok, 21} bad={:error, :not_a_number} neg={:error, :not_positive}
```

### Kata 06: Replace a One-Shot Counter with an Agent

(Concepts: co-09.)

The starter spawns a counter that answers exactly one message. Replace the manual protocol with an agent that composes two updates and one read. Done looks like the composed count with no protocol to extend.

**Before** (`drilling/code/kata-06-agent-safe-counter/before/starter.exs`):

```elixir
# => Kata 6 starter: a hand-rolled counter with a one-shot protocol.
counter = spawn(fn -> # => the counter process; one receive inside.
  # => The process waits for one add message, then answers exactly once.
  receive do # => the single receive.
    {:add, back, n} -> send(back, {:added, n}) # => answer once, then exit.
  end # => the receive closes.
end) # => the spawn closes; counter holds the pid.
# => One add works; the second add would need a loop the starter lacks.
send(counter, {:add, self(), 41}) # => ask the counter to add 41.
# => The reply pattern names the only message this counter ever sends.
got = receive do {:added, n} -> n after 1000 -> :lost end # => wait for the single reply.
# => Print the one-shot count with a fixed label.
IO.puts("count=#{got}") # => count=41.
```

**After** (`drilling/code/kata-06-agent-safe-counter/after/solution.exs`):

```elixir
# => Kata 6 solution: the agent owns the loop; callers keep functions.
{:ok, counter} = Agent.start_link(fn -> 0 end) # => counter starts at zero.
# => Updates compose: two adds run as two calls, no protocol to extend.
Agent.update(counter, fn n -> n + 40 end) # => first add: 0 becomes 40.
Agent.update(counter, fn n -> n + 1 end) # => second add: 40 becomes 41.
# => get reads the final value; the agent stops with the script.
value = Agent.get(counter, fn n -> n end) # => read 41 out.
Agent.stop(counter) # => stop the agent; the script owns it.
# => Print the composed count with a fixed label.
IO.puts("count=#{value}") # => count=41.
```

**Output** (`drilling/code/kata-06-agent-safe-counter/expected/main.stdout.txt`):

```text
count=41
```

### Kata 07: Fuse Three Passes into One Stream

(Concepts: co-10, co-15.)

The starter maps, filters, and takes in three allocating passes. Fuse them into one lazy stream pulled exactly three deep. Done looks like the identical taken triple with no intermediate lists.

**Before** (`drilling/code/kata-07-stream-over-hand-loop/before/starter.exs`):

```elixir
# => Kata 7 starter: three Enum passes allocate three intermediate lists.
nums = Enum.to_list(1..100) # => materialize 1 to 100 as a list.
# => Each pass walks the whole list and builds another one.
doubled = Enum.map(nums, fn x -> x * 2 end) # => pass one: double everything.
evens = Enum.filter(doubled, fn x -> rem(x, 4) == 0 end) # => pass two: keep multiples of four.
taken = Enum.take(evens, 3) # => pass three: take the head three.
# => The answer is right; the allocation is triple what one pass needs.
IO.puts("taken=#{inspect(taken)}") # => taken=[4, 8, 12].
```

**After** (`drilling/code/kata-07-stream-over-hand-loop/after/solution.exs`):

```elixir
# => Kata 7 solution: one fused stream pass replaces the three lists.
taken = # => the pipeline binds here; stages follow.
  1..100 # => the range source; nothing computed yet.
  |> Stream.map(fn x -> x * 2 end) # => lazy double stage.
  |> Stream.filter(fn x -> rem(x, 4) == 0 end) # => lazy keep-multiples stage.
  |> Enum.take(3) # => the single strict pass: [4, 8, 12].
# => Identical answer, one pass, no intermediate lists at all.
IO.puts("taken=#{inspect(taken)}") # => taken=[4, 8, 12].
```

**Output** (`drilling/code/kata-07-stream-over-hand-loop/expected/main.stdout.txt`):

```text
taken=[4, 8, 12]
```

### Kata 08: Open a Type Cond into a Protocol

(Concepts: co-10.)

The starter branches on type with `cond`; every new type reopens the function. Open it into a protocol so new types add implementations instead of clauses. Done looks like the identical four counts with the call site closed.

**Before** (`drilling/code/kata-08-protocol-dispatch-kata/before/starter.exs`):

```elixir
# => Kata 8 starter: cond branches on type; every type edits this function.
size_of = fn value -> # => one closure; every type lives inside.
  # => Each cond arm repeats the type test the next type must copy.
  cond do # => the type-branch cond.
    is_list(value) -> length(value) # => lists measure by length.
    is_map(value) -> map_size(value) # => maps measure by size.
    is_binary(value) -> byte_size(value) # => binaries measure by bytes.
    true -> 1 # => anything else counts one.
  end # => the cond closes.
end # => the closure closes.
# => The branches work; the fifth type reopens the function.
IO.puts("list=#{size_of.([1, 2])} map=#{size_of.(%{a: 1})} bin=#{size_of.("ab")} other=#{size_of.(:x)}") # => list=2 map=1 bin=2 other=1.
```

**After** (`drilling/code/kata-08-protocol-dispatch-kata/after/solution.exs`):

```elixir
# => Kata 8 solution: the protocol opens dispatch; types add impls elsewhere.
defprotocol KataSize do # => the size contract.
  # => The protocol function is the only contract new types must meet.
  def count(value) # => one function, every type counts.
end # => the protocol closes.
# => Each impl lives beside its type; the call site never branches again.
defimpl KataSize, for: List do # => the list impl.
  def count(list), do: length(list) # => lists count by length.
end # => the List impl closes.
defimpl KataSize, for: Map do # => the map impl.
  def count(map), do: map_size(map) # => maps count by size.
end # => the Map impl closes.
defimpl KataSize, for: BitString do # => the binary impl.
  def count(bin), do: byte_size(bin) # => binaries count by bytes.
end # => the BitString impl closes.
defimpl KataSize, for: Atom do # => the atom impl.
  def count(_), do: 1 # => atoms always count one.
end # => the Atom impl closes.
# => New types add files, not clauses; the call site stays closed.
IO.puts("list=#{KataSize.count([1, 2])} map=#{KataSize.count(%{a: 1})} bin=#{KataSize.count("ab")} other=#{KataSize.count(:x)}") # => list=2 map=1 bin=2 other=1.
```

**Output** (`drilling/code/kata-08-protocol-dispatch-kata/expected/main.stdout.txt`):

```text
list=2 map=1 bin=2 other=1
```

## Self-check checklist

Twenty-four "I can ..." items, at least one per concept. Check each honestly; an unchecked item names the example to revisit.

1. I can bind by shape, rebind, and pin with the match operator instead of assigning. (co-01, Examples 1–3)
2. I can flatten nested matches into a `with` chain with specific-first else branches. (co-01, Examples 3, 17)
3. I can carry expected failures as `{:error, reason}` tuples through pipes and chains. (co-02, Examples 9, 12, 14)
4. I can raise structured exceptions for broken contracts and rescue them with context at the edge. (co-02, Examples 10, 13)
5. I can bound every wait and every retry with an explicit budget that the transcript proves. (co-02, Examples 11, 15, 55)
6. I can choose the `Enum` function by the shape of the question with no loops. (co-03, Examples 6–8)
7. I can pick maps, keywords, or structs by their open, optional, or fixed contracts. (co-03, Examples 5, 28)
8. I can build output as IO lists, format columns with `:io_lib`, and keep fixtures beside the code. (co-04, Examples 20, 21)
9. I can keep regexes small and composed with plain `String` functions doing the simple jobs. (co-04, Examples 18, 19, 22)
10. I can construct dates and times as fixed values and compute without ever reading the clock. (co-05, Examples 23–25)
11. I can lay out modules with clauses, guards, docs, and private helpers in their places. (co-06, Examples 26, 28)
12. I can scaffold with `mix new`, use `alias`/`import`/`require` precisely, and separate compile-time from runtime config. (co-06, Examples 27, 29, 32, 33)
13. I can read a `mix.lock` as data and state what each pinned entry guarantees. (co-07, Examples 30, 77)
14. I can write version requirements that admit patches and refuse minors, and choose deps by the stdlib-first ranking. (co-07, Examples 31, 34)
15. I can write ExUnit suites with deterministic summaries and gate downstream work on the counts. (co-08, Examples 35, 43, 44)
16. I can organize suites with setup, tags, doubles, and bounds that each prove one fact. (co-08, Examples 36–42)
17. I can choose tasks, agents, GenServers, supervisors, and registries from the failure story. (co-09, Examples 54–61)
18. I can write concurrent scripts that never print pids and sort every collected result. (co-09, Examples 54–60)
19. I can replace type conditionals with protocols and module contracts with behaviours. (co-10, Examples 45, 46, 74)
20. I can fuse pipelines with streams and measure laziness with counters instead of hoping. (co-10, co-15, Examples 48, 52)
21. I can use strict and loose equality on purpose and update immutably with shared structure. (co-11, Examples 49, 50, 53)
22. I can format by tool, read compiler diagnostics as data, and check small rules with small scripts. (co-12, Examples 62, 63, 69)
23. I can call Erlang modules, open ports with pinned correlation, and encode terms for the wire. (co-13, Examples 64, 70)
24. I can write pipes that read top to bottom, names that carry contracts, docs that state them, and read any sample in kind-surface-dependencies-flow-question order. (co-14, co-16, Examples 65–68, 71-78)

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer. Explain each aloud before reading the answer; the explanation is the learning.

### Why tuples instead of exceptions for expected failures — and why not always tuples?

Model answer: tuples keep the common path flat and the failure reasons matchable, which is what callers that branch need (Examples 9, 14). Exceptions would force every caller into `rescue` blocks for outcomes that are not exceptional. But tuples are wrong for broken contracts — a zero divisor where the contract forbids it — because a tuple can be ignored while a raise cannot, and for supervised workers, because crashing is the mechanism the supervisor acts on (Examples 10, 13, 59). The consumer decides: branchers get tuples, contracts get bangs, trees get crashes.

### Why an Agent for plain shared state — and why not a GenServer?

Model answer: an Agent serializes state access behind a function API with no callbacks to write, which is exactly the need when nothing must restart and no messages need selective matching (Examples 56, 61). A GenServer would add `init`, `handle_call`, and `handle_cast` ceremony with no failure story to justify it. But the Agent is wrong the moment state must survive crashes — only a supervised GenServer replays the start argument — or the moment callers need named access across restarts, which is the Registry's job (Examples 58–60). Complexity follows the failure story, never anticipation.

### Why a Stream for large inputs — and why not everywhere?

Model answer: streams fuse stages and stop early, so a take-bounded pull over one hundred inputs touches six elements instead of allocating three full lists (Examples 48, 52, Kata 07). `Enum` between stages would allocate each intermediate list and never terminate on infinite inputs. But streams are wrong for small finite work, where `Enum` is clearer and the allocation is trivially small — laziness without a measurement is the worst of both worlds. The `:counters` proof decides: count the runs, then choose (Example 52).

### Why pinned locks over floating requirements — and why not pins alone?

Model answer: pins record the exact resolved closure so every machine builds the identical system, while floating requirements resolve differently on every fetch (Examples 30, 31). Latest-without-a-lock is a different system per day. But pins alone lose the policy: `mix.exs` requirements state which upgrades are acceptable (`~> 1.4.0` admits patches, refuses minors), and the lock records which one was chosen. Requirements express intent, locks record decisions, and deploys read the lock (Example 77).

### Why the suite summary as data — and why not read the printed report?

Model answer: the summary map — total, failures, excluded, skipped — lets scripts gate downstream work on numbers, which is how the capstone blocks its report when red (Examples 43, 44). Printed reports need human eyes, and eyes skip steps under pressure. Formatters print timings that break transcripts, so course scripts suppress them and print fixed lines. Data summaries turn the suite from a report into a build step; printed output stays for humans, counts decide for machines.

### Why read types before code — and why not dive into implementation?

Model answer: naming each stage's input and output types builds the skeleton that details hang on, whether the unit is a pipe chain, a `with` chain, a GenServer, or a protocol call (Examples 71–78). Divers who start with implementation drown in details with no frame for judging them. The five-step order — kind, surface, dependencies, flow, question — turns every unfamiliar file into the same procedure, and the procedure works because types change slower than code.
