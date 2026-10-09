"""Example 10: Boolean Operators."""
# => The three expressions yield False, True, False in source order.

# print() accepts multiple positional arguments and joins them with spaces.
# and/or/not are Python's three boolean operators (no bitwise-only forms needed here).
print(  # => prints and, or, and not results in that order
    True and False,  # => and is True only if BOTH sides are True -- False
    True or False,  # => or is True if EITHER side is True -- True
    not True,  # => not flips a bool -- False
)  # => Output: False True False
