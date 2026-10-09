"""Example 30: Comprehension Filter."""

# => The filter excludes the odd values 1, 3, and 5.

# The `if` filters BEFORE an n is kept.
evens: list[int] = [n for n in range(6) if n % 2 == 0]  # => keeps 0, 2, 4
print(evens)  # => Output: [0, 2, 4]
