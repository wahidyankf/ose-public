"""Example 29: List Comprehension."""

# => Squaring zero through four produces five list elements.

# Builds a list directly -- no append() build-up loop needed.
squares: list[int] = [n * n for n in range(5)]  # => squares of 0 through 4
print(squares)  # => Output: [0, 1, 4, 9, 16]
