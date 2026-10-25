# => Example 57: Ets Outlives the Worker
Logger.configure(level: :warning)
# => warnings only; ETS stays silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 holds the whole example narrative
defmodule Ex57.Main do
  # => single entry point the last line calls
  def run do
    # => this process owns the table, not the worker
    table = :ets.new(:ex57_cache, [:set, :public])
    # => a short worker writes one row, then exits
    worker = spawn(fn -> :ets.insert(table, {:total, 42}) end)
    # => the monitor reports the worker's normal exit
    ref = Process.monitor(worker)
    # => the DOWN arrives once the write finished
    receive do
      # => the worker is gone, the row remains
      {:DOWN, ^ref, :process, _, _} ->
        :ok
        # => end receive: exit observed, table kept
    after
      # => a missing exit would fail loudly here
      1000 ->
        IO.puts("worker: missing")
        # => end after: workers always finish
    end

    # => Output: cached: 42
    IO.puts("cached: #{:ets.lookup(table, :total) |> hd() |> elem(1)}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex57.Main.run()
