# Worked Example 32: Joining as of Last Quarter
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Same order, two eras, two honest totals.
# => Only the as-of target moves; the join stands still.
db = [  # => prices then and now
    # => Entity 1 part/price.
    (1, "part/price", 180, 30501),  # => March wheel price
    # => Entity 2 part/price.
    (2, "part/price", 25, 30501),  # => March cog price
    # => Entity 1 part/price.
    (1, "part/price", 175, 30502),  # => current wheel price
    # => Close the collection.
]  # => the cog never repriced
# => Line items of order 10: two wheels, five cogs.
items = [(1, 2), (2, 5)]  # => part entity and quantity


# => Total the items with prices visible as of the target.
def total_as_of(target):  # => the invoice as it read then
    # => Per part, take the newest price at or before the target.
    total = 0  # => whole currency units
    # => Walk each candidate in turn.
    for part, qty in items:  # => each line item
        # => Compute the next value.
        price = max(
            v for e, a, v, t in db if e == part and a == "part/price" and t <= target
        )  # => era-correct price
        # => Compute the next value.
        total += price * qty  # => line total joins the sum
    # => Hand the answer back.
    return total  # => the era's honest total


# => Print the March invoice and the current reprint.
print("march-total:", total_as_of(30501))  # => Output shows 485
# => The check the lesson quotes.
print("current-total:", total_as_of(30599))  # => Output shows 475
