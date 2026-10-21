# Capstone: a reference fact-database engine for order and shipment.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Assert and retract facts, read as of any transaction, apply rules.
# => Five queries over a toy order-and-shipment domain prove the engine.
db = []  # => the append-only log of asserted datoms
# => Compute the next value.
gone = []  # => retractions as entity, attribute, value, closing-tx tuples
# => Compute the next value.
clock = [90001]  # => the next transaction id, shared by every write


# => Install facts as one atomic batch stamped with the next id.
def transact(facts):  # => every write flows through here
    # => Facts arrive unstamped; the engine stamps them.
    tx = clock[0]  # => this batch's transaction
    # => Stamp and store each fact, then advance the clock.
    db.extend([(e, a, v, tx) for e, a, v in facts])  # => one batch, one tx
    # => Compute the next value.
    clock[0] += 1  # => the next batch moves forward
    # => Hand the answer back.
    return tx  # => callers keep the stamp for as-of reads


# => End a fact's present without deleting its past.
def retract(entity, attr, value):  # => retraction is also a write
    # => The closing stamp comes from the same clock.
    gone.append((entity, attr, value, clock[0]))  # => visibility ends here
    # => Compute the next value.
    clock[0] += 1  # => retractions advance time too


# => The value of one attribute as of one transaction.
def value_as_of(entity, attr, target):  # => the time-travel read
    # => Asserted at or before target, and not yet retracted there.
    cands = [
        (t, v)
        for e, a, v, t in db
        if e == entity
        and a == attr
        and t <= target
        and not any(x == e and y == a and z == v and w <= target for x, y, z, w in gone)
    ]  # => the visibility window
    # => Newest surviving candidate wins, or None when nothing qualifies.
    return max(cands)[1] if cands else None  # => the era's value


# => Open the shop: parts, customers, orders, and shipments in one batch.
t_open = transact(
    [  # => the founding transaction of this domain
        # => Entity 1 part/name.
        (1, "part/name", "Road wheel 700c"),  # => the wheel
        # => Entity 1 part/price.
        (1, "part/price", 180),  # => its March price
        # => Entity 2 part/name.
        (2, "part/name", "Track cog 16t"),  # => the cog
        # => Entity 2 part/price.
        (2, "part/price", 25),  # => the cog never reprices
        # => Entity 20 customer/name.
        (20, "customer/name", "Sari"),  # => a Bandung customer
        # => Entity 20 customer/city.
        (20, "customer/city", "Bandung"),  # => her city
        # => Entity 21 customer/name.
        (21, "customer/name", "Agus"),  # => a Surabaya customer
        # => Entity 21 customer/city.
        (21, "customer/city", "Surabaya"),  # => his city
        # => Entity 10 order/customer.
        (10, "order/customer", 20),  # => order 10 belongs to Sari
        # => Entity 10 order/part.
        (10, "order/part", 1),  # => four wheels
        # => Entity 10 order/qty.
        (10, "order/qty", 4),  # => the quantity
        # => Entity 11 order/customer.
        (11, "order/customer", 21),  # => order 11 belongs to Agus
        # => Entity 11 order/part.
        (11, "order/part", 2),  # => twenty-one cogs
        # => Entity 11 order/qty.
        (11, "order/qty", 21),  # => the quantity
        # => Entity 10 shipment/id.
        (10, "shipment/id", "SJ-501"),  # => order 10 ships as SJ-501
        # => Entity 11 shipment/id.
        (11, "shipment/id", "SJ-502"),  # => order 11 ships as SJ-502
        # => Close the collection.
    ]
)  # => sixteen facts, one transaction
# => April repricing, then the red option is discontinued.
t_price = transact([(1, "part/price", 175)])  # => the wheel drops to 175
# => Compute the next value.
t_color = transact([(1, "part/color", "red")])  # => red arrives late
# => Compute the next value.
retract(1, "part/color", "red")  # => red is discontinued


# => Query one: current totals for both orders, joined and summed.
def order_total(order):  # => qty times the current price
    # => Resolve the part, the quantity, and today's price.
    part = next(
        v for e, a, v, _t in db if e == order and a == "order/part"
    )  # => the ordered part
    # => Compute the next value.
    qty = next(
        v for e, a, v, _t in db if e == order and a == "order/qty"
    )  # => how many
    # => Hand the answer back.
    return qty * value_as_of(part, "part/price", 99999)  # => priced at present


# => Query two and three: discount eligibility and the Bandung rule.
eligible = [o for o in (10, 11) if order_total(o) > 500]  # => totals above 500
# => Compute the next value.
cities = {
    e: value_as_of(e, "customer/city", 99999) for e in (20, 21)
}  # => current cities
# => Compute the next value.
owners = {
    o: next(v for e, a, v, _t in db if e == o and a == "order/customer")
    for o in (10, 11)
}  # => order to customer
# => Compute the next value.
bandung = [o for o in (10, 11) if cities[owners[o]] == "Bandung"]  # => the two-hop rule
# => Query four and five: the wheel then, and its full history.
wheel_then = value_as_of(1, "part/price", t_open)  # => as of the founding tx
# => Compute the next value.
wheel_history = sorted(
    (t, v) for e, a, v, t in db if e == 1 and a == "part/price"
)  # => every era
# => Print all five answers in query order.
print("orders:", [10, 11])  # => Output names both orders
# => The check the lesson quotes.
print("totals:", [(o, order_total(o)) for o in (10, 11)])  # => Output shows 700 and 525
# => The check the lesson quotes.
print("eligible:", eligible)  # => Output shows both orders
# => The check the lesson quotes.
print("bandung-orders:", bandung)  # => Output shows order 10
# => The check the lesson quotes.
print("wheel-then:", wheel_then)  # => Output shows 180
# => The check the lesson quotes.
print("wheel-history:", wheel_history)  # => Output shows both eras
