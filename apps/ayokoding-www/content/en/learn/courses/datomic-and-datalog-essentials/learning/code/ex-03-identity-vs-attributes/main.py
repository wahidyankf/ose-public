# Worked Example 3: Identity Is Not Its Attributes
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Two new parts arrive with client-side tempids -1 and -2.
# => The store answers with entity ids, in arrival order.
tempids = [-1, -2]  # => negative means not yet stored
# => Map each tempid to its assigned entity id.
assigned = {t: i + 1 for i, t in enumerate(tempids)}  # => -1 becomes 1, -2 becomes 2
# => Stored facts reference the assigned identity, never the tempid.
db = [  # => stored facts use real entity ids
    # => Compute the next value.
    (assigned[-1], "part/name", "Road wheel 700c", 3001),  # => entity 1
    # => Compute the next value.
    (assigned[-2], "part/name", "Track cog 16t", 3001),  # => entity 2
    # => Close the collection.
]  # => two datoms, two identities, one transaction
# => Print the mapping first, then prove the datoms use it.
print("mapping:", assigned)  # => Output shows tempid to entity
# => The check the lesson quotes.
print("entities:", sorted(e for e, _a, _v, _t in db))  # => Output shows 1 and 2
