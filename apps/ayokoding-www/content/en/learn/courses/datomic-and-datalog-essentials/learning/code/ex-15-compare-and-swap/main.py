# Worked Example 15: Conditional Writes Prevent Lost Updates
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Two clerks race; the precondition admits only the fresh one.
# => Check and install share one transaction, so no update is lost.
db = [(1, "part/price", 175, 9301)]  # => the price both clerks saw


# => Install the new price only when the seen price still holds.
def swap(db, seen, new, tx):  # => compare-and-swap in one step
    # => The current price is the newest price datom.
    current = max((v, t) for _e, _a, v, t in db)[0]  # => what the store holds now
    # => Match means install; mismatch means refuse without writing.
    if current != seen:  # => stale reads lose here
        # => Hand the answer back.
        return db, "rejected"  # => nothing was written
    # => Fresh reads install one new price datom.
    return db + [(1, "part/price", new, tx)], "accepted"  # => one verdict


# => Rani saw 175 and writes 170; Bimo also saw 175 but arrives late.
db, first = swap(db, 175, 170, 9302)  # => fresh read wins
# => Compute the next value.
db, second = swap(db, 175, 165, 9303)  # => stale read loses
# => Print both verdicts and the surviving price.
print("first:", first)  # => Output shows accepted
# => The check the lesson quotes.
print("second:", second)  # => Output shows rejected
# => The check the lesson quotes.
print("price:", max((v, t) for _e, _a, v, t in db)[0])  # => Output shows 170
