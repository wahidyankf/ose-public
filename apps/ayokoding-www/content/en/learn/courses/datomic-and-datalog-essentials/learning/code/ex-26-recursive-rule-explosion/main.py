# Worked Example 26: Recursion Walks the Assembly Tree
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One bike, four reachable components, no cycles.
# => The rule asks itself about every child.
contains = {30: [31, 32], 31: [33], 32: [], 33: [34], 34: []}  # => parent to children


# => Every component reachable from a parent, children first.
def reachable(parent, seen=None):  # => the recursive rule
    # => Accumulate into a set so shared children count once.
    seen = set() if seen is None else seen  # => fresh set per top call
    # => Visit each child, then recurse into it.
    for child in contains.get(parent, []):  # => direct children first
        # => Compute the next value.
        seen.add(child)  # => record the child
        # => Compute the next value.
        reachable(child, seen)  # => the rule calls itself
    # => Hand the answer back.
    return seen  # => the full explosion


# => Print the sorted explosion for the touring bike.
parts = sorted(reachable(30))  # => entities 31 through 34
# => The check the lesson quotes.
print("components:", parts)  # => Output shows all four
