# => Example 60: Casts Queue Before Calls
Logger.configure(level: :warning)
# => warnings only; GenServers stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => one GenServer module counts cast increments
defmodule Ex60.Counter do
  # => GenServer callbacks live here
  use GenServer

  # => clients start one counter
  def start_link(_opts), do: GenServer.start_link(__MODULE__, 0)

  # => the counter starts at zero after every boot
  def init(first), do: {:ok, first}

  # => each cast adds exactly one, answering nothing
  def handle_cast(:inc, count), do: {:noreply, count + 1}

  # => get reads the count after every queued cast
  def handle_call(:get, _from, count), do: {:reply, count, count}
end

# => run/0 holds the whole example narrative
defmodule Ex60.Main do
  # => single entry point the last line calls
  def run do
    # => one supervision tree owns the counter
    {:ok, sup} = Supervisor.start_link([{Ex60.Counter, []}], strategy: :one_for_one)
    # => the single child answers under a known id
    [{_, counter, _, _}] = Supervisor.which_children(sup)
    # => three casts queue without waiting
    GenServer.cast(counter, :inc)
    # => the second cast queues behind the first
    GenServer.cast(counter, :inc)
    # => the third cast queues behind the second
    GenServer.cast(counter, :inc)
    # => the call runs after all three casts
    IO.puts("count: #{GenServer.call(counter, :get)}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex60.Main.run()
