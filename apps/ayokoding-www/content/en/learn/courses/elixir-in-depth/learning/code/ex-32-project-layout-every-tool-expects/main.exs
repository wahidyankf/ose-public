# => Example 32: every Elixir tool expects the same scaffold paths.
root = Path.join(__DIR__, "sample_proj") # => the committed fixture scaffold.
# => Wildcard the scaffold and sort, so order never depends on the disk.
paths = # => the sorted relative paths the transcript asserts.
  root # => glob everything under the fixture root.
  |> Path.join("**/*") # => the recursive glob pattern.
  |> Path.wildcard() # => expand to absolute matches.
  |> Enum.map(&Path.relative_to(&1, root)) # => relativize each match.
  |> Enum.sort() # => sort for a stable report.
# => Three files plus two directories prove the layout tools assume.
IO.puts("entries=#{length(paths)}") # => the five-entry proof.
# => The sorted layout is fully determined by the committed fixture.
IO.puts(Enum.join(paths, "\n")) # => one path per line, sorted.
