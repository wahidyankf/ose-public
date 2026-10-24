# => Example 19: small regexes extract; parsers handle the rest.
line = "order-2026-01-15 qty=12"
# => Named captures document each field at the pattern site.
fields = Regex.named_captures(~r/order-(?<date>\d{4}-\d{2}-\d{2}) qty=(?<qty>\d+)/, line)
# => scan finds every occurrence; here exactly one date-shaped token exists.
dates = Regex.scan(~r/\d{4}-\d{2}-\d{2}/, line) |> List.flatten()
# => replace rewrites with backreferences numbered in match order.
masked = Regex.replace(~r/qty=\d+/, line, "qty=N")
# => split on a small pattern tokenizes without a grammar.
tokens = Regex.split(~r/[\s=]+/, masked, trim: true)
# => Print the captures, the scanned dates, the masked line, and tokens.
IO.puts("date=#{fields["date"]} qty=#{fields["qty"]} dates=#{inspect(dates)}")
# => The masked line and tokens are fully determined by the fixed input.
IO.puts("masked=#{masked} tokens=#{inspect(tokens)}")
