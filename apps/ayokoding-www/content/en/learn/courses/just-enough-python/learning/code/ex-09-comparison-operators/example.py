"""Example 9: Comparison Operators."""
# => Three comparisons yield True, True, False in source order.

# print() accepts multiple positional arguments and joins them with spaces.
# Python has six comparison operators total: < > <= >= == !=.
print(  # => prints three comparison results in expression order
    3 < 5,  # => strictly less-than -- True (bool)
    3 == 3,  # => value equality -- True (bool)
    4 != 4,  # => not-equal -- False, since 4 does equal 4 (bool)
)  # => Output: True True False
