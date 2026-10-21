# Worked Example 22: One Variable, One Value
# => Kencana Parts Co. is fictional; every number here is fixed.
# => ?c must satisfy both clauses at once.
# => Two Bandung orders survive; Surabaya does not.
db = [  # => orders pointing at customers, customers with cities
    # => Entity 10 order/customer.
    (10, "order/customer", 20, 20101),  # => order 10 belongs to 20
    # => Entity 20 customer/city.
    (20, "customer/city", "Bandung", 20101),  # => customer 20 lives in Bandung
    # => Entity 11 order/customer.
    (11, "order/customer", 21, 20101),  # => order 11 belongs to 21
    # => Entity 21 customer/city.
    (21, "customer/city", "Surabaya", 20101),  # => customer 21 lives in Surabaya
    # => Entity 12 order/customer.
    (12, "order/customer", 20, 20101),  # => order 12 belongs to 20
    # => Close the collection.
]  # => five facts, one shared customer
# => Map each customer to its city for the join.
cities = {e: v for e, a, v, _t in db if a == "customer/city"}  # => customer to city
# => Keep orders whose customer unifies with a Bandung customer.
bandung = sorted(
    o for o, a, c, _t in db if a == "order/customer" and cities.get(c) == "Bandung"
)  # => ?c agrees twice
# => Print the matching orders.
print("bandung-orders:", bandung)  # => Output shows 10 and 12
