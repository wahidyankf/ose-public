---
title: "Drilling Overview"
date: 2026-10-25T00:00:00+07:00
draft: false
weight: 1
---

Recall questions, applied composition problems, hands-on katas, a readiness
checklist, and design trade-off prompts. Work them after the themes: recall
locks in the vocabulary, applied problems force composition judgement under
ambiguity, katas rebuild the muscle, and the checklist tells you when to stop.
Do them with a terminal open and the course models at hand -- every question
and problem below is answerable by running a model from Themes A through I,
and the habit of verifying an answer by running it is the real skill being
drilled. Keep a log of every miss and every slow answer: the log becomes your
personal review deck for the week after you finish.

## Recall Q&A

Twenty-four short-answer questions, at least one per concept below. Answer from
memory, then check. Star the ones you miss and repeat them after a day; spaced
repetition only works when the misses decide what comes back. Say each answer
as a mechanism, not a slogan -- "the gate rejects before the handler runs"
rather than "validation matters" -- because recall that stops at vocabulary
cannot select a tool under pressure.

### Q1 (co-01): One field list drives two things in Example 1. What are they, and what breaks if they drift?

<details><summary>Answer</summary>

The list drives the runtime check (`checkField` per field) and the derived
static type (`User`). If they drift, the validator accepts what the type
forbids (or rejects what the type promises), and the mismatch surfaces far
from either declaration. The schema exists to make drift impossible by
construction: one declaration, two consumers.

</details>

### Q2 (co-01): How do extension and merge differ, and what do they share?

<details><summary>Answer</summary>

Extension grows one schema with new fields (base plus timestamps); merge joins
two schemas into one (profile plus preferences). They share the copy rule:
neither mutates its inputs, so shared bases stay safe to reuse. Example 4
proves the base intact after both operations.

</details>

### Q3 (co-02): What is the difference between safeParse and parse, and when is each honest?

<details><summary>Answer</summary>

safeParse returns a union (data or issue) for input that may be wrong: forms,
query strings, uploads. parse throws for input that cannot be wrong, where a
throw signals a programmer error. Example 6 runs both on the same hostile
payload so the two styles can be compared branch for branch.

</details>

### Q4 (co-02): Why must the server re-validate a payload the form already checked?

<details><summary>Answer</summary>

Because the wire is untrusted no matter what the form did: attackers bypass
forms, so client validation is courtesy (fast feedback) and server validation
is security (the real boundary). Example 30 forges a payload past the missing
pre-check and proves the server gate still catches it.

</details>

### Q5 (co-02): An array parse reports one issue "at=1 qty: expected positive number". What does each part tell you?

<details><summary>Answer</summary>

`at=1` names the failing index (the second item), `qty` names the failing
field inside that item, and the message names the rule. Example 8 collects all
indexed failures instead of stopping at the first, so one pass repairs the
whole batch.

</details>

### Q6 (co-03): What does a typed error channel state that a throwing function cannot?

<details><summary>Answer</summary>

The signature states what the function can fail with: `Outcome<string,
UserNotFound>` advertises the miss, while a throwing signature advertises
nothing. Callers of the typed version must branch on the error; callers of the
throwing version may forget the catch. Example 11 shows the same lookup both
ways by implication: the miss becomes data, never an exception.

</details>

### Q7 (co-03): When should an error union grow a member, and what breaks if it does not?

<details><summary>Answer</summary>

The union grows when the operation gains a failure mode with a different
recovery: absence suggests creation, denial suggests escalation, so both
belong. If the union omits one, callers handle both with one branch and apply
the wrong recovery. Example 12 keeps `NotFound` and `Forbidden` distinct so
each renders its own fix.

</details>

### Q8 (co-03): What is the difference between fail and die, and who handles each?

<details><summary>Answer</summary>

Fail is an expected, typed failure the signature admits; handlers recover,
retry, or report it. Die is a defect (a bug): no handler can fix the program,
so it skips error handling and demands a code fix. Example 14 runs both lanes
so the split is visible: handled division-by-zero versus a reported defect.

</details>

### Q9 (co-04): Why does andThen short-circuit, and what would break if it did not?

<details><summary>Answer</summary>

It runs the next step only on success, forwarding the first failure. Without
short-circuiting, step two would run on step one's failure value: the age rule
would check a non-number, producing a confusing second error that hides the
real one. Example 16 proves each input exits at exactly one step.

</details>

### Q10 (co-04): When do you join with all instead of chaining with andThen?

<details><summary>Answer</summary>

Join when the effects are independent (neither needs the other's result);
chain when each step feeds the next. Joining declares independence, which lets
the runtime parallelize and lets the reader see no ordering is required.
Example 17 pairs two fetches that never touch each other's values.

</details>

### Q11 (co-04): What does a retry budget bound, and what happens at each side of the bound?

<details><summary>Answer</summary>

The budget bounds how many times a flaky effect re-runs. Inside the budget, a
success returns normally (the flake is absorbed); at exhaustion, the last
error is kept honestly. Example 18 succeeds on attempt three of three and
keeps the error for the permanently failing fetch after two attempts.

</details>

### Q12 (co-05): What makes an injected service testable without mocks?

<details><summary>Answer</summary>

The logic declares its needs as parameters, so tests pass a fixed
implementation (a clock pinned to 08:00) while production passes the live
one. No interception, no framework: the test double is a real implementation
of the contract with fixed answers. Example 19 proves both branches with two
fixed clocks and zero wall-clock reads.

</details>

### Q13 (co-05): What is a layer, and what does swapping one prove?

<details><summary>Answer</summary>

A layer is a providing of a service contract: production provides the real
database, tests provide the always-absent one, and the logic never knows
which it got. The swap proves both branches: the hit path and the fallback
path. Example 20 asserts both layers behave as specified against the same
function.

</details>

### Q14 (co-06): What does the client derive from the router, and what disappears as a result?

<details><summary>Answer</summary>

The client derives its input and output types from the router type (the
`inferRouterInputs` shape), and the handwritten client copy disappears. With
nothing to go stale, drift becomes impossible by construction. Example 28
proves the derived shape assignable to the declared one with zero copies.

</details>

### Q15 (co-06): A server rename breaks the client build. Why is that the good outcome?

<details><summary>Answer</summary>

Because the alternative is a production incident: a client reading a field
the server no longer sends. The build break names the stale read in CI, where
the author who renamed the field fixes the reader in one line. Example 29
shows the old field provably absent and the new field carrying the value.

</details>

### Q16 (co-07): What are the three jobs of a procedure, in order, and which tool owns each in this course?

<details><summary>Answer</summary>

Gate the input (Zod's job: validate before the handler), run the logic
(Effect's job in composed procedures, or plain logic), and route the call
(tRPC's job: name, transport, reply). Example 44 shows the order as code:
schema gate first, procedure second, reply third.

</details>

### Q17 (co-07): Why must router merges refuse name clashes instead of letting one side win?

<details><summary>Answer</summary>

Because silent shadowing routes calls to the wrong handler with no error
anywhere: the call succeeds and does the wrong thing. Refusing turns the
collision into a loud composition error at merge time. Example 25 names the
clashing procedure so the teams can resolve it before any traffic flows.

</details>

### Q18 (co-08): What does a transition table list, and what does its absence mean?

<details><summary>Answer</summary>

It lists every legal (state, event) pair and its target. Absence means the
move is impossible: the event is ignored or refused in that state, never
performed. Example 37 refuses DELETE from empty with the state and event
named instead of corrupting state.

</details>

### Q19 (co-09): When do nested states beat a flat machine, and what is the symptom you have outgrown flat?

<details><summary>Answer</summary>

When several states share transitions (SAVE from text and preview), nesting
states the sharing once on the parent. The symptom is duplicated transitions
that drift: SAVE works from preview but silently stops working from text after
a refactor. Example 39 keeps the shared exit in one place.

</details>

### Q20 (co-10): Why do guards belong on transitions rather than inside handlers?

<details><summary>Answer</summary>

Because handlers check preconditions after the action has begun (the modal
opens then closes), while guards refuse before anything happens (no flicker,
no half-started effect, no cleanup). Tests also simplify: asserting nothing
changed is stronger than asserting a mess was cleaned up. Example 35 swallows
the fourth press without a trace.

</details>

### Q21 (co-11): What makes double-pay unrepresentable in Example 43, and what would make it representable again?

<details><summary>Answer</summary>

`payment.card` has no PAY transition: the table simply omits the pair, so the
second payment cannot be constructed as a move. It becomes representable the
moment anyone adds a PAY-from-paid transition without a guard, which is why
money tables deserve a second reviewer on every diff.

</details>

### Q22 (co-12): In the schema-guards-procedure combination, what breaks if the order reverses?

<details><summary>Answer</summary>

Validating inside the handler (after routing) scatters checks across handlers
that diverge; skipping validation trusts the wire. Schema-first keeps one
check per procedure that the handler trusts completely. Example 44 runs the
gate before the procedure so the procedure never sees invalid input.

</details>

### Q23 (co-13, co-14): A teammate says "TypeScript already checks types, so Zod is redundant." What two answers does the matrix give?

<details><summary>Answer</summary>

First, the check column: TypeScript checks at compile time, Zod checks the
wire at runtime, and no compiler watches the network cable (Example 7).
Second, the cost column: redundancy would mean paying without gaining, but
schemas cost one declaration per boundary and gain every downstream guarantee.
The claim confuses two different checks at two different times.

</details>

### Q24 (co-15, co-16): How do selection and testing agree with each other?

<details><summary>Answer</summary>

The seam decides both: the tool chosen for a gap is tested at that gap's
seam (hostile inputs for schemas and procedures, failing layers for Effects,
event scripts for machines). Example 48 runs all three seams green. If you
cannot name the seam, you cannot test the tool, which usually means you
selected the wrong tool for the gap.

</details>

## Applied problems

Eight composition problems under ambiguity. Work each on paper before running
anything: name the gap, pick the tool from the matrix, then verify by running
the closest course model with your inputs. The point is selection under
uncertainty, not syntax recall.

1. **The phantom discount**: an admin form posts `{ code: "HALF", pct: "50" }` and
   customers sometimes get 5,000% off. Decide whether this is a validation gap,
   an untyped error path, an API type mismatch, or a missing UI state. Then
   name the tool, the gate, and the test that would have caught it. (Check
   against Examples 9 and 30: the wire sends strings, the effect trusts
   numbers, and only a schema gate between them converts honestly.)
2. **The silent outage**: a fetch fails at 3 AM and the dashboard shows an
   empty table with no error. Decide whether the loading flag, the error
   channel, or the machine is missing. Then sketch the fetch lifecycle states
   and say which state the 3 AM UI was actually in. (Check against Example 38:
   three flags admit eight combinations and only three make sense.)
3. **The boolean-flag component**: a dialog owns `open`, `closing`, and
   `animating`, and QA found it rendering open-but-closing with no animation.
   Redesign it as a state machine: name the states, the events, and which
   combination from the flags has no state. (Check against Examples 34 and 37:
   impossible combinations become refused transitions.)
4. **The drifting client**: the server renamed `title` to `headline` and the
   mobile app renders blank cards for a week before anyone notices. Say which
   inference link was missing and what breaks in CI once it exists. (Check
   against Examples 28 and 29: derivation turns the silent blank into a build
   break naming the stale read.)
5. **The flaky webhook**: a payment webhook fails one time in twenty and the
   team debates retrying in the handler versus in the pipeline. Decide where
   the retry belongs, what bounds it, and what the exhaustion path renders.
   (Check against Example 18: policy as data with an honest final error beats
   a hand-rolled loop in the handler.)
6. **The untestable checkout**: the checkout function reads the live payments
   client from an import and the suite needs a real sandbox to run. Name the
   seam, the injected contract, and the two layers (production and test) with
   what each proves. (Check against Examples 19 and 20: the seam is the
   constructor, and the swap proves both branches.)
7. **The second router**: the team adds a billing router with a `charge`
   procedure while the payments router already has one. Say what the merge
   reports, who resolves it, and how the two teams keep their names apart
   afterwards. (Check against Example 25: the merge refuses with the clashing
   name, and resolution is a naming decision, not a code change.)
8. **The impatient UI**: users double-click pay and get charged twice. Decide
   whether the fix belongs in the button, the procedure, or the machine, and
   say what each choice fails to prevent. (Check against Examples 43 and 46:
   only the machine makes the second submit unrepresentable; the button races
   and the procedure bills twice behind an idempotency key you do not have.)

## Code katas

Five hands-on katas. Each starts from the `Before` starter, and the `After`
reference shows one good solution with its recorded output. Make the starter
match before peeking. Work them in order: the schema kata first, because every
boundary in the course repeats it; the Effect kata second, because typed
errors underlie three later examples; the guard kata third, because guards
reappear in the checkout chart; the router kata fourth, because additive
changes are the production norm; the pipeline kata last, because it composes
the first two katas' lessons. its wrong output carefully -- the wrong output is the specification of the bug.

### Kata 1: convert a hand-rolled type guard into a Zod schema

The starter checks the email and forgets the age, so a negative age passes.
Replace the manual guard with one schema gate that rejects bad ages by name.

**Before** (`drilling/code/kata-01-guard-to-schema/before/starter.ts`):

```typescript
// => Kata 1 starter: a hand-rolled guard that forgets the age check.
// => Task: replace the manual checks with one schema gate that rejects bad ages.
function isSignup(input: unknown): boolean {
  // => the hand-rolled guard: checks email, forgets age entirely
  if (typeof input !== "object" || input === null) {
    // => non-objects are not signups
    return false; // => rejected
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["email"] !== "string") {
    // => the only check this guard performs
    return false; // => rejected
  } // => email fine: the guard stops here, age unchecked
  return true; // => BUG: any age passes, including -3 and "old"
}
function main(): void {
  // => entry point; the bad payload slips through the hand-rolled guard
  // => a negative age passes: the guard never looked
  console.log("guard says: " + String(isSignup({ email: "ada@example.com", age: -3 }))); // => starter prints true: the bug
  // => the task: one schema gate so this prints false
  console.log("wanted: false"); // => target output after the fix
}
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-01-guard-to-schema/after/solution.ts`):

```typescript
// => Kata 1 solution: one schema gate checks every field, including age.
// => The manual guard is gone: email and age validate in the same place.
function checkSignup(input: unknown): { ok: true } | { ok: false; issue: string } {
  // => the schema gate: every field checked, failures named
  if (typeof input !== "object" || input === null) {
    // => non-objects carry no fields
    return { ok: false, issue: "expected object" }; // => reject before any field read
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["email"] !== "string" || !record["email"].includes("@")) {
    // => the email rule the hand-rolled guard had
    return { ok: false, issue: "email: expected email string" }; // => field named
  } // => email settled
  if (typeof record["age"] !== "number" || !Number.isInteger(record["age"]) || record["age"] < 13) {
    // => the age rule the hand-rolled guard forgot
    return { ok: false, issue: "age: expected integer 13 or older" }; // => field named
  } // => age settled
  return { ok: true }; // => every field valid
}
function main(): void {
  // => entry point; the same bad payload now fails at the gate
  // => the negative age is rejected with the field named
  const bad = checkSignup({ email: "ada@example.com", age: -3 }); // => hostile payload
  if (!bad.ok) {
    // => the failure names the forgotten field
    console.log("schema says: false (" + bad.issue + ")"); // => fixed: the gate catches the age
  } // => bad done
  // => an honest payload still passes untouched
  const good = checkSignup({ email: "ada@example.com", age: 36 }); // => valid payload
  console.log("good: " + String(good.ok)); // => valid input unaffected
}
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-01-guard-to-schema/expected/main.stdout.txt`):

```text
schema says: false (age: expected integer 13 or older)
good: true
```

### Kata 2: convert a throwing function into an Effect with a typed error

The starter throws on overdraft, which no signature advertises. Return a
tagged `InsufficientFunds` error carrying the shortfall instead, and prove
both paths branch without try/catch.

**Before** (`drilling/code/kata-02-throw-to-effect/before/starter.ts`):

```typescript
// => Kata 2 starter: a throwing withdraw that callers cannot plan for.
// => Task: return a typed error instead of throwing, so callers branch on it.
function withdraw(balance: number, amount: number): number {
  // => the throwing version: failure is an exception with no type
  if (amount > balance) {
    // => overdraft: explosive, untyped, invisible in the signature
    throw new Error("overdraft"); // => BUG: callers need try/catch to survive
  } // => funded: fall through
  return balance - amount; // => new balance
}
function main(): void {
  // => entry point; the overdraft throws instead of returning a value
  // => the failure path needs a try/catch the signature never advertised
  try {
    // => the throwing call must sit inside try
    withdraw(10, 30); // => throws: overdraft
    console.log("starter: unexpectedly funded"); // => unreachable for this input
  } catch {
    // => the catch proves the failure was an exception, not a value
    console.log("starter: threw (untyped)"); // => starter behavior: exception
  } // => starter done
  // => the task: a typed InsufficientFunds value instead of this throw
  console.log("wanted: typed error value"); // => target after the fix
}
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-02-throw-to-effect/after/solution.ts`):

```typescript
// => Kata 2 solution: overdraft becomes a typed error value.
// => The signature advertises the failure; no try/catch anywhere.
// => The typed error replaces the throw: same failure, visible in the signature.
class InsufficientFunds {
  // => the typed error: shortfall carried as data
  readonly tag = "InsufficientFunds"; // => matchable by tag downstream
  readonly shortBy: number; // => how much money is missing
  constructor(shortBy: number) {
    // => plain parameter: strip-safe, assigned explicitly
    this.shortBy = shortBy; // => context stored on the instance
  }
}
// => The Effect shape: value or typed error, never a throw.
function withdraw(
  balance: number,
  amount: number,
): { ok: true; balance: number } | { ok: false; error: InsufficientFunds } {
  // => the Effect shape: value or typed error, never a throw
  // => Overdraft check first: the failure branch returns the tagged error.
  if (amount > balance) {
    // => overdraft: a value the caller branches on
    return { ok: false, error: new InsufficientFunds(amount - balance) }; // => shortfall computed
  } // => funded: fall through
  return { ok: true, balance: balance - amount }; // => new balance out
}
// => Both paths branch without try/catch: overdraft first, funding second.
function main(): void {
  // => entry point; the overdraft is a value, the funding is a value
  // => the overdraft arrives as a tagged error with the shortfall
  const broke = withdraw(10, 30); // => unaffordable withdrawal
  if (!broke.ok) {
    // => branch on the discriminant, never try/catch
    console.log("overdraft: " + broke.error.tag + " shortBy=" + String(broke.error.shortBy)); // => fixed: typed error value
  } // => broke done
  // => the funded withdrawal returns the new balance
  const funded = withdraw(100, 30); // => affordable withdrawal
  if (funded.ok) {
    // => narrow before reading the balance
    console.log("funded: balance=" + String(funded.balance)); // => normal path unaffected
  } // => funded done
}
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-02-throw-to-effect/expected/main.stdout.txt`):

```text
overdraft: InsufficientFunds shortBy=20
funded: balance=70
```

### Kata 3: add a guard to an XState transition

The starter publishes from any state, so drafts ship without review. Guard
PUBLISH on reviewed, refuse drafts with the missing step named, and prove the
legal review-then-publish path still works.

**Before** (`drilling/code/kata-03-guard-the-transition/before/starter.ts`):

```typescript
// => Kata 3 starter: an unguarded publish that ships drafts.
// => Task: add a guard so PUBLISH works only from reviewed.
type DocState = "draft" | "reviewed" | "published"; // => the document lifecycle
function next(current: DocState, event: { type: "REVIEW" } | { type: "PUBLISH" }): DocState {
  // => the unguarded table: PUBLISH moves from anywhere, including draft
  if (event.type === "REVIEW" && current === "draft") {
    // => review advances drafts
    return "reviewed"; // => legal move
  } // => review done
  if (event.type === "PUBLISH") {
    // => BUG: no guard on the current state: drafts publish too
    return "published"; // => unguarded move
  } // => publish done
  return current; // => no transition: hold
}
function main(): void {
  // => entry point; publishing a draft succeeds when it must not
  // => the draft publishes without review: the missing guard
  console.log("starter: draft publish -> " + next("draft", { type: "PUBLISH" })); // => starter prints published: the bug
  // => the task: guard PUBLISH so drafts stay drafts
  console.log("wanted: draft"); // => target after the fix
}
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-03-guard-the-transition/after/solution.ts`):

```typescript
// => Kata 3 solution: PUBLISH is guarded on reviewed; drafts are refused.
// => The guard names the refusal so the caller knows the missing step.
type DocState = "draft" | "reviewed" | "published"; // => the document lifecycle
// => The guarded table: every move legal or named-refused.
function next(
  current: DocState,
  event: { type: "REVIEW" } | { type: "PUBLISH" },
): { ok: true; state: DocState } | { ok: false; refused: string } {
  // => the guarded table: every move legal or named-refused
  if (event.type === "REVIEW" && current === "draft") {
    // => review advances drafts
    return { ok: true, state: "reviewed" }; // => legal move
  } // => review done
  if (event.type === "PUBLISH" && current === "reviewed") {
    // => the guard: only reviewed documents publish
    return { ok: true, state: "published" }; // => legal move
  } // => guarded publish done
  if (event.type === "PUBLISH") {
    // => publish from any other state: refused with the missing step
    return { ok: false, refused: "PUBLISH refused in " + current + ": review first" }; // => guard names the fix
  } // => refused publish done
  return { ok: false, refused: "no transition" }; // => every other pair refused
}
// => The draft publish is refused; the legal review-then-publish path still works.
function main(): void {
  // => entry point; the draft publish is refused, the reviewed publish works
  // => publishing a draft is refused with the missing step named
  const draft = next("draft", { type: "PUBLISH" }); // => illegal move
  if (!draft.ok) {
    // => the refusal carries the fix
    console.log("draft publish: " + draft.refused); // => fixed: guard holds
  } // => draft done
  // => the legal path reviews then publishes
  const reviewed = next("draft", { type: "REVIEW" }); // => legal review
  if (reviewed.ok) {
    // => narrow before the publish
    const published = next(reviewed.state, { type: "PUBLISH" }); // => legal publish
    if (published.ok) {
      // => narrow before reading the state
      console.log("reviewed publish: " + published.state); // => legal path unaffected
    } // => published done
  } // => reviewed done
}
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-03-guard-the-transition/expected/main.stdout.txt`):

```text
draft publish: PUBLISH refused in draft: review first
reviewed publish: published
```

### Kata 4: add a tRPC procedure to an existing router without breaking client types

The starter router has `getName` only, and the new `rename` call fails
routing. Add the procedure with its input gate, keep `getName` verbatim, and
prove the old client call still passes with the old answer.

**Before** (`drilling/code/kata-04-add-router-procedure/before/starter.ts`):

```typescript
// => Kata 4 starter: the client calls a procedure the router does not have.
// => Task: add the rename procedure to the router without touching the old one.
function createCaller(
  routes: Record<string, (input: unknown) => unknown>,
): (name: string, input: unknown) => { ok: true; value: unknown } | { ok: false; issue: string } {
  // => the test caller: routes by name, reports unknown procedures
  return (name: string, input: unknown) => {
    // => each call looks its procedure up by name
    const handler: ((input: unknown) => unknown) | undefined = routes[name]; // => route lookup
    if (handler === undefined) {
      // => missing procedure: the routing error
      return { ok: false, issue: "unknown procedure: " + name }; // => client ahead of server
    } // => procedure found: fall through
    return { ok: true, value: handler(input) }; // => handler runs in-process
  };
}
// => The old procedure works; the new call exposes the gap.
function main(): void {
  // => entry point; the old procedure works, the new one is missing
  // => the router has getName only: rename is not there yet
  const caller = createCaller({ getName: () => "Ada" }); // => v1 router
  const old = caller("getName", null); // => existing client call
  // => The existing path stays green while rename is missing.
  if (old.ok) {
    // => the old procedure keeps working
    console.log("starter: getName=" + String(old.value)); // => old path green
  } // => old done
  // => the new client call fails routing: the procedure does not exist yet
  const missing = caller("rename", "Grace"); // => new client call, no server procedure
  if (!missing.ok) {
    // => the routing error proves the gap
    console.log("starter: " + missing.issue); // => starter prints the gap: the task
  } // => missing done
}
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-04-add-router-procedure/after/solution.ts`):

```typescript
// => Kata 4 solution: rename joins the router; getName is untouched.
// => Old clients keep compiling and passing; the new procedure is additive only.
// => The test caller is unchanged from the starter: routing by name, errors for gaps.
function createCaller(
  routes: Record<string, (input: unknown) => unknown>,
): (name: string, input: unknown) => { ok: true; value: unknown } | { ok: false; issue: string } {
  // => the test caller: identical to the starter, routes by name
  return (name: string, input: unknown) => {
    // => each call looks its procedure up by name
    const handler: ((input: unknown) => unknown) | undefined = routes[name]; // => route lookup
    if (handler === undefined) {
      // => missing procedure: the routing error
      return { ok: false, issue: "unknown procedure: " + name }; // => still possible for typos
    } // => procedure found: fall through
    return { ok: true, value: handler(input) }; // => handler runs in-process
  };
}
// => The new procedure's gate: non-empty strings in, named rejections out.
function checkName(input: unknown): { ok: true; name: string } | { ok: false; issue: string } {
  // => the new procedure's input gate: non-empty strings only
  if (typeof input !== "string" || input.length === 0) {
    // => blank renames are rejected at the schema
    return { ok: false, issue: "name: expected non-empty string" }; // => gate error
  } // => valid name: fall through
  return { ok: true, name: input }; // => trusted name out
}
// => Version two of the router: getName verbatim plus the new rename procedure.
function main(): void {
  // => entry point; both procedures route, the old one unchanged
  // => the v2 router: getName verbatim plus the new rename procedure
  const caller = createCaller({
    // => getName copied untouched from v1
    getName: () => "Ada", // => old procedure, old behavior
    rename: (input: unknown) => {
      // => new procedure: schema gate then the rename
      const checked = checkName(input); // => gate runs first
      return checked.ok ? "renamed to " + checked.name : "rejected: " + checked.issue; // => gate decides
    },
  });
  // => the old client call still passes with the old answer
  const old = caller("getName", null); // => existing client call
  // => The old client call still passes with the old answer.
  if (old.ok) {
    // => unchanged behavior is the point
    console.log("solution: getName=" + String(old.value)); // => old path still green
  } // => old done
  // => the new client call now routes and renames
  const renamed = caller("rename", "Grace"); // => new client call, new procedure
  if (renamed.ok) {
    // => narrow before reading the answer
    console.log("solution: " + String(renamed.value)); // => fixed: new procedure live
  } // => renamed done
}
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-04-add-router-procedure/expected/main.stdout.txt`):

```text
solution: getName=Ada
solution: renamed to Grace
```

### Kata 5: validate, then run -- compose a Zod gate with an Effect

The starter casts a wire string into the discount effect, printing a rate
from a lie. Parse first with a schema gate (numbers 0-100 only), run the
effect on trusted numbers, and prove the string stops at the gate while 40
still computes its rate.

**Before** (`drilling/code/kata-05-validate-then-run/before/starter.ts`):

```typescript
// => Kata 5 starter: the discount effect runs on unvalidated input.
// => Task: parse first with a schema gate, then run the effect on trusted input.
function discountEffect(pct: number): { ok: true; rate: number } | { ok: false; error: string } {
  // => the effect: applies the discount rate or fails when overdrawn
  if (pct > 50) {
    // => business rule: never discount more than half
    return { ok: false, error: "discount capped at 50" }; // => typed error value
  } // => within cap: fall through
  return { ok: true, rate: 1 - pct / 100 }; // => the multiplier
}
function main(): void {
  // => entry point; a string input reaches the numeric effect unchecked
  // => the wire hands over a string and the effect trusts it blindly
  const wire: unknown = "40"; // => query params arrive as strings
  const rate = discountEffect(wire as number); // => BUG: cast instead of parse
  if (rate.ok) {
    // => the arithmetic silently coerces: "40" behaves like 40 until it does not
    console.log("starter: rate=" + String(rate.rate) + " (unvalidated cast)"); // => starter prints a rate from a lie
  } // => starter done
  // => the task: a schema gate so only real numbers reach the effect
  console.log("wanted: gate rejects non-numbers"); // => target after the fix
}
main(); // => run once; a throw exits nonzero
```

**After** (`drilling/code/kata-05-validate-then-run/after/solution.ts`):

```typescript
// => Kata 5 solution: the schema gate parses, the effect runs on trusted numbers only.
// => Parse-dont-validate meets the typed error channel: boundary first, logic second.
function checkPct(input: unknown): { ok: true; pct: number } | { ok: false; issue: string } {
  // => the schema gate: real numbers in range, everything else rejected
  if (typeof input !== "number" || !Number.isFinite(input) || input < 0 || input > 100) {
    // => strings, NaN, and out-of-range numbers never reach the effect
    return { ok: false, issue: "pct: expected number 0-100" }; // => gate error with the range
  } // => trusted number: fall through
  return { ok: true, pct: input }; // => trusted pct out
}
function discountEffect(pct: number): { ok: true; rate: number } | { ok: false; error: string } {
  // => the effect, unchanged: runs only on schema-trusted input now
  if (pct > 50) {
    // => business rule: never discount more than half
    return { ok: false, error: "discount capped at 50" }; // => typed error value
  } // => within cap: fall through
  return { ok: true, rate: 1 - pct / 100 }; // => the multiplier
}
function applyDiscount(input: unknown): { ok: true; rate: number } | { ok: false; issue: string } {
  // => the composed boundary: schema gate first, effect second
  const checked = checkPct(input); // => Zod's job: validate
  if (!checked.ok) {
    // => gate failed: the effect never runs
    return { ok: false, issue: checked.issue }; // => gate error out
  } // => gate passed: fall through to the effect
  const result = discountEffect(checked.pct); // => Effect's job: the fallible logic
  if (!result.ok) {
    // => effect failed: its error becomes the reply
    return { ok: false, issue: result.error }; // => effect error out
  } // => effect succeeded: fall through
  return { ok: true, rate: result.rate }; // => the multiplier out
}
function main(): void {
  // => entry point; a string is gated, an over-cap number fails the effect, 40 succeeds
  // => the string from the wire stops at the gate: no cast, no coercion
  const gated = applyDiscount("40"); // => hostile wire input
  if (!gated.ok) {
    // => the gate names the expected shape
    console.log("gated: " + gated.issue); // => fixed: gate rejects non-numbers
  } // => gated done
  // => a valid number passes the gate and the effect computes the rate
  const valid = applyDiscount(40); // => honest numeric input
  if (valid.ok) {
    // => narrow before reading the rate
    console.log("valid: rate=" + String(valid.rate)); // => gate plus effect agree
  } // => valid done
}
main(); // => run once; a throw exits nonzero
```

**Output** (`drilling/code/kata-05-validate-then-run/expected/main.stdout.txt`):

```text
gated: pct: expected number 0-100
valid: rate=0.6
```

## Self-check checklist

Twenty-four "I can ..." items, at least one per concept. Check an item only
when you have done it against a running model, not when you have read about
it. Any unchecked item names your next drilling session.

1. I can derive a static type from a runtime schema instead of writing both by hand (co-01).
2. I can extend and merge schemas without mutating the shared base (co-01).
3. I can route heterogeneous payloads through a discriminated union tag (co-01, co-02).
4. I can choose safeParse for expected failure and parse for impossible failure (co-02).
5. I can turn `JSON.parse` output into a trusted value or a named rejection (co-02).
6. I can validate arrays per item with indexed error collection (co-02).
7. I can coerce wire shapes and transform validated values without mixing the two (co-02).
8. I can brand validated strings so same-shaped ids stay incompatible (co-01, co-02).
9. I can model an operation that can fail with a typed error channel (co-03).
10. I can list every failure mode of an operation as an error union (co-03).
11. I can catch one error by tag while letting the others pass through (co-03, co-04).
12. I can separate expected failures from defects and handle each proportionally (co-03, co-13).
13. I can gate nullable and throwing edges into the typed world (co-02, co-03).
14. I can chain effects with short-circuiting and join independent ones into tuples (co-04).
15. I can bound a flaky effect with a retry budget and keep the final error honest (co-04).
16. I can inject a service as an argument and swap production for test layers (co-05, co-16).
17. I can scope resources so release is structural and leaks read zero (co-04, co-05).
18. I can build a procedure with validated input and compose routers by checked merge (co-07).
19. I can thread context through middleware so handlers never touch tokens (co-05, co-07).
20. I can derive client types from the router and read a rename as a build break (co-06).
21. I can share one schema across the wire and type procedure errors end to end (co-01, co-03, co-06).
22. I can model a UI flow as an explicit machine with guarded transitions and refused impossible moves (co-08, co-10, co-11).
23. I can scale a machine with nesting, parallelism, history, and invocation (co-09).
24. I can match a gap to its tool, combine the tools coherently, and test each at its seam (co-12, co-14, co-15, co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts, each naming a design choice and a rejected
alternative, with a model answer. Say your answer aloud before reading the
model: explaining is the test, and hesitation marks the gap.

### Why validate at the boundary instead of at use?

The choice: one schema gate where untrusted data enters. The rejected
alternative: validating at every use site, where each consumer re-checks what
it touches. The model answer: use-site validation rots because N consumers
mean N copies of the rule and N chances to forget; boundary validation checks
once and every downstream value is trusted by construction. The cost of the
chosen design is a gate that must exist before any use, which slows the first
endpoint and speeds every later one. Example 7's lying `"7"` is the proof:
one gate rejects it; ten use-sites would each need the same check.

### Why return typed errors instead of throwing them?

The choice: failures as values in a typed channel the signature advertises.
The rejected alternative: throwing, which keeps signatures clean and pushes
handling to catch blocks. The model answer: thrown errors are invisible in the
type, so handling is optional and forgetting is silent; typed errors force
every caller to confront every failure mode, and exhaustive matching turns new
failures into build breaks. The cost is verbosity: every fallible call
branches, and pipelines need combinators instead of semicolons. Example 24's
`Conflict` tag is the proof: the client matches it and renders the fix, which
no catch block could have typed.

### Why share router types with the client instead of versioning the API?

The choice: one router type read on both sides, so drift breaks the build.
The rejected alternative: versioned endpoints (`/v1`, `/v2`) with handwritten
client types per version. The model answer: versions multiply the surfaces to
maintain while the handwritten copies still rot; derivation deletes the second
source of truth entirely. The cost is coupling: client and server must see the
same type, which suits monorepos better than public APIs with independent
release trains. Example 29's rename is the proof: one line breaks in CI versus
a week of blank cards in production.

### Why model UI flow as a machine instead of flags with guards?

The choice: named states with a transition table that omits illegal moves. The
rejected alternative: boolean flags plus `if` checks in handlers, which is
less code for simple flows. The model answer: flags admit every combination
and checks are per-handler, so each new flag doubles the combinations and
each new handler risks forgetting a check; the machine admits only listed
moves, so safety is the absence of code rather than the presence of checks.
The cost is upfront modeling: simple toggles feel heavier as machines until
the second flag arrives. Example 43's refused double-pay is the proof: no
transition exists, so no check was needed.

### Why compose all four tools instead of standardizing on one?

The choice: each gap gets its tool (schema for input, Effect for failure,
tRPC for the contract, XState for the flow). The rejected alternative: one
framework for everything, which minimizes dependencies and concepts. The model
answer: no single tool covers all four gaps (a machine cannot validate JSON,
a schema cannot route calls), so standardizing on one leaves three gaps
hand-rolled; composition pays four learning costs once and reuses each tool
where it is strongest. The cost is real: four APIs, four idioms, four failure
styles to learn. Example 46's submit flow is the proof: each tool does its own
job and the combination reads as gate, run, reply, render.

### Why test at the seam instead of through the UI?

The choice: hostile inputs for schemas, failing layers for Effects,
in-process callers for procedures, event scripts for machines. The rejected
alternative: end-to-end UI tests covering everything, which prove the real
user path. The model answer: seam tests break exactly when the contract
breaks and run in milliseconds with zero fixtures; UI tests break when
anything changes (copy, timing, layout) and take seconds with full fixtures.
The cost is that seams can agree while the composition disagrees, which is why
the capstone trace exists: seam suites plus one composed trace. Example 48's
illegal-step failure is the proof: the suite names the exact state and event
instead of screenshotting a wrong page.

---

← Previous: [Learning Overview](../learning/overview.md) · Back to: [Course Overview](../overview.md) →
