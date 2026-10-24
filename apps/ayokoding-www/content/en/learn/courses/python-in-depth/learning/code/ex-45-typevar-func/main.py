# => Example 45: one function, every element type.
from typing import TypeVar  # => WHY TypeVar: names the in-out relationship

T = TypeVar("T")  # => WHY declare: T stands for any single type


def first(items: list[T]) -> T:  # => WHY generic: same type in and out
    return items[0]  # => the logic never mentions a concrete type


print(first([1, 2, 3]))  # => Output: 1, T bound to int here
print(first(["a", "b"]))  # => Output: a, T bound to str here
print(first([(1, 2)]))  # => Output: (1, 2), T bound to tuple here
# => No duplication: one body serves ints, strings, and tuples alike.
# => Erasure: at runtime this is plain indexing; types guide checkers only.
