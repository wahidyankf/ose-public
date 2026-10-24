# Worked Example 28: Asking the Database Last March
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One query, two target transactions, two honest answers.
# => As-of keeps datoms from transactions at or before the target.
db = [  # => two prices, two transactions
    # => Entity 1 part/price.
    (1, "part/price", 180, 30101),  # => the March price
    # => Entity 1 part/price.
    (1, "part/price", 175, 30102),  # => the April correction
    # => Close the collection.
]  # => the whole price history


# => The value as of T is the newest datom at or before T.
def as_of(db, attr, entity, target):  # => time-travel read
    # => Candidates come from the past side of the target only.
    past = [
        (t, v) for e, a, v, t in db if e == entity and a == attr and t <= target
    ]  # => nothing future leaks in
    # => Newest surviving candidate wins.
    return max(past)[1]  # => the value then


# => Print March, then April.
print("march-price:", as_of(db, "part/price", 1, 30101))  # => Output shows 180
# => The check the lesson quotes.
print("april-price:", as_of(db, "part/price", 1, 30102))  # => Output shows 175
