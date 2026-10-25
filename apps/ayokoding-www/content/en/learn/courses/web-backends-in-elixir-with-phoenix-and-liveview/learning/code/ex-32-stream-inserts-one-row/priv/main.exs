# => Example 32: Stream Inserts One Row
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module lists orders as a stream
defmodule Ex32.Orders do
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
  def render(assigns),
    do: ~H"<ul><li :for={{id, order} <- @streams.orders}>{order.item}</li></ul>"

  # => end view: stream in, list out
end

# => run/0 holds the whole example narrative
defmodule Ex32.Main do
  # => single entry point the last line calls
  def run do
    # => streams need a lifecycle-primed socket
    primed =
      struct(Phoenix.LiveView.Socket, private: %{lifecycle: struct(Phoenix.LiveView.Lifecycle)})

    # => mount starts the two-row stream
    {:ok, socket} = Ex32.Orders.mount(%{}, %{}, primed)
    # => the add event inserts the third row
    {:noreply, next} = Ex32.Orders.handle_event("add", %{"item" => "coffee"}, socket)
    # => render expands all three rows
    html =
      Ex32.Orders.render(next.assigns) |> Phoenix.HTML.Safe.to_iodata() |> IO.iodata_to_binary()

    # => Output: rows: <ul><li>noodles</li><li>tea</li><li>coffee</li></ul>
    IO.puts("rows: #{html}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex32.Main.run()
