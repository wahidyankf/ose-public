# => Example 77: read a foreign project manifest-first, pins second.
manifest = Path.join(__DIR__, "foreign/mix.exs") |> File.read!() # => read the manifest as text.
# => The app line names the project; the version line names its release.
app = Regex.run(~r/app: :(\w+)/, manifest) |> List.last() # => pull the app atom name.
vsn = Regex.run(~r/version: "([^"]+)"/, manifest) |> List.last() # => pull the version string.
# => The lock next door lists the pinned closure the manifest floats above.
{entries, _} = Path.join(__DIR__, "foreign/mix.lock") |> Code.eval_file() # => the pinned entries map.
# => Sorted names keep the report stable across file orderings.
names = entries |> Map.keys() |> Enum.sort() # => sorted dependency names.
# => Print the app, the version, and the pinned closure with fixed labels.
IO.puts("app=#{app} version=#{vsn} deps=#{length(names)} #{Enum.join(names, " ")}") # => identity plus closure.
