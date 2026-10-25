# => Example 74: one live item per stage, whatever the volume.
def numbers(limit):  # => stage one: produce the raw sequence lazily
    for n in range(limit):  # => range itself is lazy: no list built
        yield n  # => WHY yield: one value per request, then suspend


def evens(stream):  # => stage two: filter without materializing
    for n in stream:  # => pulls upstream one item at a time
        if n % 2 == 0:  # => the filter predicate for this stage
            yield n * n  # => WHY yield: squares flow downstream singly


total = sum(evens(numbers(10)))  # => WHY once: materialize only at the consumer
print(total)  # => Output: 120, 0+4+16+36+64 summed
print(sum(evens(numbers(0))))  # => Output: 0, empty streams sum cleanly
