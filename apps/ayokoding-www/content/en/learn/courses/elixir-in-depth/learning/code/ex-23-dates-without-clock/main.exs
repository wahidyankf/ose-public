# => Example 23: dates are constructed values, never clock reads.
release = ~D[2026-01-15]
# => Sigils build dates at compile time; no function reads the machine clock.
plus_month = Date.add(release, 30)
# => diff counts whole days between two fixed dates, order-sensitive.
span = Date.diff(plus_month, release)
# => compare answers with atoms, so callers match instead of comparing.
order = Date.compare(release, plus_month)
# => Ranges enumerate calendar days without any time component.
days = Enum.count(Date.range(release, Date.add(release, 6)))
# => Print the constructed date, the span, the order, and the week count.
IO.puts("release=#{release} plus30=#{plus_month} span=#{span} order=#{order} week=#{days}")
