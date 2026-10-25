# => Example 30: Info Message Loads Async Data
Logger.configure(level: :warning)
# => warnings only; LiveView stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one LiveView module loads its total after mount
defmodule Ex30.Total do
  # => mount, event, and render callbacks live here
  use Phoenix.LiveView

  # => mount starts loading and reports nothing yet
  def mount(_params, _session, socket) do
    # => self() stands in for the async worker
    send(self(), :load_total)
    # => loading stays true until the message lands
    {:ok, assign(socket, loading: true, total: 0)}
    # => end mount: question asked, answer pending
  end

  # => the load message carries the computed total
  def handle_info(:load_total, socket) do
    # => telemetry marks the load for operators
    :telemetry.execute([:ex30, :loaded], %{rows: 3}, %{view: "total"})
    # => two plus one stands in for a real query
    {:noreply, assign(socket, loading: false, total: 3)}
    # => end info: answer lands, flag flips
  end

  # => the template reads the loading flag
  def render(assigns), do: ~H"<p>loading: {@loading} total: {@total}</p>"
  # => end view: flag in, line out
end

# => run/0 holds the whole example narrative
defmodule Ex30.Main do
  # => single entry point the last line calls
  def run do
    # => telemetry listens for the load event
    :telemetry.attach(
      "ex30-listener",
      [:ex30, :loaded],
      fn ev, ms, _md, _c -> send(self(), {:seen, ev, ms}) end,
      nil
    )

    # => mount queues the load message to self
    {:ok, socket} = Ex30.Total.mount(%{}, %{}, struct(Phoenix.LiveView.Socket))
    # => handle_info consumes it like the process would
    {:noreply, done} = Ex30.Total.handle_info(:load_total, socket)
    # => Output: loaded: false total: 3
    IO.puts("loaded: #{done.assigns.loading} total: #{done.assigns.total}")
    # => the telemetry event arrived with its count
    receive do
      # => the rows measurement proves the load ran
      {:seen, [:ex30, :loaded], %{rows: 3}} ->
        IO.puts("telemetry: rows 3")
        # => end receive: one event, one line
    after
      # => a missing event would fail loudly here
      1000 ->
        IO.puts("telemetry: missing")
        # => end after: the worker always answers
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex30.Main.run()
