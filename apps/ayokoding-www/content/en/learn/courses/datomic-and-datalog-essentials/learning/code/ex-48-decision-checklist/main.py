# Worked Example 48: Should This Workload Be Facts
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Four features, four weights, one recommendation.
# => The catalog passes; a click counter would not.
features = {  # => workload traits, each 0 to 10
    # => The audit-need entry.
    "audit-need": 9,  # => auditors visit yearly
    # => The history-reads entry.
    "history-reads": 7,  # => repricing reviews are weekly
    # => The write-calm entry.
    "write-calm": 8,  # => dozens of writes a day, not thousands
    # => The relationships entry.
    "relationships": 8,  # => parts, orders, customers interlink
    # => Close the collection.
}  # => Kencana's catalog profile
# => Equal weights; twenty-four out of forty recommends facts.
score = sum(features.values())  # => the workload score
# => Compute the next value.
verdict = "use-facts" if score >= 24 else "use-rows"  # => the threshold
# => Print the score and the recommendation.
print("score:", score)  # => Output shows 32
# => The check the lesson quotes.
print("verdict:", verdict)  # => Output shows use-facts
