"""Example 33: Generator Expression."""
# => The generator is consumed by sum without making a list.

# No brackets -- values are produced lazily, one at a time, for sum().
total: int = sum(n * n for n in range(4))  # => generator feeds 0, 1, 4, 9 into sum
print(total)  # => 0+1+4+9 -- Output: 14
