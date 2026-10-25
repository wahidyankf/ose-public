# Kata 04 solution: read the price as of a past transaction for the audit.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The newest datom at or before the target wins.
db = [  # => two prices, two transactions
    # => Entity 1 part/price.
    (1, "part/price", 180, 70401),  # => Friday's price
    # => Entity 1 part/price.
    (1, "part/price", 175, 70402),  # => today's price
    # => Close the collection.
]  # => the audit spans both


# => Return the newest price at or before the target.
def as_of(target):  # => the time-travel read
    # => Candidates predate the target; the newest wins.
    return max((t, v) for _e, _a, v, t in db if t <= target)[1]  # => the era's price


# => Print Friday, then today.
print("friday-price:", as_of(70401))  # => Output shows 180
# => The check the lesson quotes.
print("today-price:", as_of(70402))  # => Output shows 175
