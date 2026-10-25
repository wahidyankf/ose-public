# Worked Example 23: Constants Narrow the Search
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Fixing the city to Surabaya leaves one order.
# => Constants turn patterns into specific questions.
db = [  # => the same three orders and two cities
    # => Entity 10 order/customer.
    (10, "order/customer", 20, 20201),  # => Bandung order
    # => Entity 20 customer/city.
    (20, "customer/city", "Bandung", 20201),  # => its city
    # => Entity 11 order/customer.
    (11, "order/customer", 21, 20201),  # => Surabaya order
    # => Entity 21 customer/city.
    (21, "customer/city", "Surabaya", 20201),  # => its city
    # => Entity 12 order/customer.
    (12, "order/customer", 20, 20201),  # => Bandung order
    # => Close the collection.
]  # => five facts, one constant question
# => Map each customer to its city for the join.
cities = {e: v for e, a, v, _t in db if a == "customer/city"}  # => customer to city
# => Keep orders whose customer city equals the constant.
surabaya = sorted(
    o for o, a, c, _t in db if a == "order/customer" and cities.get(c) == "Surabaya"
)  # => pinned value
# => Print the single matching order.
print("surabaya-orders:", surabaya)  # => Output shows 11
