# => Example 55: map fans out, orders, and propagates errors.
from concurrent.futures import ThreadPoolExecutor  # => WHY executor: managed fan-out


def double(n):  # => the unit of work: pure and tiny
    return n * 2  # => WHY pure: no shared state, no races possible


with ThreadPoolExecutor(max_workers=3) as pool:  # => WHY manager: shutdown guaranteed
    out = list(pool.map(double, [1, 2, 3, 4, 5]))  # => WHY map: order preserved
print(out)  # => Output: [2, 4, 6, 8, 10], input order kept
with ThreadPoolExecutor(max_workers=2) as pool:  # => a second pool for errors
    future = pool.submit(double, 21)  # => single submission form
    print(future.result())  # => Output: 42, result re-raises failures here
