# Kata 02 starter: join orders to parts to names across three entities.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Fill the join so each order prints with its part name.
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
# => TODO: map each part entity to its name.
names = {}  # => TODO: build entity to name from part/name datoms
# => TODO: pair each order with its joined part name.
rows = []  # => TODO: join order/part with the names map
# => Print one joined row per order.
print("rows:", sorted(rows))  # => Output lists both orders with names
