# Worked Example 14: Every Transaction Signs Its Work
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Three transactions, three signers, three fixed instants.
# => The log answers who and when for every fact.
txlog = {  # => one entry per transaction, in no particular order
    # => The 9201 entry.
    9201: {"instant": "2026-03-02T09:00:00Z", "actor": "rani"},  # => the morning import
    # => The 9202 entry.
    9202: {"instant": "2026-03-02T14:30:00Z", "actor": "bimo"},  # => the repricing
    # => The 9203 entry.
    9203: {"instant": "2026-03-03T09:00:00Z", "actor": "rani"},  # => the restock
    # => Close the collection.
}  # => who did what, and when
# => Print the log oldest transaction first.
for tx in sorted(txlog):  # => time order is transaction order
    # => Compute the next value.
    entry = txlog[tx]  # => the signature for this batch
    # => The check the lesson quotes.
    print(
        f"tx={tx} instant={entry['instant']} actor={entry['actor']}"
    )  # => Output signs each batch
