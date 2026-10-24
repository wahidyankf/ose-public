---
title: "Drilling Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns reading into reflexes: recall the concept cold, apply it to a judgement call,
build it with your hands, then check yourself against a list. Work the sections in order --
recall first, because everything later assumes the vocabulary; problems second, because
judgement needs facts; katas third, because hands need both; the checklists last, because
self-grading only works after attempting.

## Recall Q&A

Twenty-four short-answer questions, one or two per concept below. Answer from memory, then
check. Star the ones you miss and repeat them after a day; spaced repetition only works when
the misses decide what comes back.

### Q1 (co-01): Which locator do you reach for first, and why?

<details><summary>Answer</summary>

`getByRole` with an accessible name first, then `getByLabel` for controls, then `getByTestId`
for the rest. CSS selectors come last because they couple the test to styling.

</details>

### Q2 (co-01): What does strict mode do when a locator matches twice?

<details><summary>Answer</summary>

It fails the action instead of picking one match. Narrow the locator with a filter or a more
specific name until exactly one element resolves.

</details>

### Q3 (co-02): What waits before every Playwright action?

<details><summary>Answer</summary>

Actionability: attached, visible, stable across two frames, enabled, and receiving events. The
action retries these preconditions until they all hold or the timeout expires.

</details>

### Q4 (co-02): Why is a fixed sleep worse than a condition wait in both directions?

<details><summary>Answer</summary>

Too short flakes when the app is slow; too long wastes time when the app is fast. A condition
wait returns the moment the app is ready, so it is faster and more reliable at once.

</details>

### Q5 (co-03): What runs before and after a fixture's `use()` call?

<details><summary>Answer</summary>

Everything before `use()` is setup and runs before the test; everything after is teardown and
runs after the test, even when the test fails.

</details>

### Q6 (co-03): When does a worker-scoped fixture build, and when does it tear down?

<details><summary>Answer</summary>

It builds once, on first use by any test on that worker, and tears down after the worker's
last test. Use it for servers and app instances, never for mutable per-test state.

</details>

### Q7 (co-04): What does a navigation action return, and why?

<details><summary>Answer</summary>

The next page object. Returning it chains the journey in code and makes impossible journeys
unrepresentable: dashboard actions cannot run before a login that returns the dashboard.

</details>

### Q8 (co-04): Where do shared test steps belong, and where do they not belong?

<details><summary>Answer</summary>

In plain helper functions that take the page, imported where needed. Not in base classes,
which lock every test into one hierarchy and rot on the third cross-cutting concern.

</details>

### Q9 (co-05): What does the route handler see that the pixels cannot show?

<details><summary>Answer</summary>

The outgoing request: method, URL, and body. Asserting on the payload tests the real
frontend-backend contract, while the confirmation banner renders for any 200.

</details>

### Q10 (co-05): When do you abort requests instead of fulfilling them?

<details><summary>Answer</summary>

For heavy decoration a layout or logic test never looks at: images, fonts, media. Aborting
saves the download time and removes slow third-party requests from tests that ignore them.

</details>

### Q11 (co-06): What does a trace capture that a stack trace cannot?

<details><summary>Answer</summary>

Actions, network, console, and DOM snapshots in order, replayable step by step. It shows what
was really under the pointer and what the screen really showed at the failing moment.

</details>

### Q12 (co-06): Which video policy records only the interesting runs?

<details><summary>Answer</summary>

`video: "on-first-retry"` (with `trace: "on-first-retry"`). Green runs record nothing; the
retry after a failure is the footage worth watching and storing.

</details>

### Q13 (co-07): When does a screenshot baseline change, and who approves it?

<details><summary>Answer</summary>

Only when the UI genuinely changed, and only after a human reviews the diff and runs with
`--update-snapshots`. Auto-updating on red turns the gate into a mirror.

</details>

### Q14 (co-07): What do you mask, and what must stay exact?

<details><summary>Answer</summary>

Mask what legitimately changes every run: clocks, avatars, ads. Everything else stays under
exact comparison, because the mask excuses only the regions you named.

</details>

### Q15 (co-08): What does an axe scan assert, and where does it run?

<details><summary>Answer</summary>

Zero violations -- missing names, bad structure, contrast -- inside the same browser the
functional tests already drive. One more assertion, not a new harness.

</details>

### Q16 (co-09): What starts empty in every test, and what shares by choice?

<details><summary>Answer</summary>

Every test starts with a fresh browser context: empty cookies, storage, and history. Sharing
happens only through an explicit storage-state file, never through leftovers.

</details>

### Q17 (co-10): What is the retry budget, and what does three reds mean?

<details><summary>Answer</summary>

Two retries on CI, zero locally. Three reds in a row means genuinely broken, not unlucky:
stop retrying and diagnose the app or the test.

</details>

### Q18 (co-10): Why retry the flaky step instead of the whole test?

<details><summary>Answer</summary>

Whole-test retries re-run minutes of solid setup to forgive one flaky second, and they hide
which step hurt. Step retries cost one extra attempt of the guilty step and document the
flakiness at its source.

</details>

### Q19 (co-11): What must hold before you shard or parallelize?

<details><summary>Answer</summary>

Independence: fresh contexts and unique per-worker data. Parallelism divides wall time only
when tests cannot collide; shared names turn speed into order flakes.

</details>

### Q20 (co-11): How do sharded results become one report?

<details><summary>Answer</summary>

Each shard writes a blob report, and `merge-reports` combines them into one HTML report after
every shard finishes. Unmerged shards leave the verdict scattered across machines.

</details>

### Q21 (co-12): Who types the password, how often, and where does it live after?

<details><summary>Answer</summary>

The setup project types it once per run and writes the storage-state file; every other test
loads the file. No test body contains credentials, and expiry renews in setup, not mid-suite.

</details>

### Q22 (co-13): What does `mount` give you that a page cannot?

<details><summary>Answer</summary>

One component with no page, router, or backend: props in, pixels and events out, in
milliseconds. Page tests keep proving journeys; component tests prove widgets in isolation.

</details>

### Q23 (co-14): When do you reach for the request context instead of the page?

<details><summary>Answer</summary>

For API contract coverage: status, shape, and auth behavior with no rendering costs. Request
tests run the same assertions against the same backend in milliseconds of browser time.

</details>

### Q24 (co-15): How do you tell an app race from a flaky test?

<details><summary>Answer</summary>

Reproduce the overlap deterministically: two increments through read-then-write lose one
update no matter how patient the test is. Serialization fixing it convicts the backend; order
dependence across suite permutations convicts shared state.

</details>

## Applied problems

Eight judgement problems drawn from real suite shapes. Work each on paper before comparing.

### Problem 1: Pick the locator for a redesigned checkout

The checkout button's classes change every sprint, its text stays "Pay now", and the suite
breaks monthly. Name the locator strategy, the exact call, and what survives the next
redesign. A strong answer picks `getByRole("button", { name: "Pay now" })` with a `data-testid`
fallback, and names CSS classes as the thing that must never be asserted on. A weak answer
keeps the class selector and schedules the next fix for the next redesign.

### Problem 2: Kill a fixed sleep without losing the guarantee

A test sleeps two seconds after clicking Save, then asserts the toast. On slow CI it flakes;
everywhere else it wastes two seconds. Rewrite the wait as a condition, name the exact
assertion, and state what the suite gains in both directions. A strong answer uses
`expect(toast).toBeVisible()`, gains speed locally and reliability on CI, and deletes the
sleep instead of shortening it. A weak answer trims the sleep to one second, keeping both
failure modes at half price.

### Problem 3: Cover an error path nobody has seen

The cart API has never failed in tests, and the error banner has never rendered. Design the
mock that exercises it: the route, the status, and the two assertions (banner shown, total
hidden) that prove the path. A strong answer fulfills the route with a 500, asserts the
banner text and the absent total, and adds the recovery case at 200. A weak answer asserts
only that the request failed, which tests the mock instead of the UI.

### Problem 4: Split login cost out of eighty tests

Eighty tests each log in, and the login rate limit fires weekly. Redesign the auth flow: one
setup project, one state file per role, and the dependency line that wires them. A strong
answer names `auth.setup.ts`, the storage-state path, and the project dependency, with login
count dropping from eighty to one. A weak answer caches the password in a helper, which
shares the secret but repeats the cost.

### Problem 5: Name the culprit from a trace excerpt

A click fails with "element is not receiving events". The trace shows the pointer at the Pay
button's coordinates and the topmost element as `promo-overlay`. Name the fix, the file it
lands in, and what you explicitly do not change. A strong answer dismisses or reorders the
overlay in the app code and leaves the locator untouched. A weak answer strengthens the
locator, which passes until the next overlay eats the next click.

### Problem 6: Decide retry or fix for a coupon step

A coupon step fails one run in five; everything else is solid. Choose between a step retry, a
test retry, and a quarantine entry, with the cost of each. A strong answer wraps the step in
a bounded retry, names the step as the flaky boundary, and files the backend hiccup as the
follow-up. A weak answer quarantines the test, hiding the only signal about the coupon
service's reliability.

### Problem 7: Shard a twenty-minute suite onto four machines

The suite is independent but runs twenty minutes on one machine. Plan the sharding: the flag,
the independence proof you check first, and how the four reports become one verdict. A strong
answer uses `--shard=i/4` on four machines after verifying unique per-worker data, then
merges the blob reports into one HTML report. A weak answer shards without the data check and
discovers the shared-user collisions on the first parallel run.

### Problem 8: Review a baseline update request

A visual diff shows the receipt total moved from $42.00 to $41.90 with no linked product
change. Decide whether to bless the baseline, and list the two questions you ask first. A
strong answer refuses the update until someone names the intended price change and its
source: unexplained money movement is a bug until proven to be a decision. A weak answer
updates the snapshot to stop the red, converting the gate into an approval stamp.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows
one good solution with its recorded output. Make the starter match before peeking. Work them
in order: waiting and locators first, because every later kata assumes the suite waits
properly; interception and auth next, because they isolate the two skills production suites
use daily; structure and diagnosis after, because they train the reflexes red builds demand;
the visual decision last, because it assembles strictness and judgement into one gate.

### Kata 01: Replace Fixed Delay With Real Wait

(Concepts: co-02.)

Turn the starter's fixed sleep into a condition wait. Start from the starter, which passes
slowly, and match the reference: same verdict, a third of the cost.

**Before** (`drilling/code/kata-01-replace-fixed-delay-with-real-wait/before/starter.ts`):

```typescript
// Kata 1 starter: the test sleeps a fixed 10 ticks, then asserts. It passes,
// but every run pays the full sleep even though the toast renders at tick 3.
// Task: replace the fixed sleep with a condition wait (see Example 10). The
// test must still pass and must finish earlier than tick 10.
async function main(): Promise<void> {
  const slept = 10; // fixed sleep: the whole budget, every run
  const toastAt = 3; // the toast actually renders at tick 3
  const pass: boolean = slept >= toastAt; // passes, but paid 10 for 3
  console.log("passes: " + String(pass));
  console.log("cost ticks: " + String(slept));
  console.log("wasted: " + String(slept - toastAt));
}

await main();
```

**After** (`drilling/code/kata-01-replace-fixed-delay-with-real-wait/after/solution.ts`):

```typescript
// Kata 1 solution: wait for the toast (condition), not the clock. The wait
// returns at tick 3, saving 7 ticks over the starter every single run.
// (co-02: auto-waiting)
async function main(): Promise<void> {
  // => entry point
  const toastAt = 3; // => the toast renders at tick 3
  const landed: number = waitForVisible(toastAt, 10); // => real: await expect(toast).toBeVisible()
  console.log("passes: " + String(landed === toastAt)); // => Output: passes: true
  console.log("cost ticks: " + String(landed)); // => Output: cost ticks: 3
  console.log("saved: " + String(10 - landed)); // => Output: saved: 7
} // => the condition beat the clock

function waitForVisible(appearsAt: number, timeout: number): number {
  // => stand-in for expect().toBeVisible()
  for (let tick = 0; tick <= timeout; tick++) {
    // => poll once per tick
    if (tick >= appearsAt) {
      // => visible from its tick on
      return tick; // => return the first true tick
    } // => not yet visible
  } // => timeout exhausted
  return -1; // => real Playwright throws expect.toBeVisible timed out
} // => waitForVisible returns the landing tick or -1

await main(); // => run once
```

**Output** (`drilling/code/kata-01-replace-fixed-delay-with-real-wait/expected/main.stdout.txt`):

```text
passes: true
cost ticks: 3
saved: 7
```

**Key takeaway**: Replace every fixed sleep with the condition it was papering over -- the
wait returns when the app is ready, not when the clock runs out.

**Why it matters**: This is the single highest-value edit in most UI suites: one sleep removed
per test compounds into minutes per run and zero sleep-flakes. Repeat it until condition waits
are the reflex and fixed sleeps look like what they are -- guesses with a timer.

### Kata 02: Brittle Selector to Resilient Locator

(Concepts: co-01.)

Move the starter's CSS selector to a test id. Start from the starter, which breaks on
redesign, and match the reference: green before and after the class rename.

**Before** (`drilling/code/kata-02-brittle-selector-to-resilient-locator/before/starter.ts`):

```typescript
// Kata 2 starter: the test locates Checkout by CSS class. After the redesign
// renames every class, the selector finds nothing and the test goes red --
// even though the button is right there.
// Task: switch to a resilient locator (see Example 4). The test must pass
// before AND after the redesign.
async function main(): Promise<void> {
  const html = '<button class="btn-primary-x">Checkout</button>';
  const before: boolean = html.includes('class="btn-primary-x"');
  const redesigned: string = html.replace(/btn-primary-x/g, "cta-ember-2");
  const after: boolean = redesigned.includes('class="btn-primary-x"');
  console.log("passes before redesign: " + String(before));
  console.log("passes after redesign: " + String(after));
  console.log("redesign broke it: " + String(before && !after));
}

await main();
```

**After** (`drilling/code/kata-02-brittle-selector-to-resilient-locator/after/solution.ts`):

```typescript
// Kata 2 solution: locate by test id, which ignores styling churn. The test
// passes before and after the redesign with no changes.
// (co-01: locator)
async function main(): Promise<void> {
  // => entry point
  const html = '<button class="btn-primary-x" data-testid="checkout-submit">Checkout</button>'; // => the test hook survives styling
  const redesigned: string = html.replace(/btn-primary-x/g, "cta-ember-2"); // => the redesign renames classes only
  const before: boolean = html.includes('data-testid="checkout-submit"'); // => real: getByTestId("checkout-submit")
  const after: boolean = redesigned.includes('data-testid="checkout-submit"'); // => same locator, restyled page
  console.log("passes before redesign: " + String(before)); // => Output: passes before redesign: true
  console.log("passes after redesign: " + String(after)); // => Output: passes after redesign: true
  console.log("redesign-proof: " + String(before && after)); // => Output: redesign-proof: true
} // => the hook outlived the stylesheet

await main(); // => run once
```

**Output** (`drilling/code/kata-02-brittle-selector-to-resilient-locator/expected/main.stdout.txt`):

```text
passes before redesign: true
passes after redesign: true
redesign-proof: true
```

**Key takeaway**: Anchor selectors to test ids, not to the stylesheet -- redesigns should
change pixels, not verdicts.

**Why it matters**: Every CSS-coupled selector is a scheduled false failure. Converting them
one kata at a time is how a suite stops dreading redesigns: the hook outlives the stylesheet,
so the next visual refresh passes without a single test edit.

### Kata 03: Intercept Request and Assert

(Concepts: co-05.)

Move the starter's pixel-only assertion down to the request payload. Start from the starter,
which passes on the wrong order, and match the reference: wrong payloads fail, right ones
pass.

**Before** (`drilling/code/kata-03-intercept-request-and-assert/before/starter.ts`):

```typescript
// Kata 3 starter: the test asserts only the confirmation banner. The banner
// renders for any 200 -- including one that saved the wrong item -- so the
// test passes while the order is wrong.
// Task: intercept the request and assert on its payload (see Example 28).
// The test must fail when the payload is wrong and pass when it is right.
async function main(): Promise<void> {
  const banner = "Order confirmed"; // the UI always says this on 200
  const savedItem = "bread"; // ...but the backend saved the wrong item
  const pass: boolean = banner === "Order confirmed"; // pixels only: blind to the payload
  console.log("banner shown: " + String(pass));
  console.log("saved item: " + savedItem);
  console.log("test blind to payload: " + String(pass && savedItem !== "milk"));
}

await main();
```

**After** (`drilling/code/kata-03-intercept-request-and-assert/after/solution.ts`):

```typescript
// Kata 3 solution: capture the outgoing request in the route handler and
// assert on its payload before answering. Wrong payloads fail the test even
// when the banner would have rendered.
// (co-05: network-interception)
interface Captured {
  // => what the app sent
  url: string; // => the request URL
  item: string; // => the ordered item
  count: number; // => the ordered count
} // => Captured is the contract under test

async function main(): Promise<void> {
  // => entry point
  const seen: Captured[] = []; // => every intercepted request lands here
  orderThroughRoute(seen, "milk", 2); // => the app orders correctly
  console.log("item: " + String(seen[0]?.item)); // => Output: item: milk
  console.log("count: " + String(seen[0]?.count)); // => Output: count: 2
  orderThroughRoute(seen, "bread", 2); // => the app orders the wrong item
  const last: number = seen.length - 1; // => the newest capture
  console.log("wrong payload caught: " + String(seen[last]?.item !== "milk")); // => Output: wrong payload caught: true
  console.log("payload asserted: " + String(seen[0]?.item === "milk" && seen[0]?.count === 2)); // => Output: payload asserted: true
} // => the payload, not the pixels, decides

function orderThroughRoute(seen: Captured[], item: string, count: number): void {
  // => stand-in for route + assertions
  seen.push({ url: "/api/order", item: item, count: count }); // => the handler inspects the request here
} // => orderThroughRoute records what the app sent

await main(); // => run once
```

**Output** (`drilling/code/kata-03-intercept-request-and-assert/expected/main.stdout.txt`):

```text
item: milk
count: 2
wrong payload caught: true
payload asserted: true
```

**Key takeaway**: Test the request the app sends, not just the banner it renders -- the
payload is the contract, the pixels are the receipt.

**Why it matters**: Pixel-only assertions bless wrong orders with success banners. Request
assertions catch the integration bug where it lives -- in the payload -- while the evidence
is still on the table instead of in a customer's inbox.

### Kata 04: Fixture for Logged-In State

(Concepts: co-12, co-03.)

Move the starter's per-test logins into one shared session. Start from the starter, which
types the password three times, and match the reference: three tests, one login.

**Before** (`drilling/code/kata-04-fixture-for-logged-in-state/before/starter.ts`):

```typescript
// Kata 4 starter: every test types the login itself. Three tests mean three
// logins -- slow, and one rate limit away from a red suite.
// Task: log in once and share the session (see Example 22). The password
// must be typed exactly once no matter how many tests need it.
async function main(): Promise<void> {
  let logins = 0; // how many passwords got typed
  for (const test of ["cart", "orders", "profile"]) {
    // three tests, each logging in
    logins += 1; // type the password again
    void test; // the test would run here
  } // every test logged in separately
  console.log("tests: 3");
  console.log("logins: " + String(logins));
  console.log("login per test: " + String(logins === 3));
}

await main();
```

**After** (`drilling/code/kata-04-fixture-for-logged-in-state/after/solution.ts`):

```typescript
// Kata 4 solution: log in once, save the session, and let every test load
// it. Three tests, one password typed.
// (co-12: authentication-state, co-03: fixture)
async function main(): Promise<void> {
  // => entry point
  let logins = 0; // => how many passwords got typed
  let saved: string | null = null; // => the shared session, empty at first
  for (const test of ["cart", "orders", "profile"]) {
    // => three tests
    if (saved === null) {
      // => no session yet: log in once
      logins += 1; // => the single real login
      saved = "session-for-ada"; // => storageState written
    } // => later tests reuse the session
    void test; // => the test runs logged in
  } // => every test served
  console.log("tests: 3"); // => Output: tests: 3
  console.log("logins: " + String(logins)); // => Output: logins: 1
  console.log("one login serves all: " + String(logins === 1)); // => Output: one login serves all: true
} // => the password was typed once

await main(); // => run once
```

**Output** (`drilling/code/kata-04-fixture-for-logged-in-state/expected/main.stdout.txt`):

```text
tests: 3
logins: 1
one login serves all: true
```

**Key takeaway**: Log in once per run and share the session -- the password is typed by the
setup, never by the tests.

**Why it matters**: Per-test logins tax every run with the slowest flow in the app and invite
rate limits to fail the suite at random. One shared session removes the tax and the
randomness together, which is the cheapest reliability upgrade available.

### Kata 05: Page-Object Extraction

(Concepts: co-04.)

Extract the starter's duplicated selector sequences into one page object. Start from the
starter, which writes every step twice, and match the reference: one definition, two users.

**Before** (`drilling/code/kata-05-page-object-extraction/before/starter.ts`):

```typescript
// Kata 5 starter: two tests repeat the same raw selector sequence. When the
// login form changes, both copies must change -- and one will be forgotten.
// Task: extract a page object (see Example 35). The selectors must appear in
// exactly one place.
async function main(): Promise<void> {
  const stepsA: string[] = ["fill #user", "fill #pass", "click #signin"]; // test one: raw selectors
  const stepsB: string[] = ["fill #user", "fill #pass", "click #signin"]; // test two: same raw selectors again
  const copies: number = stepsA.length + stepsB.length; // every step written twice
  console.log("selector steps written: " + String(copies));
  console.log("single definition: false");
  console.log("duplicated: " + String(copies === 6));
}

await main();
```

**After** (`drilling/code/kata-05-page-object-extraction/after/solution.ts`):

```typescript
// Kata 5 solution: one LoginPage class owns the selectors; both tests call
// loginAs. A form change touches one class, never the tests.
// (co-04: page-object)
class LoginPage {
  // => the single owner of the login selectors
  logins: number; // => how many logins ran through the object
  constructor() {
    // => no test touches a selector anymore
    this.logins = 0; // => nothing run yet
  } // => construction ends
  loginAs(user: string): boolean {
    // => real: fill user, fill pass, click Sign in
    this.logins += 1; // => the intent runs once per call
    return user === "ada"; // => the modeled verdict
  } // => loginAs performs the whole intent
} // => LoginPage hides every selector

async function main(): Promise<void> {
  // => entry point
  const page: LoginPage = new LoginPage(); // => both tests share the object
  const one: boolean = page.loginAs("ada"); // => test one: intent, not selectors
  const two: boolean = page.loginAs("ada"); // => test two: same intent
  console.log("both pass: " + String(one && two)); // => Output: both pass: true
  console.log("selector definitions: 1"); // => Output: selector definitions: 1
  console.log("single definition: " + String(page.logins === 2)); // => Output: single definition: true
} // => one class served both tests

await main(); // => run once
```

**Output** (`drilling/code/kata-05-page-object-extraction/expected/main.stdout.txt`):

```text
both pass: true
selector definitions: 1
single definition: true
```

**Key takeaway**: Extract duplicated selector sequences into a page object on the second copy
-- never let the third copy happen.

**Why it matters**: The second copy feels harmless and the fifth copy is a maintenance trap:
five places to update, four that get updated. Extracting at two keeps the "define once" rule
true from the start, when the extraction is still trivial.

### Kata 06: Read Trace to Name Misclick

(Concepts: co-06.)

Replace the starter's hasty "locator broken" verdict with trace evidence. Start from the
starter, which never opens the trace, and match the reference: the overlay convicted, the
locator cleared.

**Before** (`drilling/code/kata-06-read-trace-to-name-misclick/before/starter.ts`):

```typescript
// Kata 6 starter: the test failed with "button not clickable" and the first
// instinct was to blame the locator. The locator is fine -- but nothing in
// this file looks at the trace, so the wrong fix is one edit away.
// Task: read the trace and name the real culprit (see Example 63). The
// diagnosis must point at the overlay, not the locator.
async function main(): Promise<void> {
  const error = "button not clickable"; // the failure text
  const diagnosis = "locator broken"; // the hasty (wrong) conclusion
  console.log("error: " + error);
  console.log("diagnosis: " + diagnosis);
  console.log("trace consulted: false");
}

await main();
```

**After** (`drilling/code/kata-06-read-trace-to-name-misclick/after/solution.ts`):

```typescript
// Kata 6 solution: the trace records what was really under the pointer --
// a promo overlay -- so the locator is innocent and the layout is guilty.
// (co-06: trace-viewer)
async function main(): Promise<void> {
  // => entry point
  const hit = "promo-overlay"; // => the trace: what the click really hit
  const aimed = "pay-button"; // => what the locator resolved
  console.log("aimed: " + aimed); // => Output: aimed: pay-button
  console.log("hit: " + hit); // => Output: hit: promo-overlay
  console.log("locator innocent: " + String(hit !== aimed)); // => Output: locator innocent: true
  console.log("fix the overlay: " + String(hit === "promo-overlay")); // => Output: fix the overlay: true
} // => the trace convicted the overlay

await main(); // => run once
```

**Output** (`drilling/code/kata-06-read-trace-to-name-misclick/expected/main.stdout.txt`):

```text
aimed: pay-button
hit: promo-overlay
locator innocent: true
fix the overlay: true
```

**Key takeaway**: Open the trace before editing the locator -- the snapshot shows what the
pointer really hit.

**Why it matters**: Hasty locator edits for layout problems break working selectors and leave
the overlay in place. The trace-first reflex converts a guess into evidence in the time it
takes to open the file, which pays for itself on the first misclick.

### Kata 07: Retry-Policy Fix

(Concepts: co-10, co-15.)

Bound the starter's whole-run retries to the guilty step and name the cause. Start from the
starter, which burns five full runs on a permanent bug, and match the reference: two step
attempts, cause named, zero whole runs burned.

**Before** (`drilling/code/kata-07-retry-policy-fix/before/starter.ts`):

```typescript
// Kata 7 starter: the test retries the WHOLE suite run five times around a
// backend bug that fails every time. Five runs, still red, and the retry log
// says nothing about the cause.
// Task: bound the retry to the flaky step and surface the real cause (see
// Examples 42 and 67). Retries must stay small and the cause must be named.
async function main(): Promise<void> {
  let runs = 0; // whole-test retries around a permanent bug
  for (let i = 0; i < 5; i++) {
    // five full runs
    runs += 1; // each run fails the same way
  } // budget burned, nothing learned
  console.log("runs burned: " + String(runs));
  console.log("cause named: false");
  console.log("wasteful: " + String(runs === 5));
}

await main();
```

**After** (`drilling/code/kata-07-retry-policy-fix/after/solution.ts`):

```typescript
// Kata 7 solution: retry only the flaky coupon step (bounded), and when it
// keeps failing, name the backend cause instead of burning whole runs.
// (co-10: retry-policy, co-15: flakiness-diagnosis)
async function main(): Promise<void> {
  // => entry point
  let attempts = 0; // => step attempts, bounded
  let cause = ""; // => the named cause when the step keeps failing
  for (let i = 0; i < 2; i++) {
    // => at most two tries of the guilty step
    attempts += 1; // => count this attempt
    cause = "coupon service hiccup"; // => the step reports its cause
  } // => budget spent on the step, not the suite
  console.log("step attempts: " + String(attempts)); // => Output: step attempts: 2
  console.log("cause named: " + cause); // => Output: cause named: coupon service hiccup
  console.log("whole runs burned: 0"); // => Output: whole runs burned: 0
  console.log("bounded and named: " + String(attempts === 2 && cause !== "")); // => Output: bounded and named: true
} // => small retry, named cause, no wasted runs

await main(); // => run once
```

**Output** (`drilling/code/kata-07-retry-policy-fix/expected/main.stdout.txt`):

```text
step attempts: 2
cause named: coupon service hiccup
whole runs burned: 0
bounded and named: true
```

**Key takeaway**: Spend retries on the guilty step with a small bound, and name the cause when
the bound runs out -- never burn whole runs on a permanent bug.

**Why it matters**: Whole-run retries around deterministic failures waste the most expensive
minutes in CI while producing zero information. Bounded step retries with named causes turn
the same failures into a to-do list with an owner, which is the only retry output that leads
anywhere.

### Kata 08: Visual Baseline Mask Decision

(Concepts: co-07.)

Unmute the starter's gate the right way: mask the clock, keep everything else exact. Start
from the starter, which mutes the gate instead of fixing it, and match the reference: time
ignored, genuine drift still red.

**Before** (`drilling/code/kata-08-visual-baseline-mask-decision/before/starter.ts`):

```typescript
// Kata 8 starter: the screenshot gate compares raw renders, so the clock in
// the header fails the test every minute. The team mutes the gate instead of
// fixing the comparison -- and now real regressions pass silently too.
// Task: mask the dynamic region but keep the gate strict (see Example 56).
// The clock must stop deciding, and genuine drift must still fail.
async function main(): Promise<void> {
  const first = "orders 10:41 milk"; // render at 10:41
  const second = "orders 10:42 milk"; // render at 10:42
  const muted = true; // the gate got muted instead of fixed
  console.log("unmasked equal: " + String(first === second));
  console.log("gate muted: " + String(muted));
  console.log("drift would pass silently: " + String(muted));
}

await main();
```

**After** (`drilling/code/kata-08-visual-baseline-mask-decision/after/solution.ts`):

```typescript
// Kata 8 solution: mask the clock, keep everything else exact. Time stops
// deciding the verdict, but a changed total still goes red.
// (co-07: visual-comparison)
async function main(): Promise<void> {
  // => entry point
  const masked = (render: string): string => render.replace(/[0-9]{1,2}:[0-9]{2}/g, "[time]"); // => the clock mask
  const ten41: string = masked("orders 10:41 milk $3.00"); // => render at 10:41
  const ten42: string = masked("orders 10:42 milk $3.00"); // => render at 10:42
  console.log("clock ignored: " + String(ten41 === ten42)); // => Output: clock ignored: true
  const drift: string = masked("orders 10:42 milk $2.40"); // => a genuine price change
  console.log("drift still red: " + String(ten41 !== drift)); // => Output: drift still red: true
  console.log("gate strict where it matters: " + String(ten41 === ten42 && ten41 !== drift)); // => Output: gate strict where it matters: true
} // => masked time, exact everything else

await main(); // => run once
```

**Output** (`drilling/code/kata-08-visual-baseline-mask-decision/expected/main.stdout.txt`):

```text
clock ignored: true
drift still red: true
gate strict where it matters: true
```

**Key takeaway**: Fix noisy gates with masks, never with mutes -- excuse exactly the dynamic
region and keep the comparison ruthless everywhere else.

**Why it matters**: Muted gates are deleted gates with extra steps: the team stops trusting
the check, then stops looking at it, then ships the regression it would have caught. Masks
keep the trust by removing only the noise, which is the difference between a gate and a
decoration.

## Self-check checklist

Grade your own readiness honestly. Every box should be checkable with one command or one file
before you claim the course is done.

- [ ] I can name the locator priority (role, label, test id, CSS last) and the strict-mode rule without looking.
- [ ] I can convert any `waitForTimeout` I find into the condition it was papering over.
- [ ] My fixtures build and destroy: every created order, user, and file has a teardown pair.
- [ ] My page objects expose intents (`loginAs`) and hide every selector in one definition each.
- [ ] My network tests assert on the request payload, not just the rendered pixels.
- [ ] My suite logs in once per run through a setup project and shares the state file.
- [ ] My visual tests mask clocks and dynamic regions, and red screenshots get reviewed before `--update-snapshots`.
- [ ] Every page I test gets an axe scan with zero violations before I call it done.
- [ ] My retries live on CI with a small budget and stay at zero locally.
- [ ] My suite shards cleanly because contexts are fresh and data is per-worker.
- [ ] Every red build keeps its trace, video, and screenshot where the debugger can open them.
- [ ] I can tell an app race from a flaky test by reproducing the overlap, not by waiting longer.

## Elaborative interrogation & self-explanation

Answer aloud, in your own words, before moving on. The best answers connect two clusters that
seemed unrelated.

1. Why does a resilient locator strategy (Beginner) decide whether sharding (Advanced) is even possible?
2. Explain how auto-waiting changes the meaning of a timeout from "how long the app may take" to "how wrong the app may be".
3. A teammate proposes `waitForTimeout(500)` "just to be safe" before every assertion. What two guarantees do they break, and what do you replace each sleep with?
4. Why does asserting on the request payload catch bugs that asserting on the confirmation banner cannot, even when both tests are green on the happy path?
5. Your suite passes alone and fails on CI. Walk through the isolation, order, and data checks in the order you would run them, and say what each result rules out.
6. A visual diff shows a one-pixel shift in the footer on every page. Is this a mask case, a baseline update, or a real bug -- and what question decides between the three?
7. Explain why retries belong in CI config and not in test code, and why the local value must stay zero even though "it passes on retry" feels productive.
8. How does a setup project change the failure signature of an expired credential from eighty red tests to one red setup -- and why is that cheaper to triage?
