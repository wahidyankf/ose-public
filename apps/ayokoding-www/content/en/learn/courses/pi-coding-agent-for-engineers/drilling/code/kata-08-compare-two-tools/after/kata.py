# Kata 8: Compare Two Tools
# => Criteria are named before either tool runs.
# => Scores map each tool to points per criterion.
# => Totals decide; ties defer to the cheaper tool.
task = "add coupon total with test"  # => the shared job
# => Named axes force every contender through the same gates.
# => The table below freezes both recorded legs.
criteria = ["correctness", "turns", "cost", "trace clarity"]  # => axes
# => Frozen scores stand in for the two recorded legs.
scores = {"pi": [3, 2, 3, 3], "sibling": [3, 3, 2, 2]}  # => table
# => Add each row; the highest total wins the comparison.
totals = {t: sum(v) for t, v in scores.items()}  # => add axes
winner = max(totals, key=totals.get)  # => top scorer
# => Print task, criteria, totals, and the winner.
print("task:", task)  # => Output states the job
print("criteria:", criteria)  # => Output lists the axes
print("totals:", totals)  # => Output totals the table
print("winner:", winner)  # => Output names the winner
