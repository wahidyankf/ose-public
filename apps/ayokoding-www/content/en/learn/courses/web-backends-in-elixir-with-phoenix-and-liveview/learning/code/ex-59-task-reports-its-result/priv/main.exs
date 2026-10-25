# => Example 59: Task Reports Its Result
Logger.configure(level: :warning)
# => warnings only; tasks stay silent below this
Code.compiler_options(ignore_module_conflict: true)
# => reloaded modules stay silent on double runs

# => run/0 holds the whole example narrative
defmodule Ex59.Main do
  # => single entry point the last line calls
  def run do
    # => the total computes in a sibling process
    task = Task.async(fn -> 6 * 7 end)
    # => await collects the answer or raises
    total = Task.await(task)
    # => Output: total: 42
    IO.puts("total: #{total}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Ex59.Main.run()
