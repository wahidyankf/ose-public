# => Example 66: @doc states contracts; comments explain why, never what.
source = Path.join(__DIR__, "documented.ex") |> File.read!() # => read the fixture module text.
# => Trim first: doc attributes indent with the code they document.
doc_lines = # => the trimmed attribute lines the count asserts.
  source # => split the fixture into lines for filtering.
  |> String.split("\n") # => one element per source line.
  |> Enum.map(&String.trim/1) # => trim so indented attributes match.
  |> Enum.filter(fn l -> String.starts_with?(l, "@doc ") or l == "@doc" or String.starts_with?(l, "@moduledoc") end) # => keep doc attributes only.
# => The count proves the fixture documents every public entry it defines.
IO.puts("docs=#{length(doc_lines)}") # => three attributes documented.
# => Print the attribute lines trimmed, in file order, as the evidence.
IO.puts(Enum.join(doc_lines |> Enum.map(&String.trim/1), "\n")) # => the auditable attribute evidence.
