# Worked Example 24: Name a Pattern Once, Reuse It Twice
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One rule, two queries, one consistent answer.
# => Totals above 500 earn the discount.
orders = {10: 640, 11: 120, 12: 515}  # => order totals in whole units


# => The named rule: an order is eligible when its total tops 500.
def discount_eligible(order):  # => one definition, two callers
    # => Totals are fixed; the threshold is the business policy.
    return orders[order] > 500  # => True earns the discount


# => Query one lists eligible orders; query two counts them.
listed = sorted(o for o in orders if discount_eligible(o))  # => the quoting screen
# => Compute the next value.
counted = sum(1 for o in orders if discount_eligible(o))  # => the month-end report
# => Print the list and the count side by side.
print("eligible:", listed)  # => Output shows 10 and 12
# => The check the lesson quotes.
print("eligible-count:", counted)  # => Output shows 2
