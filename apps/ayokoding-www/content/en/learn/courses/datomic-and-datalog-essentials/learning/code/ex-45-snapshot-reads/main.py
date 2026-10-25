# Worked Example 45: Readers Never Block Writers
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The report pins tx 60201 while three writes land after it.
# => Stable count, zero lock acquisitions, no retries.
db = [(i, "part/in-stock", 10 * i, 60201) for i in range(1, 6)]  # => five parts
# => Three writes land after the report starts; the snapshot ignores them.
later = [  # => concurrent writes
    # => Entity 6 part/in-stock.
    (6, "part/in-stock", 60, 60202),  # => a new part arrives
    # => Entity 1 part/in-stock.
    (1, "part/in-stock", 15, 60203),  # => entity 1 restocked
    # => Entity 7 part/in-stock.
    (7, "part/in-stock", 70, 60204),  # => another new part
    # => Close the collection.
]  # => all invisible to the snapshot
# => The report reads as of 60201: five parts, no locks taken.
snapshot = [d for d in db if d[3] <= 60201]  # => the past is immutable
# => Compute the next value.
lock_waits = 0  # => snapshots never lock
# => Print the stable count, the ignored writes, and the waits.
print("snapshot-parts:", len(snapshot))  # => Output shows 5
# => The check the lesson quotes.
print("ignored-writes:", len(later))  # => Output shows 3
# => The check the lesson quotes.
print("lock-waits:", lock_waits)  # => Output shows 0
