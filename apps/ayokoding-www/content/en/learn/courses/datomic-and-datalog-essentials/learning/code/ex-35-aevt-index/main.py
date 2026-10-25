# Worked Example 35: Sorting by Attribute First
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Same six datoms, a different contiguous run.
# => AEVT groups every price fact together.
db = [  # => the same shuffled six
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
# => AEVT sorts by attribute first, then entity, value, tx.
aevt = sorted(db, key=lambda d: (d[1], d[0], d[2], d[3]))  # => attribute-led order
# => Print the price group: every part/price datom in entity order.
prices = [(e, v) for e, a, v, _t in aevt if a == "part/price"]  # => the price run
# => The check the lesson quotes.
print("price-facts:", prices)  # => Output shows both prices
