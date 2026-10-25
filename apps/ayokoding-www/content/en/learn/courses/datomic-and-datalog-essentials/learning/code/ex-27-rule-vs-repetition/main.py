# Worked Example 27: One Rule Beats Three Copies
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Same answer today; only the rule survives tomorrow.
# => Three copies drift; one definition holds.
orders = {10: 640, 11: 120, 12: 515}  # => order totals in whole units


# => The rule version: threshold lives in exactly one place.
def eligible(order):  # => the single definition
    # => Above 500 earns the discount.
    return orders[order] > 500  # => one threshold, one home


# => Three inlined copies, as three screens would carry them.
quote = sorted(o for o, t in orders.items() if t > 500)  # => copy one
# => Compute the next value.
report = sorted(o for o, t in orders.items() if t > 500)  # => copy two
# => Compute the next value.
mailer = sorted(o for o, t in orders.items() if t > 500)  # => copy three
# => The rule version, computed once and shared.
ruled = sorted(o for o in orders if eligible(o))  # => the named version
# => Print all four answers: identical today, by construction.
print("quote:", quote)  # => Output shows 10 and 12
# => The check the lesson quotes.
print("report:", report)  # => Output shows 10 and 12
# => The check the lesson quotes.
print("mailer:", mailer)  # => Output shows 10 and 12
# => The check the lesson quotes.
print("ruled:", ruled)  # => Output matches all three copies
