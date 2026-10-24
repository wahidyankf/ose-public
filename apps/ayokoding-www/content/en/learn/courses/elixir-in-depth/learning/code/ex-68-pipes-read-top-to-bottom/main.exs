# => Example 68: pipes read top to bottom; nesting reads inside out.
raw = "  Ada,36;Grace,85  " # => the raw fixed report input.
# => Each stage names one transform; the data flows down the left edge.
report = # => the sorted multi-line report the transcript asserts.
  raw # => trim, split, map, map, sort, join: six stages.
  |> String.trim() # => stage one: drop surrounding whitespace.
  |> String.split(";") # => stage two: split rows on semicolons.
  |> Enum.map(fn row -> String.split(row, ",") end) # => stage three: rows to pairs.
  |> Enum.map(fn [name, age] -> "#{String.trim(name)} is #{age}" end) # => stage four: pairs to sentences.
  |> Enum.sort() # => stage five: sort sentences alphabetically.
  |> Enum.join("\n") # => stage six: join with newlines.
# => then/2 inserts a named step into a pipeline without breaking its shape.
shouted = "ada" |> String.upcase() |> then(fn s -> "hello #{s}" end) # => upcase, then greet.
# => Print the sorted multi-line report and the tapped pipeline result.
IO.puts(report) # => the two-line sorted report.
IO.puts("shouted=#{shouted}") # => the tapped pipeline result.
