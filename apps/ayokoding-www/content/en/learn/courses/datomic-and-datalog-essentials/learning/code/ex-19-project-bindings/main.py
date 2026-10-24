# Worked Example 19: Project Only What You Need
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Full facts in, name-price pairs out.
# => Projection is the query's output contract.
db = [  # => two parts with names, prices, and stock
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 10401),  # => entity 1
    # => Entity 1 part/price.
    (1, "part/price", 180, 10401),  # => its price
    # => Entity 1 part/in-stock.
    (1, "part/in-stock", 40, 10401),  # => not projected
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 10401),  # => entity 2
    # => Entity 2 part/price.
    (2, "part/price", 25, 10401),  # => its price
    # => Entity 2 part/in-stock.
    (2, "part/in-stock", 200, 10401),  # => not projected
    # => Close the collection.
]  # => six facts, four of them wanted
# => Build per-entity maps, then project the two wanted columns.
names = {e: v for e, a, v, _t in db if a == "part/name"}  # => entity to name
# => Compute the next value.
prices = {e: v for e, a, v, _t in db if a == "part/price"}  # => entity to price
# => The projection: name and price only, sorted by name.
pairs = sorted((names[e], prices[e]) for e in names if e in prices)  # => two pairs
# => Print the projected pairs.
for name, price in pairs:  # => narrow answers, wide facts behind
    # => The check the lesson quotes.
    print(f"part={name} price={price}")  # => Output shows two pairs
