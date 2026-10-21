# => Example 52: same arguments compute once, then hit cache.
from functools import lru_cache  # => WHY decorator: memoization in one line


@lru_cache(maxsize=None)  # => WHY unbounded: tiny domain, cache everything
def fib(n):  # => the classic exponential recursion, tamed
    if n < 2:  # => WHY base: anchors the recursion
        return n  # => fib(0) and fib(1) are themselves
    return fib(n - 1) + fib(n - 2)  # => each value computed exactly once


print(fib(30))  # => Output: 832040, fast through memoization
info = fib.cache_info()  # => WHY stats: prove the cache earns its memory
print(info.misses)  # => Output: 31, values 0..30 computed once each
print(info.hits > 0)  # => Output: True, repeats served from cache
fib.cache_clear()  # => WHY clear: tests start from empty
print(fib.cache_info().currsize)  # => Output: 0, cleared for independence
