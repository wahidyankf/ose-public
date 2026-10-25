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
      {:DOWN, ^ref, :process, _, _} ->
        IO.puts("restarted: false")
        # => end receive: death observed, silence after
    after
      # => a missing exit would fail loudly here
      1000 ->
        IO.puts("restarted: unknown")
        # => end after: exits always land
    end

    # => end run: supervise the worker, then crash it
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata08.Main.run()
