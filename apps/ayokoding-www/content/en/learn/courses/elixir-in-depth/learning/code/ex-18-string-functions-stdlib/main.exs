# => Example 18: the String module answers text questions without dependencies.
line = "  Ada Lovelace, 1815  "
# => trim removes surrounding whitespace before any other transform.
clean = String.trim(line)
# => split with trim: true drops the empties a naive split would keep.
parts = clean |> String.split(",", trim: true) |> Enum.map(&String.trim/1)
# => downcase, replace, and pad shape text for comparison and display.
shaped = clean |> String.downcase() |> String.replace(" ", "_") |> String.pad_leading(24, ".")
# => starts_with? and contains? ask boolean questions without regex.
starts = String.starts_with?(clean, "Ada")
# => graphemes splits on user-perceived characters, not bytes.
first_three = clean |> String.graphemes() |> Enum.take(3) |> Enum.join()
# => Print the parts, the shaped line, the booleans, and the prefix.
IO.puts("parts=#{inspect(parts)} starts=#{starts} first=#{first_three}")
# => Padding is visible as dots; the shaped line is fully determined.
IO.puts("shaped=#{shaped}")
