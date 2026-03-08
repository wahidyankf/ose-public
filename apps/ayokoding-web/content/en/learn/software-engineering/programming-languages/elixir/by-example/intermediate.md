---
title: "Intermediate"
date: 2025-12-23T00:00:00+07:00
draft: false
weight: 10000002
description: "Master intermediate Elixir through 30 examples: advanced pattern matching, structs, protocols, error handling, processes, and testing patterns"
tags: ["elixir", "tutorial", "by-example", "intermediate", "otp", "processes", "testing"]
---

Build on your Elixir foundations with 30 intermediate examples covering advanced patterns, practical OTP usage, error handling, and testing strategies. Each example is self-contained and heavily annotated.

## Example 31: Guards in Depth

Guards are boolean expressions that add additional constraints to pattern matches in function heads, case clauses, and other contexts. They enable more precise pattern matching based on types and values.

**Code**:

```elixir
defmodule Guards do
  # Type guards (dispatch based on runtime type)
  def type_check(value) when is_integer(value), do: "integer: #{value}"
  # => when is_integer(value): guard checks type at runtime
  # => Guard fails: tries next clause
  # => Guard succeeds: executes this clause
  def type_check(value) when is_float(value), do: "float: #{value}"
  # => Multiple clauses tried top-to-bottom
  def type_check(value) when is_binary(value), do: "string: #{value}"
  # => is_binary checks for bitstring (includes strings)
  def type_check(value) when is_atom(value), do: "atom: #{inspect(value)}"
  # => inspect/1 converts atom to readable string
  def type_check(_value), do: "unknown type"
  # => Catch-all clause (no guard = always matches)
  # => _ prefix signals "intentionally unused"

  # Value guards (dispatch based on value ranges)
  def category(age) when age < 13, do: "child"
  # => Numeric comparison in guard
  def category(age) when age >= 13 and age < 20, do: "teen"
  # => Compound guard: and combines conditions
  # => Both conditions must be true
  def category(age) when age >= 20 and age < 65, do: "adult"
  # => Guards are evaluated at dispatch time (before function body)
  def category(age) when age >= 65, do: "senior"
  # => Last specific clause before catch-all

  # Multiple guards with `or`
  def weekday(day) when day == :saturday or day == :sunday, do: "weekend"
  # => or: either condition matches
  # => == checks value equality
  def weekday(_day), do: "weekday"
  # => Catch-all for all other days

  # Guard functions (limited set allowed for purity)
  def valid_user(name, age) when is_binary(name) and byte_size(name) > 0 and age >= 18 do
    # => byte_size/1: allowed guard function (measures binary bytes)
    # => Three conditions ANDed: type check, non-empty, age check
    {:ok, %{name: name, age: age}}
    # => Returns tagged tuple on success
  end
  def valid_user(_name, _age), do: {:error, "invalid user"}
  # => Catch-all for validation failures

  # Pattern matching with guards (combine both techniques)
  def process_response({:ok, status, body}) when status >= 200 and status < 300 do
    # => Pattern: {:ok, status, body} destructures tuple
    # => Guard: checks status is 2xx (success range)
    {:success, body}
    # => Returns normalized :success tuple
  end
  def process_response({:ok, status, _body}) when status >= 400 do
    # => Pattern matches :ok tuple but guards on 4xx+ status
    # => _ prefix: body ignored (not used in function)
    {:error, "client error: #{status}"}
    # => Returns error with status code
  end
  def process_response({:error, reason}) do
    # => Pattern matches :error tuple (no guard needed)
    {:error, "request failed: #{reason}"}
    # => Wraps reason in descriptive message
  end

  # Allowed guard functions (restricted for performance & safety):
  # Type checks: is_atom, is_binary, is_boolean, is_float, is_integer, is_list, is_map, is_tuple
  # Comparisons: ==, !=, ===, !==, <, >, <=, >=
  # Boolean: and, or, not
  # Arithmetic: +, -, *, /
  # Others: abs, div, rem, length, byte_size, tuple_size, elem, hd, tl
  # => Restriction: guards must be pure (no side effects, no IO, no exceptions)
  # => Reason: guards execute during pattern matching (before stack allocation)

  # Custom guard-safe functions (using defguard macro)
  defguard is_adult(age) when is_integer(age) and age >= 18
  # => defguard: defines reusable guard expression
  # => Expands inline at compile time (zero runtime overhead)
  # => Must only use other guard-safe operations

  def can_vote(age) when is_adult(age), do: true
  # => Uses custom guard like built-in
  # => Expands to: when is_integer(age) and age >= 18
  def can_vote(_age), do: false
  # => Catch-all for non-adults
end

# Type dispatching
Guards.type_check(42)
# => Tries clause 1: is_integer(42) → true → "integer: 42"
Guards.type_check(3.14)
# => Tries clause 1: is_integer(3.14) → false
# => Tries clause 2: is_float(3.14) → true → "float: 3.14"
Guards.type_check("hello")
# => Tries clauses 1-2: both fail
# => Tries clause 3: is_binary("hello") → true → "string: hello"
Guards.type_check(:atom)
# => Tries clauses 1-3: all fail
# => Tries clause 4: is_atom(:atom) → true → "atom: :atom"

# Value range dispatching
Guards.category(10)
# => Guard: 10 < 13 → true → "child"
Guards.category(15)
# => Guard: 15 < 13 → false
# => Guard: 15 >= 13 and 15 < 20 → true → "teen"
Guards.category(30)
# => Guards: tries clauses 1-2, both fail
# => Guard: 30 >= 20 and 30 < 65 → true → "adult"
Guards.category(70)
# => Guards: tries clauses 1-3, all fail
# => Guard: 70 >= 65 → true → "senior"

# OR guards
Guards.weekday(:saturday)
# => Guard: :saturday == :saturday or ... → true (short-circuits) → "weekend"
Guards.weekday(:monday)
# => Guard: :monday == :saturday → false
# => Guard: :monday == :sunday → false → or fails
# => Tries clause 2: always matches → "weekday"

# Complex validation
Guards.valid_user("Alice", 25)
# => Guard: is_binary("Alice") → true
# => Guard: byte_size("Alice") > 0 → 5 > 0 → true
# => Guard: 25 >= 18 → true
# => All conditions true → {:ok, %{age: 25, name: "Alice"}}
Guards.valid_user("", 25)
# => Guard: is_binary("") → true
# => Guard: byte_size("") > 0 → 0 > 0 → false → guard fails
# => Tries clause 2 → {:error, "invalid user"}
Guards.valid_user("Bob", 15)
# => Guards: is_binary("Bob") → true, byte_size("Bob") > 0 → true
# => Guard: 15 >= 18 → false → guard fails
# => Tries clause 2 → {:error, "invalid user"}

# HTTP response handling
Guards.process_response({:ok, 200, "Success"})
# => Pattern: {:ok, 200, "Success"} matches {:ok, status, body}
# => Guard: 200 >= 200 and 200 < 300 → true
# => {:success, "Success"}
Guards.process_response({:ok, 404, "Not Found"})
# => Pattern: {:ok, 404, "Not Found"} matches clause 1
# => Guard: 404 >= 200 and 404 < 300 → false → clause 1 fails
# => Tries clause 2: {:ok, 404, "Not Found"} matches {:ok, status, _body}
# => Guard: 404 >= 400 → true → {:error, "client error: 404"}
Guards.process_response({:error, :timeout})
# => Pattern: {:error, :timeout} doesn't match clause 1 or 2
# => Tries clause 3: matches {:error, reason} → {:error, "request failed: timeout"}

# Custom guard usage
Guards.can_vote(25)
# => Guard: is_adult(25) expands to is_integer(25) and 25 >= 18
# => Both true → true
Guards.can_vote(16)
# => Guard: is_integer(16) and 16 >= 18 → true and false → false
# => Tries clause 2 → false
```

**Key Takeaway**: Guards add type and value constraints to pattern matching. Only a limited set of functions is allowed in guards to ensure they remain side-effect free and fast.

**Why It Matters**: Guards extend pattern matching with boolean predicates, enabling type validation and range checking directly in function heads and case clauses. The restriction to pure functions (no side effects, no user-defined functions) exists because guards are evaluated at pattern match time by the BEAM's hot path—they must be guaranteed to terminate and have no side effects. This restriction also means guards serve as compile-time-checked contracts: the compiler knows which guard functions are valid. Production code uses guards for input validation, numeric boundary checking, and type discrimination in polymorphic functions.

---

## Example 32: Pattern Matching in Function Heads

Multi-clause functions use pattern matching in function heads to elegantly handle different input shapes. Clauses are tried in order from top to bottom until one matches.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Input["Function Call:<br/>handle({:ok, data})"] --> Clause1{" Clause 1:<br/>{:error, _}?"}
    Clause1 -->|No| Clause2{"Clause 2:<br/>{:ok, data}?"}
    Clause2 -->|Yes| Execute["Execute:<br/>Process data"]
    Clause1 -->|Yes| Error["Execute:<br/>Handle error"]

    style Input fill:#0173B2,color:#fff
    style Clause1 fill:#DE8F05,color:#fff
    style Clause2 fill:#DE8F05,color:#fff
    style Execute fill:#029E73,color:#fff
    style Error fill:#CC78BC,color:#fff
```

**Code**:

```elixir
defmodule FunctionMatching do
  # Order matters! Specific cases before general cases
  def handle_result({:ok, value}), do: "Success: #{value}"
  # => Pattern: {:ok, value} matches 2-element tuple with :ok atom
  # => value extracts second element
  def handle_result({:error, reason}), do: "Error: #{reason}"
  # => Different pattern: {:error, _} would match any error
  def handle_result(_), do: "Unknown result"
  # => Catch-all: matches anything not matched above
  # => WARNING: Must be last clause (matches everything)

  # Pattern matching with destructuring (tagged tuples)
  def greet({:user, name}), do: "Hello, #{name}!"
  # => Matches {:user, "Alice"} → extracts "Alice" into name
  def greet({:admin, name}), do: "Welcome back, Admin #{name}!"
  # => Different first element → different clause
  def greet({:guest}), do: "Welcome, guest!"
  # => Single-element tuple pattern (guest has no name)

  # List pattern matching (recursive)
  def sum([]), do: 0
  # => Base case: empty list returns 0
  # => Recursion terminates here
  def sum([head | tail]), do: head + sum(tail)
  # => Pattern: [head | tail] splits list into first element + rest
  # => Recursive case: add head to sum of tail
  # => Example: [1,2,3] → 1 + sum([2,3]) → 1 + 2 + sum([3]) → 1 + 2 + 3 + sum([]) → 6

  # Map pattern matching (structural matching)
  def user_summary(%{name: name, age: age}) when age >= 18 do
    # => Pattern: %{name: name, age: age} extracts specific keys
    # => Map can have other keys (ignored)
    # => Guard: age >= 18 adds constraint after pattern match
    "#{name} is an adult (#{age} years old)"
  end
  def user_summary(%{name: name, age: age}) do
    # => Same pattern, different guard
    # => Clause order matters: guard checked first-to-last
    "#{name} is a minor (#{age} years old)"
  end

  # Multiple pattern matches with guards (value classification)
  def classify_number(n) when n < 0, do: :negative
  # => Guard only (no pattern destructuring needed)
  def classify_number(0), do: :zero
  # => Exact value pattern (no guard needed)
  def classify_number(n) when n > 0 and n < 100, do: :small_positive
  # => Compound guard: both conditions must be true
  def classify_number(n) when n >= 100, do: :large_positive
  # => Last specific clause (implicitly covers n >= 100)

  # Complex nested patterns (multi-level destructuring)
  def process_response({:ok, %{status: 200, body: body}}) do
    # => Nested pattern: tuple contains map
    # => Matches: {:ok, %{status: 200, body: "anything"}}
    # => Extracts: body value
    {:success, body}
  end
  def process_response({:ok, %{status: status, body: _}}) when status >= 400 do
    # => Pattern: tuple + map destructuring
    # => _ ignores body (not used)
    # => Guard: status >= 400 further constrains
    {:client_error, status}
  end
  def process_response({:error, %{reason: reason}}) do
    # => Different tuple tag: :error instead of :ok
    # => Still uses map pattern for nested data
    {:failed, reason}
  end

  # Default arguments with pattern matching (multi-clause + defaults)
  def send_message(user, message, opts \\ [])
  # => Function head: declares default value opts = []
  # => Actual implementations below (pattern match on opts)
  def send_message(%{email: email}, message, priority: :high) do
    # => Pattern: opts must be [priority: :high] (keyword list)
    # => user must be map with :email key
    "Urgent email to #{email}: #{message}"
  end
  def send_message(%{email: email}, message, _opts) do
    # => Catch-all for opts (any value including [])
    # => Matches when first clause doesn't
    "Email to #{email}: #{message}"
  end
end

# Result tuple handling
FunctionMatching.handle_result({:ok, 42})
# => Tries clause 1: {:ok, 42} matches {:ok, value} → "Success: 42"
FunctionMatching.handle_result({:error, "not found"})
# => Clause 1 fails (not :ok)
# => Clause 2: {:error, "not found"} matches {:error, reason} → "Error: not found"
FunctionMatching.handle_result(:unknown)
# => Clauses 1-2 fail (not tuple)
# => Clause 3: _ matches anything → "Unknown result"

# Tagged tuple dispatching
FunctionMatching.greet({:user, "Alice"})
# => Clause 1: {:user, "Alice"} matches {:user, name} → "Hello, Alice!"
FunctionMatching.greet({:admin, "Bob"})
# => Clause 1 fails (:admin ≠ :user)
# => Clause 2: {:admin, "Bob"} matches {:admin, name} → "Welcome back, Admin Bob!"
FunctionMatching.greet({:guest})
# => Clauses 1-2 fail (wrong pattern)
# => Clause 3: {:guest} matches → "Welcome, guest!"

# Recursive list processing
FunctionMatching.sum([1, 2, 3, 4])
# => [1 | [2,3,4]] → 1 + sum([2,3,4])
# => [2 | [3,4]] → 2 + sum([3,4])
# => [3 | [4]] → 3 + sum([4])
# => [4 | []] → 4 + sum([])
# => [] → 0
# => Stack unwinds: 4 + 0 = 4, 3 + 4 = 7, 2 + 7 = 9, 1 + 9 = 10
FunctionMatching.sum([])
# => Clause 1: [] matches → 0 (base case)

# Map pattern matching with guards
FunctionMatching.user_summary(%{name: "Alice", age: 25})
# => Pattern: %{name: "Alice", age: 25} matches %{name: name, age: age}
# => Extracts: name = "Alice", age = 25
# => Guard: 25 >= 18 → true → "Alice is an adult (25 years old)"
FunctionMatching.user_summary(%{name: "Bob", age: 16})
# => Pattern matches clause 1
# => Guard: 16 >= 18 → false → clause 1 fails
# => Clause 2: same pattern, no guard → matches → "Bob is a minor (16 years old)"

# Value classification with guards
FunctionMatching.classify_number(-5)
# => Guard: -5 < 0 → true → :negative
FunctionMatching.classify_number(0)
# => Clause 1 guard fails
# => Pattern: 0 matches exactly → :zero
FunctionMatching.classify_number(50)
# => Clauses 1-2 fail
# => Guard: 50 > 0 and 50 < 100 → true → :small_positive
FunctionMatching.classify_number(200)
# => Clauses 1-3 fail
# => Guard: 200 >= 100 → true → :large_positive

# Nested pattern matching
FunctionMatching.process_response({:ok, %{status: 200, body: "OK"}})
# => Pattern: {:ok, %{status: 200, body: body}} matches exactly
# => Extracts: body = "OK" → {:success, "OK"}
FunctionMatching.process_response({:ok, %{status: 404, body: "Not Found"}})
# => Clause 1: status 404 ≠ 200 → fails
# => Clause 2: pattern matches, guard 404 >= 400 → true → {:client_error, 404}
FunctionMatching.process_response({:error, %{reason: :timeout}})
# => Clauses 1-2: {:error, ...} doesn't match {:ok, ...}
# => Clause 3: {:error, %{reason: :timeout}} matches → {:failed, :timeout}

# Default arguments with pattern matching
FunctionMatching.send_message(%{email: "a@example.com"}, "Hello", priority: :high)
# => opts = [priority: :high] (provided)
# => Clause 1: pattern [priority: :high] matches → "Urgent email..."
FunctionMatching.send_message(%{email: "b@example.com"}, "Hi", [])
# => opts = [] (provided empty list)
# => Clause 1: [] doesn't match [priority: :high]
# => Clause 2: _opts matches [] → "Email..."
```

**Key Takeaway**: Pattern matching in function heads enables elegant multi-clause logic. Place specific patterns before general ones, and combine with guards for precise control flow.

**Why It Matters**: Pattern matching in function heads is Elixir's primary mechanism for polymorphism—different implementations for different input shapes, without inheritance or method overloading. The BEAM compiles multiple clauses into an optimized decision tree, typically more efficient than if/else chains. When a GenServer receives different message types, when a Phoenix controller handles different content types, when an Ecto query handles different filter shapes—all use function head pattern matching. Writing a function that works for lists and maps means writing two clauses, not one function with type checks inside.

---

## Example 33: With Expression (Happy Path)

The `with` expression chains pattern matches, short-circuiting on the first mismatch. It's ideal for "happy path" coding where you expect success and want to handle errors at the end.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Start["with"] --> Match1["Step 1:<br/>{:ok, user} <- get_user()"]
    Match1 -->|Match| Match2["Step 2:<br/>{:ok, account} <- get_account()"]
    Match2 -->|Match| Match3["Step 3:<br/>{:ok, balance} <- get_balance()"]
    Match3 -->|Match| Do["do:<br/>Process happy path"]

    Match1 -->|No Match| Else["else:<br/>Handle error"]
    Match2 -->|No Match| Else
    Match3 -->|No Match| Else

    style Start fill:#0173B2,color:#fff
    style Match1 fill:#DE8F05,color:#fff
    style Match2 fill:#DE8F05,color:#fff
    style Match3 fill:#DE8F05,color:#fff
    style Do fill:#029E73,color:#fff
    style Else fill:#CC78BC,color:#fff
```

**Code**:

```elixir
defmodule WithExamples do           # => Defines module for with expression examples
  # Simulate API functions (return tagged tuples)
  def fetch_user(id) do             # => Simulates database/API user fetch
                                     # => Returns tagged tuple {:ok, user} or {:error, reason}
    case id do                       # => Pattern matches on user id
      1 -> {:ok, %{id: 1, name: "Alice", account_id: 101}}
                                     # => Success: returns {:ok, user_map}
                                     # => User 1 linked to account 101
      2 -> {:ok, %{id: 2, name: "Bob", account_id: 102}}
                                     # => User 2 linked to account 102
      _ -> {:error, :user_not_found}  # => Failure: returns {:error, atom}
                                     # => Any other id returns error
    end                              # => Ends case expression
  end                                # => Ends fetch_user function

  def fetch_account(account_id) do  # => Simulates account data fetch
                                     # => Takes account_id from user record
    case account_id do               # => Pattern matches on account_id
      101 -> {:ok, %{id: 101, balance: 1000}}
                                     # => Account 101 has balance 1000
      102 -> {:ok, %{id: 102, balance: 500}}
                                     # => Account 102 has balance 500
      _ -> {:error, :account_not_found}
                                     # => Unknown account returns error
    end
  end

  def fetch_transactions(account_id) do  # => Simulates transaction history fetch
                                     # => Returns list of transaction maps
    case account_id do
      101 -> {:ok, [%{amount: 100}, %{amount: -50}]}
                                     # => Returns list of transaction maps
                                     # => Account 101 has 2 transactions
      102 -> {:ok, [%{amount: 200}]}  # => Account 102 has 1 transaction
      _ -> {:error, :transactions_not_found}
                                     # => Unknown account returns error
    end
  end

  # ❌ WITHOUT `with` - nested case statements (pyramid of doom)
  def get_user_summary_nested(user_id) do  # => Traditional nested approach
                                     # => Demonstrates problem with solves
    case fetch_user(user_id) do      # => First API call
                                     # => Level 1 nesting
      {:ok, user} ->                 # => User fetch succeeded
                                     # => Extracts user from {:ok, user} tuple
        case fetch_account(user.account_id) do  # => Second API call (nested)
                                     # => Level 2 nesting
                                     # => Uses user.account_id from level 1
          {:ok, account} ->          # => Account fetch succeeded
                                     # => Extracts account from tuple
            case fetch_transactions(account.id) do  # => Third API call (deeply nested)
                                     # => Level 3 nesting (hard to read!)
                                     # => Uses account.id from level 2
              {:ok, transactions} -> # => All three fetches succeeded
                                     # => Extracts transactions from tuple
                {:ok, %{user: user, account: account, transactions: transactions}}
                                     # => Builds success result map
                                     # => Returns all three fetched values
              {:error, reason} ->    # => Transaction fetch failed
                {:error, reason}     # => Must repeat error handling at each level
            end
          {:error, reason} ->        # => Account fetch failed
            {:error, reason}         # => Duplicated error handling
        end
      {:ok, reason} ->        # => User fetch failed
        {:error, reason}             # => Error handling repeated 3 times!
                                     # => Same pattern at every nesting level
    end                              # => Ends deeply nested case expression
  end                                # => Ends nested function

  # ✅ WITH `with` - clean happy path (linear, readable)
  def get_user_summary(user_id) do  # => Clean version using with expression
                                     # => Same logic, much more readable
    with {:ok, user} <- fetch_user(user_id),
                                     # => Step 1: pattern match {:ok, user}
                                     # => Left side is pattern, right side is expression
                                     # => If matches: continue to step 2
                                     # => If doesn't match: jump to else block
         {:ok, account} <- fetch_account(user.account_id),
                                     # => Step 2: uses user from step 1
                                     # => user binding available from previous step
                                     # => Chain continues only if pattern matches
         {:ok, transactions} <- fetch_transactions(account.id) do
                                     # => Step 3: uses account from step 2
                                     # => account binding available from step 2
                                     # => All patterns matched: execute do block
      # Happy path - all matches succeeded
      {:ok, %{                       # => Builds success result
        user: user.name,             # => user binding from step 1
                                     # => Extracts name field from user map
        balance: account.balance,    # => account binding from step 2
                                     # => Extracts balance field
        transaction_count: length(transactions)
                                     # => transactions binding from step 3
                                     # => Counts number of transactions
      }}                             # => Returns {:ok, summary_map}
    else                             # => Handles any pattern mismatch
                                     # => First mismatch jumps here (short-circuit)
      {:error, :user_not_found} -> {:error, "User not found"}
                                     # => Pattern match error from step 1
                                     # => Converts atom to user-friendly message
      {:error, :account_not_found} -> {:error, "Account not found"}
                                     # => Pattern match error from step 2
      {:error, :transactions_not_found} -> {:error, "Transactions not found"}
                                     # => Pattern match error from step 3
                                     # => Consolidated error handling in one place!
    end                              # => Ends with expression
  end                                # => Ends get_user_summary function

  # `with` can match any pattern (not just :ok/:error)
  def complex_calculation(x) do      # => Demonstrates with for calculation chains
                                     # => Shows pattern matching flexibility
    with {:ok, doubled} <- {:ok, x * 2},
                                     # => x = 5 → {:ok, 10}
                                     # => Right side evaluates, left pattern matches
                                     # => Matches pattern, doubled = 10
         {:ok, incremented} <- {:ok, doubled + 1},
                                     # => {:ok, 11}, incremented = 11
                                     # => Uses doubled from previous step
         {:ok, squared} <- {:ok, incremented * incremented} do
                                     # => {:ok, 121}, squared = 121
                                     # => Uses incremented from previous step
      {:ok, squared}                 # => Returns {:ok, 121}
                                     # => All steps succeeded, return final value
    else                             # => Handles pattern mismatch (won't happen here)
      _ -> {:error, "calculation failed"}
                                     # => Catch-all for any non-matching pattern
                                     # => Would execute if any step failed
    end                              # => Ends with expression
  end                                # => Ends complex_calculation function

  # Boolean guards in `with` (Elixir 1.3+)
  def process_number(x) when is_integer(x) do  # => Function guard ensures integer
                                     # => with can validate with boolean expressions
    with true <- x > 0,              # => Matches true or jumps to else
                                     # => Pattern: true <- boolean_expression
                                     # => First validation: x must be positive
         true <- x < 100 do          # => Second validation: x must be < 100
                                     # => Both must match true to proceed
      {:ok, "Valid number: #{x}"}    # => Both guards passed
                                     # => String interpolation with validated x
    else                             # => Handles guard failures
      false -> {:error, "Number out of range"}
                                     # => Either guard failed (returned false)
                                     # => Both failures use same pattern
                                     # => Unified error message for range violations
    end                              # => Ends with expression
  end                                # => Ends process_number function
end                                  # => Ends WithExamples module

# Happy path - all steps succeed
WithExamples.get_user_summary(1)  # => Calls with user_id 1
# => Step 1: fetch_user(1) → {:ok, %{id: 1, name: "Alice", account_id: 101}}
# => Pattern {:ok, user} matches, user bound to map
# => Step 2: fetch_account(101) → {:ok, %{id: 101, balance: 1000}}
# => Pattern {:ok, account} matches, account bound to map
# => Step 3: fetch_transactions(101) → {:ok, [...]}
# => Pattern {:ok, transactions} matches, all steps succeeded
# => do block executes → {:ok, %{balance: 1000, transaction_count: 2, user: "Alice"}}

WithExamples.get_user_summary(2)  # => Calls with user_id 2
# => User Bob, account 102, balance 500, 1 transaction
# => All three with steps succeed
# => {:ok, %{balance: 500, transaction_count: 1, user: "Bob"}}

# Failure path - short-circuit at step 1
WithExamples.get_user_summary(999)  # => Calls with invalid user_id
# => Step 1: fetch_user(999) → {:error, :user_not_found}
# => Pattern {:ok, user} doesn't match → jumps to else
# => Steps 2 and 3 never execute (short-circuit)
# => else block: {:error, :user_not_found} matches → {:error, "User not found"}

# Calculation chain
WithExamples.complex_calculation(5)  # => Demonstrates with for calculations
# => Step 1: {:ok, 5 * 2} = {:ok, 10}
# => Pattern matches, doubled = 10
# => Step 2: {:ok, 10 + 1} = {:ok, 11}
# => Pattern matches, incremented = 11
# => Step 3: {:ok, 11 * 11} = {:ok, 121}
# => Pattern matches, squared = 121
# => {:ok, 121}

# Boolean guard validation
WithExamples.process_number(50)  # => Tests boolean guards in with
# => Guard 1: 50 > 0 → true (matches)
# => First pattern true <- true succeeds
# => Guard 2: 50 < 100 → true (matches)
# => Second pattern true <- true succeeds
# => {:ok, "Valid number: 50"}

WithExamples.process_number(150)
# => Guard 1: 150 > 0 → true
# => Guard 2: 150 < 100 → false (doesn't match true)
# => else: false matched → {:error, "Number out of range"}

WithExamples.process_number(-10)
# => Guard 1: -10 > 0 → false (short-circuits)
# => else: false matched → {:error, "Number out of range"}
```

**Key Takeaway**: `with` chains pattern matches and short-circuits on the first mismatch. Use it for happy path coding where you expect success, with error handling consolidated in the `else` block.

**Why It Matters**: The `with` expression solves the pyramid of doom problem for sequential operations that can each fail. Without `with`, chaining multiple operations returning `{:ok, value}` / `{:error, reason}` requires nested case statements. With `with`, happy-path bindings read linearly, and the `else` clause handles all failure cases in one place. Phoenix controller actions, Ecto multi-step transactions, and external API chains all use `with` to maintain clean linear flow while handling errors properly. This pattern is so idiomatic that reading any production Phoenix application requires fluency with `with`.

---

## Example 34: Structs

Structs are extensions of maps with compile-time guarantees and default values. They enforce a predefined set of keys, enabling clearer data modeling and better error messages.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Map["Regular Map<br/>%{any: keys, ...}"] --> Struct["Struct<br/>%User{name: ..., age: ...}"]
    Struct --> Tag["Special __struct__: User key"]
    Struct --> Keys["Enforced keys:<br/>name, age"]
    Struct --> Defaults["Default values:<br/>active: true"]

    style Map fill:#0173B2,color:#fff
    style Struct fill:#DE8F05,color:#fff
    style Tag fill:#029E73,color:#fff
    style Keys fill:#CC78BC,color:#fff
    style Defaults fill:#CA9161,color:#fff
```

### Struct Features

**Tagged Maps**: Structs are maps with special `__struct__` key (module name)
**Default Values**: Define defaults for fields (e.g., `active: true`)
**Enforced Keys**: `@enforce_keys` requires fields at creation (compile-time check)
**Pattern Matching**: Match on struct type for type-safe function dispatch
**Immutability**: Updates create new structs (original unchanged)

**Code**:

```elixir
defmodule User do
  # Define struct with default values
  defstruct name: nil, age: nil, email: nil, active: true
  # => All fields optional with defaults
  # => active defaults to true (others nil)

  # Alternative: enforced keys (compile-time check)
  # @enforce_keys [:name, :age]
  # => Compile error if keys not provided at creation
  # defstruct [:name, :age, email: nil, active: true]
end

defmodule Account do
  @enforce_keys [:id, :balance]
  # => MUST provide :id and :balance at creation
  # => Raises ArgumentError if missing
  defstruct [:id, :balance, status: :active, transactions: []]
  # => :id, :balance required; status/:transactions have defaults
end

# Create struct with all fields
user = %User{name: "Alice", age: 30, email: "alice@example.com"}
# => Syntax: %ModuleName{key: value, ...}
# => active uses default (true)
# => %User{name: "Alice", age: 30, email: "alice@example.com", active: true}

# Create struct with partial fields
user_partial = %User{name: "Bob", age: 25}
# => email: nil (default), active: true (default)

# Access struct fields (dot notation)
user.name
# => "Alice"
user.age
# => 30
user.active
# => true (default value)

# Update struct (immutable, creates new struct)
updated_user = %{user | age: 31, email: "alice.new@example.com"}
# => Syntax: %{struct | field: new_value, ...}
# => Returns NEW struct (original unchanged)
user.age
# => 30 (original unchanged - immutability)

# Struct is a tagged map
user.__struct__
# => User (module name stored in __struct__ field)
is_map(user)
# => true (structs ARE maps)
Map.keys(user)
# => [:__struct__, :active, :age, :email, :name]

# Pattern matching on structs
%User{name: name, age: age} = user
# => Destructures struct fields
# => Only matches User structs (not other types)
name
# => "Alice"
age
# => 30

# Pattern matching in function heads (type safety)
def greet_user(%User{name: name}), do: "Hello, #{name}!"
# => Only accepts User structs (not Account or plain maps)
# => Type-safe dispatch
greet_user(user)
# => "Hello, Alice!"
# greet_user(%{name: "Bob"}) would raise FunctionClauseError

# Enforced keys example
account = %Account{id: 1, balance: 1000}
# => MUST provide :id and :balance (@enforce_keys)
# => status and transactions use defaults
# => %Account{id: 1, balance: 1000, status: :active, transactions: []}

# account_invalid = %Account{id: 1}
# => ** (ArgumentError) missing required keys: [:balance]
```

**Key Takeaway**: Structs are tagged maps with enforced keys and default values. They provide compile-time guarantees and clearer domain modeling compared to plain maps.

**Why It Matters**: Structs are named maps with compile-time field guarantees—they combine the flexibility of maps with the safety of typed data. Unlike maps, accessing an undefined struct field raises a compile-time error (not a runtime KeyError), catching typos immediately. Elixir's struct system is the foundation of Ecto schemas (representing database rows), Phoenix.Conn (representing HTTP connections), and all domain models in production applications. Protocols dispatch differently on structs than plain maps, enabling type-specific behavior without inheritance. Always use structs when a map represents a known, fixed domain entity.

---

## Example 35: Streams (Lazy Enumeration)

Streams are lazy enumerables that build a recipe for computation without executing it immediately. They enable efficient processing of large or infinite datasets by composing transformations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Eager["Enum (Eager)<br/>[1,2,3,4,5]"] --> Map1["map: [2,4,6,8,10]<br/>EXECUTES"]
    Map1 --> Filter1["filter: [2,4,6,8,10]<br/>EXECUTES"]
    Filter1 --> Take1["take 2: [2,4]<br/>EXECUTES"]

    Lazy["Stream (Lazy)<br/>[1,2,3,4,5]"] --> Map2["map: recipe<br/>NO EXECUTION"]
    Map2 --> Filter2["filter: recipe<br/>NO EXECUTION"]
    Filter2 --> Take2["take 2: recipe<br/>NO EXECUTION"]
    Take2 --> Realize["Enum.to_list: [2,4]<br/>EXECUTE ONCE"]

    style Eager fill:#0173B2,color:#fff
    style Lazy fill:#0173B2,color:#fff
    style Map1 fill:#CC78BC,color:#fff
    style Filter1 fill:#CC78BC,color:#fff
    style Take1 fill:#CC78BC,color:#fff
    style Map2 fill:#DE8F05,color:#fff
    style Filter2 fill:#DE8F05,color:#fff
    style Take2 fill:#DE8F05,color:#fff
    style Realize fill:#029E73,color:#fff
```

**Code**:

```elixir
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Eager evaluation (Enum) - immediate execution
eager_result = numbers
               |> Enum.map(fn x -> x * 2 end)
               # => Pass 1: builds [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
               # => Processes all 10 elements immediately
               |> Enum.filter(fn x -> rem(x, 4) == 0 end)
               # => Pass 2: builds [4, 8, 12, 16, 20]
               # => Processes all 5 remaining elements
               |> Enum.take(2)
               # => Pass 3: takes first 2 → [4, 8]
               # => Already processed all 10 elements (wasteful!)

# Lazy evaluation (Stream) - deferred execution
lazy_result = numbers
              |> Stream.map(fn x -> x * 2 end)
              # => Returns #Stream<...> (NOT a list)
              # => No execution yet, just builds recipe
              |> Stream.filter(fn x -> rem(x, 4) == 0 end)
              # => Returns #Stream<...> (still no execution)
              # => Composes filter into recipe
              |> Enum.take(2)
              # => TRIGGERS execution: processes elements one-by-one
              # => Stops after finding 2 matches
              # => Only processes: 1→2 (no), 2→4 (YES), 3→6 (no), 4→8 (YES), STOP
              # => [4, 8] (processed 4 elements, not 10!)

# Infinite streams (impossible with eager evaluation)
infinite_numbers = Stream.iterate(1, fn x -> x + 1 end)
# => Infinite sequence: 1, 2, 3, 4, 5, ...
# => Returns #Stream<...> (no execution yet)
# => Would never terminate if eager!

first_evens = infinite_numbers
              |> Stream.filter(fn x -> rem(x, 2) == 0 end)
              # => Lazy filter (no execution)
              |> Enum.take(10)
              # => Takes first 10 even numbers
              # => [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
              # => Stops after 10 matches (doesn't process infinite stream!)

# Stream.cycle - repeats list infinitely
Stream.cycle([1, 2, 3]) |> Enum.take(7)
# => Cycles through [1,2,3] infinitely
# => Takes first 7: [1, 2, 3, 1, 2, 3, 1]

# Stream.unfold - generates values from state
fibonacci = Stream.unfold({0, 1}, fn {a, b} -> {a, {b, a + b}} end)
# => unfold(initial_state, next_fn)
# => next_fn returns {value, new_state}
# => {0, 1} → emit 0, next state {1, 1}
# => {1, 1} → emit 1, next state {1, 2}
# => {1, 2} → emit 1, next state {2, 3}
# => {2, 3} → emit 2, next state {3, 5}
# => Infinite Fibonacci sequence
Enum.take(fibonacci, 10)
# => [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

# Performance comparison
defmodule Performance do
  def eager_pipeline(n) do
    1..n
    |> Enum.map(fn x -> x * 2 end)
    # => Builds entire intermediate list (n elements)
    |> Enum.filter(fn x -> rem(x, 3) == 0 end)
    # => Builds another intermediate list (~n/3 elements)
    |> Enum.take(100)
    # => Takes 100, discards rest
    # => Wastes memory and CPU for large n
  end

  def lazy_pipeline(n) do
    1..n
    |> Stream.map(fn x -> x * 2 end)
    # => No intermediate list (lazy)
    |> Stream.filter(fn x -> rem(x, 3) == 0 end)
    # => Still lazy (just composing)
    |> Enum.take(100)
    # => Processes ONLY until 100 matches found
    # => For n=1_000_000: processes ~300 elements, not 1 million!
  end
end

# Performance.eager_pipeline(1_000_000)
# => Processes 1 million elements, builds 2 intermediate lists
# Performance.lazy_pipeline(1_000_000)
# => Processes ~300 elements, 0 intermediate lists

# Stream.resource - manage external resources (files, sockets, etc.)
stream_resource = Stream.resource(
  fn -> {:ok, "initial state"} end,
  # => Start function: called once to initialize
  # => Returns initial accumulator state
  fn state -> {[state], "next state"} end,
  # => Next function: called repeatedly
  # => Returns {values_to_emit, new_state}
  # => Can return {:halt, state} to stop
  fn _state -> :ok end
  # => After function: cleanup (called when stream ends)
  # => Close files, release resources, etc.
)
Enum.take(stream_resource, 3)
# => Calls start → {:ok, "initial state"}
# => Calls next("initial state") → {["initial state"], "next state"}
# => Emits "initial state"
# => Calls next("next state") → {["next state"], "next state"}
# => Emits "next state" (2 times)
# => Calls after("next state") → :ok (cleanup)
# => ["initial state", "next state", "next state"]
```

**Key Takeaway**: Streams enable lazy evaluation—building a recipe without executing it. Use streams for large datasets, infinite sequences, or when you want to compose transformations efficiently.

**Why It Matters**: Streams are lazy enumerables that compute values on demand, enabling processing of datasets larger than memory and avoiding unnecessary computation. When you only need the first 10 results of a million-element dataset, `Stream.take/2` stops computation after 10 elements—Enum would compute all million. Database cursors, file reading, and network response processing all benefit from laziness. Ecto's `Repo.stream/2` returns a Stream for processing large result sets without loading everything into memory. The composability of Stream operations enables building complex data pipelines that execute in a single pass.

---

## Example 36: MapSet for Uniqueness

MapSets are unordered collections of unique values. They provide efficient membership testing and set operations (union, intersection, difference). Use them when uniqueness matters and order doesn't.

**Code**:

```elixir
# Create MapSet from list (automatic deduplication)
set1 = MapSet.new([1, 2, 3, 3, 4, 4, 5])
# => MapSet.new/1 removes duplicates automatically
# => #MapSet<[1, 2, 3, 4, 5]>
# => Unordered: order not guaranteed

# Create MapSet from range
set_range = MapSet.new(1..10)
# => Converts range to set
# => #MapSet<[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]>

# Add element (immutable, returns new set)
set2 = MapSet.put(set1, 6)
# => Adds 6 to set (new set returned)
# => #MapSet<[1, 2, 3, 4, 5, 6]>
set1
# => #MapSet<[1, 2, 3, 4, 5]> (original unchanged!)
# => Immutability: set2 is separate copy

# Add duplicate (no effect)
set3 = MapSet.put(set1, 3)
# => 3 already exists in set
# => Returns set unchanged
# => #MapSet<[1, 2, 3, 4, 5]> (same as set1)

# Remove element
set4 = MapSet.delete(set1, 3)
# => Removes 3 from set
# => #MapSet<[1, 2, 4, 5]>

# Membership testing (O(log n))
MapSet.member?(set1, 3)
# => Checks if 3 is in set
# => true (efficient lookup)
MapSet.member?(set1, 10)
# => Checks if 10 is in set
# => false (not present)

# Set size
MapSet.size(set1)
# => Counts unique elements
# => 5

# Set operations
setA = MapSet.new([1, 2, 3])
# => Set A: {1, 2, 3}
setB = MapSet.new([3, 4, 5])
# => Set B: {3, 4, 5}

# Union (all unique elements from both sets)
MapSet.union(setA, setB)
# => A ∪ B: elements in A OR B
# => #MapSet<[1, 2, 3, 4, 5]>

# Intersection (common elements)
MapSet.intersection(setA, setB)
# => A ∩ B: elements in A AND B
# => #MapSet<[3]> (only 3 is common)

# Difference (elements in A but not in B)
MapSet.difference(setA, setB)
# => A \ B: elements in A but NOT in B
# => #MapSet<[1, 2]> (3 is removed)
MapSet.difference(setB, setA)
# => B \ A: elements in B but NOT in A
# => #MapSet<[4, 5]> (3 is removed)
# => Difference is NOT commutative!

# Subset and superset
setX = MapSet.new([1, 2])
# => Set X: {1, 2}
setY = MapSet.new([1, 2, 3, 4])
# => Set Y: {1, 2, 3, 4}
MapSet.subset?(setX, setY)
# => Is X ⊆ Y? (all elements of X in Y?)
# => true (1 and 2 are in Y)
MapSet.subset?(setY, setX)
# => Is Y ⊆ X?
# => false (3 and 4 not in X)

# Disjoint sets (no common elements)
MapSet.disjoint?(setA, MapSet.new([6, 7]))
# => Do A and {6, 7} have any common elements?
# => true (no overlap)
# => Disjoint: A ∩ {6,7} = ∅

# Convert to list (order not guaranteed)
MapSet.to_list(set1)
# => Converts set to list
# => [1, 2, 3, 4, 5] (order may vary)
# => Sets are unordered!

# Practical example: unique tags from posts
posts = [
  %{id: 1, tags: ["elixir", "functional", "programming"]},
  %{id: 2, tags: ["elixir", "otp", "concurrency"]},
  %{id: 3, tags: ["functional", "fp", "programming"]}
]

# Extract all unique tags
all_tags = posts
           |> Enum.flat_map(fn post -> post.tags end)
           # => Flattens: ["elixir", "functional", "programming", "elixir", "otp", ...]
           # => With duplicates
           |> MapSet.new()
           # => Deduplicates: #MapSet<["elixir", "functional", "programming", "otp", "concurrency", "fp"]>
# => Automatic uniqueness!

# Find common tags between posts
post1_tags = MapSet.new(["elixir", "functional"])
post2_tags = MapSet.new(["elixir", "otp"])
MapSet.intersection(post1_tags, post2_tags)
# => Common tags: #MapSet<["elixir"]>
# => Useful for finding related content
```

**Key Takeaway**: MapSets provide O(log n) membership testing and automatic deduplication. Use them for unique collections where order doesn't matter and set operations (union, intersection, difference) are needed.

**Why It Matters**: MapSet provides O(log n) membership testing—vastly more efficient than `Enum.member?/2` on lists for large collections. When you need to track seen items, deduplicate streams, or compute set intersections, MapSet is the correct tool. Implementing deduplication with a list is O(n squared); with MapSet it is O(n log n). In Phoenix, MapSets track connected WebSocket clients, permissions, and feature flags. Event deduplication in message queues, cache invalidation sets, and visited node tracking in graph algorithms all benefit from MapSet's constant-time operations over list's linear-time checks.

---

## Example 37: Module Attributes

Module attributes are compile-time constants defined with `@`. They're commonly used for documentation (`@moduledoc`, `@doc`), compile-time configuration, and storing values computed during compilation.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    CompileTime["Compile Time"] --> Attrs["Module Attributes Evaluated"]
    Attrs --> Version["@version = '1.0.0'"]
    Attrs --> Timeout["@default_timeout = 5000"]
    Attrs --> Languages["@languages = [...list...]"]
    Languages --> Count["@language_count = 3<br/>(computed: length list)"]

    Runtime["Runtime"] --> Inline["Attributes inlined"]
    Inline --> VersionFunc["version() -> '1.0.0'<br/>(zero-cost constant)"]
    Inline --> TimeoutFunc["wait(5000)<br/>(default from @default_timeout)"]
    Inline --> CountFunc["language_count() -> 3<br/>(pre-computed)"]

    Reserved["Reserved Attributes"] --> ModuleDoc["@moduledoc<br/>(documentation)"]
    Reserved --> Doc["@doc<br/>(function docs)"]
    Reserved --> Behaviour["@behaviour<br/>(callback verification)"]
    Reserved --> Impl["@impl<br/>(marks callbacks)"]

    style CompileTime fill:#0173B2,color:#fff
    style Attrs fill:#DE8F05,color:#fff
    style Version fill:#029E73,color:#fff
    style Timeout fill:#029E73,color:#fff
    style Languages fill:#029E73,color:#fff
    style Count fill:#029E73,color:#fff
    style Runtime fill:#CC78BC,color:#fff
    style Inline fill:#DE8F05,color:#fff
    style Reserved fill:#CA9161,color:#fff
    style ModuleDoc fill:#CA9161,color:#fff
    style Doc fill:#CA9161,color:#fff
    style Behaviour fill:#CA9161,color:#fff
    style Impl fill:#CA9161,color:#fff
```

**Code**:

```elixir
defmodule MyModule do
  # Module documentation (special reserved attribute)
  @moduledoc """
  This module demonstrates module attributes.
  Module attributes are compile-time constants.
  """
  # => @moduledoc appears in generated documentation
  # => Accessible via Code.fetch_docs/1

  # Compile-time constants
  @default_timeout 5000
  # => Computed once during compilation
  # => Inlined wherever used (zero runtime cost)
  # => @default_timeout is 5000
  @version "1.0.0"
  # => String constant
  # => @version is "1.0.0"
  @max_retries 3
  # => Integer constant
  # => @max_retries is 3

  # Function documentation (special reserved attribute)
  @doc """
  Waits for a specified timeout or default.
  Returns :ok after waiting.
  """
  # => @doc appears in function documentation (h/1 in IEx)
  def wait(timeout \\ @default_timeout) do
    # => Default argument uses module attribute
    # => @default_timeout inlined to 5000 at compile time
    :timer.sleep(timeout)
    # => Sleeps for timeout milliseconds
    :ok
    # => Returns :ok atom
  end

  @doc """
  Gets the module version.
  """
  def version, do: @version
  # => Returns compile-time constant (inlined to "1.0.0")

  # Computed at compile time (not runtime!)
  @languages ["Elixir", "Erlang", "LFE"]
  # => List created once during compilation
  # => @languages is ["Elixir", "Erlang", "LFE"]
  @language_count length(@languages)
  # => length/1 executed at compile time!
  # => Result: 3 (computed once, inlined everywhere)
  # => @language_count is 3

  def supported_languages, do: @languages
  # => Returns ["Elixir", "Erlang", "LFE"] (compile-time constant)
  # => Inlines to ["Elixir", "Erlang", "LFE"] (no runtime lookup)
  def language_count, do: @language_count
  # => Returns 3 (compile-time computed)
  # => Inlines to 3 (no runtime computation)

  # Module registration (declares implemented behaviour)
  @behaviour :gen_server
  # => Compiler checks we implement all required callbacks
  # => Common in OTP applications

  # Accumulating values (each @ reassignment creates new value)
  @colors [:red, :blue]
  # => Initial value: [:red, :blue]
  @colors [:green | @colors]
  # => Reads previous @colors, prepends :green → [:green, :red, :blue]
  @colors [:yellow | @colors]
  # => Reads previous @colors, prepends :yellow → [:yellow, :green, :red, :blue]

  def colors, do: @colors
  # => [:yellow, :green, :red, :blue] (final accumulated value)

  # Attributes are scoped to next function definition
  @important true
  # => Attribute active for next function
  # => @important is true (at this point)
  def func1, do: @important
  # => Returns true (attribute value when func1 defined)
  # => Captures @important value true

  @important false
  # => Redefines @important for next function
  # => @important is now false (at this point)
  def func2, do: @important
  # => Returns false (NEW value, doesn't affect func1!)
  # => Captures @important value false

  # Custom attributes for metadata
  @deprecated_message "Use new_function/1 instead"
  # => Custom attribute (not reserved, any compile-time value)

  @doc @deprecated_message
  # => Uses custom attribute in @doc (dynamic documentation)
  def old_function, do: :deprecated

  # Reserved attributes (special compiler meaning):
  # @moduledoc - module documentation
  # @doc - function documentation
  # @behaviour - declares implemented behaviour
  # @impl - marks callback implementation
  # @deprecated - marks deprecated (compiler warns)
  # @spec - type specification (dialyzer)
  # @type - defines custom type
  # @opaque - defines opaque type
  # => Custom attributes allowed: @author, @since, etc.
end

# Module attribute usage examples
MyModule.wait(1000)
# => Sleeps 1000ms, returns :ok

MyModule.version()
# => "1.0.0" (compile-time constant inlined)

MyModule.supported_languages()
# => ["Elixir", "Erlang", "LFE"] (compile-time constant)

MyModule.language_count()
# => 3 (computed once at compile time, not runtime!)

MyModule.colors()
# => [:yellow, :green, :red, :blue]
# => Final accumulated value from compile-time build

```

**Key Takeaway**: Module attributes (`@name`) are compile-time constants useful for documentation, configuration, and computed values. They're evaluated during compilation, not runtime.

**Why It Matters**: Module attributes serve three distinct purposes: compile-time constants (zero runtime overhead), module metadata (`@moduledoc`, `@spec`, `@behaviour`), and accumulation for later use (`@before_compile` hooks). Using attributes for constants rather than functions or module variables prevents repeated computation and enables the compiler to optimize call sites. `@spec` type specifications generate documentation and enable Dialyzer static analysis to catch type errors before runtime. ExDoc generates readable API documentation from `@moduledoc` and `@doc`. Libraries like Ecto use `@before_compile` to transform accumulated attribute data into generated code.

---

## Example 38: Import, Alias, Require

`import`, `alias`, and `require` control how modules are referenced in your code. They reduce verbosity and manage namespaces cleanly.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Alias["alias MyApp.User"] --> Short["User -> MyApp.User<br/>Shorten module names"]
    Import["import Enum, only: [map: 2]"] --> NoPrefix["map(list, fn) -> Enum.map<br/>Remove module prefix"]
    Require["require Logger"] --> Macros["Logger.info -> Macro<br/>Enable macro expansion"]

    ModLevel["Module-level<br/>(outside def)"] --> AllFuncs["Available in all functions"]
    FuncLevel["Function-level<br/>(inside def)"] --> OnlyFunc["Available in that function only"]

    style Alias fill:#0173B2,color:#fff
    style Import fill:#DE8F05,color:#fff
    style Require fill:#029E73,color:#fff
    style Short fill:#0173B2,color:#fff
    style NoPrefix fill:#DE8F05,color:#fff
    style Macros fill:#029E73,color:#fff
    style ModLevel fill:#CC78BC,color:#fff
    style FuncLevel fill:#CA9161,color:#fff
    style AllFuncs fill:#CC78BC,color:#fff
    style OnlyFunc fill:#CA9161,color:#fff
```

### Directive Comparison

| Directive | Purpose                    | When to Use                             |
| --------- | -------------------------- | --------------------------------------- |
| `alias`   | Shorten module names       | Always (safe, compile-time)             |
| `import`  | Bring functions into scope | Sparingly (namespace pollution risk)    |
| `require` | Enable macros              | Only for macros (Logger, custom macros) |

### Scoping Rules

- **Module-level**: Affects all functions in module
- **Function-level**: Only affects that function
- **import/require**: Function-level when inside `def`, module-level when outside

**Code**:

```elixir
defmodule ImportAliasRequire do               # => Module demonstrating namespace directives
  alias MyApp.Accounts.User                   # => Creates shorthand alias
  # => User = MyApp.Accounts.User (module-level scope)

  alias MyApp.Accounts.Admin, as: A           # => Custom alias with as: option
  # => A = MyApp.Accounts.Admin (different name)

  def create_user(name) do                    # => Function using User alias
    %User{name: name}                         # => Struct expansion via alias
    # => Expands to %MyApp.Accounts.User{name: name}
  end

  def create_admin(name) do                   # => Function using A alias
    %A{name: name}                            # => Struct expansion via custom alias
    # => Expands to %MyApp.Accounts.Admin{name: name}
  end

  import Enum, only: [map: 2, filter: 2]     # => Selective import (best practice)
  # => Brings map/2 and filter/2 into scope (no other Enum functions)

  def process_numbers(list) do                # => Function using imported functions
    list                                      # => Input list
    |> map(fn x -> x * 2 end)                # => Calls Enum.map/2 without module prefix
                                              # => Doubles each element
    |> filter(fn x -> x > 10 end)            # => Calls Enum.filter/2 without prefix
                                              # => Keeps only values > 10
  end

  import String, except: [split: 1]          # => Import all except split/1
  # => All String functions available except split/1

  def upcase_string(str) do                  # => Function using imported String function
    upcase(str)                               # => Calls String.upcase/1 without prefix
    # => Returns uppercased string
  end

  require Logger                              # => Required for macros
  # => Logger.info, Logger.debug are macros (compile-time expansion)

  def log_something do                        # => Function using Logger macro
    Logger.info("This is a log message")      # => Macro expands at compile time
    # => Generates log output with metadata
  end

  alias MyApp.{Accounts, Billing, Reports}   # => Multi-alias syntax
  # => Creates three aliases: Accounts, Billing, Reports

  def get_account_report do                   # => Function using multiple aliases
    account = Accounts.get()                  # => Expands to MyApp.Accounts.get/0
    # => Retrieves account data
    billing = Billing.get()                   # => Expands to MyApp.Billing.get/0
    # => Retrieves billing data
    Reports.generate(account, billing)        # => Expands to MyApp.Reports.generate/2
    # => Generates combined report
  end
end

defmodule MyApp.Accounts.User do              # => User struct definition
  defstruct name: nil, email: nil             # => Fields: name and email
end

defmodule MyApp.Accounts.Admin do             # => Admin struct definition
  defstruct name: nil, role: :admin           # => Fields: name and role (default :admin)
end

defmodule ScopingExample do                   # => Module demonstrating import scoping
  def func1 do                                # => Function with local import
    import Enum                               # => Function-level import (lexical scope)
    # => Import valid only within func1 body
    map([1, 2, 3], fn x -> x * 2 end)        # => Calls imported map/2
    # => Returns [2, 4, 6]
  end

  def func2 do                                # => Function without import
    Enum.map([1, 2, 3], fn x -> x * 2 end)   # => Must use full module name
    # => func1's import not available (function-scoped)
  end

  import String                               # => Module-level import
  # => Available in all functions below (module scope)

  def func3, do: upcase("hello")             # => Uses module-level imported upcase/1
  # => Returns "HELLO"

  def func4, do: downcase("WORLD")           # => Uses module-level imported downcase/1
  # => Returns "world"
end

# ImportAliasRequire.create_user("Alice")   # => Calls create_user/1
# => %MyApp.Accounts.User{name: "Alice", email: nil}

# ImportAliasRequire.process_numbers([1, 2, 3, 4, 5, 6, 7, 8])  # => Process with imported functions
# => Doubles: [2, 4, 6, 8, 10, 12, 14, 16]
# => Filters > 10: [12, 14, 16]

# ScopingExample.func1()                     # => Calls func1 with local import
# => [2, 4, 6]

# ScopingExample.func3()                     # => Calls func3 with module-level import
# => "HELLO"
```

**Key Takeaway**: Use `alias` to shorten module names, `import` to bring functions into scope (sparingly!), and `require` for macros. These directives manage namespaces and reduce verbosity.

**Why It Matters**: The import/alias/require distinction reflects Elixir's philosophy around explicit dependencies. `alias` is safest—it renames modules for brevity without importing anything into the namespace. `import` brings function names into scope but risks naming conflicts; use sparingly and prefer alias. `require` is needed for macros because macros must be available at compile time, not just runtime. Phoenix controllers `use Phoenix.Controller`, which internally imports and aliases the right modules. Understanding these distinctions helps you debug undefined function errors and design clean module APIs.

---

## Example 39: Protocols (Polymorphism)

Protocols enable polymorphism—defining a function that works differently for different data types. They're Elixir's mechanism for ad-hoc polymorphism, similar to interfaces in other languages.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Protocol["Protocol: Printable<br/>defines print/1"] --> ImplList["Implementation for List"]
    Protocol --> ImplMap["Implementation for Map"]
    Protocol --> ImplStruct["Implementation for User struct"]

    Call["Printable.print(data)"] --> Dispatch{Dispatch by type}
    Dispatch --> ImplList
    Dispatch --> ImplMap
    Dispatch --> ImplStruct

    style Protocol fill:#0173B2,color:#fff
    style ImplList fill:#DE8F05,color:#fff
    style ImplMap fill:#DE8F05,color:#fff
    style ImplStruct fill:#DE8F05,color:#fff
    style Call fill:#029E73,color:#fff
    style Dispatch fill:#CC78BC,color:#fff
```

**Code**:

```elixir
defprotocol Printable do
  # => Protocol definition: defines polymorphic interface
  # => Protocols dispatch based on data type at runtime
  # => Similar to interfaces in OOP languages
  @doc "Converts data to a printable string"
  # => Documentation for protocol function
  def print(data)
  # => Function signature: takes any data, returns string
  # => Implementation provided by defimpl for each type
end

defimpl Printable, for: Integer do
  # => Implementation of Printable protocol for Integer type
  # => defimpl: define protocol implementation
  # => for: Integer: specifies target type
  def print(int), do: "Number: #{int}"
  # => Pattern matches integer parameter
  # => Returns formatted string with integer value
  # => String interpolation: #{int}
end

defimpl Printable, for: List do
  # => Implementation for List type
  def print(list), do: "List with #{length(list)} items: #{inspect(list)}"
  # => length(list): counts list elements
  # => inspect(list): converts list to readable string
  # => Returns formatted string with count and contents
end

defimpl Printable, for: Map do
  # => Implementation for Map type
  def print(map), do: "Map with #{map_size(map)} keys"
  # => map_size(map): counts keys in map (O(1) operation)
  # => Returns formatted string with key count
end

Printable.print(42)
# => Calls protocol function with integer
# => Runtime dispatch: finds Integer implementation
# => Executes Printable.Integer.print/1
# => Returns "Number: 42"

Printable.print([1, 2, 3])
# => Runtime dispatch: finds List implementation
# => Calls Printable.List.print/1
# => Returns "List with 3 items: [1, 2, 3]"

Printable.print(%{a: 1, b: 2})
# => Runtime dispatch: finds Map implementation
# => Calls Printable.Map.print/1
# => Returns "Map with 2 keys"

defmodule User do
  # => Custom struct definition
  defstruct name: nil, age: nil
  # => Struct with two fields: name and age
  # => Both default to nil
end

defimpl Printable, for: User do
  # => Protocol implementation for custom User struct
  # => Protocols work with any data type, including custom structs
  def print(user), do: "User: #{user.name}, age #{user.age}"
  # => Accesses struct fields: user.name, user.age
  # => Returns formatted string with user data
end

user = %User{name: "Alice", age: 30}
# => Creates User struct instance
# => Binds to user variable
# => %User{name: "Alice", age: 30}

Printable.print(user)
# => Runtime dispatch: finds User implementation
# => Calls Printable.User.print/1
# => Returns "User: Alice, age 30"

defimpl String.Chars, for: User do
  # => Implements built-in String.Chars protocol
  # => String.Chars: enables to_string/1 and string interpolation
  # => Implementing this protocol integrates User with Elixir's string system
  def to_string(user), do: user.name
  # => Returns user's name as string representation
  # => Used by to_string/1 and #{} interpolation
end

to_string(user)
# => Calls String.Chars.to_string/1
# => Dispatch finds User implementation
# => Returns "Alice"

"Hello, #{user}"
# => String interpolation calls to_string/1 implicitly
# => Uses String.Chars.User.to_string/1
# => Converts user to "Alice"
# => Returns "Hello, Alice"
# => Without String.Chars impl, would raise Protocol.UndefinedError

defmodule Range do
  # => Custom Range struct
  defstruct first: nil, last: nil
  # => Stores range bounds: first and last
end

defimpl Enumerable, for: Range do
  # => Implements built-in Enumerable protocol
  # => Enumerable: enables Enum.* functions (map, filter, reduce, count, etc.)
  # => Must implement: count/1, member?/2, reduce/3, slice/1

  def count(range), do: {:ok, range.last - range.first + 1}
  # => Returns total element count
  # => Formula: last - first + 1 (inclusive range)
  # => Example: first=1, last=5 => 5-1+1 = 5 elements
  # => Returns {:ok, count} tuple

  def member?(range, value), do: {:ok, value >= range.first and value <= range.last}
  # => Checks if value is in range
  # => Returns {:ok, boolean}
  # => Example: member?(1..5, 3) => {:ok, true}

  def reduce(range, acc, fun) do
    # => Core enumeration function
    # => Converts custom Range to built-in range (range.first..range.last)
    # => Delegates to Enum.reduce/3
    Enum.reduce(range.first..range.last, acc, fun)
    # => Applies fun to each element with accumulator
    # => This enables all Enum.* functions to work with Range
  end

  def slice(_range), do: {:error, __MODULE__}
  # => Slice operation not supported for this Range
  # => Returns {:error, module_name}
  # => __MODULE__: expands to current module name (Enumerable.Range)
  # => Some Enum functions (take, drop) use slice for optimization
  # => Error return means fallback to reduce-based implementation
end

my_range = %Range{first: 1, last: 5}
# => Creates Range struct with bounds 1..5
# => Represents values: [1, 2, 3, 4, 5]

Enum.count(my_range)
# => Calls Enumerable.Range.count/1
# => Returns {:ok, 5}
# => Enum.count extracts value from {:ok, count} tuple
# => Returns 5

Enum.member?(my_range, 3)
# => Calls Enumerable.Range.member?/2
# => Checks if 3 is in range 1..5
# => Returns {:ok, true}
# => Enum.member? extracts boolean from tuple
# => Returns true

Enum.map(my_range, fn x -> x * 2 end)
# => Uses Enumerable.Range.reduce/3 under the hood
# => Iterates: 1, 2, 3, 4, 5
# => Applies fn: 1*2=2, 2*2=4, 3*2=6, 4*2=8, 5*2=10
# => Returns [2, 4, 6, 8, 10]
# => This works because we implemented Enumerable protocol!

defprotocol Describable do
  # => Protocol with fallback to Any
  @fallback_to_any true
  # => @fallback_to_any: enables default implementation
  # => If no specific implementation found, uses Any implementation
  # => Without this, missing implementation raises Protocol.UndefinedError
  def describe(data)
  # => Function signature for polymorphic describe/1
end

defimpl Describable, for: Any do
  # => Fallback implementation for all types
  # => Only used if @fallback_to_any true
  # => Catches all types without specific implementation
  def describe(_data), do: "No description available"
  # => _data: unused parameter (underscore prefix)
  # => Returns generic fallback message
end

defimpl Describable, for: Integer do
  # => Specific implementation for Integer
  # => Takes precedence over Any implementation
  def describe(int), do: "The number #{int}"
  # => Returns specific description for integers
end

Describable.describe(42)
# => Runtime dispatch: finds Integer implementation
# => Uses specific Describable.Integer.describe/1 (not Any)
# => Returns "The number 42"

Describable.describe("hello")
# => Runtime dispatch: no String implementation found
# => Fallback to Any implementation (because @fallback_to_any true)
# => Calls Describable.Any.describe/1
# => Returns "No description available"

Describable.describe([1, 2, 3])
# => No List implementation found
# => Fallback to Any
# => Returns "No description available"
# => Without @fallback_to_any, would raise Protocol.UndefinedError
```

**Key Takeaway**: Protocols enable polymorphic functions that dispatch based on data type. Implement protocols for your custom types to integrate with Elixir's built-in functions (`to_string`, `Enum.*`, etc.).

**Why It Matters**: Protocols enable polymorphism without inheritance hierarchies—any data type can implement any protocol, even types defined in other libraries. This is Elixir's answer to how you make existing types work with new functions. The `String.Chars` protocol enables any type to be interpolated in strings. `Inspect` enables custom IEx printing. `Enumerable` makes custom data structures work with all Enum functions. Unlike typeclasses or interfaces, protocols dispatch at runtime based on data type, enabling open extension. Adding JSON serialization to a struct from an external library requires only implementing the Jason.Encoder protocol.

---

## Example 40: Result Tuples (:ok/:error)

Elixir idiomatically uses tagged tuples `{:ok, value}` or `{:error, reason}` to represent success and failure. This explicit error handling is preferred over exceptions for expected error cases.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Call["Function Call:<br/>divide(10, 2)"] --> Check{" Result?"}
    Check -->|Success| OK["{:ok, 5.0}<br/>Return success tuple"]
    Check -->|Failure| Error["{:error, :reason}<br/>Return error tuple"]

    Caller["Caller"] --> Match{"Pattern Match"}
    Match -->|" {:ok, value}"| HandleSuccess["Use value<br/>Continue execution"]
    Match -->|" {:error, reason}"| HandleError["Handle error<br/>Recover or propagate"]

    style Call fill:#0173B2,color:#fff
    style Check fill:#DE8F05,color:#fff
    style OK fill:#029E73,color:#fff
    style Error fill:#CC78BC,color:#fff
    style Caller fill:#0173B2,color:#fff
    style Match fill:#DE8F05,color:#fff
    style HandleSuccess fill:#029E73,color:#fff
    style HandleError fill:#CC78BC,color:#fff
```

**Code**:

```elixir
defmodule ResultTuples do
  # => Module demonstrating idiomatic Elixir error handling
  # => Uses tagged tuples instead of exceptions for expected errors

  # Function that can succeed or fail
  def divide(a, b) when b != 0, do: {:ok, a / b}
  # => Clause 1: Guard checks b != 0
  # => Success case: returns {:ok, result} tuple
  # => Tagged tuple: :ok atom indicates success, second element is value
  # => Example: divide(10, 2) => {:ok, 5.0}

  def divide(_a, 0), do: {:error, :division_by_zero}
  # => Clause 2: Pattern matches b = 0 (exact value)
  # => Failure case: returns {:error, reason} tuple
  # => :division_by_zero is an atom describing the error
  # => _a: unused parameter (underscore prefix)

  # Parse integer from string
  def parse_int(string) do
    # => Wraps Integer.parse/1 with result tuple convention
    case Integer.parse(string) do
      # => Integer.parse/1 returns {int, rest} or :error
      {int, ""} -> {:ok, int}
      # => Pattern: {int, ""} means full string parsed (no remainder)
      # => Returns {:ok, int} indicating successful complete parse
      # => Example: parse("42") => {42, ""} => {:ok, 42}

      {_int, _rest} -> {:error, :partial_parse}
      # => Pattern: {int, rest} means partial parse (extra chars remain)
      # => Returns error indicating incomplete parse
      # => Example: parse("42abc") => {42, "abc"} => {:error, :partial_parse}

      :error -> {:error, :invalid_integer}
      # => Pattern: :error means string contains no valid integer
      # => Returns error indicating invalid input
      # => Example: parse("abc") => :error => {:error, :invalid_integer}
    end
  end

  # Fetch user from database (simulated)
  def fetch_user(id) when id > 0 and id < 100 do
    # => Clause 1: Guard validates id range [1, 99]
    # => Simulates successful database lookup
    {:ok, %{id: id, name: "User #{id}"}}
    # => Returns {:ok, map} with user data
  end

  def fetch_user(_id), do: {:error, :user_not_found}
  # => Clause 2: Catches all other ids (id <= 0 or id >= 100)
  # => Returns error tuple for invalid ids

  # Chain operations with pattern matching
  def get_user_name(id) do
    # => Demonstrates manual error propagation
    case fetch_user(id) do
      # => Call fetch_user, pattern match on result
      {:ok, user} -> {:ok, user.name}
      # => Success case: extract user.name, re-wrap in {:ok, ...}
      # => Propagates success with transformed value

      {:error, reason} -> {:error, reason}
      # => Failure case: propagate error unchanged
      # => Pattern matches any error reason, passes it through
    end
  end

  # Chain with `with`
  def calculate(a_str, b_str) do
    # => Demonstrates with expression for cleaner error chaining
    with {:ok, a} <- parse_int(a_str),
         # => Step 1: Parse first string to integer
         # => If {:ok, a} pattern matches: bind a, continue to step 2
         # => If {:error, _} or other: jump to else block

         {:ok, b} <- parse_int(b_str),
         # => Step 2: Parse second string to integer
         # => If {:ok, b} pattern matches: bind b, continue to step 3
         # => If error: jump to else block

         {:ok, result} <- divide(a, b) do
         # => Step 3: Divide a by b
         # => If {:ok, result} pattern matches: bind result, execute do block
         # => If error: jump to else block

      {:ok, result}
      # => All steps succeeded: return final result
      # => Returns {:ok, result} maintaining tuple convention
    else
      {:error, reason} -> {:error, reason}
      # => Any step failed: propagate error
      # => Pattern matches any error tuple from any step
      # => Early return: stops at first error
    end
  end
end

ResultTuples.divide(10, 2)
# => Calls divide/2 with valid divisor
# => Guard b != 0 succeeds (2 != 0 is true)
# => Returns {:ok, 5.0}

ResultTuples.parse_int("42")
# => Calls Integer.parse("42") => {42, ""}
# => Pattern matches {int, ""} (complete parse)
# => Returns {:ok, 42}

ResultTuples.fetch_user(1)
# => id = 1: guard id > 0 and id < 100 succeeds
# => Returns {:ok, %{id: 1, name: "User 1"}}

ResultTuples.divide(10, 0)
# => Calls divide/2 with zero divisor
# => Guard b != 0 fails (0 != 0 is false)
# => Falls through to clause 2: divide(_a, 0)
# => Returns {:error, :division_by_zero}

ResultTuples.parse_int("abc")
# => Calls Integer.parse("abc") => :error (no digits)
# => Pattern matches :error clause
# => Returns {:error, :invalid_integer}

ResultTuples.fetch_user(999)
# => id = 999: guard id > 0 and id < 100 fails (999 < 100 is false)
# => Falls through to clause 2: fetch_user(_id)
# => Returns {:error, :user_not_found}

ResultTuples.get_user_name(1)
# => Calls fetch_user(1) => {:ok, %{id: 1, name: "User 1"}}
# => Pattern matches {:ok, user}
# => Extracts user.name => "User 1"
# => Returns {:ok, "User 1"}

ResultTuples.get_user_name(999)
# => Calls fetch_user(999) => {:error, :user_not_found}
# => Pattern matches {:error, reason}
# => Returns {:error, :user_not_found} (propagated)

ResultTuples.calculate("10", "2")
# => with step 1: parse_int("10") => {:ok, 10} ✓ bind a=10
# => with step 2: parse_int("2") => {:ok, 2} ✓ bind b=2
# => with step 3: divide(10, 2) => {:ok, 5.0} ✓ bind result=5.0
# => All steps succeeded, execute do block
# => Returns {:ok, 5.0}

ResultTuples.calculate("10", "0")
# => with step 1: parse_int("10") => {:ok, 10} ✓ bind a=10
# => with step 2: parse_int("0") => {:ok, 0} ✓ bind b=0
# => with step 3: divide(10, 0) => {:error, :division_by_zero} ✗ mismatch!
# => Pattern {:ok, result} doesn't match {:error, ...}
# => Jump to else block
# => Returns {:error, :division_by_zero}

ResultTuples.calculate("abc", "2")
# => with step 1: parse_int("abc") => {:error, :invalid_integer} ✗ mismatch!
# => Pattern {:ok, a} doesn't match {:error, ...}
# => Jump to else block immediately (step 2 and 3 never execute)
# => Returns {:error, :invalid_integer}

case ResultTuples.divide(10, 2) do
  # => Pattern matching on result tuple
  # => Call divide(10, 2) => {:ok, 5.0}
  {:ok, result} -> IO.puts("Result: #{result}")
  # => Pattern matches {:ok, 5.0}, bind result=5.0
  # => Prints "Result: 5.0"
  # => Returns :ok (IO.puts return value)

  {:error, :division_by_zero} -> IO.puts("Cannot divide by zero")
  # => Would match if result was {:error, :division_by_zero}
  # => Not executed in this example
end

{:ok, value} = ResultTuples.divide(10, 2)
# => Pattern matching assignment
# => Right side: ResultTuples.divide(10, 2) => {:ok, 5.0}
# => Left side: {:ok, value} pattern
# => Pattern matches, binds value = 5.0
# => If pattern didn't match (e.g., returned {:error, ...}), raises MatchError

value
# => Returns 5.0 (extracted from tuple)
# => This unwraps the result, losing error information!
# => Use only when you're certain of success

defmodule Bang do
  # => Module demonstrating bang (!) function convention
  # => Bang functions unwrap results or raise exceptions

  def divide!(a, b) do
    # => Function name ends with !: indicates may raise exception
    # => Convention: ! functions unwrap {:ok, value} or raise on {:error, reason}
    case ResultTuples.divide(a, b) do
      # => Calls safe divide/2 that returns tuple
      {:ok, result} -> result
      # => Success: unwrap tuple, return bare value
      # => Converts {:ok, 5.0} to 5.0

      {:error, reason} -> raise "Division failed: #{reason}"
      # => Failure: raise RuntimeError with reason
      # => Converts {:error, :division_by_zero} to exception
      # => Caller must handle with try/rescue or let process crash
    end
  end
end

Bang.divide!(10, 2)
# => Calls ResultTuples.divide(10, 2) => {:ok, 5.0}
# => Pattern matches {:ok, result}, binds result=5.0
# => Returns 5.0 (unwrapped value)
# => No exception raised
```

**Key Takeaway**: Use tagged tuples `{:ok, value}` and `{:error, reason}` for expected error cases. Functions ending with `!` unwrap results or raise exceptions. Pattern match to handle both success and failure cases.

**Why It Matters**: The `{:ok, value}` / `{:error, reason}` convention is Elixir's universal error handling contract—every library in the ecosystem uses it. Unlike exceptions that propagate invisibly up call stacks, result tuples make failures explicit and composable. The `with` expression chains multiple result tuple operations cleanly. Pattern matching ensures all error cases are handled. Ecto changesets, GenServer calls, File operations, HTTP clients—all return result tuples. Internalizing this pattern makes reading unfamiliar code immediately comprehensible and prevents the silent failure modes common when exceptions are swallowed.

---

## Example 41: Try/Rescue/After

`try/rescue/after` handles exceptions. Use `rescue` to catch exceptions, `after` for cleanup code that always runs (like `finally` in other languages). Prefer result tuples for expected errors.

**Code**:

```elixir
defmodule TryRescue do
  # => Module demonstrating exception handling with try/rescue/after
  # => Use for exceptions from external libraries or cleanup scenarios

  # Basic try/rescue
  def safe_divide(a, b) do
    # => Wraps risky division operation in try/rescue
    try do
      # => try block: code that might raise exception
      a / b
      # => Division by zero raises ArithmeticError in Elixir
      # => If successful, returns result (5.0 for 10/2)
    rescue
      # => rescue block: catches and handles exceptions
      ArithmeticError -> {:error, :division_by_zero}
      # => Pattern matches specific exception type
      # => Converts exception to {:error, reason} tuple
      # => No error information, just atom tag
    end
    # => try/rescue returns value from matched block
  end

  # Multiple rescue clauses
  def parse_and_double(str) do
    # => Demonstrates multiple rescue patterns
    try do
      str
      |> String.to_integer()
      # => String.to_integer/1 raises ArgumentError for invalid strings
      # => Example: "abc" raises ArgumentError
      |> Kernel.*(2)
      # => Kernel.*/2: multiplication operator as function
      # => Doubles the integer
    rescue
      # => Multiple rescue clauses: matched top-to-bottom
      ArgumentError -> {:error, :invalid_integer}
      # => Clause 1: Simple pattern, catches ArgumentError
      # => Returns error tuple without exception details

      err in RuntimeError -> {:error, {:runtime_error, err.message}}
      # => Clause 2: Named pattern with "in"
      # => err: binds exception struct
      # => RuntimeError: exception type to match
      # => err.message: accesses exception message field
      # => Returns error tuple with message
    end
  end

  # try/after for cleanup
  def read_file(path) do
    # => Demonstrates after block for guaranteed cleanup
    {:ok, file} = File.open(path, [:read])
    # => Opens file, pattern matches {:ok, file}
    # => If file doesn't exist, raises MatchError (no try/rescue here!)
    # => file: file handle/PID

    try do
      # => try block: risky file reading
      IO.read(file, :all)
      # => Reads entire file contents
      # => Returns string with file data
      # => Could raise if file handle invalid
    after
      # => after block: ALWAYS executes (success or exception)
      # => Similar to finally in other languages
      File.close(file)
      # => Closes file handle to free resource
      # => Runs even if IO.read raises exception
      # => Ensures no file handle leak
      # => after block return value is IGNORED
    end
    # => Returns IO.read result (string) if successful
    # => If exception raised, propagates after cleanup
  end

  # try/rescue/after all together
  def complex_operation do
    # => Demonstrates combining rescue and after
    try do
      # => try block: intentionally dangerous operation
      result = 10 / 0
      # => Division by zero raises ArithmeticError
      # => This line never executes
      {:ok, result}
      # => Would return {:ok, Infinity} if division succeeded (it won't)
    rescue
      # => rescue block: handles exceptions
      ArithmeticError -> {:error, :arithmetic_error}
      # => Catches ArithmeticError specifically
      # => Matches division by zero case
      # => Returns error tuple

      _ -> {:error, :unknown_error}
      # => Catch-all pattern: matches any exception
      # => _ discards exception value (not bound to variable)
      # => Fallback for unexpected exceptions
    after
      # => after block: runs regardless of success/failure
      IO.puts("Cleanup happens here")
      # => Prints to stdout
      # => Executes BEFORE return (after rescue clause)
      # => Return value ignored (function returns rescue result)
    end
    # => Execution order: try → rescue → after → return rescue value
  end

  # Catch specific exception type
  def handle_specific_error do
    # => Demonstrates accessing exception struct
    try do
      raise ArgumentError, message: "Invalid argument"
      # => raise: throws exception
      # => ArgumentError: exception module
      # => message: "...": sets exception message field
    rescue
      e in ArgumentError -> "Caught: #{e.message}"
      # => e in ArgumentError: binds exception to e variable
      # => e: exception struct %ArgumentError{message: "Invalid argument"}
      # => e.message: accesses message field
      # => Returns string with message (no {:error, ...} tuple)
    end
  end

  # Re-raise exception
  def logged_operation do
    # => Demonstrates logging + re-raising
    try do
      raise "Something went wrong"
      # => raise "string": creates RuntimeError with message
      # => Shorthand for: raise RuntimeError, message: "..."
    rescue
      e ->
        # => e: catches any exception (no "in" type restriction)
        # => Binds exception struct to e variable
        Logger.error("Error occurred: #{inspect(e)}")
        # => Log error before re-raising
        # => inspect(e): converts exception struct to string
        # => Side effect: logs to logger backend

        reraise e, __STACKTRACE__
        # => reraise: re-throws exception with original stacktrace
        # => e: exception struct to re-throw
        # => __STACKTRACE__: special variable with current stacktrace
        # => Preserves original error location for debugging
        # => Function does NOT return (exception propagates)
    end
  end
end

TryRescue.safe_divide(10, 2)
# => try block: 10 / 2 = 5.0 (success, no exception)
# => rescue block: NOT executed
# => Returns 5.0 (not wrapped in tuple)

TryRescue.safe_divide(10, 0)
# => try block: 10 / 0 raises ArithmeticError
# => rescue block: catches ArithmeticError
# => Returns {:error, :division_by_zero}

TryRescue.parse_and_double("5")
# => try: String.to_integer("5") => 5 (success)
# => try: 5 * 2 = 10
# => rescue: NOT executed
# => Returns 10

TryRescue.parse_and_double("abc")
# => try: String.to_integer("abc") raises ArgumentError
# => rescue: catches ArgumentError (first clause matches)
# => Returns {:error, :invalid_integer}

TryRescue.complex_operation()
# => try: 10 / 0 raises ArithmeticError
# => rescue: catches ArithmeticError => {:error, :arithmetic_error}
# => after: IO.puts("Cleanup happens here") executes
# => Prints "Cleanup happens here" to stdout
# => Returns {:error, :arithmetic_error}

TryRescue.handle_specific_error()
# => try: raise ArgumentError => raises with message
# => rescue: catches ArgumentError, binds to e
# => e.message => "Invalid argument"
# => Returns "Caught: Invalid argument"



defmodule HTTPClient do
  # => Example HTTP client with exception handling
  def get(url) do
    # => Simulates HTTP request with error handling
    try do
      # => try block: risky HTTP call
      {:ok, "Response from #{url}"}
      # => In real code, this would be: HTTPoison.get!(url)
      # => Returns success tuple with response
    rescue
      # => rescue with multiple exception types
      HTTPError -> {:error, :http_error}
      # => Hypothetical HTTPError exception
      # => Catches HTTP-specific errors (404, 500, etc.)

      TimeoutError -> {:error, :timeout}
      # => Hypothetical TimeoutError exception
      # => Catches connection timeout errors
      # => Different error handling based on exception type
    end
  end
end
```

**Key Takeaway**: Use `try/rescue/after` to handle exceptions from external libraries or for cleanup. Prefer result tuples for expected errors. The `after` block always runs, making it ideal for resource cleanup.

**Why It Matters**: Try/rescue handles exceptional conditions—not the normal error flow (use result tuples for that). Reserve try/rescue for integrating with libraries that raise exceptions, for guarding against unexpected runtime errors, and for cleanup in `after` blocks. The `after` clause guarantees execution even if rescue raises—critical for releasing resources like file handles, database connections, and network sockets. Overusing try/rescue is an antipattern in Elixir: let processes crash and restart via Supervisors rather than catching all errors. Use try/rescue surgically at integration boundaries.

---

## Example 42: Raise and Custom Exceptions

Use `raise` to throw exceptions. Define custom exception modules for domain-specific errors. Exceptions should be for unexpected situations, not control flow.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    SafeFunc["Safe Function:<br/>fetch(key)"] --> Check{" Key exists?"}
    Check -->|Yes| OkTuple["{:ok, value}<br/>Explicit success"]
    Check -->|No| ErrorTuple["{:error, :not_found}<br/>Explicit error"]

    BangFunc["Bang Function:<br/>fetch!(key)"] --> Check2{" Key exists?"}
    Check2 -->|Yes| Value["value<br/>Return value directly"]
    Check2 -->|No| Raise["raise KeyError<br/>Exception thrown"]

    Caller["Caller handles:"] --> Pattern["Pattern match<br/>{:ok, v} or {:error, r}"]
    Caller2["Caller handles:"] --> TryRescue["try/rescue<br/>or let it crash"]

    style SafeFunc fill:#0173B2,color:#fff
    style BangFunc fill:#0173B2,color:#fff
    style OkTuple fill:#029E73,color:#fff
    style ErrorTuple fill:#DE8F05,color:#fff
    style Value fill:#029E73,color:#fff
    style Raise fill:#CC78BC,color:#fff
    style Pattern fill:#029E73,color:#fff
    style TryRescue fill:#CC78BC,color:#fff
```

### Exception Conventions

**Custom Exceptions**: Define with `defexception` (creates struct with `__exception__: true`)
**Message Protocol**: Implement `message/1` for formatted error messages
**Bang Functions**: `!` suffix indicates function may raise (e.g., `fetch!/1` vs `fetch/1`)
**Return Tuples**: Safe functions return `{:ok, value}` or `{:error, reason}`

### Safe vs Bang Functions

| Pattern    | Return Type                        | Error Handling        | Use Case                           |
| ---------- | ---------------------------------- | --------------------- | ---------------------------------- |
| `fetch/1`  | `{:ok, value} \| {:error, reason}` | Explicit error tuples | Caller handles errors              |
| `fetch!/1` | `value`                            | Raises exception      | Errors unexpected or unrecoverable |

**Code**:

```elixir
defmodule MyApp.ValidationError do
  # => Custom exception with default values
  # => defexception creates struct with __exception__: true field
  defexception message: "Validation failed", field: nil
  # => Fields: message (string), field (atom or nil)
  # => field stores which field failed validation

  @impl true
  # => Implements Exception protocol's message/1 callback
  def message(exception) do
    # => Exception protocol callback for formatted messages
    # => Called when exception converted to string (e.g., in error logs)
    "Validation failed for field: #{exception.field}"
    # => Interpolates field name into message
    # => Returns formatted string for display
  end
end

defmodule MyApp.NotFoundError do
  # => Custom exception with list syntax (all fields default to nil)
  defexception [:resource, :id]
  # => Fields: resource (type), id (identifier)
  # => Creates struct: %MyApp.NotFoundError{resource: nil, id: nil}

  @impl true
  # => Implements Exception protocol message/1 callback
  def message(exception) do
    # => Custom message format
    # => Builds 404-style error message from struct fields
    "#{exception.resource} with id #{exception.id} not found"
    # => Human-readable 404-style error
    # => Returns: "User with id 999 not found"
  end
end

defmodule UserValidator do
  # => Validation module with bang functions (! means may raise)
  # => Bang convention: function may raise exception on invalid input

  def validate_age!(age) when is_integer(age) and age >= 0 and age < 150, do: :ok
  # => Happy path: age is integer in valid range [0, 150)
  # => Guard clause ensures: is_integer AND age >= 0 AND age < 150
  # => Returns: :ok (validation passed)

  def validate_age!(age) when is_integer(age) do
    # => Integer but out of range (age < 0 or age >= 150)
    # => Second clause matches when first guard fails
    raise MyApp.ValidationError, field: :age, message: "Age must be between 0 and 150, got: #{age}"
    # => Raises with specific error message
    # => Keyword list populates exception struct fields
  end

  def validate_age!(_age) do
    # => Catch-all: not an integer
    # => Third clause matches when type is wrong (string, float, etc.)
    raise MyApp.ValidationError, field: :age, message: "Age must be an integer"
    # => Raises type error with descriptive message
  end

  def validate_email!(email) when is_binary(email) do
    # => Email validation (is_binary checks string type)
    # => Guard ensures email is binary (string in Elixir)
    if String.contains?(email, "@") do
      :ok
      # => Success: email has @ symbol
      # => Returns :ok atom (validation passed)
    else
      raise MyApp.ValidationError, field: :email, message: "Email must contain @"
      # => Basic validation (production would use regex)
      # => Raises when @ missing from email string
    end
  end

  def validate_email!(_email) do
    # => Catch-all: email is not a string
    # => Matches when email is integer, atom, list, etc.
    raise MyApp.ValidationError, field: :email, message: "Email must be a string"
    # => Raises type error for non-string input
  end
end

UserValidator.validate_age!(30)
# => Valid age: returns :ok
# => 30 is integer in range [0, 150) - first clause matches

UserValidator.validate_email!("alice@example.com")
# => Valid email: returns :ok
# => String contains @ - validation passes

# Example: age validation failure (out of range)
# UserValidator.validate_age!(200)
# => Raises MyApp.ValidationError: "Age must be between 0 and 150, got: 200"
# => Second clause raises because 200 >= 150

# Example: age validation failure (wrong type)
# UserValidator.validate_age!("30")
# => Raises MyApp.ValidationError: "Age must be an integer"
# => Third clause raises because "30" is string, not integer

defmodule UserRepo do
  # => Repository demonstrating safe/bang function pairs
  # => fetch/1 returns tuple, fetch!/1 raises exception

  def fetch(id) when id > 0 and id < 100 do
    # => Safe fetch: returns result tuple
    # => Guard ensures ID in valid range (1-99)
    {:ok, %{id: id, name: "User #{id}"}}
    # => Success: {:ok, user_map}
    # => Returns tagged tuple with user data
  end

  def fetch(_id), do: {:error, :not_found}
  # => Catch-all: invalid ID returns error tuple
  # => Matches when id <= 0 or id >= 100
  # => Returns: {:error, :not_found} for explicit error handling

  def fetch!(id) do
    # => Bang version: unwraps result or raises
    # => Calls safe fetch/1, then pattern matches on result
    case fetch(id) do
      {:ok, user} -> user
      # => Success: unwrap tuple, return bare user map
      # => Extracts user from {:ok, user} tuple

      {:error, :not_found} ->
        # => Failure: raise custom exception
        # => Pattern matches error tuple from fetch/1
        raise MyApp.NotFoundError, resource: "User", id: id
        # => Exception message: "User with id <id> not found"
        # => Keyword list populates exception struct
    end
  end
end

UserRepo.fetch(1)
# => Returns: {:ok, %{id: 1, name: "User 1"}}
# => ID in range [1, 99] - first clause returns success tuple

UserRepo.fetch(999)
# => Returns: {:error, :not_found}
# => ID out of range - second clause returns error tuple

UserRepo.fetch!(1)
# => Returns: %{id: 1, name: "User 1"} (unwrapped)
# => fetch!/1 calls fetch/1, unwraps {:ok, user} tuple

# Example: bang function raising exception
# UserRepo.fetch!(999)
# => Raises MyApp.NotFoundError: "User with id 999 not found"
# => fetch!/1 calls fetch/1, matches {:error, :not_found}, raises exception
```

**Key Takeaway**: Raise exceptions for unexpected, unrecoverable errors. Define custom exceptions for domain-specific errors. Use the `!` convention: functions ending with `!` raise exceptions, non-bang versions return result tuples.

**Why It Matters**: Custom exceptions communicate error domain and carry structured data about what went wrong. Unlike string error messages, structured exceptions enable pattern matching on error type, automated error reporting classification, and documentation of failure modes in module specs. The `defexception` macro generates an exception module implementing the Exception behaviour. Libraries define custom exceptions so callers can match on specific error types: `rescue MyApp.NotFoundError ->` vs a generic rescue catching everything. Ecto.NoResultsError, Phoenix.Router.NoRouteError, and all major library exceptions follow this pattern.

---

## Example 43: Spawning Processes

Processes are Elixir's lightweight concurrency primitive. Each process has its own memory and communicates via message passing. Use `spawn/1` or `spawn_link/1` to create processes.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Main["Main Process"] --> Spawn["spawn(fn -> ... end)"]
    Spawn --> P1["Process 1<br/>Isolated Memory"]
    Spawn --> P2["Process 2<br/>Isolated Memory"]
    Spawn --> P3["Process 3<br/>Isolated Memory"]

    Main --> Send["send(pid, message)"]
    Send --> P1
    Send --> P2
    Send --> P3

    style Main fill:#0173B2,color:#fff
    style Spawn fill:#DE8F05,color:#fff
    style P1 fill:#029E73,color:#fff
    style P2 fill:#029E73,color:#fff
    style P3 fill:#029E73,color:#fff
    style Send fill:#CC78BC,color:#fff
```

### Process Lifecycle

**Spawning**: `spawn/1` or `spawn/3` creates new BEAM process with isolated memory
**Execution**: Process runs concurrently (non-blocking), executes function, then exits
**Isolation**: Each process has separate memory (data copied, not shared)
**Lifecycle**: Check status with `Process.alive?/1`, inspect with `Process.info/1`

### spawn/1 vs spawn_link/1

| Function       | Behavior                                           | Use Case                            |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| `spawn/1`      | Isolated processes (crashes don't propagate)       | Independent tasks, fire-and-forget  |
| `spawn_link/1` | Linked processes (bidirectional crash propagation) | Supervised tasks, dependent workers |

**Code**:

```elixir
# Basic process spawning
pid = spawn(fn -> IO.puts("Hello from spawned process!") end)
# => Creates new BEAM process executing function concurrently
# => Returns: PID (process identifier) e.g. #PID<0.150.0>
# => Process exits when function completes (non-blocking)

Process.alive?(pid)
# => Checks if process is still running
# => Returns: false (process finished in microseconds)

# Long-running process example
long_process = spawn(fn ->
  # => Process sleeps before completing
  :timer.sleep(1000)
  # => Blocks process for 1 second (parent continues immediately)
  IO.puts("Finished after 1 second")
end)
# => Returns: PID of long-running process

Process.alive?(long_process)
# => Returns: true (process still sleeping)

:timer.sleep(1500)
# => Parent sleeps 1.5s (ensures child finishes)

Process.alive?(long_process)
# => Returns: false (child exited ~0.5s ago)

# Getting current process PID
self()
# => Returns PID of current (calling) process
# => Example: #PID<0.100.0>

# Spawning multiple processes
pids = Enum.map(1..5, fn i ->
  # => Creates 5 concurrent processes
  spawn(fn -> IO.puts("Process #{i}") end)
  # => Processes run concurrently (order not guaranteed)
  # => i: captured from parent scope (closure)
end)
# => Returns: list of 5 PIDs [#PID<0.151.0>, ...]

# Using module function with spawn
defmodule Worker do
  def work(n) do
    # => Worker function simulating task processing
    IO.puts("Working on task #{n}")
    :timer.sleep(100)
    # => Simulates 100ms work
    IO.puts("Task #{n} done!")
  end
end

spawn(Worker, :work, [1])
# => spawn/3: spawns process calling Worker.work(1)
# => Equivalent to: spawn(fn -> Worker.work(1) end)
# => Returns: PID

# Linked processes (crash propagation)
parent_pid = self()
# => Stores parent PID for reference
child = spawn_link(fn ->
  # => spawn_link/1: creates bidirectional link
  # => If either crashes, both crash (unless trapping exits)
  :timer.sleep(500)
  raise "Child process crashed!"
  # => Child crashes, propagates to parent via link
  # => WARNING: Parent crashes unless trapping exits
end)
# => Returns: PID of linked child

# Process introspection
pid = spawn(fn -> :timer.sleep(5000) end)
# => Long-lived process (5s sleep) for inspection

Process.info(pid)
# => Returns: keyword list with process information
# => [{:registered_name, []}, {:current_function, {:timer, :sleep, 1}}, ...]
# => Returns nil if process not alive

Process.info(pid, :status)
# => Queries specific field (e.g., :status)
# => Returns: {:status, :waiting} (process in sleep)
# => States: :running, :runnable, :suspended, :garbage_collecting

# Mass process creation (demonstrates lightweight processes)
Enum.each(1..10_000, fn _ ->
  # => Creates 10,000 concurrent processes
  spawn(fn -> :timer.sleep(10_000) end)
  # => Each process sleeps 10s
  # => Memory per process: ~2KB (very lightweight)
  # => Total: ~20MB for 10,000 processes
end)
# => All processes run concurrently (BEAM scheduler distributes across cores)

# Memory isolation demonstration
defmodule Isolation do
  def demonstrate do
    # => Shows data is copied, not shared between processes
    list = [1, 2, 3]
    # => Parent has list [1, 2, 3]
    spawn(fn ->
      # => Child receives COPY of list (no shared memory)
      modified_list = [0 | list]
      # => Child prepends 0: [0, 1, 2, 3]
      # => Parent's list unchanged
      IO.inspect(modified_list, label: "Child process")
      # => Prints: Child process: [0, 1, 2, 3]
    end)
    :timer.sleep(100)
    # => Wait for child to print
    IO.inspect(list, label: "Parent process")
    # => Prints: Parent process: [1, 2, 3]
    # => Proves: processes have isolated memory
  end
end

Isolation.demonstrate()
# => Output shows parent and child have different lists
# => Memory isolation: no shared state between processes
```

**Key Takeaway**: Processes are lightweight, isolated, and communicate via messages. Use `spawn/1` for independent processes, `spawn_link/1` for linked processes. Elixir can run millions of processes concurrently.

**Why It Matters**: Spawning processes is Elixir's concurrency primitive—not threads which share memory but isolated processes that communicate only via messages. The BEAM can run millions of concurrent processes, each with its own heap, garbage collected independently with no global GC pauses. This isolation means one process crashing does not affect others—the foundation of Elixir's fault tolerance. Every GenServer, Phoenix request handler, and background job is a spawned process. Understanding the raw `spawn` API before GenServer abstractions demystifies what GenServer does and why the actor model scales so well.

---

## Example 44: Send and Receive

Processes communicate by sending and receiving messages. Messages go into a process mailbox and are processed with `receive`. This is asynchronous message passing—the sender doesn't block.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Sender["Sender Process"] --> Send["send(pid, {:msg, data})"]
    Send --> Mailbox["Receiver Mailbox<br/>[{:msg, data}]"]
    Mailbox --> Receive["receive do<br/>{:msg, data} -> ..."]
    Receive --> Process["Process Message"]

    style Sender fill:#0173B2,color:#fff
    style Send fill:#DE8F05,color:#fff
    style Mailbox fill:#029E73,color:#fff
    style Receive fill:#CC78BC,color:#fff
    style Process fill:#CA9161,color:#fff
```

**Code**:

```elixir
# Basic bidirectional message passing
receiver = spawn(fn ->
  # => Spawns receiver process
  # => Process waits for incoming messages
  receive do
    # => receive block: pattern matches messages from mailbox
    # => Blocks until matching message arrives
    # => Messages queued in FIFO order
    {:hello, sender} -> send(sender, {:hi, self()})
    # => Pattern 1: matches {:hello, <sender_pid>}
    # => sender: extracted from tuple (caller's PID)
    # => send/2: sends message to sender
    # => self(): receiver's own PID
    # => Reply: {:hi, <receiver_pid>}
    # => Non-blocking send (returns immediately)

    {:goodbye, sender} -> send(sender, {:bye, self()})
    # => Pattern 2: matches {:goodbye, <sender_pid>}
    # => Different message type, different response
    # => Reply: {:bye, <receiver_pid>}
  end
  # => After processing one message, process exits
  # => No loop: single-message receiver
end)

send(receiver, {:hello, self()})
# => send/2: sends message to receiver process
# => Message: {:hello, <parent_pid>}
# => Goes into receiver's mailbox
# => Async: sender doesn't wait for processing
# => Returns: {:hello, <parent_pid>} (the message sent)

receive do
  # => Parent waits for reply from receiver
  {:hi, pid} -> IO.puts("Received hi from #{inspect(pid)}")
  # => Matches {:hi, <receiver_pid>}
  # => pid: bound to receiver's PID
  # => Prints: "Received hi from #PID<0.X.Y>"
  # => Process continues after receiving reply
end

# Receive with timeout (prevents infinite blocking)
spawn(fn ->
  # => Spawns process that waits for message with timeout
  receive do
    :message -> IO.puts("Got message")
    # => Matches :message atom
    # => Would print if message received within timeout
  after
    # => after clause: timeout handler
    # => Executes if no matching message arrives in time
    1000 -> IO.puts("No message received after 1 second")
    # => 1000ms timeout (1 second)
    # => Prints timeout message
    # => Process exits after timeout
  end
end)
# => Process waits 1 second, times out, prints, exits
# => No message sent, so timeout always triggers

# Multiple message patterns
receiver = spawn(fn ->
  # => New receiver with multiple pattern handlers
  receive do
    {:add, a, b} -> IO.puts("Sum: #{a + b}")
    # => Pattern: {:add, number, number}
    # => Extracts a and b from tuple
    # => Prints sum result

    {:multiply, a, b} -> IO.puts("Product: #{a * b}")
    # => Pattern: {:multiply, number, number}
    # => Different operation, same structure
    # => Prints product result

    unknown -> IO.puts("Unknown message: #{inspect(unknown)}")
    # => Catch-all pattern: matches any message
    # => unknown: binds to entire message
    # => inspect/1: converts term to readable string
    # => Handles unexpected message formats
  end
end)

send(receiver, {:add, 5, 3})
# => Sends {:add, 5, 3} to receiver
# => Matches first pattern
# => Prints: Sum: 8
# => Process exits after handling message

# Echo server (recursive receive loop)
defmodule Echo do
  # => Module implementing echo server pattern
  def loop do
    # => Recursive function: processes messages indefinitely
    receive do
      {:echo, msg, sender} ->
        # => Pattern: {:echo, message, sender_pid}
        # => Receives message and sender PID
        send(sender, {:reply, msg})
        # => Echoes message back to sender
        # => Reply: {:reply, <original_msg>}
        loop()
        # => Recursive call: continue receiving
        # => Tail-recursive: no stack growth
        # => Process remains alive for next message

      :stop -> :ok
      # => Stop signal: breaks recursion
      # => Returns :ok (function exits)
      # => Process terminates after receiving :stop
    end
  end
end

echo_pid = spawn(&Echo.loop/0)
# => spawn(&Fun/Arity): spawns with function reference
# => &Echo.loop/0: captures Echo.loop function
# => Echo server starts, waiting for messages
# => Returns: PID of echo server

send(echo_pid, {:echo, "Hello", self()})
# => Sends echo request with message "Hello"
# => Includes parent PID for reply
# => Message: {:echo, "Hello", <parent_pid>}

receive do
  {:reply, msg} -> IO.puts("Echo replied: #{msg}")
  # => Waits for echo reply
  # => Matches {:reply, "Hello"}
  # => Prints: "Echo replied: Hello"
end

send(echo_pid, {:echo, "World", self()})
# => Second echo request
# => Echo server still running (due to loop())
# => Message: {:echo, "World", <parent_pid>}

receive do
  {:reply, msg} -> IO.puts("Echo replied: #{msg}")
  # => Waits for second reply
  # => Matches {:reply, "World"}
  # => Prints: "Echo replied: World"
end

send(echo_pid, :stop)
# => Sends stop signal to echo server
# => Matches :stop pattern
# => Echo server exits (no more loop())
# => Process terminates cleanly

# FIFO message ordering
pid = self()
# => Get current process PID
send(pid, :first)
# => Send message 1 to self
# => Mailbox: [:first]
send(pid, :second)
# => Send message 2 to self
# => Mailbox: [:first, :second] (FIFO order)
send(pid, :third)
# => Send message 3 to self
# => Mailbox: [:first, :second, :third]

receive do: (:first -> IO.puts("1"))
# => Compact syntax: single-clause receive
# => Matches and removes :first from mailbox
# => Prints: 1
# => Mailbox after: [:second, :third]

receive do: (:second -> IO.puts("2"))
# => Matches and removes :second (now at head)
# => Prints: 2
# => Mailbox after: [:third]

receive do: (:third -> IO.puts("3"))
# => Matches and removes :third
# => Prints: 3
# => Mailbox after: [] (empty)
# => Demonstrates FIFO: messages processed in send order

# flush() - clear mailbox
send(self(), :msg1)
# => Send message to self
# => Mailbox: [:msg1]
send(self(), :msg2)
# => Mailbox: [:msg1, :msg2]

flush()
# => flush/0: prints all messages in mailbox
# => Removes all messages from mailbox
# => Prints: :msg1, :msg2
# => Mailbox after: [] (empty)
# => Useful for debugging and cleanup

# Asynchronous message sending (non-blocking)
pid = spawn(fn ->
  :timer.sleep(2000)
  # => Process sleeps for 2 seconds before receiving
  # => Simulates slow message processing
  receive do
    msg -> IO.puts("Received: #{inspect(msg)}")
    # => Pattern matches any message
    # => Will print after 2-second sleep
  end
end)

send(pid, :hello)
# => Sends message while process is sleeping
# => Message queued in mailbox immediately
# => send/2 returns instantly (doesn't wait for receive)
# => Returns: :hello (the message)

IO.puts("Sent message, continuing...")
# => Prints immediately after send (proves non-blocking)
# => Parent continues while child sleeps
# => Message will be processed in 2 seconds

# Messages can be any Elixir term
send(self(), {:tuple, 1, 2})
# => Tuple message
# => Mailbox: [{:tuple, 1, 2}]
send(self(), [1, 2, 3])
# => List message
# => Mailbox: [{:tuple, 1, 2}, [1, 2, 3]]
send(self(), %{key: "value"})
# => Map message
# => Mailbox: [..., %{key: "value"}]
send(self(), "string")
# => String message
# => Mailbox: [..., "string"]
send(self(), 42)
# => Integer message
# => Mailbox: [..., 42]

flush()
# => Prints all 5 messages
# => {:tuple, 1, 2}
# => [1, 2, 3]
# => %{key: "value"}
# => "string"
# => 42
# => Demonstrates: messages can be any Elixir term
# => Mailbox cleared after flush
```

**Key Takeaway**: Processes communicate via asynchronous message passing. `send/2` puts messages in the mailbox, `receive` pattern matches and processes them. Messages are queued in FIFO order.

**Why It Matters**: Message passing is how isolated Elixir processes coordinate without shared state. `send/2` places messages in the receiver's mailbox; `receive` pattern matches against them. This eliminates race conditions, deadlocks, and the need for locks—processes never directly access each other's state. The actor model (processes plus message passing) scales across CPU cores and network nodes identically: sending to a local pid and a remote pid on another machine uses the same API. Understanding `send`/`receive` at the raw level is essential before learning GenServer, which provides structured message handling on top of this foundation.

---

## Example 45: Process Monitoring

Process monitoring allows you to detect when other processes crash or exit. Use `Process.monitor/1` to watch a process and receive a message when it exits.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    subgraph Linking["Process Linking (Bidirectional)"]
        P1["Process A"] -->|link| P2["Process B"]
        P2 -->|link| P1
        P2Crash["Process B crashes 💥"] --> BothDie["Both processes terminate"]
    end

    subgraph Monitoring["Process Monitoring (Unidirectional)"]
        M1["Monitor Process"] -->|monitor| M2["Monitored Process"]
        M2Crash["Monitored crashes 💥"] --> DownMsg["Monitor receives<br/>{:DOWN, ref, :process, pid, reason}"]
        DownMsg --> MonitorSurvives["Monitor survives,<br/>handles :DOWN message"]
    end

    style P1 fill:#0173B2,color:#fff
    style P2 fill:#029E73,color:#fff
    style P2Crash fill:#CC78BC,color:#fff
    style BothDie fill:#CC78BC,color:#fff
    style M1 fill:#0173B2,color:#fff
    style M2 fill:#029E73,color:#fff
    style M2Crash fill:#CC78BC,color:#fff
    style DownMsg fill:#DE8F05,color:#fff
    style MonitorSurvives fill:#029E73,color:#fff
```

### Monitoring vs Linking

| Feature           | Monitoring                                  | Linking                             |
| ----------------- | ------------------------------------------- | ----------------------------------- |
| Direction         | Unidirectional (one watches another)        | Bidirectional (both crash together) |
| Crash Propagation | No (monitor survives, gets `:DOWN` message) | Yes (both processes crash)          |
| Use Case          | Detect failures, health checks              | Supervised tasks, dependent workers |
| Message           | `:DOWN` tuple with exit reason              | `:EXIT` signal (unless trapping)    |

### Monitor Message Format

`:DOWN` message: `{:DOWN, ref, :process, pid, reason}`

- `ref`: Monitor reference (from `Process.monitor/1`)
- `pid`: Monitored process PID
- `reason`: Exit reason (`:normal`, exception tuple, `:killed`, etc.)

**Code**:

```elixir
# Basic process monitoring (crash detection)
pid = spawn(fn ->
  # => Spawns process that crashes after 1s
  # => Spawned process runs in separate memory space
  :timer.sleep(1000)
  # => Sleeps 1000ms (1 second) before crashing
  raise "Process crashed!"
  # => Raises RuntimeError, exits abnormally
  # => Exit reason: {:error, %RuntimeError{message: "Process crashed!"}}
end)
# => pid: spawned process identifier (e.g., #PID<0.123.0>)

ref = Process.monitor(pid)
# => Starts monitoring (unidirectional: this watches pid)
# => Returns: reference e.g. #Reference<0.1234.5678>
# => Monitor doesn't crash monitoring process (unlike link)
# => Reference uniquely identifies this monitor relationship

receive do
  {:DOWN, ^ref, :process, ^pid, reason} ->
    # => Pattern: {:DOWN, ref, :process, pid, exit_reason}
    # => ^ref, ^pid: pin operators ensure correct monitor/process
    # => Pin operators (^) match against captured values (not rebind)
    # => reason: crash reason (exception tuple + stacktrace)
    # => reason structure: {:error, %RuntimeError{...}}
    IO.puts("Process #{inspect(pid)} exited with reason: #{inspect(reason)}")
    # => Logs exit reason for debugging
after
  2000 -> IO.puts("No exit message received")
  # => Timeout: 2s (safety net)
  # => Matches if no :DOWN message within 2000ms
end
# => Monitor auto-removed after :DOWN received
# => Cleanup: no manual demonitor needed

# Monitoring normal exit
pid = spawn(fn ->
  # => Process exits normally after 0.5s
  # => Normal exit: function completes without raising
  :timer.sleep(500)
  # => Sleeps 500ms (0.5 seconds)
  :ok  # Normal exit
  # => Exits with reason :normal
  # => Last expression value becomes exit reason
end)
# => pid: normal-exit process identifier

ref = Process.monitor(pid)
# => Monitors normal and abnormal exits
# => :DOWN sent for both normal and crash exits

receive do
  {:DOWN, ^ref, :process, ^pid, reason} ->
    # => reason: :normal (not error tuple)
    # => Normal exit reason is atom :normal, not exception tuple
    IO.puts("Process exited normally with reason: #{inspect(reason)}")
    # => Prints: "Process exited normally with reason: :normal"
    # => inspect/1 converts atom to string representation
after
  1000 -> IO.puts("No exit")
  # => Timeout: 1s (should receive :DOWN within 500ms)
end
# => Monitor auto-removed after :DOWN received

# Demonitor - stop monitoring
pid = spawn(fn -> :timer.sleep(10_000) end)
# => Long-running process (10s)
# => Useful for testing manual demonitor
ref = Process.monitor(pid)
# => Start monitoring
# => ref: monitor reference to remove later
Process.demonitor(ref)  # Stop monitoring
# => Removes monitor, no :DOWN message sent
# => Process still runs, just not monitored
# => Manual cleanup before process exits
Process.exit(pid, :kill)  # Kill the process
# => :kill: brutal termination (cannot be trapped)
# => No :DOWN (already demonitored)
# => Process killed but monitoring process doesn't receive :DOWN

# Monitor multiple processes (parallel work tracker)
pids = Enum.map(1..5, fn i ->
  # => Creates 5 processes with staggered completion (100-500ms)
  spawn(fn ->
    :timer.sleep(i * 100)
    # => Process 1: 100ms, Process 2: 200ms, ..., Process 5: 500ms
    IO.puts("Process #{i} done")
  end)
end)
# => All processes run concurrently

refs = Enum.map(pids, &Process.monitor/1)
# => Monitor all processes
# => &Process.monitor/1: function capture syntax
# => refs: list of 5 monitor references

Enum.each(refs, fn ref ->
  # => Wait for each process to complete
  receive do
    {:DOWN, ^ref, :process, _pid, :normal} -> :ok
    # => Match specific ref (^ref pin operator)
    # => Expect normal exit
  end
end)
# => Total wait: ~500ms (concurrent, not sequential)
IO.puts("All processes finished")
# => Coordination pattern: wait for multiple tasks

# TimeoutHelper - production pattern for process timeout
defmodule TimeoutHelper do
  # => Implements timeout pattern with monitoring
  def call_with_timeout(fun, timeout) do
    # => Executes fun with timeout limit
    parent = self()
    # => Capture parent PID (child sends result here)
    pid = spawn(fn ->
      # => Spawn child to execute function
      result = fun.()
      # => Execute function (crashes child if fun raises)
      send(parent, {:result, self(), result})
      # => Send result to parent
    end)

    ref = Process.monitor(pid)
    # => Monitor child (detects crash before result sent)

    receive do
      {:result, ^pid, result} ->
        # => Success: function completed
        Process.demonitor(ref, [:flush])
        # => Cleanup: remove monitor and flush pending :DOWN
        {:ok, result}

      {:DOWN, ^ref, :process, ^pid, reason} ->
        # => Child crashed before completing
        {:error, {:process_died, reason}}
    after
      timeout ->
        # => Timeout: child too slow
        Process.exit(pid, :kill)
        # => Kill child (prevents zombie processes)
        Process.demonitor(ref, [:flush])
        # => Cleanup monitor
        {:error, :timeout}
    end
    # => Returns: {:ok, result} | {:error, {:process_died, reason}} | {:error, :timeout}
  end
end

# Success case - completes within timeout
TimeoutHelper.call_with_timeout(fn -> :timer.sleep(500); 42 end, 1000)  # => {:ok, 42}
# => 500ms < 1000ms: completes successfully

# Timeout case - exceeds timeout
TimeoutHelper.call_with_timeout(fn -> :timer.sleep(2000); 42 end, 1000)  # => {:error, :timeout}
# => 2000ms > 1000ms: exceeds timeout
# => Child killed, returns {:error, :timeout}
```

**Key Takeaway**: Use `Process.monitor/1` to watch processes and receive `:DOWN` messages when they exit. Monitoring is unidirectional (unlike linking) and ideal for detecting process failures without crashing.

**Why It Matters**: Monitoring creates a unidirectional observation link: the monitor receives `{:DOWN, ref, :process, pid, reason}` when the monitored process exits, without crashing itself. This asymmetry distinguishes monitoring from linking: supervisors, connection managers, and health checkers use monitoring to observe child health without coupling their own lifecycle. Monitoring is temporary (explicitly demonitored) while links are permanent. Production patterns: GenServers monitor external resources and restart them; connection pools monitor worker processes; task supervisors monitor async tasks. Getting the linking vs monitoring choice right prevents cascading failures.

---

## Example 46: Task Module (Async/Await)

The `Task` module provides a simple abstraction for spawning processes and awaiting results. It's built on processes but handles boilerplate for async/await patterns.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Main["Main Process"] --> Async["Task.async(fn)"]
    Async --> Task1["Task Process<br/>Execute function"]
    Task1 --> Await["Task.await(task)"]
    Await --> Result["Return result to main"]

    Main2["Main Process"] --> AsyncStream["Task.async_stream"]
    AsyncStream --> Pool["Process Pool"]
    Pool --> T1["Task 1"]
    Pool --> T2["Task 2"]
    Pool --> T3["Task 3"]

    style Main fill:#0173B2,color:#fff
    style Main2 fill:#0173B2,color:#fff
    style Async fill:#DE8F05,color:#fff
    style Task1 fill:#029E73,color:#fff
    style Await fill:#CC78BC,color:#fff
    style AsyncStream fill:#DE8F05,color:#fff
    style Pool fill:#CA9161,color:#fff
    style T1 fill:#029E73,color:#fff
    style T2 fill:#029E73,color:#fff
    style T3 fill:#029E73,color:#fff
```

### Task Functions Comparison

| Function              | Return Type            | Blocking | Use Case             | Cleanup  |
| --------------------- | ---------------------- | -------- | -------------------- | -------- |
| `Task.async/1`        | `%Task{}`              | No       | Await result later   | Linked   |
| `Task.await/2`        | `result`               | Yes      | Get task result      | Auto     |
| `Task.yield/2`        | `{:ok, result} \| nil` | No       | Poll without error   | Manual   |
| `Task.start/1`        | `{:ok, pid}`           | No       | Fire-and-forget      | Unlinked |
| `Task.async_stream/3` | `Stream.t()`           | No       | Parallel collections | Auto     |

### Timeout Behavior

- **`Task.await/2`**: Raises `Task.TimeoutError` on timeout (default: 5000ms)
- **`Task.yield/2`**: Returns `nil` on timeout (non-blocking check)
- **Orphaned tasks**: Continue running after timeout (potential leak)

**Code**:

```elixir
# Basic async/await pattern
task = Task.async(fn ->
  # => Spawns process to execute function concurrently
  # => Returns: %Task{pid: <pid>, ref: <ref>, owner: <owner>}
  :timer.sleep(1000)
  # => Simulates 1s computation (task runs, caller continues)
  42
  # => Return value for Task.await/1
end)
# => Task struct: %Task{pid: #PID<0.150.0>, ...}

IO.puts("Task started, doing other work...")
# => Prints immediately (non-blocking)

result = Task.await(task)  # => 42
# => Blocks until task completes (~1s wait)
# => Returns: task function's return value
IO.puts("Task result: #{result}")
# => Prints: "Task result: 42"

# Multiple parallel tasks
tasks = Enum.map(1..5, fn i ->
  # => Creates 5 concurrent tasks
  Task.async(fn ->
    # => Each task in separate process
    :timer.sleep(i * 200)
    # => Task 1: 200ms, Task 2: 400ms, ..., Task 5: 1000ms
    i * i
    # => Return square: 1, 4, 9, 16, 25
  end)
end)
# => 5 Task structs, all processes running concurrently

results = Enum.map(tasks, &Task.await/1)  # => [1, 4, 9, 16, 25]
# => Await all tasks sequentially
# => &Task.await/1: function capture syntax
# => Total wait: ~1000ms (concurrent, not 3000ms sequential)
IO.inspect(results)
# => Prints: [1, 4, 9, 16, 25]

# Task timeout with exception
task = Task.async(fn ->
  # => Spawns slow task (10 seconds)
  :timer.sleep(10_000)
  :done
  # => Never reached (timeout occurs first)
end)

try do
  Task.await(task, 1000)  # Timeout after 1 second
  # => Wait max 1000ms (task needs 10000ms)
  # => Raises Task.TimeoutError after 1s
  # => WARNING: Task process keeps running (orphaned)
rescue
  e in Task.TimeoutError ->
    # => Catches timeout exception
    IO.puts("Task timed out: #{inspect(e)}")
    # => Prints timeout error details
end
# => Task process still running in background

# Task.yield - non-blocking check
task = Task.async(fn ->
  # => Task takes 2 seconds
  :timer.sleep(2000)
  :result
end)

case Task.yield(task, 500) do
  # => Non-blocking: returns immediately after 500ms
  # => Does NOT raise exception on timeout
  {:ok, result} -> IO.puts("Got result: #{result}")
  # => Task completed within 500ms (won't match, needs 2000ms)
  nil -> IO.puts("Task still running after 500ms")
  # => Task not completed, returns nil (not error tuple)
  # => Prints: "Task still running after 500ms"
end
# => Task process still alive (continues running)

case Task.yield(task, 2000) do
  # => Second yield: wait up to 2000ms more
  # => Task has ~1500ms remaining (completes in time)
  {:ok, result} -> IO.puts("Got result: #{result}")
  # => Task completed, returns {:ok, :result}
  # => Prints: "Got result: result"
  nil -> IO.puts("Still running")
  # => Won't match (task completes in ~1500ms)
end
# => Total elapsed: ~2000ms (500ms + 1500ms)

# Task.start - fire and forget
Task.start(fn ->
  # => Spawns unlinked task (returns {:ok, pid}, not %Task{})
  # => No await needed (fire-and-forget pattern)
  :timer.sleep(1000)
  IO.puts("Background task completed")
  # => Prints after 1 second asynchronously
end)
# => Returns: {:ok, #PID<0.160.0>}
IO.puts("Main process continues immediately")
# => Prints immediately (doesn't wait)

# Task.async_stream - parallel collection processing
results = 1..10
          |> Task.async_stream(fn i ->
            # => Processes collection in parallel with bounded concurrency
            # => Preserves element ordering in results
            :timer.sleep(100)
            # => Each task sleeps 100ms
            i * i
            # => Compute square: 1, 4, 9, ..., 100
          end, max_concurrency: 4)
          # => At most 4 tasks run simultaneously
          # => As tasks complete, new tasks start (batched execution)
          # => Returns: stream of {:ok, result} tuples
          |> Enum.to_list()
          # => Force stream evaluation (blocks until all complete)
          # => Total time: ~300ms (10 elements / 4 concurrency * 100ms)
# => [{:ok, 1}, {:ok, 4}, {:ok, 9}, ..., {:ok, 100}]

# Error handling in tasks
task = Task.async(fn ->
  # => Task that crashes
  raise "Task error!"
  # => Task process crashes immediately
end)

try do
  Task.await(task)
  # => Task crashed, exception propagated to caller
  # => Re-raises RuntimeError in caller's context
rescue
  e -> IO.puts("Caught error: #{inspect(e)}")
  # => Catches %RuntimeError{message: "Task error!"}
end
# => Task process terminated (crashed)

# Task.Supervisor - supervised tasks
{:ok, result} = Task.Supervisor.start_link()
# => Starts task supervisor for managed task processes
# => Provides isolation: task crashes don't affect caller
# => Returns: {:ok, #PID<supervisor_pid>}
```

**Key Takeaway**: `Task` provides async/await abstraction over processes. Use `Task.async/1` and `Task.await/1` for parallel work with results. Use `Task.async_stream/3` for processing collections in parallel.

**Why It Matters**: Task provides structured concurrency over raw process spawning—async/await semantics with proper error propagation, timeout handling, and cleanup. `Task.async/1` plus `Task.await/2` enable parallel execution of independent operations while maintaining backpressure. `Task.async_stream/3` provides bounded parallelism for processing collections. Unlike fire-and-forget `spawn`, tasks integrate with supervision trees via `Task.Supervisor`, ensuring crashed tasks are reported rather than silently lost. Phoenix LiveView uses Task for parallel data loading; background job systems use Task.Supervisor for managed concurrency.

---

## Example 47: ExUnit Basics

ExUnit is Elixir's built-in testing framework. Tests are organized into test modules, and assertions verify expected behavior. Running `mix test` executes all tests in your project.

### Key ExUnit Features

| Feature              | Purpose                 | Example                             |
| -------------------- | ----------------------- | ----------------------------------- |
| `use ExUnit.Case`    | Import test macros      | Required in test modules            |
| `test "description"` | Define test case        | `test "adds numbers" do ... end`    |
| `assert`             | Verify truthy value     | `assert 1 + 1 == 2`                 |
| `refute`             | Verify falsy value      | `refute 1 > 2`                      |
| `assert_raise`       | Verify exception        | `assert_raise Error, fn -> ... end` |
| `setup`              | Per-test initialization | Runs before each test               |
| `setup_all`          | One-time initialization | Runs before all tests               |
| `@tag`               | Categorize tests        | `@tag :slow` for selective runs     |

### Test Organization

- **Module naming**: `<ModuleName>Test` convention
- **File location**: `test/` directory
- **Discovery**: `mix test` auto-discovers test modules
- **Execution**: Tests run in random order (ensures independence)

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Setup["setup do<br/>..."] --> Test1["test 'description' do<br/>..."]
    Test1 --> Assert1["assert value == expected"]
    Assert1 --> Teardown["(automatic cleanup)"]

    Setup --> Test2["test 'another' do<br/>..."]
    Test2 --> Assert2["refute condition"]
    Assert2 --> Teardown

    style Setup fill:#0173B2,color:#fff
    style Test1 fill:#DE8F05,color:#fff
    style Test2 fill:#DE8F05,color:#fff
    style Assert1 fill:#029E73,color:#fff
    style Assert2 fill:#029E73,color:#fff
    style Teardown fill:#CC78BC,color:#fff
```

**Code**:

```elixir
defmodule MathTest do                  # => Defines test module MathTest
  use ExUnit.Case                       # => Imports test macros (test, assert, refute, setup)
                                        # => Required in all test modules

  test "addition works" do              # => Defines test case with description
                                        # => Each test is independent
    assert 1 + 1 == 2                   # => Asserts 1 + 1 equals 2
                                        # => Passes if expression evaluates to true
                                        # => Returns true on success
  end                                   # => End test definition

  test "subtraction works" do           # => Second test case (independent)
                                        # => Tests run in random order for isolation
    assert 5 - 3 == 2                   # => Asserts 5 - 3 equals 2
                                        # => Returns true on success
  end                                   # => End test definition

  test "multiplication and division" do # => Test with multiple assertions
                                        # => All assertions must pass
    assert 2 * 3 == 6                   # => Asserts multiplication result
                                        # => 2 * 3 = 6, returns true
    assert 10 / 2 == 5.0                # => Asserts division result
                                        # => Division (/) always returns float
                                        # => 10 / 2 = 5.0 (not 5)
    assert rem(10, 3) == 1              # => Asserts remainder result
                                        # => rem/2 calculates modulo
                                        # => 10 % 3 = 1, returns true
  end                                   # => End test definition

  test "boolean assertions" do          # => Test demonstrating assert/refute
    assert true                         # => Asserts true is truthy
                                        # => Always passes
    refute false                        # => Refutes false (inverse of assert)
                                        # => Passes if expression is falsy
                                        # => Returns true on success
    assert 1 < 2                        # => Asserts comparison is true
                                        # => 1 < 2 evaluates to true
    refute 1 > 2                        # => Refutes comparison
                                        # => 1 > 2 is false, so refute passes
  end                                   # => End test definition

  test "pattern matching" do            # => Test using pattern matching in assertions
    assert {:ok, value} = {:ok, 42}     # => Pattern matches and binds value
                                        # => {:ok, value} matches {:ok, 42}
                                        # => value binds to 42
                                        # => Returns true on successful match
    assert value == 42                  # => Asserts value equals 42
                                        # => value was bound to 42 in previous line
                                        # => Returns true
  end                                   # => End test definition

  test "raises exception" do            # => Test verifying exception is raised
    assert_raise ArithmeticError, fn -> # => Expects ArithmeticError exception
                                        # => Takes exception type and function
      1 / 0                             # => Division by zero operation
                                        # => Raises ArithmeticError
                                        # => Test passes if error raised
    end                                 # => End assert_raise block
                                        # => Returns true if exception raised
  end                                   # => End test definition

  test "raises with message" do         # => Test verifying exception with message
    assert_raise ArgumentError, "Invalid", fn ->  # => Expects specific message
                                                   # => Verifies exception type AND message
      raise ArgumentError, "Invalid"    # => Raises ArgumentError with message "Invalid"
                                        # => Message must match exactly
                                        # => Test passes if both match
    end                                 # => End assert_raise block
                                        # => Returns true if exception and message match
  end                                   # => End test definition

  setup do                              # => Setup callback runs before EACH test
                                        # => Used for per-test initialization
    {:ok, user: %{name: "Alice", age: 30}}  # => Returns context map
                                             # => Tagged tuple with :ok
                                             # => user key contains map with name and age
                                             # => Available to all tests in this module
  end                                   # => End setup definition

  test "uses setup data", %{user: user} do  # => Test receives context from setup
                                             # => Pattern matches user from context map
                                             # => user binds to %{name: "Alice", age: 30}
    assert user.name == "Alice"         # => Accesses name field from user map
                                        # => user.name is "Alice"
                                        # => Returns true
    assert user.age == 30               # => Accesses age field from user map
                                        # => user.age is 30
                                        # => Returns true
  end                                   # => End test definition
end                                     # => End module definition

defmodule Calculator do                 # => Defines Calculator module for testing
  def add(a, b), do: a + b              # => Addition function (one-line syntax)
                                        # => Returns sum of a and b
  def subtract(a, b), do: a - b         # => Subtraction function
                                        # => Returns difference of a and b
  def multiply(a, b), do: a * b         # => Multiplication function
                                        # => Returns product of a and b
  def divide(_a, 0), do: {:error, :division_by_zero}  # => First clause: catches div by zero
                                                       # => Pattern matches when b is 0
                                                       # => Returns error tuple
  def divide(a, b), do: {:ok, a / b}    # => Second clause: normal division
                                        # => Only called if b is not 0
                                        # => Returns ok tuple with float result
end                                     # => End module definition

defmodule CalculatorTest do             # => Test module for Calculator
  use ExUnit.Case                       # => Imports test macros
                                        # => Required for test definitions

  test "add/2 adds two numbers" do      # => Test Calculator.add/2 function
                                        # => Verifies addition works correctly
    assert Calculator.add(2, 3) == 5    # => Calls add with 2 and 3
                                        # => 2 + 3 = 5, returns true
    assert Calculator.add(-1, 1) == 0   # => Tests negative numbers
                                        # => -1 + 1 = 0, returns true
  end                                   # => End test definition

  test "divide/2 returns ok tuple" do   # => Test successful division
                                        # => Verifies normal case returns :ok
    assert Calculator.divide(10, 2) == {:ok, 5.0}  # => Calls divide with 10 and 2
                                                    # => Second clause matches (b != 0)
                                                    # => 10 / 2 = 5.0 (float)
                                                    # => Returns {:ok, 5.0}
                                                    # => Assertion passes
  end                                   # => End test definition

  test "divide/2 handles division by zero" do  # => Test error handling
                                               # => Verifies div by zero returns error
    assert Calculator.divide(10, 0) == {:error, :division_by_zero}  # => Calls divide with b=0
                                                                      # => First clause matches (b is 0)
                                                                      # => Returns {:error, :division_by_zero}
                                                                      # => Assertion passes
  end                                   # => End test definition

  @tag :slow                            # => Module attribute tags test
                                        # => Categorizes as :slow test
                                        # => Use for selective test execution
  test "slow test" do                   # => Test with :slow tag
    :timer.sleep(2000)                  # => Sleeps for 2000ms (2 seconds)
                                        # => Simulates slow operation
                                        # => Run with: mix test --only slow
                                        # => Exclude with: mix test --exclude slow
    assert true                         # => Always passes
                                        # => Returns true
  end                                   # => End test definition

  @tag :skip                            # => Tags test to skip
                                        # => Test will not run by default
  test "skipped test" do                # => Skipped test (won't execute)
    assert false                        # => This would fail if executed
                                        # => Run with: mix test --include skip
                                        # => Useful for work-in-progress tests
  end                                   # => End test definition
end                                     # => End module definition
```

**Key Takeaway**: ExUnit provides testing with `assert`, `refute`, and `assert_raise`. Tests are organized in modules with `use ExUnit.Case`. Use `setup` for per-test initialization and tags to organize tests.

**Why It Matters**: ExUnit is Elixir's built-in testing framework, and good test coverage is especially important in a dynamically typed language where the compiler catches fewer errors. `assert` with `=` on the left uses pattern matching—you are not just checking equality but asserting the result shape. The test isolation model (each test in a separate process) prevents test ordering bugs. ExUnit's async tests run in parallel, leveraging the BEAM's concurrency for fast test suites. Documentation tests with `iex>` examples in `@doc` keep documentation accurate. Building the test-first habit in Elixir early pays dividends in production confidence.

---

## Example 48: Mix Project Structure

Mix is Elixir's build tool. It manages dependencies, compiles code, runs tests, and provides project scaffolding. Understanding the standard project structure is essential for Elixir development.

### Standard Project Structure

```text
my_app/
├── mix.exs              # Project configuration
├── lib/                 # Application code
│   └── my_app.ex        # Main module
├── test/                # Test files
│   └── my_app_test.exs  # Tests
└── config/              # Configuration
    ├── config.exs       # Default config
    └── dev.exs          # Environment-specific
```

### mix.exs Key Fields

| Field                | Purpose            | Example                |
| -------------------- | ------------------ | ---------------------- |
| `app`                | Application name   | `:my_app`              |
| `version`            | Semantic version   | `"0.1.0"`              |
| `elixir`             | Min Elixir version | `"~> 1.15"`            |
| `deps`               | Dependencies list  | `[{:jason, "~> 1.4"}]` |
| `extra_applications` | OTP apps to start  | `[:logger]`            |

**Code**:

```elixir
# mix.exs - project configuration file at project root
                                        # => Required for all Mix projects
defmodule MyApp.MixProject do           # => Mix project module (convention: AppName.MixProject)
  use Mix.Project                       # => Imports Mix.Project behavior
                                        # => Provides project/0 and application/0 callbacks
                                        # => Required for Mix to recognize this as project

  def project do                        # => Returns keyword list of project config
                                        # => Called by Mix during compilation
    [                                   # => Keyword list starts here
      app: :my_app,                     # => Application name as atom
                                        # => Used for .beam file naming
                                        # => Must match folder name convention
      version: "0.1.0",                 # => Semantic version string
                                        # => Format: MAJOR.MINOR.PATCH
                                        # => Incremented when releasing
      elixir: "~> 1.15",                # => Minimum Elixir version requirement
                                        # => ~> is pessimistic constraint operator
                                        # => ~> 1.15 allows 1.15.x but not 1.16.0
                                        # => Ensures compatibility
      start_permanent: Mix.env() == :prod,  # => Determines application restart strategy
                                             # => Mix.env() returns :dev, :test, or :prod
                                             # => true in :prod: restart on crash
                                             # => false in :dev/:test: don't restart
      deps: deps()                      # => Calls deps/0 function below
                                        # => Returns list of dependencies
    ]                                   # => End keyword list
  end                                   # => End project/0 function

  def application do                    # => Returns OTP application configuration
                                        # => Called when starting application
    [                                   # => Keyword list for application config
      extra_applications: [:logger]     # => OTP applications to start BEFORE this app
                                        # => :logger starts Elixir's logging system
                                        # => Runs in application's supervision tree
    ]                                   # => End keyword list
  end                                   # => End application/0 function

  defp deps do                          # => Private function returns dependency list
                                        # => Called by project/0 deps: field
    [                                   # => List of dependency tuples
      {:httpoison, "~> 2.0"},           # => HTTP client library
                                        # => Tuple: {package_atom, version_requirement}
                                        # => ~> 2.0 allows 2.x (not 3.0)
      {:jason, "~> 1.4"},               # => JSON encoder/decoder library
                                        # => ~> 1.4 allows 1.4.x (not 1.5)
      {:ex_doc, "~> 0.30", only: :dev}  # => Documentation generator
                                        # => only: :dev means dev environment only
                                        # => Not included in :prod builds
                                        # => Reduces production dependencies
    ]                                   # => Fetched from Hex.pm package registry
                                        # => Downloaded to deps/ folder
  end                                   # => End deps/0 function
end                                     # => End module definition

# lib/my_app.ex - main application module
                                        # => Located in lib/ directory (convention)
defmodule MyApp do                      # => Main module for application
  @moduledoc """                        # => Module documentation attribute
  Documentation for `MyApp`.            # => Markdown syntax supported
  """                                   # => End module doc string
                                        # => Appears in generated ExDoc
                                        # => Accessible via IEx h(MyApp)

  @doc """                              # => Function documentation attribute
  Hello world function.                 # => Describes what function does
  """                                   # => End function doc string
                                        # => Appears in ExDoc and IEx h(MyApp.hello)
  def hello do                          # => Public function (no parameters)
                                        # => Callable as MyApp.hello()
    :world                              # => Returns atom :world
                                        # => Last expression is return value
                                        # => Type: atom
  end                                   # => End function definition
end                                     # => End module definition

# test/my_app_test.exs - test file
                                        # => Located in test/ directory
                                        # => .exs extension: not compiled (evaluated)
defmodule MyAppTest do                  # => Test module (convention: ModuleNameTest)
  use ExUnit.Case                       # => Imports ExUnit test macros
                                        # => Enables test, assert, refute
  doctest MyApp                         # => Runs doctests from @doc comments
                                        # => Extracts code examples from docs
                                        # => Verifies examples work as shown
                                        # => Keeps docs in sync with code

  test "greets the world" do            # => Test case definition
                                        # => Description: "greets the world"
    assert MyApp.hello() == :world      # => Calls MyApp.hello() function
                                        # => Expects return value :world
                                        # => Test passes if assertion true
  end                                   # => End test definition
end                                     # => End module definition

# config/config.exs - application configuration file
                                        # => Located in config/ directory
import Config                           # => Imports Config module
                                        # => Provides config/2 and config/3 macros
                                        # => Required for configuration

config :my_app,                         # => Configures :my_app application
                                        # => First arg: application atom
  api_key: "development_key",           # => Sets api_key config value
                                        # => String value for development
                                        # => Retrieved via Application.get_env/2
  timeout: 5000                         # => Sets timeout config value
                                        # => Integer 5000 (5 seconds)
                                        # => Accessible at runtime

import_config "#{Mix.env()}.exs"        # => Dynamically imports environment-specific config
                                        # => Mix.env() returns :dev, :test, or :prod
                                        # => Loads dev.exs, test.exs, or prod.exs
                                        # => Environment configs override this file

# Runtime config access examples
                                        # => These show how to READ config at runtime
api_key = Application.get_env(:my_app, :api_key)  # => Reads api_key from :my_app config
                                                    # => Returns "development_key"
                                                    # => Returns nil if not set
timeout = Application.get_env(:my_app, :timeout, 3000)  # => Reads timeout with default
                                                         # => Returns 5000 (configured value)
                                                         # => Returns 3000 if not configured
                                                         # => Third arg is default value
```

**Key Takeaway**: Mix provides project scaffolding, dependency management, and build tools. Standard structure: `lib/` for code, `test/` for tests, `mix.exs` for configuration. Use `mix` commands to compile, test, and manage projects.

**Why It Matters**: Mix is Elixir's integrated build tool, dependency manager, and task runner—no Gradle, Maven, or Rake needed. Understanding the standard project layout (`lib/`, `test/`, `config/`, `mix.exs`) is prerequisite knowledge for reading any Elixir project. The `mix.exs` file serves as both build configuration and project metadata; Hex.pm reads it to publish packages. Environment separation (`dev`, `test`, `prod`) through Mix environments enables different dependency sets and configuration per environment. For new Elixir projects, `mix new`, `mix deps.get`, and `mix test` are the first commands you will run.

---

## Example 49: Doctests

Doctests embed tests in documentation using `@doc` comments. They verify that code examples in documentation actually work, keeping docs accurate and tested.

**Code**:

```elixir
defmodule StringHelper do
  # => Module with string manipulation functions
  # => Demonstrates doctests in @doc comments
  @moduledoc """
  Helper functions for string manipulation.
  """
  # => @moduledoc: module-level documentation
  # => Brief description of module purpose
  # => Appears in generated docs and IEx (h StringHelper)

  @doc """
  Reverses a string.

  ## Examples

      iex> StringHelper.reverse("hello")
      "olleh"

      iex> StringHelper.reverse("Elixir")
      "rixilE"

      iex> StringHelper.reverse("")
      ""
  """
  # => @doc: function-level documentation
  # => ## Examples section: contains doctests
  # => iex>: IEx prompt (indicates doctest line)
  # => Next line: expected output
  # => doctest/1 in test file extracts and runs these
  # => 3 examples test: normal case, different input, edge case (empty string)
  def reverse(string) do
    # => reverse/1: reverses string character by character
    # => Parameter: string (binary)
    String.reverse(string)
    # => String.reverse/1: built-in function
    # => Returns: reversed string
    # => "hello" → "olleh"
  end
  # => Function implementation matches doctest expectations
  # => Doctests verify function works as documented

  @doc """
  Counts words in a string.

  ## Examples

      iex> StringHelper.word_count("hello world")
      2

      iex> StringHelper.word_count("one")
      1

      iex> StringHelper.word_count("")
      0
  """
  # => ## Examples: 3 doctests
  # => Test cases: multiple words, single word, empty string
  # => Expected outputs: 2, 1, 0
  def word_count(string) do
    # => word_count/1: counts words separated by whitespace
    string
    |> String.split()
    # => String.split/1: splits on whitespace (default)
    # => "hello world" → ["hello", "world"]
    # => "" → []
    |> length()
    # => length/1: counts list elements
    # => ["hello", "world"] → 2
    # => [] → 0
  end
  # => Returns: word count (integer)
  # => Doctests verify: 2 words, 1 word, 0 words

  @doc """
  Capitalizes each word.

  ## Examples

      iex> StringHelper.capitalize_words("hello world")
      "Hello World"

      iex> StringHelper.capitalize_words("ELIXIR programming")
      "Elixir Programming"
  """
  # => ## Examples: 2 doctests
  # => Test cases: lowercase, mixed case
  # => Both should capitalize first letter of each word
  def capitalize_words(string) do
    # => capitalize_words/1: capitalizes first letter of each word
    string
    |> String.split()
    # => Split into words: "hello world" → ["hello", "world"]
    # => "ELIXIR programming" → ["ELIXIR", "programming"]
    |> Enum.map(&String.capitalize/1)
    # => Capitalize each word: ["hello", "world"] → ["Hello", "World"]
    # => String.capitalize/1: lowercase rest, uppercase first letter
    # => "ELIXIR" → "Elixir" (not "ELIXIR")
    |> Enum.join(" ")
    # => Join with space: ["Hello", "World"] → "Hello World"
    # => Enum.join/2: concatenates list with separator
  end
  # => Returns: capitalized string
  # => Doctests verify: lowercase input, mixed case input

  @doc """
  Checks if string is palindrome.

  ## Examples

      iex> StringHelper.palindrome?("racecar")
      true

      iex> StringHelper.palindrome?("hello")
      false

      iex> StringHelper.palindrome?("A man a plan a canal Panama" |> String.downcase() |> String.replace(" ", ""))
      true
  """
  # => ## Examples: 3 doctests
  # => Test cases: palindrome, non-palindrome, complex palindrome with pipe
  # => Third example: pipeline in doctest (valid syntax)
  def palindrome?(string) do
    # => palindrome?/1: checks if string reads same forwards/backwards
    # => Convention: ? suffix for boolean functions
    string == String.reverse(string)
    # => Compare string with its reverse
    # => "racecar" == "racecar" → true
    # => "hello" == "olleh" → false
    # => Returns: boolean
  end
  # => Doctests verify: true case, false case, preprocessed input
end
# => StringHelper complete: all functions have doctests

defmodule StringHelperTest do
  # => Test module for StringHelper
  use ExUnit.Case
  # => Import ExUnit testing macros
  doctest StringHelper  # Runs all doctests from @doc comments
  # => doctest/1: extracts examples from StringHelper @doc comments
  # => Scans for ## Examples sections
  # => Converts iex> lines to test assertions
  # => Total: 8 doctests (3 + 3 + 2 + 3 from all functions)
  # => Each doctest becomes separate test case
  # => Doctests run alongside regular tests

  # Additional regular tests
  test "reverse handles unicode" do
    # => Regular ExUnit test (not doctest)
    # => Tests edge case not in doctests (unicode)
    assert StringHelper.reverse("Hello 世界") == "界世 olleH"
    # => Verify unicode handling: Chinese characters reversed
    # => "Hello 世界" → "界世 olleH" (character-level reversal)
    # => Doctests + regular tests = comprehensive coverage
  end
  # => Best practice: doctests for basic cases, regular tests for edge cases
end
# => StringHelperTest complete: doctests + unicode test


# Calculator with multi-clause doctests
defmodule Calculator do
  # => Module demonstrating multi-clause functions with doctests
  @doc """
  Performs calculation based on operator.

  ## Examples

      iex> Calculator.calculate(5, :add, 3)
      8

      iex> Calculator.calculate(10, :subtract, 4)
      6

      iex> Calculator.calculate(3, :multiply, 4)
      12

      iex> result = Calculator.calculate(10, :divide, 2)
      iex> result
      5.0

      iex> Calculator.calculate(10, :divide, 0)
      {:error, :division_by_zero}
  """
  # => @doc: single documentation block for all clauses
  # => ## Examples: 5 doctests covering all operations
  # => Fourth example: multi-line doctest (assign then check)
  # => Fifth example: error case (division by zero)
  # => Doctests verify all function clauses work correctly
  def calculate(a, :add, b), do: a + b
  # => First clause: addition operator
  # => Pattern: second arg is :add atom
  # => Returns: sum (integer or float)
  # => Doctest: 5 + 3 = 8 ✓
  def calculate(a, :subtract, b), do: a - b
  # => Second clause: subtraction operator
  # => Pattern: second arg is :subtract atom
  # => Returns: difference
  # => Doctest: 10 - 4 = 6 ✓
  def calculate(a, :multiply, b), do: a * b
  # => Third clause: multiplication operator
  # => Pattern: second arg is :multiply atom
  # => Returns: product
  # => Doctest: 3 * 4 = 12 ✓
  def calculate(_a, :divide, 0), do: {:error, :division_by_zero}
  # => Fourth clause: division by zero (error case)
  # => Pattern: third arg is 0
  # => Matches before general divide clause (clause order matters)
  # => _a: ignore numerator (not needed)
  # => Returns: error tuple (not exception)
  # => Doctest: 10 / 0 = {:error, :division_by_zero} ✓
  def calculate(a, :divide, b), do: a / b
  # => Fifth clause: general division
  # => Pattern: third arg is not 0 (previous clause didn't match)
  # => Returns: quotient (always float in Elixir)
  # => Doctest: 10 / 2 = 5.0 (float, not 5) ✓
end
# => Calculator complete: multi-clause function with comprehensive doctests
# => All 5 clauses tested via doctests
# => Demonstrates: doctests work with pattern matching and multi-clause functions



```

**Key Takeaway**: Doctests embed executable examples in `@doc` comments using `iex>` prompts. Enable with `doctest ModuleName` in tests. They keep documentation accurate and provide basic test coverage.

**Why It Matters**: Doctests bridge documentation and testing by extracting `iex>` examples from `@doc` comments and running them as actual tests. This practice keeps documentation accurate—if the code changes and a doctest fails, Mix catches it immediately. It also incentivizes writing example-driven documentation. Libraries with comprehensive doctests serve as their own tutorials. The practice is low-overhead: you write documentation examples anyway, and making them executable adds only `doctest MyModule` to test files. Particularly valuable for utility functions where behavior is best demonstrated by example.

---

## Example 50: String Manipulation Advanced

Elixir strings are UTF-8 binaries. The `String` module provides extensive manipulation functions. Understanding binaries, charlists, and Unicode handling is essential for text processing.

Strings in Elixir are UTF-8 encoded binaries, not character lists. The `String` module provides grapheme-aware functions for proper Unicode handling. Key concepts include: binary vs charlist distinction, graphemes (visual characters) vs codepoints (Unicode units), and UTF-8 multibyte character support.

**Code**:

```elixir
# Strings are UTF-8 binaries
string = "Hello, 世界!"
# => "Hello, 世界!" (UTF-8 encoded, Unicode support)
is_binary(string)
# => true (strings are binaries, not character lists)

# String length vs byte size
String.length("Hello")
# => 5 (counts graphemes)
String.length("世界")
# => 2 (graphemes, not bytes)
byte_size("世界")
# => 6 (3 bytes per Chinese character in UTF-8)

# Charlists vs Strings
charlist = 'hello'
# => 'hello' (single quotes = list of integers)
is_list(charlist)
# => true
charlist === [104, 101, 108, 108, 111]
# => true (charlist is list of ASCII codes)

# Converting between strings and charlists
String.to_charlist("hello")
# => 'hello' (binary → charlist for Erlang interop)
List.to_string('hello')
# => "hello" (charlist → binary)

# String slicing
String.slice("Hello", 0, 3)
# => "Hel" (start index 0, length 3)
String.slice("Hello", 1..-1)
# => "ello" (range: index 1 to end)
String.slice("Hello", -3, 3)
# => "llo" (negative index from end)

# String character access
String.at("Hello", 1)
# => "e" (0-based index)
String.at("Hello", -1)
# => "o" (negative = from end)

# String searching
String.contains?("Hello World", "World")
# => true (case-sensitive)
String.contains?("Hello World", ["Hi", "Hello"])
# => true (OR logic: any substring matches)
String.starts_with?("Hello", "He")
# => true
String.ends_with?("Hello", "lo")
# => true

# Case conversion
String.upcase("hello")
# => "HELLO"
String.downcase("HELLO")
# => "hello"
String.capitalize("hello world")
# => "Hello world" (only first char)

# Whitespace trimming
String.trim("  hello  ")
# => "hello"
String.trim_leading("  hello  ")
# => "hello  " (trailing preserved)
String.trim_trailing("  hello  ")
# => "  hello" (leading preserved)

# String splitting and joining
String.split("one,two,three", ",")
# => ["one", "two", "three"]
String.split("hello world")
# => ["hello", "world"] (splits on whitespace by default)
Enum.join(["a", "b", "c"], "-")
# => "a-b-c"

# String replacement
String.replace("hello world", "world", "Elixir")
# => "hello Elixir" (replaces all occurrences)
String.replace("aaa", "a", "b")
# => "bbb" (replaces all)
String.replace("aaa", "a", "b", global: false)
# => "baa" (first only)

# String padding
String.pad_leading("42", 5, "0")
# => "00042"
String.pad_trailing("42", 5, "0")
# => "42000"

# Regular expressions
Regex.match?(~r/hello/, "hello world")
# => true
# => ~r/.../ is regex sigil syntax
Regex.match?(~r/\d+/, "abc123")
# => true (matches digits)
# => \d+ matches one or more digits

Regex.scan(~r/\d+/, "abc 123 def 456")
# => [["123"], ["456"]] (all matches)
# => Returns list of all pattern matches in string

Regex.replace(~r/\d/, "Room 123", "X")
# => "Room XXX"
# => Replaces each digit with "X"

~r/(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
|> Regex.named_captures("Date: 2024-12-23")
# => %{"year" => "2024", "month" => "12", "day" => "23"}
# => Named capture groups: (?<name>pattern) extracts to map keys

# String to number conversion
String.to_integer("42")
# => 42
String.to_integer("2A", 16)
# => 42 (hex: 2*16 + 10)
String.to_float("3.14")
# => 3.14
Integer.parse("42 units")
# => {42, " units"} (stops at non-digit)
Float.parse("3.14 pi")
# => {3.14, " pi"}

# Graphemes vs Codepoints
String.graphemes("Hello")
# => ["H", "e", "l", "l", "o"]
String.graphemes("👨‍👩‍👧‍👦")
# => ["👨‍👩‍👧‍👦"] (single visual character)

String.codepoints("Hello")
# => ["H", "e", "l", "l", "o"]
String.codepoints("👨‍👩‍👧‍👦")
# => ["👨", "‍", "👩", "‍", "👧", "‍", "👦"] (7 codepoints for family emoji)

# String interpolation
name = "Alice"
"Hello, #{name}!"
# => "Hello, Alice!" (double quotes only)

# String sigils
~s(String with "quotes")
# => "String with \"quotes\"" (lowercase sigil allows interpolation)
~S(No interpolation #{name})
# => "No interpolation \#{name}" (uppercase = literal)
~r/regex/
# => Regex sigil
~w(one two three)
# => ["one", "two", "three"] (word list)
```

**Unicode Handling**:

- **Graphemes**: User-visible characters (use for string length, iteration)
- **Codepoints**: Unicode units (use for Unicode internals, low-level operations)
- **Bytes**: UTF-8 encoding size (use for memory/network calculations)

**Charlist vs String**:

| Feature   | String (binary) | Charlist (list)  |
| --------- | --------------- | ---------------- |
| Literal   | `"hello"`       | `'hello'`        |
| Type      | Binary          | List of integers |
| Usage     | Modern Elixir   | Erlang interop   |
| Functions | String module   | List module      |

**Key Takeaway**: Strings are UTF-8 binaries with grapheme-aware functions. Use the `String` module for manipulation, regex for pattern matching, and understand the difference between graphemes (visual characters) and codepoints (Unicode units).

**Why It Matters**: Elixir's String module treats text as grapheme clusters (visual characters), not codepoints or bytes. `String.length/1` returns the number of graphemes—cafe with accent is 4 graphemes, not 5 bytes. This matters for UI text truncation, search indexing, and internationalization. The `String.valid?/1` function validates UTF-8 before processing user input. For performance-sensitive string processing, understanding when to work at the binary level vs the String module level prevents subtle Unicode bugs that only manifest with non-ASCII input from real users.

## Example 51: GenServer Session Manager (Production Pattern)

GenServer is OTP's generic server behavior - a process that maintains state and handles synchronous/asynchronous requests. Production systems use GenServer for session storage, caches, connection pools, and stateful services. This example demonstrates a thread-safe session manager with TTL cleanup.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Client1["Client 1"] --> Put["put(key, value)"]
    Client2["Client 2"] --> Get["get(key)"]
    Client3["Client 3"] --> Delete["delete(key)"]

    Put --> GenServer["GenServer Process<br/>State: %{sessions: map, ttl: 300}"]
    Get --> GenServer
    Delete --> GenServer

    GenServer --> Handle["handle_call/cast<br/>Thread-safe operations"]
    Handle --> State["Updated State"]

    Timer["Periodic Cleanup<br/>:cleanup_expired"] --> GenServer

    style Client1 fill:#0173B2,color:#fff
    style Client2 fill:#0173B2,color:#fff
    style Client3 fill:#0173B2,color:#fff
    style Put fill:#DE8F05,color:#fff
    style Get fill:#DE8F05,color:#fff
    style Delete fill:#DE8F05,color:#fff
    style GenServer fill:#029E73,color:#fff
    style Handle fill:#CC78BC,color:#fff
    style State fill:#CA9161,color:#fff
    style Timer fill:#CC78BC,color:#fff
```

**Code**:

```elixir
defmodule SessionManager do
  # => GenServer-based session manager module
  # => Demonstrates production pattern for stateful services
  @moduledoc """
  GenServer-based session manager with TTL-based cleanup.
  Provides thread-safe concurrent access to session data.
  """
  # => @moduledoc: documentation for module
  # => Explains purpose: session storage with TTL

  use GenServer  # => Use GenServer behavior (implements init, handle_call, handle_cast, etc.)
  # => use GenServer: imports GenServer behavior macros
  # => Requires implementation of: init/1, handle_call/3, handle_cast/2, handle_info/2
  # => Provides: start_link/1, call/2, cast/2, etc.

  # Client API - public interface
  # => Client API: functions callers use (abstracts GenServer protocol)
  # => Best practice: separate client API from server callbacks

  @doc "Starts the session manager with optional TTL (default: 300 seconds)"
  def start_link(opts \\ []) do
    # => start_link/1: starts GenServer process
    # => opts: keyword list of options
    # => Default: [] (empty)
    ttl = Keyword.get(opts, :ttl, 300)  # => Default 5 minutes
    # => Keyword.get/3: extract :ttl from opts, default 300
    # => ttl: time-to-live in seconds
    GenServer.start_link(__MODULE__, ttl, name: __MODULE__)
    # => GenServer.start_link/3: spawns GenServer process
    # => First arg: module name (__MODULE__ = SessionManager)
    # => Second arg: init arg (ttl passed to init/1)
    # => Third arg: options (name: registers process globally)
    # => name: __MODULE__: allows calling SessionManager.put/2 without PID
    # => Returns: {:ok, pid}
    # => __MODULE__ = SessionManager, name registers process globally
  end

  @doc "Stores a session with given key and value"
  def put(key, value) do
    # => put/2: client function to store session
    # => key: session identifier (string or atom)
    # => value: session data (any Elixir term)
    GenServer.call(__MODULE__, {:put, key, value})  # => Synchronous call
    # => GenServer.call/2: sends synchronous request
    # => __MODULE__: named process (SessionManager)
    # => Message: {:put, key, value}
    # => Blocks until handle_call returns reply
    # => Returns: :ok (from handle_call reply)
    # => Blocks until server responds
    # => Thread-safe: only one caller modifies state at a time
  end

  @doc "Retrieves session by key, returns {:ok, value} or {:error, :not_found}"
  def get(key) do
    # => get/1: client function to retrieve session
    # => key: session identifier
    GenServer.call(__MODULE__, {:get, key})  # => Synchronous call
    # => Message: {:get, key}
    # => Blocks until handle_call returns
    # => Returns: {:ok, value} or {:error, :not_found} or {:error, :expired}
  end

  @doc "Deletes session by key"
  def delete(key) do
    # => delete/1: client function to remove session
    # => key: session identifier
    GenServer.cast(__MODULE__, {:delete, key})  # => Asynchronous cast
    # => GenServer.cast/2: sends asynchronous request (fire-and-forget)
    # => Message: {:delete, key}
    # => Returns immediately :ok (doesn't wait for processing)
    # => handle_cast processes message asynchronously
    # => Returns immediately without waiting for completion
    # => Use cast when reply not needed (performance optimization)
  end

  @doc "Returns all active sessions (for debugging)"
  def list_all do
    # => list_all/0: retrieves all active sessions
    # => Debugging function (not for production use at scale)
    GenServer.call(__MODULE__, :list_all)  # => Synchronous call
    # => Message: :list_all (atom, not tuple)
    # => Returns: map of %{key => value} (without timestamps)
  end

  @doc "Returns session count"
  def count do
    # => count/0: returns number of active sessions
    GenServer.call(__MODULE__, :count)  # => Synchronous call
    # => Message: :count
    # => Returns: integer count
  end

  # Server Callbacks - GenServer implementation
  # => Server callbacks: handle requests and manage state
  # => Private to module (not called directly by clients)

  @impl true
  # => @impl true: marks function as behavior callback implementation
  # => Compiler verifies function matches GenServer behavior contract
  def init(ttl) do
    # => init/1: GenServer callback for initialization
    # => Called when GenServer.start_link/3 executes
    # => Arg: ttl (from start_link second argument)
    # Called when GenServer starts
    # Initialize state with empty sessions map and TTL
    state = %{
      # => State: map with sessions and ttl
      # => Immutable: each callback returns new state
      sessions: %{},  # => key -> {value, inserted_at}
      # => sessions: map of session_key => {session_value, timestamp}
      # => Empty on initialization
      ttl: ttl        # => Time-to-live in seconds
      # => ttl: expiration duration (e.g., 300 seconds)
    }
    # => state is %{sessions: %{}, ttl: 300}

    # Schedule periodic cleanup every 60 seconds
    schedule_cleanup()  # => Sends message to self after delay
    # => schedule_cleanup/0: schedules first :cleanup_expired message
    # => Process.send_after/3 sends message in 60 seconds
    # => Recursive pattern: cleanup schedules next cleanup

    {:ok, state}  # => Return {:ok, initial_state}
    # => init/1 contract: returns {:ok, state}
    # => GenServer.start_link/3 returns {:ok, pid}
    # => Process now running with state
  end

  @impl true
  def handle_call({:put, key, value}, _from, state) do
    # => handle_call/3: callback for synchronous requests
    # => First arg: request message {:put, key, value}
    # => Second arg: _from = {caller_pid, unique_ref} (unused here)
    # => Third arg: current state
    # => Synchronous request handler
    # _from = {pid, ref} of caller (unused here)

    # Store session with current timestamp
    session_data = {value, System.system_time(:second)}
    # => session_data: tuple {session_value, unix_timestamp}
    # => System.system_time(:second): current time in seconds
    # => Example: {"Alice", 1734567890}
    updated_sessions = Map.put(state.sessions, key, session_data)
    # => Map.put/3: add/update key-value in map
    # => state.sessions: old sessions map
    # => key: session key (e.g., "user_123")
    # => session_data: {value, timestamp}
    # => Returns: new sessions map with added entry

    new_state = %{state | sessions: updated_sessions}  # => Update state
    # => Map update syntax: %{old_map | key: new_value}
    # => Replaces sessions field, keeps ttl unchanged
    # => new_state is %{sessions: updated_sessions, ttl: state.ttl}

    {:reply, :ok, new_state}  # => Reply to caller with :ok, update state
    # => handle_call contract: {:reply, reply_value, new_state}
    # => reply_value: :ok (sent to caller)
    # => new_state: becomes current state
    # => GenServer.call returns :ok to caller
  end

  @impl true
  def handle_call({:get, key}, _from, state) do
    # => handle_call/3: callback for get request
    # => Message: {:get, key}
    # Synchronous request handler for get

    case Map.get(state.sessions, key) do
      # => Map.get/2: retrieves value by key (returns nil if not found)
      # => state.sessions: current sessions map
      # => Pattern matching on result
      nil ->
        # => Pattern 1: key not found in map
        {:reply, {:error, :not_found}, state}  # => Session doesn't exist
        # => Reply: {:error, :not_found}
        # => State unchanged (read operation)
        # => Caller gets {:error, :not_found}

      {value, inserted_at} ->
        # => Pattern 2: found {value, timestamp} tuple
        # => value: session data
        # => inserted_at: timestamp when stored
        # Check if session expired
        current_time = System.system_time(:second)
        # => Current time in seconds
        age = current_time - inserted_at
        # => age: seconds since session created
        # => Example: 1734567900 - 1734567890 = 10 seconds old

        if age > state.ttl do
          # => Check if session older than TTL
          # => Example: 10 > 300 (false), 400 > 300 (true)
          # Session expired - remove it
          updated_sessions = Map.delete(state.sessions, key)
          # => Map.delete/2: removes key from map
          # => Cleanup expired session on read
          new_state = %{state | sessions: updated_sessions}
          # => Update state without expired session
          {:reply, {:error, :expired}, new_state}
          # => Reply: {:error, :expired}
          # => State updated (session removed)
          # => Lazy cleanup: remove on read instead of waiting for periodic cleanup
        else
          # Session valid - return value
          {:reply, {:ok, value}, state}  # => State unchanged
          # => Reply: {:ok, session_value}
          # => State unchanged (session still valid)
          # => Caller gets {:ok, value}
        end
    end
  end

  @impl true
  def handle_call(:list_all, _from, state) do
    # => handle_call/3: callback for list_all request
    # => Message: :list_all (atom)
    # Return all sessions (for debugging)
    sessions = state.sessions
               |> Enum.map(fn {key, {value, _ts}} -> {key, value} end)
               # => Transform each {key, {value, timestamp}} to {key, value}
               # => Removes timestamps from output
               # => Example: {"user_123", {"Alice", 1734567890}} → {"user_123", "Alice"}
               |> Enum.into(%{})
               # => Convert list of tuples back to map
               # => Returns: %{key1 => value1, key2 => value2}

    {:reply, sessions, state}  # => Return map without timestamps
    # => Reply: map of sessions (no timestamps)
    # => State unchanged
  end

  @impl true
  def handle_call(:count, _from, state) do
    # => handle_call/3: callback for count request
    # Return session count
    count = map_size(state.sessions)
    # => map_size/1: returns number of keys in map
    # => Example: %{"user_123" => ..., "user_456" => ...} → 2
    {:reply, count, state}
    # => Reply: integer count
    # => State unchanged
  end

  @impl true
  def handle_cast({:delete, key}, state) do
    # => handle_cast/2: callback for asynchronous requests
    # => First arg: request message {:delete, key}
    # => Second arg: current state
    # => No _from (async, no reply)
    # Asynchronous request handler (no reply sent)
    updated_sessions = Map.delete(state.sessions, key)
    # => Remove key from sessions map
    new_state = %{state | sessions: updated_sessions}
    # => Update state with session removed

    {:noreply, new_state}  # => No reply for cast, just update state
    # => handle_cast contract: {:noreply, new_state}
    # => No reply sent to caller
    # => State updated
    # => Caller already received :ok from GenServer.cast
  end

  @impl true
  def handle_info(:cleanup_expired, state) do
    # => handle_info/2: callback for arbitrary messages (not call/cast)
    # => First arg: message (:cleanup_expired atom)
    # => Second arg: current state
    # => Handles messages from Process.send_after, timers, monitors, etc.
    # Handle messages sent to process (not call/cast)
    # Cleanup expired sessions

    current_time = System.system_time(:second)
    # => Current time for age calculation

    # Filter out expired sessions
    active_sessions = state.sessions
                      |> Enum.filter(fn {_key, {_value, inserted_at}} ->
                        # => Filter predicate: returns true to keep, false to remove
                        # => Pattern: {key, {value, timestamp}}
                        # => _key, _value: ignored (not needed for age check)
                        age = current_time - inserted_at
                        # => Calculate session age
                        age <= state.ttl  # => Keep only non-expired
                        # => true if age <= ttl (keep), false if age > ttl (remove)
                        # => Example: 295 <= 300 (true, keep), 305 <= 300 (false, remove)
                      end)
                      |> Enum.into(%{})
                      # => Convert filtered list back to map
                      # => active_sessions: map of non-expired sessions

    removed_count = map_size(state.sessions) - map_size(active_sessions)
    # => Calculate how many sessions expired
    # => Before size - after size = removed count
    if removed_count > 0 do
      # => Only log if sessions were removed
      IO.puts("Cleaned up #{removed_count} expired sessions")
      # => Log cleanup activity
      # => Production: use Logger.info instead
    end

    new_state = %{state | sessions: active_sessions}
    # => Update state with only active sessions

    # Schedule next cleanup
    schedule_cleanup()
    # => Recursive scheduling: cleanup schedules next cleanup
    # => Ensures periodic cleanup continues
    # => Pattern: self-scheduling timer

    {:noreply, new_state}  # => Update state, no reply
    # => handle_info contract: {:noreply, new_state}
    # => No caller to reply to (message from timer)
    # => State updated with cleaned sessions
  end

  # Private helpers
  # => Private functions: not part of public API

  defp schedule_cleanup do
    # => schedule_cleanup/0: schedules next cleanup message
    # => defp: private function
    # Send :cleanup_expired message to self after 60 seconds
    Process.send_after(self(), :cleanup_expired, 60_000)  # => 60 seconds
    # => Process.send_after/3: sends message after delay
    # => self(): current GenServer process PID
    # => Message: :cleanup_expired atom
    # => Delay: 60_000ms = 60 seconds
    # => Returns: timer reference (unused here)
    # => Message handled by handle_info(:cleanup_expired, state)
  end
end
# => SessionManager module complete

# Usage examples
{:ok, _pid} = SessionManager.start_link(ttl: 10)  # => 10 second TTL for demo
# => Start GenServer with 10 second TTL (for quick demo)
# => Returns: {:ok, pid}
# => _pid: ignore PID (process registered by name)
# => GenServer now running with state %{sessions: %{}, ttl: 10}

SessionManager.put("user_123", %{name: "Alice", role: :admin})
# => Store session for user_123
# => Value: map with name and role
# => Synchronous call, waits for :ok reply
# => State now: %{sessions: %{"user_123" => {%{name: "Alice", role: :admin}, timestamp}}, ttl: 10}
SessionManager.put("user_456", %{name: "Bob", role: :user})
# => Store session for user_456
# => State: 2 sessions stored
SessionManager.put("user_789", %{name: "Charlie", role: :guest})
# => Store session for user_789
# => State: 3 sessions stored

SessionManager.get("user_123")  # => {:ok, %{name: "Alice", role: :admin}}
# => Retrieve existing session
# => Synchronous call
# => Returns: {:ok, session_value}
# => Session still valid (recently created)
SessionManager.get("user_999")  # => {:error, :not_found}
# => Try to retrieve non-existent session
# => Returns: {:error, :not_found}
# => Key doesn't exist in sessions map

SessionManager.delete("user_456")
# => Delete user_456 session
# => Asynchronous cast (fire-and-forget)
# => Returns immediately: :ok
# => Session removed from state
SessionManager.get("user_456")  # => {:error, :not_found}
# => Try to retrieve deleted session
# => Returns: {:error, :not_found}
# => Session no longer exists

SessionManager.list_all()  # => %{"user_123" => %{...}, "user_789" => %{...}}
# => Retrieve all active sessions
# => Returns: map of {key => value} (no timestamps)
# => user_456 not present (was deleted)
# => user_123 and user_789 present
SessionManager.count()  # => 2
# => Count active sessions
# => Returns: 2 (user_123 and user_789)

:timer.sleep(11_000)  # => 11 seconds
# => Sleep for 11 seconds
# => Simulates time passing
# => Sessions now 11 seconds old (older than 10 second TTL)
SessionManager.get("user_123")  # => {:error, :expired}
# => Try to retrieve expired session
# => age = 11 seconds, ttl = 10 seconds
# => 11 > 10: session expired
# => handle_call removes expired session and returns {:error, :expired}
# => Demonstrates TTL expiration


```

**Key Takeaway**: GenServer provides thread-safe stateful processes via callbacks. Use `GenServer.call/2` for synchronous requests that need replies, `GenServer.cast/2` for asynchronous fire-and-forget operations. State is immutable - callbacks return new state. `handle_info/2` handles arbitrary messages like timers. GenServer processes run concurrently and isolate state, enabling millions of concurrent sessions.

**Why It Matters**: GenServer is the foundation of OTP applications. It handles concurrency, state management, and fault tolerance automatically. Production Elixir systems use GenServer for caches, connection pools, rate limiters, session stores, and background workers. Understanding the GenServer pattern (client API calling server callbacks that update state) is essential for building scalable, concurrent systems. Add GenServers to supervision trees for automatic restart on crashes.

---

## Example 52: Supervisor Child Specifications

Supervisors define child processes using child specifications that control restart behavior, shutdown timeouts, and process types. Understanding child specs enables fine-grained control over supervision trees.

### Child Specification Structure

| Field       | Type        | Purpose                             | Common Values                            |
| ----------- | ----------- | ----------------------------------- | ---------------------------------------- |
| `:id`       | `term()`    | Unique identifier within supervisor | Module name, atom, tuple                 |
| `:start`    | `{m, f, a}` | MFA tuple to start child            | `{MyWorker, :start_link, [opts]}`        |
| `:restart`  | `atom()`    | When to restart child               | `:permanent`, `:transient`, `:temporary` |
| `:shutdown` | `timeout()` | Graceful shutdown duration          | `5000` (ms), `:infinity`, `:brutal_kill` |
| `:type`     | `atom()`    | Process type                        | `:worker`, `:supervisor`                 |

### Restart Strategies

**`:permanent`** - Always restart (critical services)

- Use for: database connections, core services, state machines
- Behavior: Any exit (normal or crash) triggers restart

**`:transient`** - Restart only on abnormal exit

- Use for: tasks that complete successfully, retryable operations
- Behavior: Normal exit (`:normal`, `:shutdown`) → no restart; crash → restart

**`:temporary`** - Never restart (one-time tasks)

- Use for: fire-and-forget operations, disposable workers
- Behavior: Any exit → remove from supervision tree

**Code**:

```elixir
# Basic child specification map
child_spec = %{
  # => Child spec: defines how supervisor manages process lifecycle
  id: MyWorker,
  # => Unique identifier within supervisor
  start: {MyWorker, :start_link, [[name: :worker_1]]},
  # => MFA tuple: supervisor calls MyWorker.start_link([name: :worker_1])
  # => Must return {:ok, pid} or {:ok, pid, info}
  restart: :permanent,
  # => :permanent - always restart on exit (critical processes)
  # => :transient - restart only on abnormal exit
  # => :temporary - never restart (one-time tasks)
  shutdown: 5000,
  # => Graceful shutdown timeout: 5000ms
  # => After timeout, supervisor sends :kill signal
  # => :brutal_kill - immediate kill, :infinity - wait forever
  type: :worker
  # => :worker - leaf process, :supervisor - nested supervisor
}
# => Returns: child spec map for Supervisor.start_link/2

# Worker module implementing child_spec/1
defmodule MyWorker do
  # => Worker with custom child_spec/1 for flexible configuration
  use GenServer
  # => Imports default child_spec/1 implementation

  def start_link(opts) do
    # => Starts GenServer linked to caller
    name = Keyword.get(opts, :name, __MODULE__)
    # => Extract :name from opts, default to module name
    GenServer.start_link(__MODULE__, opts, name: name)
    # => Start GenServer and register with name
    # => Returns: {:ok, pid}
  end

  # Override default child spec
  def child_spec(opts) do
    # => Custom child specification callback
    # => Called by supervisor when starting child
    %{
      id: Keyword.get(opts, :name, __MODULE__),
      # => Dynamic id from opts enables multiple instances
      # => Each instance needs unique id in supervisor
      start: {__MODULE__, :start_link, [opts]},
      # => Pass opts through to start_link
      restart: :permanent,
      # => Always restart on exit (critical worker)
      shutdown: 10_000
      # => 10s timeout for cleanup (flush queues, close connections)
    }
    # => Returns: custom child spec map
  end

  @impl true
  def init(opts), do: {:ok, opts}
  # => Store opts as GenServer state
end
# => MyWorker complete

# Critical worker example (permanent restart)
defmodule Database do
  # => Database worker: critical service with permanent restart
  use GenServer

  def child_spec(_opts) do
    # => Custom child spec for database process
    %{
      id: __MODULE__,
      # => Single instance (module name as id)
      start: {__MODULE__, :start_link, []},
      # => No configuration needed
      restart: :permanent,
      # => Critical: database must always run
      # => Any exit triggers immediate restart
      shutdown: 30_000
      # => Long timeout: flush writes, close connections, release locks
      # => After 30s, supervisor sends :kill (may lose data)
    }
    # => Returns: child spec with critical worker settings
  end

  def start_link, do: GenServer.start_link(__MODULE__, [], name: __MODULE__)
  # => Start and register as Database

  @impl true
  def init(_), do: {:ok, %{}}
  # => Initialize empty state (real DB would connect here)
end
# => Database complete

# Optional service example (transient restart)
defmodule Cache do
  # => Cache worker: transient restart (crash → restart, normal exit → remove)
  use GenServer

  def child_spec(_opts) do
    # => Custom child spec for cache process
    %{
      id: __MODULE__,
      # => Single instance
      start: {__MODULE__, :start_link, []},
      # => Self-contained cache (no configuration)
      restart: :transient,
      # => Restart on crash only
      # => Normal exit (cache clears): no restart
      # => Abnormal exit (bug, OOM): restart
      shutdown: 5_000
      # => Standard timeout (in-memory data flushes quickly)
    }
    # => Returns: child spec with transient restart
  end

  def start_link, do: GenServer.start_link(__MODULE__, [], name: __MODULE__)
  # => Start and register as Cache

  @impl true
  def init(_), do: {:ok, %{}}
  # => Initialize empty cache
end
# => Cache complete

# Supervisor with multiple children
defmodule MyApp.Supervisor do
  # => Application supervisor managing multiple children
  use Supervisor

  def start_link(opts) do
    # => Start supervisor process
    Supervisor.start_link(__MODULE__, opts, name: __MODULE__)
    # => Calls init/1 callback with opts
    # => Returns: {:ok, pid}
  end

  @impl true
  def init(_opts) do
    # => Supervisor callback: define children and strategy
    children = [
      # => Children started in order (top to bottom)
      Database,
      # => Module form: calls Database.child_spec([])
      # => Shorthand for {Database, []}
      Cache,
      # => Cache started after Database (dependency order)
      {MyWorker, name: :worker_1},
      # => Tuple form: {module, opts}
      # => Calls MyWorker.child_spec([name: :worker_1])
      # => id: :worker_1 from opts
      {MyWorker, name: :worker_2}
      # => Second instance with different id (no conflict)
    ]
    # => 4 children: Database, Cache, worker_1, worker_2

    Supervisor.init(children, strategy: :one_for_one)
    # => :one_for_one: restart only failed child (not siblings)
    # => Other strategies: :one_for_all, :rest_for_one
    # => Returns: {:ok, {supervisor_flags, children}}
  end
end
# => MyApp.Supervisor complete

# Starting the supervisor
{:ok, sup_pid} = MyApp.Supervisor.start_link([])
# => Supervisor starts all 4 children in order
# => Database → Cache → worker_1 → worker_2
# => Returns: {:ok, pid} where pid is supervisor process

Supervisor.which_children(sup_pid)
# => Lists all children: [{id, pid, type, modules}, ...]
# => Example: [{Database, #PID<0.200.0>, :worker, [Database]}, ...]

Supervisor.count_children(sup_pid)
# => Returns: %{active: 4, specs: 4, supervisors: 0, workers: 4}
# => active: running children, specs: total child specs
```

**Key Takeaway**: Child specs control how supervisors manage children. Use `:permanent` for critical processes, `:transient` for expected failures, `:temporary` for one-time tasks. Implement `child_spec/1` to customize restart and shutdown behavior.

**Why It Matters**: Supervisor child specifications are the blueprint for building fault-tolerant systems. The child_spec map defines what to start, how to restart, how to stop, and the process type—all the information a Supervisor needs to manage a process's lifecycle. The `:permanent` restart strategy (always restart) is appropriate for services that must always run; `:temporary` (never restart) for one-off tasks; `:transient` (restart only on abnormal exit) for optional services. Getting restart strategies right prevents thundering herd problems and ensures proper cleanup before restart.

---

## Example 53: Application Callbacks and Lifecycle

Application behavior defines callbacks for application startup and shutdown. Implement `start/2` to initialize supervision trees and `stop/1` for cleanup.

The Application behavior manages application lifecycle through callbacks. `start/2` initializes the application (typically starts a supervision tree), receives startup type and arguments. `stop/1` handles graceful shutdown (cleanup resources). Applications are OTP's top-level abstraction for managing related processes and resources.

**Code**:

```elixir
defmodule MyApp.Application do
  # => Application module (conventionally: AppName.Application)
  use Application
  # => Implements Application behavior (requires start/2)

  @impl true
  def start(_type, _args) do
    # => start/2: called when application starts
    # => _type: startup type (:normal, :takeover, :failover)
    # => _args: application arguments from config
    # => Returns: {:ok, pid} or {:error, reason}

    children = [
      # => Child specifications for supervision tree
      {MyApp.Repo, []},
      # => Database connection pool
      {MyApp.Endpoint, []},
      # => Phoenix web server endpoint
      {MyApp.Worker, []}
      # => Custom worker process
    ]
    # => List of child specs

    opts = [strategy: :one_for_one, name: MyApp.Supervisor]
    # => Supervisor options
    # => strategy: :one_for_one (restart only failed child)
    # => name: registered name for supervisor

    Supervisor.start_link(children, opts)
    # => Starts supervision tree
    # => Returns: {:ok, supervisor_pid}
  end

  @impl true
  def stop(_state) do
    # => stop/1: called before application stops
    # => _state: state returned from start/2 (usually ignored)
    # => Cleanup resources (close connections, flush buffers)
    :ok
    # => Must return :ok
  end
end

# config/config.exs
# use MyApp.Application, otp_app: :my_app
# => Registers MyApp.Application as application module
# => OTP starts this module during boot
```

**Application Lifecycle**:

| Phase    | Callback  | Purpose                 | Return       |
| -------- | --------- | ----------------------- | ------------ |
| Startup  | `start/2` | Initialize processes    | `{:ok, pid}` |
| Running  | -         | Supervision tree active | -            |
| Shutdown | `stop/1`  | Cleanup resources       | `:ok`        |

**Startup Types**:

- **`:normal`** - Standard application start
- **`:takeover`** - Taking over from another node (distributed)
- **`:failover`** - Failover from failed node (distributed)

**Best Practices**:

- **Keep start/2 fast**: Heavy initialization in child processes
- **Return supervision tree PID**: Application monitors top supervisor
- **Cleanup in stop/1**: Close connections, flush logs, release resources
- **Use child specs**: Leverage Supervisor for process management

**Key Takeaway**: Applications implement `start/2` to initialize supervision trees and `stop/1` for cleanup. The Application behavior is OTP's top-level abstraction for managing related processes. Return `{:ok, supervisor_pid}` from `start/2`, `:ok` from `stop/1`.

**Why It Matters**: The Application behaviour is the top-level entry point for every OTP application—Mix compiles it, the BEAM starts it, and the supervision tree lives under it. Every Phoenix application, every Ecto-backed service, and every standalone Elixir release implements Application. The `start/2` callback is where supervision trees are created, registry processes are launched, and startup validation occurs. The `stop/1` callback enables graceful shutdown. Understanding the Application lifecycle is essential for production deployment: controlling startup order, handling configuration validation at boot, and ensuring clean process termination.

## Example 54: Custom Mix Tasks

Mix tasks automate project operations. Create custom tasks by implementing `Mix.Task` behavior with `run/1` function.

Custom Mix tasks extend Mix's functionality for project-specific automation. Tasks implement the `Mix.Task` behavior with a `run/1` entry point that receives command-line arguments. Use `OptionParser.parse/2` for argument parsing, `Mix.shell().info/1` for output, and module attributes (`@shortdoc`, `@moduledoc`) for documentation.

**Code**:

```elixir
defmodule Mix.Tasks.Hello do
  # => Custom Mix task: mix hello
  # => Module name: Mix.Tasks.TaskName (CamelCase)
  use Mix.Task
  # => Implements Mix.Task behavior (requires run/1)
  # => Imports task infrastructure

  @shortdoc "Prints hello message"
  # => Short description (shown in mix help)
  # => Displayed in task list

  @moduledoc """
  Greets the user with a hello message.

  ## Usage
      mix hello
      mix hello --name Alice
  """
  # => Full documentation (shown in mix help hello)
  # => Markdown format supported

  @impl Mix.Task
  def run(args) do
    # => run/1: task entry point
    # => args: list of command-line arguments (strings)
    {opts, _, _} = OptionParser.parse(args, switches: [name: :string])
    # => Parses args: --name Alice → [name: "Alice"]
    # => opts: keyword list of parsed options
    # => switches: expected option types

    name = opts[:name] || "World"
    # => Gets name option with default fallback
    # => opts[:name]: nil if not provided

    Mix.shell().info("Hello, #{name}!")
    # => Output to console via Mix shell
    # => Output: "Hello, World!" or "Hello, Alice!"
    # => Mix.shell(): current shell IO interface
  end
end

# Usage: mix hello --name Alice
# => Runs custom task from command line
# => Output: "Hello, Alice!"
```

**Mix Task Anatomy**:

| Component        | Purpose                          | Required      |
| ---------------- | -------------------------------- | ------------- |
| `use Mix.Task`   | Imports behavior                 | Yes           |
| `@shortdoc`      | Brief description (mix help)     | Recommended   |
| `@moduledoc`     | Full documentation               | Recommended   |
| `run/1`          | Entry point (receives args)      | Yes           |
| `@impl Mix.Task` | Explicit behavior implementation | Best practice |

**Argument Parsing**:

```elixir
# OptionParser.parse(args, switches: [...])
{opts, positional, invalid} = OptionParser.parse(  # => Parses command-line arguments
  args,                                              # => Input args from Mix.Task.run/1
  switches: [                                        # => Define expected switches/options
    name: :string,    # --name Alice                # => String option with value
    count: :integer,  # --count 5                   # => Integer option (auto-parsed)
    verbose: :boolean # --verbose                   # => Boolean flag (presence = true)
  ]
)
# => Returns 3-element tuple: {parsed_opts, positional_args, invalid_opts}
# => opts: [name: "Alice", count: 5, verbose: true]
# => positional: unnamed arguments list (e.g., ["file1.txt", "file2.txt"])
# => invalid: unrecognized options (e.g., [{"-x", nil}] for --unknown-flag)
```

**Key Takeaway**: Custom Mix tasks automate project operations. Implement `Mix.Task` behavior with `run/1`, parse arguments with `OptionParser`, and document with `@shortdoc`/`@moduledoc`. Run tasks with `mix task_name [args]`.

**Why It Matters**: Custom Mix tasks extend your project's automation infrastructure—release builds, database migrations, data imports, seed scripts, and CI/CD steps all become first-class Mix commands. Unlike shell scripts, Mix tasks run in the application's context with access to all modules and configuration. The `Mix.Task` behaviour enforces the `run/1` contract; `@shortdoc` and `@moduledoc` integrate with `mix help`. Production workflows: `mix phx.gen.context`, `mix ecto.migrate`, `mix release`—all are Mix tasks. Custom tasks keep automation close to the code it automates.

## Example 55: Runtime Configuration

Runtime configuration loads settings when the application starts (not compile time). Use `config/runtime.exs` for environment variables and production secrets.

Runtime configuration (`config/runtime.exs`) loads settings at application startup, enabling environment-specific configuration and secrets management. Unlike `config/config.exs` (compile-time), runtime config values aren't baked into releases, making it safe for secrets. Use `Application.get_env/2` to read config, `Application.fetch_env!/2` for required values.

**Code**:

```elixir
# config/runtime.exs - runs at application startup
# => Executed when application starts (not at compile time)
import Config
# => Required for config/2 macro
# => Imports Config.config/2 for configuration DSL

config :my_app,
  # => Configures application :my_app
  # => First arg: application atom, second arg: keyword list
  secret_key: System.get_env("SECRET_KEY") || raise("SECRET_KEY not set"),
  # => Reads SECRET_KEY env var, raises if missing (required config)
  # => System.get_env/1 returns string or nil
  # => || raise/1: fail-fast pattern for required secrets
  database_url: System.get_env("DATABASE_URL") || raise("DATABASE_URL not set"),
  # => Database connection string, required in production
  # => Raises if DATABASE_URL env var not set
  port: String.to_integer(System.get_env("PORT") || "4000")
  # => HTTP port, defaults to 4000, converts string → integer
  # => Environment variables are strings: "4000" → 4000
  # => String.to_integer/1 converts to integer type

if config_env() == :prod do
  # => Production-only config
  # => config_env/0 returns current Mix environment (:dev, :test, :prod)
  # => Guards production-specific settings
  config :my_app, MyApp.Repo,
    # => Ecto repo configuration
    # => Second arg is module name (MyApp.Repo)
    url: System.get_env("DATABASE_URL"),
    # => Database URL
    # => Overrides or extends :my_app config for MyApp.Repo
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")
    # => Connection pool size, defaults to 10
    # => String env var converted to integer
end
# => Config only applied if config_env() == :prod

# Application reads runtime config
defmodule MyApp.Application do
  use Application

  def start(_type, _args) do
    # => Application startup callback
    port = Application.get_env(:my_app, :port)
    # => Reads port from runtime config
    secret = Application.get_env(:my_app, :secret_key)
    # => Reads secret_key from runtime config

    IO.puts("Starting on port #{port}")
    # => Output: "Starting on port 4000"

    children = [
      {MyApp.Server, port: port, secret: secret}
      # => Passes runtime config to child process
    ]

    Supervisor.start_link(children, strategy: :one_for_one)
    # => Starts supervision tree
  end
end

# Config accessor module (best practice)
defmodule MyApp.Config do
  # => Centralizes config access with defaults

  def port, do: Application.get_env(:my_app, :port, 4000)
  # => Returns port with default 4000

  def secret_key, do: Application.fetch_env!(:my_app, :secret_key)
  # => Returns secret_key, raises if missing (required config)

  def database_url, do: Application.fetch_env!(:my_app, :database_url)
  # => Returns database_url, raises if missing

  def timeout, do: Application.get_env(:my_app, :timeout, 5000)
  # => Returns timeout with default 5000ms
end
```

**Compile-Time vs Runtime Config**:

| Feature   | config/config.exs (Compile-Time) | config/runtime.exs (Runtime) |
| --------- | -------------------------------- | ---------------------------- |
| Execution | Mix compile                      | Application startup          |
| Values    | Baked into release               | Loaded from environment      |
| Use Case  | Defaults, non-secrets            | Secrets, env variables       |
| Security  | Not recommended for secrets      | Recommended for secrets      |

**Best Practices**:

- **Required config**: Use `|| raise()` or `fetch_env!/2` (fail fast)
- **Optional config**: Use `get_env/3` with defaults
- **Type conversion**: Environment variables are always strings
- **Config accessor**: Create module for centralized access (e.g., `MyApp.Config`)

**Key Takeaway**: Use `config/runtime.exs` for secrets and environment-specific configuration. Runtime config loads at startup (not compile time), making it safe for production secrets. Use `Application.get_env/2` for optional config, `Application.fetch_env!/2` for required config.

**Why It Matters**: Runtime configuration (`config/runtime.exs`) is essential for production deployments where secrets, database URLs, and service endpoints come from environment variables—not hardcoded values. Unlike compile-time configuration, runtime config loads at application startup, enabling the same release binary to be deployed in multiple environments. `System.fetch_env!/1` fails fast if required environment variables are absent, preventing misconfigured deployments from running. This is the right place for database credentials, API keys, and feature flags. Understanding the compile-time vs runtime config distinction prevents secrets from being baked into release artifacts.

## Example 56: Process Links and Crash Propagation

Linked processes crash together—when one exits abnormally, linked processes receive exit signals. Use linking for tightly-coupled processes that should fail together.

Links create bidirectional connections between processes for crash propagation. When a linked process crashes, all connected processes receive exit signals and crash too (unless trapping exits). This pattern enables supervisor-like behavior where parent processes detect and handle child crashes. The `:trap_exit` flag converts exit signals into messages, preventing crash propagation.

**Code**:

```elixir
parent = self()
# => Current process PID
# => Type: pid()

child = spawn_link(fn ->
  # => spawn_link/1: spawns process AND links it to caller
  # => Creates bidirectional link (crash propagation enabled)
  :timer.sleep(1000)
  # => Sleep 1 second before crashing
  raise "Child crashed!"
  # => Child exits abnormally → parent crashes too
  # => Exit signal propagates via link
end)
# => Returns child PID, linked bidirectionally
# => child: pid()

Process.alive?(child)
# => true (child still sleeping)
:timer.sleep(1500)
# => Wait for child to crash (after 1 second)
Process.alive?(child)
# => false (child crashed after 1 second)
# Parent process also crashed due to link!

# Manual linking with Process.link/1
pid1 = spawn(fn -> :timer.sleep(10_000) end)
# => Spawn process (NOT linked yet)
# => Independent process, sleeps 10 seconds
pid2 = spawn(fn -> :timer.sleep(10_000) end)
# => Second independent process
# => Also sleeps 10 seconds

Process.link(pid1)
# => Links current process to pid1 bidirectionally
# => Current crashes → pid1 crashes; pid1 crashes → current crashes
Process.link(pid2)
# => Links current process to pid2
# => Triangle: current ↔ pid1, current ↔ pid2 (no direct pid1 ↔ pid2)

Process.exit(pid1, :kill)
# => Kills pid1 with :kill reason
# => Exit signal propagates to current process
# => Current process crashes (unless trapping exits)

# Trap exits to handle crashes gracefully
Process.flag(:trap_exit, true)
# => Converts exit signals to {:EXIT, pid, reason} messages
# => Process won't crash when linked process exits
# => Returns: false (previous trap_exit value)

linked_pid = spawn_link(fn ->
  # => Spawn and link child
  :timer.sleep(500)
  # => Sleep 0.5 seconds
  raise "Linked process error!"
  # => Child crashes with RuntimeError
  # => Exit signal → message (parent trapping exits)
end)
# => Returns child PID

receive do
  # => Wait for exit message
  {:EXIT, ^linked_pid, reason} ->
    # => Pattern match exit message
    # => ^linked_pid: pin operator (match exact PID)
    IO.puts("Linked process exited with reason: #{inspect(reason)}")
    # => Output: "Linked process exited with reason: {%RuntimeError{...}, ...}"
    # => Parent continues running (handled gracefully)
end
# => receive complete
# => Parent process still alive

# Supervisor pattern uses links
defmodule Worker do
  # => GenServer worker for supervisor example
  use GenServer

  def start_link(id) do
    # => Starts worker linked to caller (supervisor)
    GenServer.start_link(__MODULE__, id)
    # => Returns: {:ok, pid}
  end

  @impl true
  def init(id) do
    # => GenServer initialization callback
    IO.puts("Worker #{id} started")
    # => Output: "Worker 1 started"
    {:ok, id}
    # => Returns: {:ok, state}
  end

  @impl true
  def handle_cast(:crash, _state) do
    # => Handles :crash message
    raise "Worker crashed!"
    # => Worker exits abnormally
    # => Supervisor receives {:EXIT, worker_pid, reason}
    # => Supervisor restarts worker per restart strategy
  end
end

# Exit reasons determine propagation behavior
# :normal - graceful exit (doesn't crash linked processes)
spawn_link(fn -> exit(:normal) end)
# => Exits normally
# => Won't crash parent
# => Parent receives {:EXIT, pid, :normal} if trapping

# :kill - forceful kill (cannot be trapped)
# spawn_link(fn -> exit(:kill) end)
# => Exits with :kill
# => Crashes parent immediately
# => trap_exit ignored for :kill

# any other - abnormal exit (crashes linked unless trapping)
spawn_link(fn -> exit(:abnormal) end)
# => Exits abnormally
# => Crashes parent unless trapping exits
# => If trapping: {:EXIT, pid, :abnormal} message

# Unlinking processes
Process.unlink(pid1)
# => Removes bidirectional link to pid1
# => Crashes no longer propagate
# => Returns: true
```

**Exit Reason Behavior**:

- **`:normal`** - Graceful exit, doesn't crash linked processes (worker completed successfully)
- **`:kill`** - Forceful termination, cannot be trapped (emergency shutdown)
- **`other`** - Abnormal exit, crashes linked processes unless trapping

**Linking vs Monitoring**:

- **Linking**: Bidirectional crash propagation (fail-together pattern for supervisor)
- **Monitoring**: Unidirectional crash detection (observer pattern for notifications)

**Key Takeaway**: Linked processes crash together. Use `spawn_link/1` for coupled processes. Trap exits with `Process.flag(:trap_exit, true)` to handle crashes gracefully. Supervisors use links to detect worker crashes.

**Why It Matters**: Process links create bidirectional dependencies: when one crashes, all linked processes receive exit signals. This let-it-crash propagation is intentional—it ensures that when something goes wrong, the entire related group fails together rather than operating in a partially broken state. Supervisors use `:trap_exit` to intercept these signals and restart processes cleanly. Understanding link semantics prevents two failure modes: accidentally linking unrelated processes (causing cascading failures) and failing to link related processes (allowing zombies to run with dead dependencies). Links are how supervision trees maintain coherent state across process boundaries.

## Example 57: Message Mailbox Management

Process mailboxes queue incoming messages. Understanding mailbox behavior prevents memory leaks and enables selective message processing.

Every process has a mailbox that queues messages in FIFO order. Messages accumulate until processed by `receive` blocks. Selective receive pattern-matches messages, potentially scanning the entire mailbox. Monitor mailbox size with `Process.info/2` to detect message buildup and prevent memory leaks.

**Code**:

```elixir
# Messages accumulate in mailbox
pid = self()
# => Current process PID

send(pid, :msg1)
# => Adds :msg1 to mailbox (position 1)
send(pid, :msg2)
# => Adds :msg2 to mailbox (position 2)
send(pid, :msg3)
# => Adds :msg3 to mailbox (position 3)
# => Mailbox: [:msg1, :msg2, :msg3]

Process.info(pid, :message_queue_len)
# => {:message_queue_len, 3}
# => Returns message count in mailbox

# FIFO processing
receive do
  msg -> IO.inspect(msg, label: "Received")
  # => Processes first message: :msg1
  # => Output: "Received: :msg1"
end
# => Mailbox now: [:msg2, :msg3]

Process.info(pid, :message_queue_len)
# => {:message_queue_len, 2}

# Selective receive (pattern matching)
send(self(), {:priority, "urgent"})
# => Mailbox: [:msg2, :msg3, {:priority, "urgent"}]
send(self(), {:normal, "task1"})
# => Mailbox: [:msg2, :msg3, {:priority, "urgent"}, {:normal, "task1"}]

receive do
  {:priority, content} -> IO.puts("Priority: #{content}")
  # => Scans mailbox for first match
  # => Finds {:priority, "urgent"} at position 3
  # => Skips :msg2 and :msg3
  # => Output: "Priority: urgent"
end
# => Mailbox: [:msg2, :msg3, {:normal, "task1"}]
# => Skipped messages remain in mailbox

# Flush mailbox (process all messages)
receive do
  msg -> IO.inspect(msg)
  # => Process one message
after
  0 -> :ok
  # => Timeout 0ms: if no messages, exit immediately
end
# => Processes messages until mailbox empty
```

**Mailbox Behavior**:

| Operation                | Effect             | Performance      |
| ------------------------ | ------------------ | ---------------- |
| `send/2`                 | Adds to end (FIFO) | O(1)             |
| `receive` (no pattern)   | Removes first      | O(1)             |
| `receive` (with pattern) | Scans until match  | O(n)             |
| Unmatched messages       | Stay in mailbox    | Memory leak risk |

**Selective Receive Costs**:

- **Best case**: Match at front of mailbox (O(1))
- **Worst case**: Scan entire mailbox (O(n))
- **Memory risk**: Unmatched messages accumulate

**Key Takeaway**: Process mailboxes queue messages in FIFO order. Use `receive` to process messages. Selective receive scans the mailbox for pattern matches, potentially skipping messages. Monitor mailbox size with `Process.info/2` to prevent memory leaks from unmatched messages.

**Why It Matters**: Process mailboxes are unbounded queues—if producers send faster than consumers process, the mailbox grows indefinitely until the process runs out of memory. Monitoring mailbox size with `Process.info(pid, :message_queue_len)` is a critical production observable. Selective receive (pattern matching only specific messages) leaves unmatched messages in the mailbox, causing selective receive to scan the entire queue on each call—O(n) for n unmatched messages. GenServer's structured callback model prevents mailbox unboundedness by processing all messages in order. Understanding mailbox mechanics helps debug slow GenServers and memory leaks.

## Example 58: Anonymous GenServers and Local Names

GenServers can run anonymously (PID-based) or with local/global names. Anonymous GenServers prevent name conflicts and enable multiple instances.

**Code**:

```elixir
defmodule Counter do
  # => Anonymous GenServer: identified by PID only
  # => No name registration (no atom name)
  # => Enables multiple instances without name conflicts
  use GenServer
  # => GenServer behavior

  # Start anonymous GenServer (no name)
  # => Anonymous: no name option passed to GenServer.start_link
  # => Callers must track PID to communicate
  def start_link(initial) do
    # => start_link/1: starts anonymous GenServer
    # => initial: initial counter value
    GenServer.start_link(__MODULE__, initial)
    # => No name: option passed
    # => GenServer not registered with any name
    # => __MODULE__: resolves to Counter
    # => initial: passed to init/1
    # => Returns {:ok, pid}
    # => Caller must store pid to use counter
  end

  def increment(pid) do
    # => increment/1: increments counter
    # => pid: GenServer PID (must be passed explicitly)
    GenServer.call(pid, :increment)
    # => GenServer.call/2: synchronous request
    # => Must pass PID explicitly
    # => First arg: pid (not atom name)
    # => Second arg: :increment message
    # => Returns: new counter value
  end

  def get(pid) do
    # => get/1: gets current counter value
    # => pid: required (anonymous GenServer)
    GenServer.call(pid, :get)
    # => Synchronous call with PID
    # => Returns: current state (counter value)
  end

  @impl true
  def init(initial), do: {:ok, initial}
  # => init/1: initializes counter with initial value
  # => Returns: {:ok, state} where state = initial

  @impl true
  def handle_call(:increment, _from, state) do
    # => handle_call/3: handles :increment message
    # => :increment: message from GenServer.call
    # => _from: caller info (ignored)
    # => state: current counter value
    {:reply, state + 1, state + 1}
    # => Increments counter
    # => Reply: state + 1 (new value sent to caller)
    # => New state: state + 1 (updated counter)
    # => Type: {:reply, reply, new_state}
  end

  @impl true
  def handle_call(:get, _from, state) do
    # => handle_call/3: handles :get message
    # => Returns current state without modification
    {:reply, state, state}
    # => Reply: state (current value)
    # => New state: state (unchanged)
  end
end
# => Counter module complete

# Multiple anonymous instances
# => Advantage: multiple counters with different states
# => Each has unique PID (no name conflicts)
{:ok, counter1} = Counter.start_link(0)
# => Start first counter with initial value 0
# => counter1: PID of first GenServer
# => Type: {:ok, #PID<0.150.0>}
{:ok, counter2} = Counter.start_link(100)
# => Start second counter with initial value 100
# => counter2: PID of second GenServer
# => Both counters independent (different PIDs, states)

Counter.increment(counter1)
# => Increment counter1 (0 → 1)
# => Returns: 1
# => 1
Counter.increment(counter2)
# => Increment counter2 (100 → 101)
# => Returns: 101
# => 101
# => Two separate states maintained

Counter.get(counter1)
# => Get counter1 value
# => Returns: 1
# => 1
Counter.get(counter2)
# => Get counter2 value
# => Returns: 101
# => 101
# => Pattern: PID-based identification for multiple instances

# Named GenServer (local to node)
# => Named: registered with atom name
# => Limitation: atoms are limited (not good for dynamic names)
# => Local: only on current node (not distributed)
defmodule NamedCounter do
  # => NamedCounter: GenServer with atom-based naming
  use GenServer

  def start_link(name, initial) do
    # => start_link/2: starts named GenServer
    # => name: atom to register GenServer
    # => initial: initial counter value
    GenServer.start_link(__MODULE__, initial, name: name)
    # => name: name option registers GenServer with atom
    # => name: must be atom (not string or tuple)
    # => Registered globally on local node
    # => Process.whereis(name) → returns PID
    # => Second start_link with same name → {:error, {:already_started, pid}}
  end

  def increment(name), do: GenServer.call(name, :increment)
  # => increment/1: increments named counter
  # => name: atom (not PID)
  # => GenServer.call resolves atom to PID internally
  def get(name), do: GenServer.call(name, :get)
  # => get/1: gets value of named counter
  # => name: atom registered with GenServer

  @impl true
  def init(initial), do: {:ok, initial}

  @impl true
  def handle_call(:increment, _from, state), do: {:reply, state + 1, state + 1}
  @impl true
  def handle_call(:get, _from, state), do: {:reply, state, state}
end
# => NamedCounter module complete

{:ok, _} = NamedCounter.start_link(:counter_a, 0)
# => Start named counter with atom :counter_a
# => Initial value: 0
# => Registered as :counter_a on local node
# => PID discarded (can use name instead)
{:ok, _} = NamedCounter.start_link(:counter_b, 50)
# => Start second named counter with atom :counter_b
# => Initial value: 50
# => Both registered with different atoms

NamedCounter.increment(:counter_a)
# => Increment :counter_a by name (no PID needed)
# => Returns: 1
# => 1
# => Atom resolved to PID internally
NamedCounter.get(:counter_b)
# => Get :counter_b value by name
# => Returns: 50
# => 50
# => Pattern: atom-based lookup (easier than PID tracking)

# Using Registry for dynamic names
# => Registry: OTP process registry (built-in)
# => Enables unlimited dynamic process names
# => Alternative to atoms (atoms are limited resource)
{:ok, _} = Registry.start_link(keys: :unique, name: MyRegistry)
# => Start Registry process
# => keys: :unique - each key registered once (no duplicates)
# => name: MyRegistry - global name for registry
# => :duplicate option allows multiple processes per key
# => Registry must be started before use (usually in supervision tree)

defmodule RegistryCounter do
  # => RegistryCounter: GenServer with Registry-based naming
  # => Enables dynamic names (strings, tuples, not just atoms)
  use GenServer

  def start_link(id, initial) do
    # => start_link/2: starts counter with Registry name
    # => id: dynamic identifier (can be string, tuple, anything)
    GenServer.start_link(__MODULE__, initial, name: via_tuple(id))
    # => name: via_tuple(id) - Registry-based name
    # => via-tuple enables Registry lookup
  end

  defp via_tuple(id) do
    # => via_tuple/1: creates Registry lookup tuple
    # => id: unique identifier for process
    {:via, Registry, {MyRegistry, {:counter, id}}}
    # => {:via, Registry, {registry_name, key}}
    # => :via - tells GenServer to use Registry
    # => Registry - module handling lookup
    # => MyRegistry - registry instance name
    # => {:counter, id} - key in registry (tuple with id)
    # => GenServer uses this to register/lookup process
  end

  def increment(id), do: GenServer.call(via_tuple(id), :increment)
  # => increment/1: increments counter by id
  # => via_tuple(id): resolves to PID via Registry
  # => GenServer.call looks up process in Registry
  def get(id), do: GenServer.call(via_tuple(id), :get)
  # => get/1: gets counter value by id
  # => Registry lookup: {:counter, id} → PID

  @impl true
  def init(initial), do: {:ok, initial}

  @impl true
  def handle_call(:increment, _from, state), do: {:reply, state + 1, state + 1}
  @impl true
  def handle_call(:get, _from, state), do: {:reply, state, state}
end
# => RegistryCounter module complete

RegistryCounter.start_link("user_123", 0)
# => Start counter with string id "user_123"
# => Registered as {:counter, "user_123"} in MyRegistry
# => Initial value: 0
# => Dynamic name (not limited by atom table)
RegistryCounter.start_link("user_456", 10)
# => Start counter with string id "user_456"
# => Registered as {:counter, "user_456"} in MyRegistry
# => Initial value: 10
# => Can have thousands/millions of dynamic names

RegistryCounter.increment("user_123")
# => Increment counter for "user_123"
# => Registry lookup: {:counter, "user_123"} → PID
# => Returns: 1
# => 1
RegistryCounter.get("user_456")
# => Get counter value for "user_456"
# => Returns: 10
# => 10
# => Pattern: unlimited dynamic process names via Registry

# Comparison
# 1. Anonymous (PID): Multiple instances, caller tracks PIDs
# => Use: temporary processes, testing, no global access needed
# 2. Named (atoms): Global access, limited names (~1M atoms)
# => Use: singleton services, well-known processes
# 3. Registry (via-tuple): Unlimited dynamic names, global access
# => Use: user sessions, dynamic workers, scalable services
```

**Key Takeaway**: Anonymous GenServers use PIDs for identification, enabling multiple instances. Named GenServers use atoms (limited) or Registry (unlimited dynamic names). Use Registry via-tuples for scalable process registration.

**Why It Matters**: Named processes provide stable references that survive process restarts—once a Supervisor restarts a GenServer, its pid changes but its registered name remains constant. This is essential for singletons: application-wide caches, rate limiters, connection pools, and configuration servers all need stable names. The Registry module enables dynamic naming with namespace isolation, solving naming conflicts in multi-tenant systems. Understanding the difference between pid references (break on restart) and name references (survive restart) prevents the common bug of storing a pid at startup and then crashing when the process restarts hours later.

---

## Example 59: Telemetry Events and Metrics

Telemetry provides instrumentation for measuring application behavior. Emit events for metrics, logging, and observability without coupling code to specific reporters.

**Dependency Note**: `:telemetry` is bundled with Erlang/OTP 26+ (required by Elixir 1.15+). For older OTP versions, add `{:telemetry, "~> 1.2"}` to your `deps` in `mix.exs`. Telemetry is the standard instrumentation interface because it decouples event emission from reporting and is used by Phoenix, Ecto, and the broader ecosystem.

**Code**:

```elixir
# Attach telemetry handler
# => Telemetry: event-based instrumentation library
# => Decouples code instrumentation from metrics/logging
:telemetry.attach(
  # => :telemetry.attach/4: attaches handler to event
  # => First arg: handler id (unique identifier)
  "my-handler-id",
  # => Unique handler ID (string)
  # => Used to detach handler later
  # => Must be unique across all handlers
  [:my_app, :request, :stop],
  # => Event name (list of atoms)
  # => Convention: [app, module, action, lifecycle]
  # => [:my_app, :request, :stop] fired when request completes
  # => Pattern: namespace with atoms to avoid conflicts
  fn event_name, measurements, metadata, _config ->
    # => Callback function: executed when event fires
    # => event_name: the event that triggered ([:my_app, :request, :stop])
    # => measurements: numeric values (duration, count, size)
    # => metadata: contextual data (request path, user id)
    # => _config: config passed to attach (nil here)
    # => Callback receives event data
    IO.puts("Event: #{inspect(event_name)}")
    # => Print event name
    IO.puts("Duration: #{measurements.duration}ms")
    # => Access measurements map (:duration key)
    IO.puts("Metadata: #{inspect(metadata)}")
    # => Print metadata map
  end,
  # => Callback function complete
  nil
  # => Config (passed to callback)
  # => Optional configuration for handler
  # => Available as fourth argument in callback
)
# => Handler attached: ready to receive events

# Emit telemetry event
defmodule MyApp.API do
  # => API module emitting telemetry events
  def handle_request(path) do
    # => handle_request/1: processes request with telemetry
    start_time = System.monotonic_time()
    # => System.monotonic_time/0: monotonic timestamp (nanoseconds)
    # => Monotonic: always increasing (not affected by clock adjustments)
    # => Used for duration measurement (not wall clock)

    # Perform work
    result = process_request(path)
    # => Execute actual request processing
    # => process_request/1: simulated work

    duration = System.monotonic_time() - start_time
    # => Calculate duration in nanoseconds
    # => current_time - start_time = elapsed nanoseconds

    # Emit telemetry event
    :telemetry.execute(
      # => :telemetry.execute/3: emits event to all attached handlers
      [:my_app, :request, :stop],
      # => Event name (must match handler event name)
      # => All handlers attached to this event will fire
      %{duration: duration},
      # => Measurements (numeric data)
      # => Map with measurement values
      # => Convention: numeric metrics (duration, count, bytes)
      %{path: path, result: result}
      # => Metadata (any term)
      # => Contextual information about event
      # => Can be any data (request details, user info, etc.)
    )
    # => execute/3 complete: handlers fired synchronously

    result
    # => Return result to caller
  end

  defp process_request(path) do
    # => Simulated request processing
    :timer.sleep(100)
    # => Sleep 100ms (simulate work)
    {:ok, "Response for #{path}"}
    # => Return simulated response
  end
end
# => MyApp.API complete

MyApp.API.handle_request("/users")
# => Call handle_request with "/users" path
# => Emits [:my_app, :request, :stop] event
# => Handler callback fires and prints:
# Prints:
# Event: [:my_app, :request, :stop]
# Duration: 100000000ms
# => Duration in nanoseconds (100ms = 100,000,000ns)
# Metadata: %{path: "/users", result: {:ok, "Response for /users"}}

# Span measurement pattern
# => Span: measures duration automatically (start → stop events)
# => Simplifies manual start_time/duration tracking
defmodule MyApp.Database do
  # => Database module with span telemetry
  def query(sql) do
    # => query/1: executes query with automatic timing
    :telemetry.span(
      # => :telemetry.span/3: emits start and stop events automatically
      # => Fires: [:my_app, :db, :query, :start] before function
      # => Fires: [:my_app, :db, :query, :stop] after function
      [:my_app, :db, :query],
      # => Event prefix (adds :start and :stop suffixes)
      # => [:my_app, :db, :query] → [:my_app, :db, :query, :start/stop]
      %{sql: sql},
      # => Initial metadata (available in both start and stop events)
      # => Metadata for query SQL
      fn ->
        # => Function to execute (work to measure)
        # => span measures duration of this function
        # Perform work
        result = execute_query(sql)
        # => Execute actual query

        # Return {result, extra_metadata}
        {result, %{rows: length(result)}}
        # => Return tuple: {result, extra_metadata}
        # => result: returned to caller
        # => extra_metadata: merged into stop event metadata
        # => Pattern: add runtime-computed metadata (:rows count)
      end
    )
    # => span/3 returns result from function
    # => Emits :start event before function
    # => Emits :stop event after function (with duration measurement)
  end

  defp execute_query(_sql) do
    # => Simulated query execution
    :timer.sleep(50)
    # => Sleep 50ms (simulate database query)
    [{:id, 1, :name, "Alice"}, {:id, 2, :name, "Bob"}]
    # => Return mock query results (list of tuples)
  end
end
# => MyApp.Database complete

# Attach handler for database queries
:telemetry.attach(
  # => Attach handler for database span stop event
  "db-handler",
  # => Handler ID
  [:my_app, :db, :query, :stop],
  # => Event name: span stop event
  # => Note: :stop suffix added by span/3
  fn _event, measurements, metadata, _config ->
    # => Handler callback
    # => _event: [:my_app, :db, :query, :stop]
    # => measurements: %{duration: nanoseconds}
    # => metadata: %{sql: "...", rows: count}
    IO.puts("Query took #{measurements.duration}ns")
    # => Print query duration (nanoseconds)
    # => measurements.duration: auto-computed by span/3
    IO.puts("Returned #{metadata.rows} rows")
    # => Print row count
    # => metadata.rows: from extra_metadata tuple
  end,
  nil
  # => No config
)
# => Handler attached for database queries

MyApp.Database.query("SELECT * FROM users")
# => Execute query with telemetry
# => Emits: [:my_app, :db, :query, :start]
# => Executes query (50ms)
# => Emits: [:my_app, :db, :query, :stop] with duration
# => Handler prints query timing and row count

# Multiple handlers for same event
# => attach_many/4: attaches handler to multiple events
# => Alternative to multiple attach/4 calls
:telemetry.attach_many(
  # => :telemetry.attach_many/4: one handler for multiple events
  "multi-handler",
  # => Handler ID (unique)
  [
    # => List of events to handle
    [:my_app, :request, :start],
    # => Request start event
    [:my_app, :request, :stop],
    # => Request stop event
    [:my_app, :request, :exception]
    # => Request exception event
  ],
  # => Same handler fires for all three events
  fn event, measurements, metadata, _config ->
    # => Handler callback for any of the three events
    # => event: which event fired (varies)
    Logger.info("Event: #{inspect(event)}", measurements: measurements, metadata: metadata)
    # => Log event with measurements and metadata
    # => Logger.info/2: logs at info level
    # => Keyword list: [measurements: ..., metadata: ...]
  end,
  nil
  # => No config
)
# => Handler attached to 3 events
# => Pattern: single handler for related events (request lifecycle)
```

**Key Takeaway**: Telemetry decouples instrumentation from reporting. Emit events with `:telemetry.execute/3` for measurements and `:telemetry.span/3` for start/stop events. Attach handlers to process events for metrics, logging, or monitoring.

**Why It Matters**: Telemetry's event model decouples instrumentation from observation: application code emits events with measurements; monitoring systems attach handlers that report to Prometheus, StatsD, or custom loggers. This decoupling means you can add metrics to library code without knowing which monitoring system downstream users prefer. Phoenix and Ecto emit telemetry events for every request, query, and lifecycle callback—attach handlers to build custom dashboards without modifying framework code. Production systems derive SLAs from telemetry measurements. Learning telemetry enables observability-first design where performance characteristics are measured from day one.

---

## Example 60: Type Specifications with @spec

Type specs document function signatures and enable static analysis with Dialyzer. They improve code documentation and catch type errors at compile time.

### @spec Syntax

`@spec` declares type specifications for functions:

- `@spec function_name(param_types) :: return_type`
- Place before function definition
- `::` separates parameters from return type
- Dialyzer verifies implementation matches spec

### Common Built-in Types

| Type         | Description           | Example Values                    |
| ------------ | --------------------- | --------------------------------- |
| `integer()`  | Whole numbers         | `-2, -1, 0, 1, 2, ...`            |
| `float()`    | Decimal numbers       | `3.14, 2.5, -1.0`                 |
| `number()`   | Integer or float      | Any numeric value                 |
| `String.t()` | UTF-8 binary string   | `"hello", "world"`                |
| `atom()`     | Atom literals         | `:ok, :error, :atom`              |
| `boolean()`  | True/false            | `true, false`                     |
| `list(type)` | List of specific type | `[1, 2, 3]` for `list(integer())` |
| `map()`      | Any map               | `%{key: value}`                   |
| `tuple()`    | Any tuple             | `{:ok, "value"}`                  |
| `pid()`      | Process identifier    | Result of `spawn/1`               |
| `term()`     | Any Elixir term       | Wildcard type                     |
| `keyword()`  | Keyword list          | `[key: value, ...]`               |
| `any()`      | Any type              | Wildcard, no constraints          |

### Union Types

Use `|` to specify multiple possible types:

- `{:ok, float()} | {:error, atom()}` - Either success or error tuple
- `integer() | nil` - Integer or nil (optional value)
- Common pattern: Result tuples with union types

**Code**:

```elixir
defmodule Calculator do
  @spec add(integer(), integer()) :: integer()
  # => Spec declares: two integers → integer
  # => Dialyzer validates implementation matches this signature
  def add(a, b), do: a + b
  # => Returns: sum (integer)
  # => Example: add(2, 3) => 5

  @spec divide(number(), number()) :: {:ok, float()} | {:error, atom()}
  # => Spec: union type (success OR error)
  # => Union type: {:ok, float()} | {:error, atom()} means return one of two tuples
  def divide(_a, 0), do: {:error, :division_by_zero}
  # => Returns: error tuple when divisor is zero
  # => Pattern match: 0 as divisor triggers this clause
  def divide(a, b), do: {:ok, a / b}
  # => Returns: success tuple with float
  # => Normal case: wraps division result in :ok tuple

  @spec sum(list(number())) :: number()
  # => Spec: list of numbers → number
  # => Accepts list of integers, floats, or mixed
  def sum(numbers), do: Enum.sum(numbers)
  # => Enum.sum: returns sum (integer or float)
  # => Example: sum([1, 2, 3]) => 6

  @spec abs(integer()) :: integer()
  # => Single spec covers all function clauses
  # => All clauses must match same return type
  def abs(n) when n < 0, do: -n
  # => Clause 1: negative → positive
  # => Guard: when n < 0 only matches negative numbers
  def abs(n), do: n
  # => Clause 2: positive → unchanged
  # => Fallthrough: matches positive and zero
end

defmodule User do
  @type t :: %__MODULE__{
    id: integer(),
    name: String.t(),
    email: String.t(),
    age: integer() | nil
  }
  # => Custom type: User.t with field types
  # => @type t :: ... defines reusable type for this struct

  defstruct [:id, :name, :email, :age]
  # => Defines struct with four fields

  @spec new(integer(), String.t(), String.t()) :: t()
  # => Returns: User.t custom type
  # => Constructor function: creates new User struct
  def new(id, name, email) do
    %__MODULE__{id: id, name: name, email: email}
    # => age defaults to nil (not provided)
    # => %__MODULE__{} expands to %User{} at compile time
  end

  @spec update_age(t(), integer()) :: t()
  # => Spec: User.t, integer → User.t
  # => Takes user struct and new age, returns updated struct
  def update_age(user, age) do
    %{user | age: age}
    # => Returns: updated User struct
    # => Map update syntax: %{struct | field: new_value}
  end

  @spec display(t()) :: String.t()
  # => Spec: User.t → String
  # => Pattern matches on struct fields in parameters
  def display(%__MODULE__{name: name, email: email}) do
    "#{name} (#{email})"
    # => Returns: formatted string
    # => String interpolation: "Alice (alice@example.com)"
  end
end

defmodule StringHelper do
  @spec reverse(String.t()) :: String.t()
  # => Spec: string → string
  def reverse(string), do: String.reverse(string)
  # => "hello" → "olleh"
  # => String.reverse/1 reverses character order

  @spec split(String.t(), String.t()) :: list(String.t())
  # => Spec: string, separator → list of strings
  # => Returns list of string parts
  def split(string, separator), do: String.split(string, separator)
  # => "a,b,c" split by "," → ["a", "b", "c"]
  # => String.split/2 breaks string at separator

  @spec join(list(String.t()), String.t()) :: String.t()
  # => Spec: list of strings, separator → string
  # => Inverse of split operation
  def join(parts, separator), do: Enum.join(parts, separator)
  # => ["a", "b", "c"] with "," → "a,b,c"
  # => Enum.join/2 concatenates list elements with separator
end

# Custom type aliases
@type result :: {:ok, String.t()} | {:error, atom()}
# => Reusable type: success or error tuple
# => Defines common result pattern for this module
@type user_id :: integer()
# => Semantic alias: clearer intent than raw integer()
# => Type alias documents domain meaning
@type user_map :: %{id: user_id(), name: String.t()}
# => Map type with required keys
# => Specifies exact map structure expected

@spec find_user(user_id()) :: result()
# => Uses custom types for readability
# => Returns: {:ok, String.t()} | {:error, atom()}
def find_user(id) when id > 0, do: {:ok, "User #{id}"}
# => Valid id: returns success tuple
# => Guard: id > 0 ensures positive ID
def find_user(_id), do: {:error, :invalid_id}
# => Invalid id: returns error tuple
# => Fallthrough clause handles invalid IDs

# mix dialyzer
# => Runs static type analysis
# => First run: builds PLT (Persistent Lookup Table - slow)
# => Subsequent: fast incremental checks
# => Reports: type mismatches, spec violations
# => Example output: "Function returns {error, binary()} but spec says {error, atom()}"
```

**Key Takeaway**: Use `@spec` to document function types. Define custom types with `@type`. Type specs enable Dialyzer to catch type errors and improve documentation. Common types: `integer()`, `String.t()`, `list(type)`, `map()`, `{:ok, type} | {:error, reason}`.

**Why It Matters**: Type specifications (`@spec`) serve dual purposes: documentation and static analysis via Dialyzer. Dialyzer is a success typing tool that analyzes BEAM bytecode to find type errors the compiler misses—calling a function with wrong argument types, impossible pattern matches, and incorrect return type assumptions. Unlike Haskell's type system, Dialyzer is gradual: it only reports errors it can prove, never false positives. Adding `@spec` to public functions enables Dialyzer to propagate type information across module boundaries. Libraries with comprehensive type specs enable IDEs to provide autocomplete and catch integration errors at development time.

---

## What's Next?

You've completed the intermediate examples covering advanced pattern matching, data structures, module organization, error handling, processes, testing, and OTP fundamentals. You now understand:

- Advanced pattern matching with guards and `with`
- Structs, streams, and MapSets
- Module attributes, import/alias, and protocols
- Error handling with result tuples and try/rescue
- Process spawning, message passing, and monitoring
- Task abstraction and testing with ExUnit
- Supervisor child specs and application lifecycle
- Custom Mix tasks and runtime configuration
- Process links, mailbox management, and GenServer patterns
- Telemetry instrumentation and type specifications

**Continue your learning**:

- [Advanced Examples (61-85)](/en/learn/software-engineering/programming-languages/elixir/by-example/advanced) - GenServer deep dive, Supervisor patterns, metaprogramming, OTP mastery
- [Beginner Examples (1-30)](/en/learn/software-engineering/programming-languages/elixir/by-example/beginner) - Review fundamentals if needed

**Deepen your understanding**:
