# Worked Example 47: Transitive Closure in Three Clauses
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One assembly, four reachable components, no SQL text.
# => Recursion plus membership is the whole query.
contains = {30: [31, 32], 31: [33], 32: [], 33: [34], 34: []}  # => the assembly graph


# => Clause one: direct children. Clause two: recurse. Clause three: collect.
def closure(start):  # => the three-clause shape as a function
    # => Direct members join the answer immediately.
    found = set(contains.get(start, []))  # => clause one: membership
    # => Each member's own closure joins too.
    for child in list(found):  # => clause two: recursion
        # => Compute the next value.
        found |= closure(child)  # => clause three: union
    # => Hand the answer back.
    return found  # => the fixpoint


# => Print the sorted closure for the touring bike.
parts = sorted(closure(30))  # => entities 31 through 34
# => The check the lesson quotes.
print("reachable:", parts)  # => Output shows all four
