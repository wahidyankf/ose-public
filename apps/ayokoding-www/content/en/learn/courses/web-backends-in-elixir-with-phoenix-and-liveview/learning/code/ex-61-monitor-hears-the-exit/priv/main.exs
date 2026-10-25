# => Example 61: Monitor Hears the Exit
Logger.configure(level: :warning)
# => warnings only; monitors stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 holds the whole example narrative
defmodule Ex61.Main do
  # => single entry point the last line calls
  def run do
    # => a short worker exits with a named reason
    worker = spawn(fn -> exit(:shift_over) end)
    # => the monitor watches that one worker
    ref = Process.monitor(worker)
    # => the DOWN message names the exit reason
    receive do
      # => Output: down: shift_over
      {:DOWN, ^ref, :process, _, reason} ->
        IO.puts("down: #{reason}")
        # => end receive: one exit, one line
    after
      # => a missing exit would fail loudly here
      1000 ->
        IO.puts("down: missing")
        # => end after: workers always exit
    end

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex61.Main.run()
