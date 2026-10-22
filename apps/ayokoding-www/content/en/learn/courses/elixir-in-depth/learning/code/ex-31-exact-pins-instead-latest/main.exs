# => Example 31: version requirements float; the lock pins exactly.
req = Version.parse_requirement!("~> 1.4.0")
# => Three-segment tilde admits patch releases inside the same minor line.
admits_patch = Version.match?("1.4.10", req)
# => The same requirement refuses the next minor line entirely.
refuses_minor = Version.match?("1.5.0", req)
# => parse! turns the pinned string into a comparable struct.
pinned = Version.parse!("1.4.10")
# => compare answers with atoms, so callers match instead of branching.
order = Version.compare(pinned, "1.4.0")
# => Print the admission answers and the comparison with fixed labels.
IO.puts("patch=#{admits_patch} minor=#{refuses_minor} order=#{order} major=#{pinned.major}")
