# Worked Example 41: Walking Two Hops to the City
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Two hops collapse into one order-city pair per order.
# => Each hop shares a variable with the next.
db = [  # => two orders, two customers, two cities
    # => Entity 10 order/customer.
    (10, "order/customer", 20, 50301),  # => order 10 to customer 20
    # => Entity 11 order/customer.
    (11, "order/customer", 21, 50301),  # => order 11 to customer 21
    # => Entity 20 customer/city.
    (20, "customer/city", "Bandung", 50301),  # => customer 20's city
    # => Entity 21 customer/city.
    (21, "customer/city", "Surabaya", 50301),  # => customer 21's city
    # => Close the collection.
]  # => four facts, two paths
# => Resolve customers to cities, then orders to customers.
cities = {e: v for e, a, v, _t in db if a == "customer/city"}  # => customer to city
# => Compute the next value.
refs = {o: c for o, a, c, _t in db if a == "order/customer"}  # => order to customer
# => Print each order with its two-hop city.
for order in sorted(refs):  # => both orders
    # => The check the lesson quotes.
    print(f"order={order} city={cities[refs[order]]}")  # => Output walks both paths
