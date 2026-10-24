# Worked Example 11: Transactions Land as One Batch
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One sale is three datoms sharing transaction 8001.
# => A bad batch installs nothing: all or nothing.
db = []  # => the log starts empty for this sale
# => The good batch: an order with its part and quantity.
good = [  # => three facts, one shared transaction
    # => Entity 10 order/id.
    (10, "order/id", "SO-101", 8001),  # => the order exists
    # => Entity 10 order/part.
    (10, "order/part", 1, 8001),  # => it points at entity 1
    # => Entity 10 order/qty.
    (10, "order/qty", 2, 8001),  # => two wheels ordered
    # => Close the collection.
]  # => validated first, then installed together


# => Install a batch only when every quantity is a positive integer.
def transact(batch):  # => the tiny all-or-nothing gate
    # => Quantities must be positive integers; anything else refuses all.
    qtys = [v for _e, a, v, _t in batch if a == "order/qty"]  # => the quantities
    # => Positive integers pass; anything else fails the batch.
    ok = all(isinstance(v, int) and v > 0 for v in qtys)  # => the batch rule
    # => Good batches extend the log; bad ones leave it untouched.
    return batch if ok else []  # => all three datoms, or none


# => The good batch lands; a batch with quantity zero is refused whole.
db += transact(good)  # => three datoms join the log
# => Compute the next value.
bad = [  # => two facts, one broken rule
    # => Entity 11 order/id.
    (11, "order/id", "SO-102", 8002),  # => the order exists
    # => Entity 11 order/qty.
    (11, "order/qty", 0, 8002),  # => zero quantity breaks the rule
    # => Close the collection.
]  # => refused whole below
# => Compute the next value.
refused = transact(bad)  # => nothing is installed
# => One line proves the install, one proves the refusal.
print("installed:", len(db))  # => Output shows 3 datoms
# => The check the lesson quotes.
print("refused:", len(refused))  # => Output shows 0 datoms
