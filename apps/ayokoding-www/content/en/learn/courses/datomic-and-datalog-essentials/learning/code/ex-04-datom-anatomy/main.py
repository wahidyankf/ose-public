# Worked Example 4: Reading a Datom Apart
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three datoms walk through the same four positions.
# => Different entities, attributes, and transactions on each line.
db = [  # => a tiny fact set with some variety
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 1001),  # => a name for entity 1
    # => Entity 1 part/price.
    (1, "part/price", 180, 1002),  # => a later price for entity 1
    # => Entity 2 part/in-stock.
    (2, "part/in-stock", 12, 1001),  # => stock for entity 2
    # => Close the collection.
]  # => three facts, two entities, two transactions
# => Unpack each datom and print its four positions on one line.
for e, a, v, t in db:  # => the loop binds the four positions
    # => The check the lesson quotes.
    print(f"e={e} a={a} v={v} tx={t}")  # => Output shows all four parts
