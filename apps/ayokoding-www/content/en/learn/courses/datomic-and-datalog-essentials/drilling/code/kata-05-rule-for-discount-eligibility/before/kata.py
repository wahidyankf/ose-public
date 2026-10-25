# Kata 05 starter: extract the discount check into one named rule.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Fill the rule so both screens agree.
orders = {10: 640, 11: 120, 12: 515}  # => order totals in whole units


# => TODO: an order is eligible when its total tops 500.
def eligible(order):  # => TODO: compare the total against 500
    # => Hand the answer back.
    return False  # => TODO: replace False with the real rule


# => Both screens call the same rule.
quote = sorted(o for o in orders if eligible(o))  # => the quoting screen
# => Compute the next value.
report = sorted(o for o in orders if eligible(o))  # => the month-end report
# => Print both answers.
print("quote:", quote)  # => Output shows 10 and 12 after the fix
# => The check the lesson quotes.
print("report:", report)  # => Output shows 10 and 12 after the fix
