# Worked Example 17: Joins Are Shared Variables
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Orders join parts through one shared variable.
# => No join keyword: repetition of ?p is the join.
db = [  # => two parts and two orders in one transaction
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 10201),  # => part entity 1
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 10201),  # => part entity 2
    # => Entity 10 order/part.
    (10, "order/part", 1, 10201),  # => order 10 wants entity 1
    # => Entity 10 order/qty.
    (10, "order/qty", 2, 10201),  # => two wheels
    # => Entity 11 order/part.
    (11, "order/part", 2, 10201),  # => order 11 wants entity 2
    # => Entity 11 order/qty.
    (11, "order/qty", 5, 10201),  # => five cogs
    # => Close the collection.
]  # => six facts, two natural groups
# => Index names by entity so the join resolves in one pass.
names = {e: v for e, a, v, _t in db if a == "part/name"}  # => entity to name
# => Each order row pairs its quantity with the joined part name.
qtys = {o: q for o, a, q, _t in db if a == "order/qty"}  # => order to quantity
# => Each order row pairs its part name with its quantity.
parts = {o: p for o, a, p, _t in db if a == "order/part"}  # => order to part
# => The join: one row per order, resolved through the maps.
rows = sorted((o, names[parts[o]], qtys[o]) for o in parts)  # => two joined rows
# => Print one joined row per order.
for order, name, qty in rows:  # => two rows, order id first
    # => The check the lesson quotes.
    print(f"order={order} part={name} qty={qty}")  # => Output shows both sales
