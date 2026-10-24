# Worked Example 40: Attributes That Point at Entities
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Order 10 points at customer 20, who is named Sari.
# => Reference values are entity ids, not literals.
db = [  # => an order, a reference, and a customer name
    # => Entity 10 order/id.
    (10, "order/id", "SO-101", 50201),  # => the order exists
    # => Entity 10 order/customer.
    (10, "order/customer", 20, 50201),  # => it points at entity 20
    # => Entity 20 customer/name.
    (20, "customer/name", "Sari", 50201),  # => entity 20 is Sari
    # => Close the collection.
]  # => three facts, one pointer
# => Follow the reference from the order to the customer name.
refs = {o: c for o, a, c, _t in db if a == "order/customer"}  # => order to customer
# => Compute the next value.
names = {e: v for e, a, v, _t in db if a == "customer/name"}  # => customer to name
# => Print the order with its resolved customer.
print(
    "order-customer:", [(o, names[c]) for o, c in sorted(refs.items())]
)  # => Output names Sari
