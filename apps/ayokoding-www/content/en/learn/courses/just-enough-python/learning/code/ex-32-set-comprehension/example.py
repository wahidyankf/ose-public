"""Example 32: Set Comprehension."""

# => The two words of length two produce one set member.

# {} with no colon builds a set -- duplicates collapse automatically.
lengths: set[int] = {len(w) for w in ["a", "bb", "cc"]}  # => duplicate 2 collapses
print(sorted(lengths))  # => "bb" and "cc" both have length 2 -- [1, 2]
