# Kata 04 starter: read the price as of a past transaction for the audit.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Fill the as-of read so Friday shows 180 and today shows 175.
db = [  # => two prices, two transactions
    # => Entity 1 part/price.
    (1, "part/price", 180, 70401),  # => Friday's price
    # => Entity 1 part/price.
    (1, "part/price", 175, 70402),  # => today's price
    # => Close the collection.
]  # => the audit spans both


# => TODO: return the newest price at or before the target.
def as_of(target):  # => TODO: filter by t <= target, take newest
    # => Hand the answer back.
    return None  # => TODO: replace None with the era's price


# => Print Friday, then today.
print("friday-price:", as_of(70401))  # => Output shows 180 after the fix
# => The check the lesson quotes.
print("today-price:", as_of(70402))  # => Output shows 175 after the fix
