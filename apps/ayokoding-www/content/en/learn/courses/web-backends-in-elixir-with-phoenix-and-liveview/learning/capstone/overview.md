---
title: "Overview"
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 1
---

Build a small live order-tracking dashboard: a Phoenix JSON API listing the open orders, a LiveView board that updates in real time as orders broadcast over PubSub, a Presence tracker counting the watchers, a changeset boundary refusing unknown order states, and an in-process ExUnit suite pinning all three layers. The single program wires every cluster of the course into one running whole — no browser, no socket, one fixed transcript.

## Why this exists -- the big idea

**The problem before the solution**: seventy-eight small examples teach the pieces, but pieces do not ship; the dashboard is where routing, validation, liveness, and testing meet. Readers who only drill fragments freeze when the blank project opens.

**Keep this if you forget everything else**: the dashboard is one supervision tree — bus, tracker, board — with the API reading and the suite proving it.

## What you will build

A program that starts its own PubSub bus with a Presence tracker, serves two open orders through a JSON API scope, mounts a board LiveView, broadcasts a new order the board absorbs, counts one watcher, and runs a three-test suite covering the API shape, the board update, and the boundary refusal. Four printed lines narrate the whole: the API count, the board's latest id, the watcher count, and the suite numbers.

## How the pieces compose

The order schema from the changeset cluster validates every state at the boundary. The JSON controller and `/api` scope from the routing cluster serve the open orders. The board LiveView from the events cluster holds `latest` and `served` assigns and folds `order_created` broadcasts into state. The Presence tracker from the presence cluster counts the cooks watching the board. The ExUnit suite from the testing cluster pins one behavior per layer with captured output. Nothing here is new; everything here is composed — which is precisely the skill production demands.

**`learning/capstone/code/main.exs`**:

```elixir
# => Capstone: live order-tracking dashboard
Logger.configure(level: :warning)
# => warnings only; the dashboard stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => ExUnit runs the dashboard suite inside this script
ExUnit.start(auto_run: false, seed: 0)
# => no formatter output keeps the transcript fixed
ExUnit.configure(formatters: [])

# => one schema module validates every order
defmodule Cap.Order do
  # => schema and changeset macros live here
  use Ecto.Schema
  # => cast and validate helpers live here
  import Ecto.Changeset

  # => orders persist under this source name
  schema "orders" do
    # => the menu item the guest chose
    field :item, :string
    # => pending, cooking, or served
    field :status, :string
  end

  # => the boundary every order crosses
  # => three states allowed, everything else refused
  def changeset(order, attrs) do
    # => cast both, require both, restrict status
    order |> cast(attrs, [:item, :status]) |> validate_required([:item, :status]) |> validate_inclusion(:status, ["pending", "cooking", "served"])
    # => end changeset: unknown states never serve
  end

  # => module boundary stays explicit
end

# => one controller module serves the JSON api
defmodule Cap.OrderController do
  # => json answers without an endpoint
  use Phoenix.Controller, formats: [:html, :json]

  # => GET /api/orders lists the two open orders
  def index(conn, _params) do
    # => fixed rows keep the transcript stable
    json(conn, %{orders: [%{id: 101, item: "noodles"}, %{id: 102, item: "tea"}]})
    # => end index: two rows, one shape
  end

  # => module boundary stays explicit
end

# => one router module owns the api scope
defmodule Cap.Router do
  # => the macro that builds match and dispatch
  use Phoenix.Router

  # => every api route shares the prefix
  scope "/api" do
    # => GET /api/orders reaches the index
    get "/orders", Cap.OrderController, :index
    # => end scope: prefixes compose, never repeat
  end

  # => end router: one scope, one route
end

# => one presence module counts the watchers
defmodule Cap.Watchers do
  # => the bus name wires tracker to PubSub
  use Phoenix.Presence, otp_app: :app, pubsub_server: Cap.Bus
end

# => one LiveView module boards the newest order
defmodule Cap.Board do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts with no order on the board
  def mount(_params, _session, socket) do
    # => latest stays nil until the first broadcast
    {:ok, assign(socket, latest: nil, served: 0)}
    # => end mount: empty board, open ears
  end

  # => new orders land on the board by broadcast
  def handle_info({:order_created, id}, socket) do
    # => the newest id replaces the old one
    {:noreply, assign(socket, latest: id)}
    # => end created: message in, state out
  end

  # => served orders tick the served count
  def handle_info({:order_served, _id}, socket) do
    # => each serving adds exactly one
    {:noreply, update(socket, :served, &(&1 + 1))}
    # => end served: message in, count out
  end

  # => the template reads both assigns
  def render(assigns), do: ~H"<p>latest: {@latest} served: {@served}</p>"
  # => end view: broadcasts in, lines out
end

# => one suite pins the api, the board, and the boundary
defmodule Cap.DashboardTest do
  # => tests run one after another here
  use ExUnit.Case, async: false

  # => the api lists exactly two open orders
  test "api lists two orders" do
    # => dispatch the index in-process
    conn = Cap.Router.call(Plug.Test.conn(:get, "/api/orders"), [])
    # => status 200 is the first assertion
    assert conn.status == 200
    # => the decoded body names both rows
    {:ok, body} = Jason.decode(conn.resp_body)
    # => two rows are the second assertion
    assert length(body["orders"]) == 2
    # => end test: api pinned, no socket
  end

  # => the board shows the broadcast order
  test "board shows broadcast order" do
    # => mount first, so the latest assign exists
    {:ok, socket} = Cap.Board.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => a broadcast lands like the bus would send it
    {:noreply, next} = Cap.Board.handle_info({:order_created, 102}, socket)
    # => the newest id is the assertion
    assert next.assigns.latest == 102
    # => end test: board pinned, no browser
  end

  # => the boundary refuses unknown states
  test "boundary refuses unknown states" do
    # => flying never names a real order state
    cs = Cap.Order.changeset(struct(Cap.Order), %{item: "tea", status: "flying"})
    # => invalid is the assertion
    assert cs.valid? == false
    # => end test: boundary pinned, no database
  end

  # => module boundary stays explicit
end

# => run/0 wires the whole dashboard at once
defmodule Cap.Main do
  # => single entry point the last line calls
  def run do
    # => one tree owns the bus and the watchers
    {:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Cap.Bus}, Cap.Watchers], strategy: :one_for_one)
    # => this dashboard watches the orders topic
    Phoenix.PubSub.subscribe(Cap.Bus, "orders")
    # => one watcher arrives on the board topic
    {:ok, _} = Cap.Watchers.track(self(), "board", "cook-1", %{role: "cook"})
    # => the api answers its two rows in-process
    conn = Cap.Router.call(Plug.Test.conn(:get, "/api/orders"), [])
    # => the decoded body counts the open orders
    {:ok, body} = Jason.decode(conn.resp_body)
    # => Output: api orders: 2
    IO.puts("api orders: #{length(body["orders"])}")
    # => mount first, so the latest assign exists
    {:ok, socket} = Cap.Board.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => a new order broadcasts across the bus
    Phoenix.PubSub.broadcast(Cap.Bus, "orders", {:order_created, 102})
    # => the broadcast waits in the mailbox
    receive do
      # => the board callback consumes it
      {:order_created, _} = msg ->
        # => handle_info folds the message into state
        {:noreply, next} = Cap.Board.handle_info(msg, socket)
        # => Output: board latest: 102
        IO.puts("board latest: #{next.assigns.latest}")
        # => end branch: message handled, board updated
    after
      # => a missing message would fail loudly here
      1000 -> IO.puts("board latest: missing")
      # => end after: the bus always delivers
    end
    # => Output: watchers: 1
    IO.puts("watchers: #{Cap.Watchers.list("board") |> map_size()}")
    # => the suite output stays captured and discarded
    _output = ExUnit.CaptureIO.capture_io(fn -> send(self(), {:result, ExUnit.run()}) end)
    # => the result map carries the only printed numbers
    receive do
      # => Output: tests: 3 failures: 0
      {:result, result} -> IO.puts("tests: #{result.total} failures: #{result.failures}")
      # => end receive: three tests, zero failures
    end

    # => end run: api, board, watchers, and suite agree
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Cap.Main.run()
```

**Output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
api orders: 2
board latest: 102
watchers: 1
tests: 3 failures: 0
```

## Reading the transcript

`api orders: 2` proves the JSON scope serves both open rows through the real router. `board latest: 102` proves the broadcast traveled the bus into the board's assigns through the real `handle_info`. `watchers: 1` proves the Presence tracker counted the cook on the board topic. `tests: 3 failures: 0` proves the suite pinned the API count, the board update, and the boundary refusal — the three behaviors the dashboard promises.

## Why this shape survives contact with production

Each layer defends one seam: the changeset refuses bad states before they spread, the API scope versions the machine contract, PubSub decouples the order writer from every viewer, Presence derives the watcher count from lifetimes instead of heartbeats, and the suite pins the seams so refactors stay mechanical. Replace the fixed rows with a repository, the direct calls with an endpoint, and the single node with a cluster, and the shape stands unchanged.

## The pinning note

The transcript above is recorded, not typed: the harness ran this program twice in the pinned container and both runs printed these bytes. Any edit to the program that changes a line re-records through the same harness before this page updates.
