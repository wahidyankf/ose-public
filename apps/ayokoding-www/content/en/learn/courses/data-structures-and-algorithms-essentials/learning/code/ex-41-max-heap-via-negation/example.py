"""Example 41: Max-Heap via Negation."""

# The original heapq API uses a MIN-heap; negating values flips the
# ordering: the smallest negative (== the largest original value) pops first (co-12).
import heapq  # => imports the stdlib binary-heap functions

max_heap: list[int] = []  # => stores NEGATED values internally
for value in (5, 1, 8, 3):  # => pushes each source value in turn
    heapq.heappush(
        max_heap, -value
    )  # => pushes -5, -1, -8, -3 -- min-heap on negatives

largest = -heapq.heappop(
    max_heap
)  # => pops the smallest negative (-8), then negates back
second_largest = -heapq.heappop(max_heap)  # => pops the next smallest negative (-5)
print(largest, second_largest)  # => Output: 8 5

assert largest == 8  # => confirms the true maximum popped first
assert second_largest == 5  # => confirms the second-largest popped next
print("ex-41 OK")  # => Output: ex-41 OK
