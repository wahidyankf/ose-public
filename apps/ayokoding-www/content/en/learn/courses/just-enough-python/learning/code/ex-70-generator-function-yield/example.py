"""Example 70: Generator Function with yield."""

# => Collecting the iterator yields integers 0, 1, and 2.

# Imports Iterator for typing the generator's return.
from collections.abc import Iterator  # => describes yielded int values


def count_up_to(n: int) -> Iterator[int]:  # => a generator function -- contains yield
    for i in range(n):  # => iterates i over 0, 1, ..., n-1
        yield i  # => pauses here and hands back i -- resumes on the NEXT value requested


# list() forces the generator to run to completion, collecting every yielded value.
print(list(count_up_to(3)))  # => list() drains the generator fully -- Output: [0, 1, 2]
