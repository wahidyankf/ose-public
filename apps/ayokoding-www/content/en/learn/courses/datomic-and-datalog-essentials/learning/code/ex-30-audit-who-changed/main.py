# Worked Example 30: Who Changed the Price
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three changes, three signers, one joined audit.
# => The transaction id joins facts to their authors.
changes = [(180, 30301), (175, 30302), (178, 30303)]  # => value per opening tx
# => Who signed each transaction, and at which fixed instant.
txlog = {  # => the signature side of the join
    # => The 30301 entry.
    30301: ("rani", "2026-03-02T09:00:00Z"),  # => morning import
    # => The 30302 entry.
    30302: ("bimo", "2026-03-02T14:30:00Z"),  # => afternoon repricing
    # => The 30303 entry.
    30303: ("rani", "2026-03-03T09:00:00Z"),  # => next-day correction
    # => Close the collection.
}  # => actor and instant per transaction
# => Join each change to its signature on the transaction id.
for value, tx in changes:  # => oldest change first
    # => Compute the next value.
    actor, instant = txlog[tx]  # => the shared key pays off
    # => Compute the next value.
    line = f"price={value} actor={actor} instant={instant}"  # => one audit row
    # => The check the lesson quotes.
    print(line)  # => Output audits all three
