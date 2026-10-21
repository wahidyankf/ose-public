# Worked Example 34: Sorting by Entity First
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Six datoms, one ordering, entity 1 first.
# => EAVT groups every entity's facts together.
db = [  # => deliberately shuffled input order
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 40101),  # => entity 2
    # => Entity 1 part/price.
    (1, "part/price", 180, 40101),  # => entity 1
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 40101),  # => entity 1
    # => Entity 2 part/price.
    (2, "part/price", 25, 40101),  # => entity 2
    # => Entity 1 part/in-stock.
    (1, "part/in-stock", 40, 40101),  # => entity 1
    # => Entity 3 part/name.
    (3, "part/name", "City basket", 40101),  # => entity 3
    # => Close the collection.
]  # => shuffle in, order out
# => EAVT order is the tuple order itself: entity, then attribute.
eavt = sorted(db)  # => one sorted run over everything
# => Print the first three: all of entity 1's facts.
for e, a, v, t in eavt[:3]:  # => the head of the run
    # => The check the lesson quotes.
    print(f"e={e} a={a} v={v} tx={t}")  # => Output shows entity 1 grouped
