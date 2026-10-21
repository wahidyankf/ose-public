# Worked Example 25: Rules Build on Rules
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Two small rules answer one real question.
# => Chaining keeps each layer testable alone.
orders = {10: (20, 640), 11: (21, 120), 12: (20, 515)}  # => order to customer and total


# => A priority customer placed an order above 500.
def priority_customer(customer):  # => the first layer
    # => Any big order promotes its customer.
    return any(
        c == customer and total > 500 for c, total in orders.values()
    )  # => one big order suffices


# => Free shipping goes to orders of priority customers.
def free_shipping(order):  # => the second layer, built on the first
    # => Look up the order's customer, then ask the first rule.
    customer, _total = orders[order]  # => who placed it
    # => Hand the answer back.
    return priority_customer(customer)  # => chained verdict


# => Print the free-shipping orders.
free = sorted(o for o in orders if free_shipping(o))  # => orders 10 and 12
# => The check the lesson quotes.
print("free-shipping:", free)  # => Output shows 10 and 12
