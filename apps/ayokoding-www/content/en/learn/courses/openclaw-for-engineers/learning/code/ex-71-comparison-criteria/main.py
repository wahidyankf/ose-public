# => Four weighted criteria summing to one.
# => Weights are set before any tool runs.
criteria = {"correctness": 0.5, "tokens": 0.2, "turns": 0.15, "review burden": 0.15}  # => correctness dominates; cost and effort split the rest
# => criteria has 4 entries (type: dict)
total = sum(criteria.values())  # => weights must sum to exactly one
# => total is 1.0
print("criteria: %d" % len(criteria))  # => Output: criteria: 4
for name, weight in criteria.items():  # => show the scorecard in canonical order
    print("%s: %.2f" % (name, weight))  # => Output: four criterion lines
print("weights sum: %.1f" % total)  # => Output: weights sum: 1.0
fair = abs(total - 1.0) < 0.001  # => tolerance guards float addition
# => fair is True
print("scorecard fair: " + str(fair))  # => Output: scorecard fair: True
