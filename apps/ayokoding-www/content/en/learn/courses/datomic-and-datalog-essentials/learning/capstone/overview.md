---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 40
---

This capstone builds the engine the whole course has been simulating in pieces: a small reference fact-database with assert, retract, as-of reads, and named Datalog-style rules, then aims it at a toy order-and-shipment domain and answers five queries including one as of a past transaction. Kencana Parts Co. is fictional, and every number here belongs to it. No licensed Datomic server is required or run; the engine models the concepts and claims nothing more.

## The domain

Two parts (the Road wheel 700c and the Track cog 16t), two customers (Sari in Bandung, Agus in Surabaya), two orders (four wheels for Sari, twenty-one cogs for Agus), and two shipments (SJ-501, SJ-502). The founding transaction installs sixteen facts at once: names, prices, customers, cities, orders, quantities, and shipment ids. April then reprices the wheel from 180 to 175, red arrives as a color option, and red is discontinued, exercising the retraction path.

## The engine contract

`transact` takes unstamped facts, stamps the whole batch with the next transaction id, and returns that id for later as-of reads. `retract` records a closing transaction for one fact without deleting anything. `value_as_of` returns the newest asserted value at or before its target that no retraction has closed by then, or None when nothing qualifies. Every write flows through these two functions, so the transaction clock advances exactly once per batch and the log stays the single source of truth.

## The five queries

First, current totals: each order joins its part and quantity to today's price, giving 700 for order 10 and 525 for order 11. Second, discount eligibility: both totals top 500, so both orders earn it. Third, the Bandung rule: a two-hop traversal from order to customer to city keeps order 10 and drops order 11. Fourth, the wheel as of the founding transaction: 180, proving the past is still queryable after the repricing. Fifth, the wheel's full history: both price eras with their opening transactions.

## How to extend it

Add a third order and watch the totals query include it without edits. Retract the cog price and check which queries change: totals move, eligibility may flip, and the history grows by one closing stamp. Introduce a new many-valued attribute like part tags and answer a membership question with one clause. Each extension exercises a different theme, which is the point: the engine is small enough to hold in your head and complete enough to keep teaching.

## Acceptance

`capstone.py` runs with Python 3.14's standard library only, exits 0, and prints the six lines recorded in `expected/main/main.stdout.txt`: the orders, their totals, the eligible list, the Bandung orders, the wheel then, and the wheel history. Change any domain number and the output changes with it; change nothing and two runs print byte-identical output. This course states explicitly that no real, licensed Datomic server is required or run.

## Query walkthrough

Query one joins each order to its part, quantity, and current price: order 10 resolves to part 1 at 175 times 4, order 11 to part 2 at 25 times 21. The totals print as 700 and 525, and the join text never mentions any price directly. Query two applies the 500 threshold to those totals and keeps both orders. Query three walks order to customer to city and keeps order 10, whose owner Sari lives in Bandung, while order 11 drops out at Surabaya. Query four pins the founding transaction and reads the wheel at 180, ignoring the later repricing entirely. Query five lists both price eras with their opening transactions, which is the audit trail in miniature.

## Determinism and limits

Every transaction id is assigned by the engine counter, every instant is a fixed string, and no map iteration escapes unsorted into the output: two runs print byte-identical text. The engine models the concepts and claims nothing more: it has no storage backend, no concurrency control, and no query planner, and this course states explicitly that no real, licensed Datomic server is required or run. Its value is pedagogical leverage: five queries over seventy lines that every theme in this course has already explained piece by piece.

## Running it

From the course directory, the harness runs `python3 capstone.py` under the Python toolchain with no network and a fixed seed environment, comparing standard output byte-for-byte against `expected/main/main.stdout.txt`. Run it locally the same way before trusting any edit: the six lines print in query order, and any domain change moves exactly the lines its query owns. Keep the engine and the domain in one file until the file earns a split; at seventy lines it has not.
Try one extension before calling the capstone done: add a third part with a many-valued tag set, then answer which orders contain a commuter-tagged part with a single membership clause. The engine needs no changes, only new facts, which is the whole argument for modeling with datoms in one sentence.

**`learning/capstone/code/capstone.py`**

```python
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
```

**Output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
orders: [10, 11]
totals: [(10, 700), (11, 525)]
eligible: [10, 11]
bandung-orders: [10]
wheel-then: 180
wheel-history: [(90001, 180), (90002, 175)]
```
