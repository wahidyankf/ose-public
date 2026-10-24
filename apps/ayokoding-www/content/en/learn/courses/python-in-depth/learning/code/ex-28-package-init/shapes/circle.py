# => Example 28 circle module: one topic, pure functions.
import math  # => pi lives in the standard library


def area(radius):  # => circle area from its radius
    return math.pi * radius * radius  # => WHY pure: same input, same output
