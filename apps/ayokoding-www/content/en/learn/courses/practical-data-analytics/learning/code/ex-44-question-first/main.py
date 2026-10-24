# Worked Example 44: Stating the Question First
# => Sinar Abadi and its restock decision are fictional; every word is fixed.
# => The question names decision, population, metric, and threshold up front.
# => A question struct prints as the contract the analysis will keep.
# => The decision the answer will actually change.
decision = "restock staples for October"  # => money follows this answer
# => The population the metric is computed over, no wider.
population = "staples receipts in September"  # => scope stated, scope kept
# => The metric and the bar that flips the decision.
metric = "mean basket qty above 3"  # => threshold named before seeing data
print("decision:", decision)  # => Output states what changes
print("population:", population)  # => Output states the scope
print("metric:", metric)  # => Output states the bar
