---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Sixteen concepts, five drills: recall the vocabulary, apply it to production-shaped problems, fix eight katas from imperfect starters to green solutions, check yourself against twenty-four promises, and argue with the design choices until they feel inevitable. Work the sections in order; each assumes the previous.

## Recall Q&A

Answer each question from memory before opening its detail block: say the answer aloud in one or two sentences, then check. The questions follow the course order — requests first, validation and LiveViews next, realtime and supervision last — so a missed question points at the level worth reworking.

### Q1 (co-01)

What does a Phoenix route match on, and what does it ignore?

<details><summary>Answer</summary>

A route matches the HTTP method plus the path pattern and dispatches to a controller action. It ignores the query string, which the pipeline fetches into params separately.

</details>

### Q2 (co-01)

What happens when no route matches, and where does the 404 come from?

<details><summary>Answer</summary>

The router raises `NoRouteError`, which carries `plug_status: 404`. The endpoint renders that status into the 404 response — so the miss is an exception with its status attached, not a nil.

</details>

### Q3 (co-02)

How does a controller action answer JSON, and what sets the content type?

<details><summary>Answer</summary>

`json(conn, map)` encodes the map through Jason and sets `application/json` in one step. Tests assert both the decoded fields and the content-type header.

</details>

### Q4 (co-02)

Where do action parameters come from in a controller test?

<details><summary>Answer</summary>

From the test connection: the router merges path segments with the fetched query params into one params map, which the action receives as its second argument.

</details>

### Q5 (co-03)

What are the two jobs of a changeset at the web boundary?

<details><summary>Answer</summary>

`cast` keeps only the allowed fields from untrusted input, and validators (`validate_required`, `validate_length`, and friends) accept or reject the result as data — never by raising.

</details>

### Q6 (co-03)

How do you build a struct from valid input without a database?

<details><summary>Answer</summary>

`apply_action(changeset, :insert)` runs insert semantics in memory: `{:ok, struct}` for valid input, `{:error, changeset}` for invalid — the same function tests and previews use.

</details>

### Q7 (co-04)

What are mount's three arguments, and which one names the visitor?

<details><summary>Answer</summary>

`mount(params, session, socket)`: params carry the URL segments, session carries the signed visitor identity, socket carries the process state. The session — not params — names who it renders for.

</details>

### Q8 (co-04)

How often does mount run, and why does that matter?

<details><summary>Answer</summary>

Once per connected LiveView process — once per visitor, not once per deploy. State seeded in mount belongs to one user, which is why counters never leak across visitors.

</details>

### Q9 (co-05)

What is the contract of render, and how do you test it without a browser?

<details><summary>Answer</summary>

`render(assigns)` maps assigns to HTML. Mount, call render on the assigns, convert with `Phoenix.HTML.Safe.to_iodata`, and assert the string — the whole UI contract pinned in-process.

</details>

### Q10 (co-05)

When do you reach for a function component versus a slot?

<details><summary>Answer</summary>

A function component takes values through declared attributes (a greeting card needing a name); a slot takes inner content from the caller (a card shell wrapping varying guts). Attributes for data, slots for composition.

</details>

### Q11 (co-06)

What is the shape of handle_event, and what do its three outcomes mean?

<details><summary>Answer</summary>

`handle_event(name, payload, socket)` returns `{:noreply, socket}` for silent state changes or `{:reply, answer, socket}` when the triggering client needs confirmation. The payload carries the visitor's choice.

</details>

### Q12 (co-06)

How does a LiveView finish work that mount started but must not await?

<details><summary>Answer</summary>

Mount sends a message to itself (or starts a task) and keeps a loading flag; `handle_info` folds the answer into state when it lands. The flag bridges mount and message.

</details>

### Q13 (co-07)

What travels the wire after an event — the page or the difference?

<details><summary>Answer</summary>

Only the difference: LiveView re-renders, diffs against the previous render, and ships changed dynamic parts. Static markup stays byte-identical between renders.

</details>

### Q14 (co-07)

When do streams beat plain list assigns, and what keys the rows?

<details><summary>Answer</summary>

When lists grow long: streams send inserts and deletes as operations instead of re-rendering every row. Rows key by id, so inserts land without disturbing the rest.

</details>

### Q15 (co-08)

What decides whether a channel join succeeds, and what does refusal look like?

<details><summary>Answer</summary>

The join clauses pattern-match topic and params: a matching clause returns `{:ok, socket}` (often with assigns stored), a refusing one returns `{:error, %{reason: ...}}` naming the cause.

</details>

### Q16 (co-08)

What is the difference between handle_in and handle_out?

<details><summary>Answer</summary>

`handle_in` handles events from the joined client (and may reply); `handle_out` rewrites outgoing broadcasts per subscriber when the channel declares `intercept`. One serves the speaker, the other personalizes for each listener.

</details>

### Q17 (co-09)

How does one process's change become every visitor's new render?

<details><summary>Answer</summary>

The changer broadcasts on a topic; every subscribed LiveView receives the message in `handle_info` and folds it into assigns, which re-renders. PubSub is the only bridge between isolated processes.

</details>

### Q18 (co-09)

When do you use broadcast_from instead of broadcast?

<details><summary>Answer</summary>

When the sender already updated its own view — chat messages, cursor moves — and hearing its own shout would double-apply the change. `broadcast_from` delivers to every subscriber except the sender.

</details>

### Q19 (co-10)

What is the difference between a presence key and its metas?

<details><summary>Answer</summary>

The key names who (ada in room 7); the metas describe how (device, status). One key can carry many metas when the same user connects from several devices.

</details>

### Q20 (co-10)

How do LiveViews learn about presence changes without polling?

<details><summary>Answer</summary>

Presence delivers join and leave diffs as messages; the LiveView's `handle_info` folds each diff into its roster assigns. Quiet rooms cost nothing; busy ones cost exactly their churn.

</details>

### Q21 (co-11)

What does 'one process per connection' buy a LiveView application?

<details><summary>Answer</summary>

Isolation: each visitor's state lives in its own supervised process, so one user's bug, crash, or heavy interaction never touches another user's page — and the server stays up when any single process falls.

</details>

### Q22 (co-12)

What survives a supervised crash, and what does not?

<details><summary>Answer</summary>

The process restarts with initial state — fresh assigns, empty drafts. Only what was persisted outside the process (database rows, ETS tables owned elsewhere) survives. Unsaved process memory is gone by design.

</details>

### Q23 (co-13)

What are the two LiveView form events, and which changeset do they share?

<details><summary>Answer</summary>

`validate` rebuilds the changeset per keystroke and stores its errors; `save` applies the same changeset and either stores the struct or keeps the errors. Both events run one boundary function.

</details>

### Q24 (co-13)

Why does uniqueness need unique_constraint instead of a validator?

<details><summary>Answer</summary>

Two simultaneous submits both look valid in memory — only the database serializes them. `unique_constraint` records the index so the loser's conflict converts into a changeset error instead of a crash.

</details>

### Q25 (co-14)

How do you test a controller without a server, and a LiveView without a browser?

<details><summary>Answer</summary>

Dispatch `Plug.Test` connections through the router and assert status and body; call `mount` and `handle_event` directly and assert assigns. Wrap both in ExUnit with captured output for fixed transcripts.

</details>

### Q26 (co-16)

When does the stateful-process model cost more than a client-rendered SPA?

<details><summary>Answer</summary>

When the page is mostly static (paying per-connection memory for nothing) or canvas-grade dynamic (diffs cannot express games or editors well). It costs less for forms, lists, and dashboards — interaction without a second codebase.

</details>

## Applied problems

### Problem 1: State or changeset?

A checkout page holds the typed card number, its validation errors, and the confirmed total. Decide what belongs in LiveView process state versus the changeset, and say what breaks if the card number lives only in the changeset. Model answer: the typed input and its errors live in the changeset rebuilt per validate event; the confirmed total lives in assigns after save. If the card number lives only in the changeset, every unrelated event (a PubSub update re-rendering the page) must rebuild it from somewhere — so the source of truth forks and the form resets on unrelated updates.

### Problem 2: Diagnose the re-rendering LiveView

An order board re-renders its thousand-row table on every keystroke in the search box, and typing lags. Diagnose the cause and name the fix with the concept it uses. Model answer: the search event reassigns the whole rows list, so the diff covers every row (co-07). Fix: stream the rows keyed by id and insert or update only changed rows, or debounce the search event so diffs stay small and rare.

### Problem 3: Design the channel topics

A market app needs per-room chat, per-order status for the buyer and the cook, and a global announcement banner. Design the topic structure (names and who joins what) and say which messages use broadcast versus broadcast_from. Model answer: `room:<id>` for chat (members join; chat uses broadcast_from so senders skip their echo), `order:<id>` for status (buyer plus cook join; updates use broadcast so late joiners' LiveViews fold them), `announcements` for the banner (everyone subscribes; rare broadcasts). Presence tracks room membership per topic.

### Problem 4: Plug order puzzle

A request-id plug, an auth plug that halts 401s, and the router: in which order must they run, and what breaks if auth runs after the router? Model answer: request-id first (everything downstream logs it), auth second (halted requests never dispatch), router last. If auth runs after the router, denied requests already executed the action — the 401 is a lie told after the work, and side effects (drafts created, counts bumped) already happened.

### Problem 5: Mount too slow

A dashboard mounts by loading three reports synchronously and first paint takes seconds. Rework the mount with the async pattern and name what the visitor sees meanwhile. Model answer: mount assigns loading flags and sends load messages (or starts tasks), rendering skeletons; each handle_info fills one report and flips its flag. The visitor sees three placeholders that populate independently instead of one long blank.

### Problem 6: Presence ghost hunt

A room shows users who disconnected an hour ago. List two causes (one missing callback, one wrong assumption) and the fix for each. Model answer: missing terminate cleanup that should untrack explicit seats, and assuming untrack is unnecessary because 'the process died' — while the tracked pid was a long-lived session process, not the connection. Fix: untrack in terminate and track the connection-owned process (or update metas to expire), so lifetimes match visibility.

### Problem 7: Supervision budget

A payment worker crashes on a poison message, restarts, re-reads the same message, and crashes again — a hot loop. Name the two defenses and where each lives. Model answer: the supervisor's restart budget (max_restarts) converts the loop into one clean shutdown, and the worker quarantines the poison message (dead-letter, skip with telemetry) instead of re-reading it. Budget bounds the blast; quarantine removes the fuel.

### Problem 8: Test the seam

The board updates when the kitchen saves an order, but the integration is covered only by clicking through a browser. Name the three in-process tests that replace the clicking and what each pins. Model answer: a PubSub test asserting the save broadcasts the payload (bus seam), a board test folding that payload through handle_info and asserting latest (view seam), and a changeset test refusing the bad order (boundary seam). Together they pin the whole path the browser merely watched.

## Code katas

Eight katas, each a broken starter plus its green solution. Run the starter, read what it cannot do, write your fix, then compare against the reference. Only the `after/` solutions run in the harness.

### Kata 01: Add a LiveView Event Handler

(co-06.)

The starter mounts a counter with no event handler: it renders zero and every press would crash. Add `handle_event("inc", ...)` so two presses reach two, matching the reference that wires the handler and presses twice.

**`drilling/code/kata-01-add-a-liveview-event-handler/before/starter.exs`**:

```elixir
# => Kata 1 starter: counter without its event
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module counts nothing yet
defmodule Kata01.Counter do
  # => mount and render callbacks live here
  use Phoenix.LiveView

  # => mount starts every visitor at zero
  def mount(_params, _session, socket) do
    # => one assign holds the whole state
    {:ok, assign(socket, count: 0)}
    # => end mount: zero forever without an event
  end

  # => MISSING: handle_event("inc", ...) goes here
  # => without it every press crashes the process

  # => the template reads the count assign
  def render(assigns), do: ~H"<p>count: {@count}</p>"
  # => end view: mount first, render after
end

# => run/0 shows the stuck counter
defmodule Kata01.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the count assign exists
    {:ok, socket} = Kata01.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => Output: stuck: 0
    IO.puts("stuck: #{socket.assigns.count}")

    # => end run: add the handler, then press
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata01.Main.run()
```

**`drilling/code/kata-01-add-a-liveview-event-handler/after/solution.exs`**:

```elixir
# => Kata 1 solution: counter with its event
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module counts button presses
defmodule Kata01s.Counter do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts every visitor at zero
  def mount(_params, _session, socket) do
    # => one assign holds the whole state
    {:ok, assign(socket, count: 0)}
    # => end mount: zero until the first press
  end

  # => the inc event adds exactly one
  def handle_event("inc", _params, socket) do
    # => update transforms the old count
    {:noreply, update(socket, :count, &(&1 + 1))}
    # => end event: state change, no reply
  end

  # => the template reads the count assign
  def render(assigns), do: ~H"<p>count: {@count}</p>"
  # => end view: press in, number out
end

# => run/0 presses the new handler twice
defmodule Kata01s.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the count assign exists
    {:ok, socket} = Kata01s.Counter.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the client presses inc twice in a row
    {:noreply, one} = Kata01s.Counter.handle_event("inc", %{}, socket)
    # => the second press sees the first press's state
    {:noreply, two} = Kata01s.Counter.handle_event("inc", %{}, one)
    # => Output: count: 2
    IO.puts("count: #{two.assigns.count}")

    # => end run: the handler unblocked the counter
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata01s.Main.run()
```

**Output** (`drilling/code/kata-01-add-a-liveview-event-handler/expected/main.stdout.txt`):

```text
count: 2
```

### Kata 02: Broadcast on a State Change

(co-09.)

The starter subscribes and then changes state in silence: the mailbox stays empty. Add the broadcast right after the state change, matching the reference that announces `{:count, 1}` and hears it back.

**`drilling/code/kata-02-broadcast-on-a-state-change/before/starter.exs`**:

```elixir
# => Kata 2 starter: state changes nobody hears
Logger.configure(level: :warning)
# => warnings only; PubSub stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 changes state without telling the bus
defmodule Kata02.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the local bus
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Kata02.Bus}], strategy: :one_for_one)
    # => this process listens on the orders topic
    Phoenix.PubSub.subscribe(Kata02.Bus, "orders")
    # => MISSING: broadcast {:count, 1} after the change
    # => the mailbox stays empty without it
    receive do
      # => any arrival here would surprise the lesson
      {:count, _} -> IO.puts("heard: some count")
      # => end receive: silence is the bug
    after
      # => Output: heard: nothing
      100 -> IO.puts("heard: nothing")
      # => end after: unheard changes fix nothing
    end

    # => end run: broadcast on change, then listen
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata02.Main.run()
```

**`drilling/code/kata-02-broadcast-on-a-state-change/after/solution.exs`**:

```elixir
# => Kata 2 solution: state changes broadcast aloud
Logger.configure(level: :warning)
# => warnings only; PubSub stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 broadcasts the new count after changing it
defmodule Kata02s.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the local bus
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Kata02s.Bus}], strategy: :one_for_one)
    # => this process listens on the orders topic
    Phoenix.PubSub.subscribe(Kata02s.Bus, "orders")
    # => the state change and its broadcast travel together
    Phoenix.PubSub.broadcast(Kata02s.Bus, "orders", {:count, 1})
    # => the mailbox holds the announced change
    receive do
      # => Output: heard: 1
      {:count, n} -> IO.puts("heard: #{n}")
      # => end receive: announced changes arrive
    after
      # => a missing message would fail loudly here
      1000 -> IO.puts("heard: nothing")
      # => end after: the bus always delivers
    end

    # => end run: every change tells the bus
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata02s.Main.run()
```

**Output** (`drilling/code/kata-02-broadcast-on-a-state-change/expected/main.stdout.txt`):

```text
heard: 1
```

### Kata 03: Test a Changeset Validation

(co-14.)

The starter prints validity without asserting anything: green output, zero confidence. Wrap the boundary in an ExUnit suite that pins the required and length rules, matching the reference that asserts both and prints two tests, zero failures.

**`drilling/code/kata-03-test-a-changeset-validation/before/starter.exs`**:

```elixir
# => Kata 3 starter: validation nobody pins down
Logger.configure(level: :warning)
# => warnings only; Ecto stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the member fields
defmodule Kata03.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field :handle, :string
  end

  # => the boundary function the test will pin
  def changeset(member, attrs) do
    # => cast first, then require, then bound
    member |> cast(attrs, [:handle]) |> validate_required([:handle]) |> validate_length(:handle, min: 3)
    # => end changeset: MISSING: a test that pins this
  end

  # => module boundary stays explicit
end

# => run/0 prints validity without asserting it
defmodule Kata03.Main do
  # => single entry point the last line calls
  def run do
    # => empty attrs look invalid, nobody asserts it
    cs = Kata03.Member.changeset(struct(Kata03.Member), %{})
    # => Output: valid: false
    IO.puts("valid: #{cs.valid?}")

    # => end run: wrap this in a suite that asserts
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata03.Main.run()
```

**`drilling/code/kata-03-test-a-changeset-validation/after/solution.exs`**:

```elixir
# => Kata 3 solution: validation pinned by a suite
Logger.configure(level: :warning)
# => warnings only; ExUnit stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one schema module names the member fields
defmodule Kata03s.Member do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => members persist under this source name
  schema "members" do
    # => the unique name a member chooses
    field :handle, :string
  end

  # => the boundary function the tests pin
  def changeset(member, attrs) do
    # => cast first, then require, then bound
    member |> cast(attrs, [:handle]) |> validate_required([:handle]) |> validate_length(:handle, min: 3)
    # => end changeset: handle must be present and long
  end

  # => module boundary stays explicit
end

# => one test module pins the boundary rules
defmodule Kata03s.MemberTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => the missing handle fails the required rule
  test "blank handle is invalid" do
    # => empty attrs miss the required field
    cs = Kata03s.Member.changeset(struct(Kata03s.Member), %{})
    # => validity and field are the assertions
    assert cs.valid? == false
    # => the error keys name the failed field
    assert :handle in Keyword.keys(cs.errors)
    # => end test: required rule pinned
  end

  # => the short handle fails the length rule
  test "short handle is invalid" do
    # => two characters miss the bound
    cs = Kata03s.Member.changeset(struct(Kata03s.Member), %{handle: "ab"})
    # => validity is the assertion again
    assert cs.valid? == false
    # => end test: length rule pinned
  end

  # => module boundary stays explicit
end

# => run/0 runs the suite and prints its numbers
defmodule Kata03s.Main do
  # => single entry point the last line calls
  def run do
    # => the suite output stays captured and discarded
    _output = ExUnit.CaptureIO.capture_io(fn -> send(self(), {:result, ExUnit.run()}) end)
    # => the result map carries the only printed numbers
    receive do
      # => Output: tests: 2 failures: 0
      {:result, result} -> IO.puts("tests: #{result.total} failures: #{result.failures}")
      # => end receive: two tests, zero failures
    end

    # => end run: the boundary stays pinned
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata03s.Main.run()
```

**Output** (`drilling/code/kata-03-test-a-changeset-validation/expected/main.stdout.txt`):

```text
tests: 2 failures: 0
```

### Kata 04: Stamp Requests With a Plug

(co-01.)

The starter routes with no plug in front: the controller reads a missing assign and answers with nothing. Add the stamping plug before dispatch, matching the reference that stamps `req-1` and reads it back.

**`drilling/code/kata-04-stamp-requests-with-a-plug/before/starter.exs`**:

```elixir
# => Kata 4 starter: controller without its plug
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one controller module reads a missing stamp
defmodule Kata04.HelloController do
  # => text answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action reads what no plug wrote
  def hello(conn, _params) do
    # => MISSING: RequestIdPlug before the router
    text(conn, "hello #{conn.assigns[:request_id]}")
    # => end hello: nil rides into the answer
  end

  # => module boundary stays explicit
end

# => one router module owns the hello route
defmodule Kata04.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /hello reaches hello unstamped
  get "/hello", Kata04.HelloController, :hello
  # => end router: routing without preparation
end

# => run/0 shows the unstamped answer
defmodule Kata04.Main do
  # => single entry point the last line calls
  def run do
    # => dispatch with no plug in front
    conn = Kata04.Router.call(Plug.Test.conn(:get, "/hello"), [])
    # => the missing stamp leaves a bare greeting
    bare = conn.resp_body == "hello "
    # => Output: stamped: false
    IO.puts("stamped: #{not bare}")

    # => end run: add the plug, then route
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata04.Main.run()
```

**`drilling/code/kata-04-stamp-requests-with-a-plug/after/solution.exs`**:

```elixir
# => Kata 4 solution: plug stamps, controller reads
Logger.configure(level: :warning)
# => warnings only; request logs never reach the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one plug module stamps every request it sees
defmodule Kata04s.RequestIdPlug do
  # => assign helpers live here
  import Plug.Conn

  # => plugs receive their options through init
  def init(opts), do: opts

  # => the stamp lands in assigns for later readers
  def call(conn, _opts), do: assign(conn, :request_id, "req-1")
  # => end plug: transform, then pass along
end

# => one controller module reads the stamp back
defmodule Kata04s.HelloController do
  # => text answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => the action the route below names
  def hello(conn, _params) do
    # => the plug ran first, so the assign exists
    text(conn, "hello #{conn.assigns[:request_id]}")
    # => end hello: plugs prepare, actions answer
  end

  # => module boundary stays explicit
end

# => one router module owns the hello route
defmodule Kata04s.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => GET /hello reaches hello after the plug
  get "/hello", Kata04s.HelloController, :hello
  # => end router: routing is the last step
end

# => run/0 stamps, then routes, then prints
defmodule Kata04s.Main do
  # => single entry point the last line calls
  def run do
    # => the plug runs before the router sees it
    conn = Plug.Test.conn(:get, "/hello") |> Kata04s.RequestIdPlug.call([]) |> Kata04s.Router.call([])
    # => Output: stamped: hello req-1
    IO.puts("stamped: #{conn.resp_body}")

    # => end run: preparation before dispatch
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata04s.Main.run()
```

**Output** (`drilling/code/kata-04-stamp-requests-with-a-plug/expected/main.stdout.txt`):

```text
stamped: hello req-1
```

### Kata 05: Track Presence on Join

(co-10.)

The starter boots the tracker but never tracks the arrival: the roster stays empty. Add the track call at join time, matching the reference that tracks one arrival and lists one.

**`drilling/code/kata-05-track-presence-on-join/before/starter.exs`**:

```elixir
# => Kata 5 starter: join nobody tracks
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Kata05.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Kata05.Bus
end

# => run/0 joins without tracking the arrival
defmodule Kata05.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Kata05.Bus}, Kata05.Tracker], strategy: :one_for_one)
    # => MISSING: track(self(), "room:7", "ada", ...) here
    # => the roster stays empty without it
    IO.puts("roster: #{Kata05.Tracker.list("room:7") |> map_size()}")

    # => end run: track the join, then list
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata05.Main.run()
```

**`drilling/code/kata-05-track-presence-on-join/after/solution.exs`**:

```elixir
# => Kata 5 solution: join tracks the arrival
Logger.configure(level: :warning)
# => warnings only; Presence stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one presence module names the tracker
defmodule Kata05s.Tracker do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Kata05s.Bus
end

# => run/0 tracks the join, then lists the roster
defmodule Kata05s.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the tracker
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Kata05s.Bus}, Kata05s.Tracker], strategy: :one_for_one)
    # => ada arrives in room 7 from the web client
    {:ok, _} = Kata05s.Tracker.track(self(), "room:7", "ada", %{device: "web"})
    # => Output: roster: 1
    IO.puts("roster: #{Kata05s.Tracker.list("room:7") |> map_size()}")

    # => end run: every join leaves a trace
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata05s.Main.run()
```

**Output** (`drilling/code/kata-05-track-presence-on-join/expected/main.stdout.txt`):

```text
roster: 1
```

### Kata 06: Validate Live on Change

(co-06.)

The starter's validate event answers without looking: errors stay zero for every input. Run the changeset over the payload and store its errors, matching the reference that counts one error for the short handle.

**`drilling/code/kata-06-validate-live-on-change/before/starter.exs`**:

```elixir
# => Kata 6 starter: validate counts nothing
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module ignores its own input
defmodule Kata06.Form do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts with zero errors counted
  def mount(_params, _session, socket) do
    # => errors stay zero without a changeset
    {:ok, assign(socket, errors: 0)}
    # => end mount: MISSING: the changeset check
  end

  # => the validate event answers without looking
  def handle_event("validate", _params, socket) do
    # => the input never reaches a changeset here
    {:noreply, socket}
    # => end event: silence instead of errors
  end

  # => the template counts the error lines
  def render(assigns), do: ~H"<p>errors: {@errors}</p>"
  # => end view: zero forever without a check
end

# => run/0 shows the uncounted errors
defmodule Kata06.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the errors assign exists
    {:ok, socket} = Kata06.Form.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the bad input changes nothing here
    {:noreply, next} = Kata06.Form.handle_event("validate", %{"handle" => "ab"}, socket)
    # => Output: errors: 0
    IO.puts("errors: #{next.assigns.errors}")

    # => end run: run the changeset, then count
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata06.Main.run()
```

**`drilling/code/kata-06-validate-live-on-change/after/solution.exs`**:

```elixir
# => Kata 6 solution: validate counts real errors
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one schema module names the handle field
defmodule Kata06s.Handle do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => handles persist under this source name
  schema "handles" do
    # => the unique name a member chooses
    field :handle, :string
  end

  # => three characters minimum, as before
  def changeset(handle, attrs) do
    # => cast first, then require, then bound
    handle |> cast(attrs, [:handle]) |> validate_required([:handle]) |> validate_length(:handle, min: 3)
    # => end changeset: every keystroke re-runs this
  end

  # => module boundary stays explicit
end

# => one LiveView module validates each keystroke
defmodule Kata06s.Form do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts from an empty changeset
  def mount(_params, _session, socket) do
    # => the form assign carries the first errors
    {:ok, assign(socket, errors: [])}
    # => end mount: empty form, empty errors
  end

  # => the validate event re-checks the typed handle
  def handle_event("validate", %{"handle" => handle}, socket) do
    # => the changeset runs on the fresh input
    cs = Kata06s.Handle.changeset(struct(Kata06s.Handle), %{handle: handle})
    # => traverse_errors turns tuples into sentences
    errors = Ecto.Changeset.traverse_errors(cs, fn {msg, _opts} -> msg end)
    # => the error list becomes the next state
    {:noreply, assign(socket, errors: errors[:handle] || [])}
    # => end event: keystroke in, errors out
  end

  # => the template counts the error lines
  def render(assigns), do: ~H"<p>errors: {length(@errors)}</p>"
  # => end view: errors shape the page
end

# => run/0 counts the errors the starter missed
defmodule Kata06s.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the errors assign exists
    {:ok, socket} = Kata06s.Form.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => the bad input now counts one error
    {:noreply, next} = Kata06s.Form.handle_event("validate", %{"handle" => "ab"}, socket)
    # => Output: errors: 1
    IO.puts("errors: #{length(next.assigns.errors)}")

    # => end run: keystrokes always meet the changeset
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata06s.Main.run()
```

**Output** (`drilling/code/kata-06-validate-live-on-change/expected/main.stdout.txt`):

```text
errors: 1
```

### Kata 07: Stream New Rows

(co-07.)

The starter lists rows from plain assigns: every insert re-renders all. Convert the list to a keyed stream with an insert event, matching the reference that streams two rows and inserts the third.

**`drilling/code/kata-07-stream-new-rows/before/starter.exs`**:

```elixir
# => Kata 7 starter: rows re-render as one list
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module lists rows from assigns
defmodule Kata07.Orders do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts the rows as a plain list
  def mount(_params, _session, socket) do
    # => MISSING: stream(socket, :orders, ...) goes here
    {:ok, assign(socket, rows: ["noodles", "tea"])}
    # => end mount: every insert re-renders all
  end

  # => the template reads the plain list
  def render(assigns), do: ~H"<ul><li :for={row <- @rows}>{row}</li></ul>"
  # => end view: list in, list out
end

# => run/0 shows the plain-list render
defmodule Kata07.Main do
  # => single entry point the last line calls
  def run do
    # => mount first, so the rows assign exists
    {:ok, socket} = Kata07.Orders.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => render expands both rows at once
    html = Kata07.Orders.render(socket.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()
    # => Output: rows: <ul><li>noodles</li><li>tea</li></ul>
    IO.puts("rows: #{html}")

    # => end run: stream the rows, then insert
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata07.Main.run()
```

**`drilling/code/kata-07-stream-new-rows/after/solution.exs`**:

```elixir
# => Kata 7 solution: rows stream and insert
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module lists orders as a stream
defmodule Kata07s.Orders do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView
  # => stream helpers attach to the socket
  import Phoenix.LiveView, only: [stream: 3, stream_insert: 3]

  # => mount starts the stream with two rows
  def mount(_params, _session, socket) do
    # => ids key the rows across inserts
    {:ok, stream(socket, :orders, [%{id: 1, item: "noodles"}, %{id: 2, item: "tea"}])}
    # => end mount: two rows, keyed by id
  end

  # => the add event inserts exactly one row
  def handle_event("add", %{"item" => item}, socket) do
    # => id 3 is fixed so the transcript stays stable
    {:noreply, stream_insert(socket, :orders, %{id: 3, item: item})}
    # => end event: insert, never re-render all
  end

  # => the template reads the stream, not a list
  def render(assigns), do: ~H"<ul><li :for={{id, order} <- @streams.orders}>{order.item}</li></ul>"
  # => end view: stream in, list out
end

# => run/0 inserts the third row through the stream
defmodule Kata07s.Main do
  # => single entry point the last line calls
  def run do
    # => streams need a lifecycle-primed socket
    primed = struct(Phoenix.LiveView.Socket, private: %{lifecycle: struct(Phoenix.LiveView.Lifecycle)})
    # => mount starts the two-row stream
    {:ok, socket} = Kata07s.Orders.mount(%{}, %{}, primed)
    # => the add event inserts the third row
    {:noreply, next} = Kata07s.Orders.handle_event("add", %{"item" => "coffee"}, socket)
    # => render expands all three rows
    html = Kata07s.Orders.render(next.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()
    # => Output: rows: <ul><li>noodles</li><li>tea</li><li>coffee</li></ul>
    IO.puts("rows: #{html}")

    # => end run: inserts travel light, lists stay heavy
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata07s.Main.run()
```

**Output** (`drilling/code/kata-07-stream-new-rows/expected/main.stdout.txt`):

```text
rows: <ul><li>noodles</li><li>tea</li><li>coffee</li></ul>
```

### Kata 08: Supervise the Counter

(co-12.)

The starter links the counter with no supervisor: the crash ends it for good. Place a supervisor above the worker, matching the reference that restarts at zero after the boom.

**`drilling/code/kata-08-supervise-the-counter/before/starter.exs`**:

```elixir
# => Kata 8 starter: counter nobody restarts
Logger.configure(level: :warning)
# => warnings only; GenServers stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one GenServer module counts without supervision
defmodule Kata08.Counter do
  # => GenServer callbacks live here
  use GenServer

  # => MISSING: a supervisor above this worker
  def start_link(_opts), do: GenServer.start_link(__MODULE__, 0)

  # => the counter starts at zero after every boot
  def init(first), do: {:ok, first}

  # => get reads the count without changing it
  def handle_call(:get, _from, count), do: {:reply, count, count}
end

# => run/0 watches the unsupervised death
defmodule Kata08.Main do
  # => single entry point the last line calls
  def run do
    # => the counter starts linked and alone
    {:ok, counter} = Kata08.Counter.start_link([])
    # => unlink first, so the boom cannot kill the script
    Process.unlink(counter)
    # => the monitor watches that one worker
    ref = Process.monitor(counter)
    # => an abnormal exit kills it for good
    Process.exit(counter, :boom)
    # => the DOWN proves nobody restarted it
    receive do
      # => Output: restarted: false
      {:DOWN, ^ref, :process, _, _} -> IO.puts("restarted: false")
      # => end receive: death observed, silence after
    after
      # => a missing exit would fail loudly here
      1000 -> IO.puts("restarted: unknown")
      # => end after: exits always land
    end

    # => end run: supervise the worker, then crash it
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata08.Main.run()
```

**`drilling/code/kata-08-supervise-the-counter/after/solution.exs`**:

```elixir
# => Kata 8 solution: supervisor restarts the counter
Logger.configure(level: :critical)
# => crash reports stay out of the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one GenServer module counts like a LiveView would
defmodule Kata08s.Counter do
  # => GenServer callbacks live here
  use GenServer

  # => clients start one counter under a supervisor
  def start_link(_opts), do: GenServer.start_link(__MODULE__, 0)

  # => the counter starts at zero after every boot
  def init(first), do: {:ok, first}

  # => get reads the count without changing it
  def handle_call(:get, _from, count), do: {:reply, count, count}
end

# => run/0 watches the supervised restart
defmodule Kata08s.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the counter
    {:ok, sup} = Supervisor.start_link([{Kata08s.Counter, []}], strategy: :one_for_one)
    # => the single child answers under a known id
    [{_, first, _, _}] = Supervisor.which_children(sup)
    # => a crash stops the counter abnormally
    :ok = GenServer.stop(first, :boom)
    # => the supervisor booted a fresh counter
    [{_, second, _, _}] = Supervisor.which_children(sup)
    # => Output: restarted: true count: 0
    IO.puts("restarted: #{first != second} count: #{GenServer.call(second, :get)}")

    # => end run: crashes end processes, never services
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata08s.Main.run()
```

**Output** (`drilling/code/kata-08-supervise-the-counter/expected/main.stdout.txt`):

```text
restarted: true count: 0
```

## Self-check checklist

- [ ] I can declare routes, scopes, and plugs and dispatch test connections through the router. (co-01.)
- [ ] I can halt a plug pipeline with 401 before dispatch when credentials are missing. (co-01.)
- [ ] I can write controller actions answering text and JSON with the right content type. (co-02.)
- [ ] I can read path segments, query params, and headers inside controller actions. (co-02.)
- [ ] I can write changeset boundaries with cast, required, length, format, number, and inclusion rules. (co-03.)
- [ ] I can traverse changeset errors into per-field sentences and build structs with apply_action. (co-03.)
- [ ] I can mount LiveViews from URL params and session identity with correct first assigns. (co-04.)
- [ ] I can explain why mount runs once per visitor process and what that implies for state. (co-04.)
- [ ] I can render assigns to HTML strings and compose function components with attributes and slots. (co-05.)
- [ ] I can branch templates with conditionals and expand lists with comprehensions. (co-05.)
- [ ] I can handle LiveView events and info messages, including replies and async loads. (co-06.)
- [ ] I can validate form input live per keystroke with the same changeset the submit runs. (co-06.)
- [ ] I can keep static shells stable across re-renders and stream long lists by keyed inserts. (co-07.)
- [ ] I can push purely visual work to client-side JS commands and flash one-shot notices. (co-07.)
- [ ] I can write channel joins that admit or refuse with named reasons and answer events with replies. (co-08.)
- [ ] I can intercept and rewrite outgoing channel events per subscriber. (co-08.)
- [ ] I can wire PubSub broadcasts into LiveView handle_info callbacks across processes. (co-09.)
- [ ] I can choose broadcast versus broadcast_from based on whether the sender already knows. (co-09.)
- [ ] I can track, list, untrack, and update presence with metadata on isolated topics. (co-10.)
- [ ] I can fold presence diffs into LiveView rosters seeded from the current list at mount. (co-10.)
- [ ] I can hold per-visitor state in processes and run one-off work in tasks. (co-11.)
- [ ] I can supervise workers with restart budgets and keep caches in ETS beyond worker crashes. (co-12.)
- [ ] I can run the full LiveView form cycle: validate per keystroke, refuse or save on submit. (co-13.)
- [ ] I can test routers, LiveViews, channels, PubSub, and changesets in-process with ExUnit. (co-14.)

## Elaborative interrogation & self-explanation

### Prompt 1: Why supervised processes instead of a shared session store?

A shared store (Redis, database sessions) centralizes state that every request re-fetches and re-locks; a supervised process keeps one visitor's state in memory with no contention and reboots clean on crash. The rejected alternative costs a network round trip per interaction and a cache-invalidation story; the chosen design costs memory per connection. Model answer: processes win while per-visitor state fits memory and dies with the visit; reach for the store when state must outlive the connection or span data centers.

### Prompt 2: Why changesets at the boundary instead of validating in each action?

Per-action validation forks the rules: the form allows what the API refuses, and fixes land in one place while the other rots. One changeset function reused by every entry path keeps a single definition with tests that pin it. The rejected alternative feels faster for one endpoint and becomes three divergent rulebooks by the tenth. Model answer: share the boundary function everywhere input enters; duplicate only what genuinely differs.

### Prompt 3: Why diffs over the wire instead of full page renders?

Full renders resend static shells visitors already hold, wasting bandwidth and flickering screens; diffs ship only changed dynamics. The rejected alternative is simpler to reason about ('the page is the render') and suits tiny pages; it collapses on real dashboards where a keystroke would move kilobytes. Model answer: diff by default for live pages, full render for errors and redirects, client rendering for canvas-grade dynamics.

### Prompt 4: Why PubSub topics instead of direct process messages?

Direct messages need pids, and pids of strangers (other visitors' LiveViews) are undiscoverable and unmonitorable in practice. Topics decouple writers from readers: publishers name subjects, subscribers declare interest, and neither tracks the other. The rejected alternative is precise but brittle — one dead pid and the message dies silently. Model answer: topics for fan-out across unknown processes, direct messages for known worker pairs.

### Prompt 5: Why test in-process instead of driving a real browser?

Browser suites boot servers, fight ports and timing, and grow to hours; direct callback tests run the same code paths in milliseconds with zero setup. The rejected alternative still earns its place for styling, JavaScript interop, and full user journeys — but logic (routing, validation, transitions) belongs in-process. Model answer: pin logic without the browser, reserve the browser for what only eyes and engines can check.

### Prompt 6: Why halt in plugs instead of guarding inside each action?

Per-action guards repeat the check in every handler and run after routing already chose (and possibly side-effected) the action; a halting plug rejects once, before dispatch, for every route behind it. The rejected alternative localizes the rule near its use but guarantees drift — one forgotten guard is one open door. Model answer: pipeline guards for cross-cutting rules, action checks only for resource-specific authorization the plug cannot see.
