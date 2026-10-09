"""Example 43: map + filter."""
# => Filtering precedes doubling, so only three values reach map.

# map() applies a function to every element; filter() keeps only elements where
# the predicate returns True. Both are lazy -- list() forces full evaluation.
result: list[int] = list(  # => list consumes the lazy map and filter pipeline
    map(  # => map() lazily applies the lambda below to each filtered element
        lambda n: n * 2,  # => doubles each surviving element
        filter(lambda n: n % 2 == 0, range(5)),  # => keeps only 0, 2, 4 first
    )  # => completes mapping over even inputs before list collects results
)  # => closes list(...), forcing evaluation of the whole pipeline
print(result)  # => [0, 2, 4] doubled -- Output: [0, 4, 8]
