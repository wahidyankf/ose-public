"""Example 38: *args and **kwargs."""
# => Three positional and two keyword arguments become separate collections.


def describe(
    *args: int, **kwargs: str
) -> None:  # => collects positional ints and keyword strings
    # args is a tuple, kwargs is a dict -- both are countable with len().
    print(len(args), len(kwargs))  # => prints their respective counts, 3 and 2


describe(1, 2, 3, name="Ada", role="engineer")  # => 3 positional, 2 keyword
# => Output: 3 2
