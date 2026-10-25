# Kata 05 solution: extract the discount check into one named rule.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One rule, two callers, zero drift.
orders = {10: 640, 11: 120, 12: 515}  # => order totals in whole units


# => An order is eligible when its total tops 500.
def eligible(order):  # => the single definition
    # => Above 500 earns the discount.
    return orders[order] > 500  # => the real rule


# => Both screens call the same rule.
quote = sorted(o for o in orders if eligible(o))  # => the quoting screen
# => Compute the next value.
report = sorted(o for o in orders if eligible(o))  # => the month-end report
# => Print both answers.
print("quote:", quote)  # => Output shows 10 and 12
# => The check the lesson quotes.
print("report:", report)  # => Output shows 10 and 12
