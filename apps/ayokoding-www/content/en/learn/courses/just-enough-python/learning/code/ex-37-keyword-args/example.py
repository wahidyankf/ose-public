"""Example 37: Keyword Args."""

# => Both binding styles return the same integer result.


# Defines subtract, which takes two ints and returns an int.
def subtract(a: int, b: int) -> int:  # => 10 minus 3 is 7 below
    return a - b  # => returns a minus b


# Keyword arguments can be passed in any order -- the names, not position, bind them.
by_position: int = subtract(10, 3)  # => positional order: a=10, b=3
by_keyword: int = subtract(b=3, a=10)  # => named, REVERSED order -- still a=10, b=3
print(by_position, by_keyword, by_position == by_keyword)  # => Output: 7 7 True
