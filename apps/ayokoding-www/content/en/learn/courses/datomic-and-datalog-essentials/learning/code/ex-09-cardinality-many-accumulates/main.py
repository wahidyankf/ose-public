# Worked Example 9: Cardinality Many Accumulates a Set
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three tags land in two transactions; all three stay.
# => Many means a set, never a single current value.
db = [  # => three tag facts for the same entity
    # => Entity 1 part/tags.
    (1, "part/tags", "wheel", 6001),  # => the family tag
    # => Entity 1 part/tags.
    (1, "part/tags", "700c", 6001),  # => the size tag
    # => Entity 1 part/tags.
    (1, "part/tags", "commuter", 6002),  # => the use tag, added later
    # => Close the collection.
]  # => three datoms, three live values
# => Collect every tag value for entity 1, sorted for determinism.
tags = sorted(
    v for e, a, v, _t in db if e == 1 and a == "part/tags"
)  # => the whole set
# => One line: how many tags, and which ones.
print("tags:", len(tags), tags)  # => Output shows 3 tags
