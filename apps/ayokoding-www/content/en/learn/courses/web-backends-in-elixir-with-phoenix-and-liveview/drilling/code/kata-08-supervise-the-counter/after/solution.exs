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
