# Worked Example 39: Tagging Without a Side Table
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three parts tagged, one tag queried, two answers.
# => Set membership is a single clause.
db = [  # => tags for three parts
    # => Entity 1 part/tags.
    (1, "part/tags", "commuter", 50101),  # => wheel is a commuter part
    # => Entity 1 part/tags.
    (1, "part/tags", "touring", 50101),  # => wheel tours too
    # => Entity 2 part/tags.
    (2, "part/tags", "track", 50101),  # => cog is track-only
    # => Entity 3 part/tags.
    (3, "part/tags", "commuter", 50101),  # => basket commutes too
    # => Entity 3 part/tags.
    (3, "part/tags", "city", 50101),  # => basket is a city part
    # => Close the collection.
]  # => five tag facts, one question
# => Every entity carrying the commuter tag, sorted.
commuters = sorted(
    e for e, a, v, _t in db if a == "part/tags" and v == "commuter"
)  # => entities 1 and 3
# => Print the commuter set.
print("commuters:", commuters)  # => Output shows 1 and 3
