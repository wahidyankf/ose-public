"""Example 31: Dict Comprehension."""

# => The dictionary uses each number as its own key.

# A `key: value` shape inside {} builds a dict, not a set.
squares: dict[int, int] = {n: n * n for n in range(3)}  # => keys 0, 1, 2
print(squares)  # => Output: {0: 0, 1: 1, 2: 4}
