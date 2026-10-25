# Kata 02 solution: join orders to parts to names across three entities.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The shared part entity is the whole join.
db = [  # => two orders, two parts
    # => Entity 10 order/part.
    (10, "order/part", 1, 70201),  # => order 10 wants entity 1
    # => Entity 11 order/part.
    (11, "order/part", 2, 70201),  # => order 11 wants entity 2
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 70201),  # => entity 1
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 70201),  # => entity 2
    # => Close the collection.
]  # => four facts, two joins to compute
# => Map each part entity to its name.
names = {e: v for e, a, v, _t in db if a == "part/name"}  # => entity to name
# => Pair each order with its joined part name.
rows = [(o, names[p]) for o, a, p, _t in db if a == "order/part"]  # => the join
# => Print one joined row per order.
print("rows:", sorted(rows))  # => Output lists both orders with names
