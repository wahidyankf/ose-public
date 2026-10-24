# => Example 20: IO lists build output without intermediate concatenation.
rows = [{"ada", 36}, {"grace", 85}]
# => Each row renders as an IO list: nesting is free, flattening is one call.
lines = Enum.map(rows, fn {name, age} -> ["name=", name, " age=", Integer.to_string(age), "\n"] end)
# => chardata_to_string flattens once at the boundary, never per row.
report = IO.iodata_to_binary(["report\n" | lines])
# => :io_lib.format shapes columns with fixed widths, like a tiny table.
table = :io_lib.format("~-6s ~3w", ["ada", 36]) |> IO.iodata_to_binary()
# => byte_size proves the single flattening: count once, print everywhere.
IO.puts("bytes=#{byte_size(report)} table=[#{table}]")
# => The report body is deterministic because the rows are fixed.
IO.write(report)
