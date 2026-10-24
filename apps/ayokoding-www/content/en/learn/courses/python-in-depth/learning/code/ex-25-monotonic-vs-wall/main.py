# => Example 25: each clock answers its own question.
import time  # => the three clocks live in one module

start = time.monotonic()  # => WHY monotonic: durations never go backwards
total = sum(range(10000))  # => fixed workload: same length every run
elapsed = time.monotonic() - start  # => elapsed by subtraction, always ordered
print(elapsed >= 0)  # => Output: True, guaranteed non-decreasing
print(total)  # => Output: 49995000, the workload result itself
stamp = time.time()  # => WHY wall: human stamps need real time
print(isinstance(stamp, float))  # => Output: True, seconds since epoch
print(time.perf_counter() > 0)  # => Output: True, highest-resolution reading
