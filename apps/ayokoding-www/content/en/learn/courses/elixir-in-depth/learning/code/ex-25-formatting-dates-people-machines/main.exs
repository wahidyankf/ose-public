# => Example 25: format dates for people, parse them for machines.
release = ~D[2026-01-15]
# => strftime renders one fixed date into each human layout deterministically.
us = Calendar.strftime(release, "%B %d, %Y")
# => ISO 8601 is the machine layout: fixed width, sortable, unambiguous.
iso = Date.to_iso8601(release)
# => from_iso8601 parses strictly; the bang raises on the same bad input.
parsed = Date.from_iso8601!("2026-01-15")
# => Weekday numbers anchor calendars: Monday is 1, Sunday is 7.
dow = Date.day_of_week(release)
# => Print the human form, the machine form, the round trip, and the weekday.
IO.puts("human=#{us} machine=#{iso} roundtrip=#{parsed == release} weekday=#{dow}")
