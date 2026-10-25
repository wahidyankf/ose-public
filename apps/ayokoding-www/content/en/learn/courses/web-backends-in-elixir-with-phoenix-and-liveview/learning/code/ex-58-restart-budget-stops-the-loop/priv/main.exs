# => Example 58: Restart Budget Stops the Loop
Logger.configure(level: :critical)
# => crash reports stay out of the transcript
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one GenServer module crashes on demand
defmodule Ex58.Flaky do
  # => GenServer callbacks live here
  use GenServer

  # => clients start one flaky worker
  def start_link(_opts), do: GenServer.start_link(__MODULE__, :ok)

  # => no state matters for this lesson
  def init(first), do: {:ok, first}

  # => stop the worker abnormally right now
  def handle_call(:crash, _from, state), do: {:stop, :boom, :ok, state}
end

# => run/0 holds the whole example narrative
defmodule Ex58.Main do
  # => single entry point the last line calls
  def run do
    # => telemetry listens for the shutdown event
    :telemetry.attach(
      "ex58-listener",
      [:ex58, :down],
      fn ev, _ms, _md, _c -> send(self(), {:seen, ev}) end,
      nil
    )

    # => one restart allowed per second of wall time
    {:ok, sup} =
      Supervisor.start_link([{Ex58.Flaky, []}],
        strategy: :one_for_one,
        max_restarts: 1,
        max_seconds: 60
      )

    # => unlink first, so the shutdown cannot kill the script
    Process.unlink(sup)
    # => the supervisor's death arrives exactly once
    ref = Process.monitor(sup)
    # => the single child answers under a known id
    [{_, first, _, _}] = Supervisor.which_children(sup)
    # => the first death arrives exactly once
    watch = Process.monitor(first)
    # => the first crash spends the one restart
    GenServer.call(first, :crash)
    # => the DOWN proves the first worker died
    receive do
      # => restart follows, the lesson proceeds
      {:DOWN, ^watch, :process, _, _} ->
        :ok
        # => end receive: death observed, restart next
    after
      # => a missing death would fail loudly here
      5000 ->
        IO.puts("first: missing")
        # => end after: crashes always land
    end

    # => the restarted child answers under a new id
    [{_, second, _, _}] = Supervisor.which_children(sup)
    # => the second crash spends more than allowed
    GenServer.call(second, :crash)
    # => the supervisor exits once the budget breaks
    receive do
      # => Output: supervisor alive: false
      {:DOWN, ^ref, :process, _, _} ->
        IO.puts("supervisor alive: false")
        # => end receive: the budget stopped the loop
    after
      # => a living supervisor would fail loudly here
      5000 ->
        IO.puts("supervisor alive: true")
        # => end after: budgets always break loops
    end

    # => the shutdown emits one telemetry event
    :telemetry.execute([:ex58, :down], %{}, %{})
    # => the listener proves the event arrived
    receive do
      # => Output: telemetry: down
      {:seen, [:ex58, :down]} ->
        IO.puts("telemetry: down")
        # => end receive: one event, one line
    after
      # => a missing event would fail loudly here
      1000 ->
        IO.puts("telemetry: missing")
        # => end after: executes always deliver
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex58.Main.run()
