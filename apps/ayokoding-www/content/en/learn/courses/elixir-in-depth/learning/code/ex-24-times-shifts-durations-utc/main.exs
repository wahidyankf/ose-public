# => Example 24: times and datetimes stay in UTC where arithmetic is exact.
noon = ~T[12:00:00] # => the fixed wall-clock noon.
# => Time.add shifts within the day clock; overflow wraps past midnight.
later = Time.add(noon, 5400) # => ninety minutes later on the day clock.
# => NaiveDateTime pairs a date with a wall time and no zone at all.
stamp = ~N[2026-01-15 12:00:00] # => the fixed naive stamp.
# => DateTime.add on a UTC instant is exact second arithmetic, no zone table.
instant = ~U[2026-01-15 12:00:00Z] # => the fixed UTC instant.
shifted = DateTime.add(instant, 3600, :second) # => exactly one hour later.
# => diff in matching units inverts add exactly for fixed values.
back = DateTime.diff(shifted, instant, :second) # => the inverse proving 3600.
# => Duration-free comparison keeps ordering a plain data question.
IO.puts("later=#{later} stamp=#{NaiveDateTime.to_string(stamp)}") # => wall time and naive stamp.
# => The shift added exactly one hour; the diff proves the inverse.
IO.puts("shifted=#{DateTime.to_iso8601(shifted)} back=#{back}") # => shifted instant and proof.
