# Worked Example 16: Your First Datalog Query
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One clause, one variable, three matching entities.
# => The engine finds matches; the query only describes them.
db = [  # => three parts, three name facts, one transaction
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 10101),  # => entity 1
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 10101),  # => entity 2
    # => Entity 3 part/name.
    (3, "part/name", "City basket", 10101),  # => entity 3
    # => Close the collection.
]  # => the fact set the pattern scans


# => A clause is attribute plus value pattern; None means any value.
def query_name(db):  # => find every entity with a part name
    # => Keep the entity wherever the attribute is part name.
    return sorted(e for e, a, _v, _t in db if a == "part/name")  # => three bindings


# => Print how many matched and which entities they are.
found = query_name(db)  # => three entities match one clause
# => The check the lesson quotes.
print("matches:", len(found))  # => Output shows 3
# => The check the lesson quotes.
print("entities:", found)  # => Output shows 1, 2, 3
