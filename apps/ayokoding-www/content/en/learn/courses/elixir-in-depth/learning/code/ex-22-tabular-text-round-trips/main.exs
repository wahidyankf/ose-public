# => Example 22: tabular text round-trips through parse, shape, and render.
fixture = Path.join(__DIR__, "roster.csv") # => the committed CSV fixture.
# => The header names the columns so the parser stays order-independent.
[header | lines] = File.read!(fixture) |> String.split("\n", trim: true) # => header plus data lines.
# => Split each line on commas; every row must match the header width.
parsed = # => the parsed row maps the report renders.
  Enum.map(lines, fn line -> # => parse each data line against the header.
    values = String.split(line, ",") # => split the row into cells.
    # => zip ties each header to its value; mismatched widths raise loudly.
    true = length(values) == length(String.split(header, ",")) # => the width contract check.
    Enum.zip(String.split(header, ","), values) |> Map.new() # => header-keyed row map.
  end) # => the map closes; parsed holds every row map.
# => Sort by name so the render order never depends on fixture order.
rendered = # => the canonical rendering the transcript asserts.
  parsed # => sort the row maps by their name field.
  |> Enum.sort_by(fn row -> row["name"] end) # => alphabetical by name.
  |> Enum.map(fn row -> "#{row["name"]},#{row["age"]}" end) # => back to CSV lines.
# => Print the row count and the canonical rendering with fixed labels.
IO.puts("rows=#{length(parsed)}") # => the parsed row count.
# => The round trip preserves every field; sorting makes it canonical.
IO.puts(Enum.join([header | rendered], "\n")) # => header plus sorted rows.
