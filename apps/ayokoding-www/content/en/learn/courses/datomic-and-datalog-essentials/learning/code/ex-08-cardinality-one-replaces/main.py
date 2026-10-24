# Worked Example 8: Cardinality One Keeps One Current Value
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The wheel is renamed twice; the present is one value.
# => The past stays readable beside it.
db = [  # => three name facts, oldest first by transaction
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel", 5001),  # => the original name
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 5002),  # => the clarified name
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c 32h", 5003),  # => the final name
    # => Close the collection.
]  # => three datoms, one current value
# => The current value is the one with the highest transaction.
current = max(db, key=lambda d: d[3])[2]  # => newest transaction wins
# => The history is every value in transaction order.
names = [v for _e, _a, v, t in sorted(db, key=lambda d: d[3])]  # => oldest first
# => One line for the present, one for the ever-was.
print("current:", current)  # => Output shows the final name
# => The check the lesson quotes.
print("history:", names)  # => Output shows all three names
