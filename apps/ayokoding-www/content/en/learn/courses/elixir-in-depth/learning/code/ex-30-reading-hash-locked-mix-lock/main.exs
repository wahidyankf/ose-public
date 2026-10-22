# => Example 30: mix.lock pins every transitive dependency by version.
lock = Path.join(__DIR__, "sample.mix.lock") # => the committed sample lock.
# => eval_file reads the lock as data; the script never executes it as code.
{entries, _} = Code.eval_file(lock) # => entries plus ignored bindings.
# => Each hex entry names its version in a fixed tuple position.
pins = # => the sorted pin strings the transcript asserts.
  entries # => map each lock entry to a name=version string.
  |> Enum.map(fn {name, {:hex, _, vsn, _, _, _, _, _}} -> "#{name}=#{vsn}" end) # => position four holds the version.
  |> Enum.sort() # => sort for a stable report.
# => The count proves the closure is pinned, not partly floating.
IO.puts("pins=#{length(pins)} #{Enum.join(pins, " ")}") # => count plus sorted pins.
