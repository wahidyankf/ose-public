# => Example 1: ask the object itself whether it counts as true.
names = ["ada", "grace"]  # => a non-empty list: truthy, the common case
empty = []  # => an empty list: falsy, nothing to process
maybe = None  # => None is always falsy: the missing-value marker
if names:  # => WHY implicit: emptiness is the question, not the literal
    print("names:", len(names))  # => Output: names: 2, truthy branch ran
if empty:  # => falsy, so this branch never runs
    print("unreachable")  # => dead under truthiness: kept to show the skip
else:  # => the falsy path: empty means nothing to do
    print("empty: nothing to do")  # => Output: empty: nothing to do
if maybe is not None:  # => WHY explicit: None needs identity, not truthiness
    print("unreachable")  # => skipped: maybe really is None here
count = 0  # => zero is falsy, but here zero is a valid measurement
if count is not None:  # => WHY explicit: zero must pass this gate
    print("count:", count)  # => Output: count: 0, explicitness kept zero
