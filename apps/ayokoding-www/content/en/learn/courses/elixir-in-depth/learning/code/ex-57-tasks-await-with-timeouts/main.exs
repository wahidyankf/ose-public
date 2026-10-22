# => Example 57: tasks await results with bounds; crashes surface at await.
# => async starts the work immediately; await collects it with a bound.
:logger.set_primary_config(:level, :none) # => crash reports carry clocks; silence them for a stable transcript.
job = Task.async(fn -> Enum.sum(1..100) end) # => sum one to one hundred concurrently.
# => await returns the value or raises if the timeout passes first.
total = Task.await(job, 5000) # => collect within five seconds.
# => async_stream bounds concurrency and keeps input order in the output.
doubled = # => the ordered doubled list the stream produces.
  1..5 # => double one through five with two at a time.
  |> Task.async_stream(fn x -> x * 2 end, max_concurrency: 2, timeout: 5000) # => bounded concurrent doubling.
  |> Enum.map(fn {:ok, n} -> n end) # => unwrap each ok tuple in order.
# => A crashing task reports through the awaiting match, not the console.
_ = Process.flag(:trap_exit, true) # => trap: link exits arrive as messages.
crasher = Task.async(fn -> raise "planned" end) # => the deliberately crashing task.
# => Await re-raises the crash as an exit, so catch owns the branch.
crashed = # => the crash report the catch produces.
  try do # => await the crashing task inside the trap.
    Task.await(crasher, 1000) # => the await that re-raises as an exit.
    "lived" # => dead unless the task ever succeeds.
  catch # => exits from linked crashes land here.
    :exit, _ -> "crashed" # => the crash report string.
  end # => the try closes; crashed holds the report.
# => Print the sum, the ordered stream, and the crash report.
IO.puts("total=#{total} doubled=#{inspect(doubled)} crashed=#{crashed}") # => value, stream, and crash lines.
