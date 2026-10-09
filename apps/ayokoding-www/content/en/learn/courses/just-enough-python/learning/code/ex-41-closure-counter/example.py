"""Example 41: Closure Counter."""

# => Successive calls produce 1, 2, then 3 from one closure.

# Imports Callable for typing the returned function.
from collections.abc import Callable  # => types the returned zero-argument function


# Returns a function that takes no args and returns an int.
def make_counter() -> Callable[[], int]:  # => creates fresh count per call
    count = 0  # => count is an upvalue -- captured by the nested function below

    # Defines the closure that reads and writes the outer count.
    def increment() -> int:  # => nested function will update its enclosing count
        nonlocal count  # => without this, `count += 1` would create a NEW local count
        count += 1  # => mutates the captured count, not a fresh local variable
        return count  # => returns the updated count after incrementing

    return increment  # => returns the closure itself, not a call to it


# Each call to make_counter() creates a FRESH count -- closures don't share state.
counter = make_counter()  # => counter is now bound to one increment closure, count=0
print(counter())  # => Output: 1
print(counter())  # => Output: 2
print(counter())  # => Output: 3
