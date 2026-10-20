# Example 71: Fix the Comparison Criteria
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Fair comparison needs one task and fixed criteria.
# => Both tools run the same job, checked on the same day.
task = "add coupon total with test"  # => the shared repeatable job
# => Criteria are named before either tool runs.
criteria = ["correctness", "turns", "cost", "trace clarity"]  # => frozen scoring axes
# => Scores map each tool to points per criterion.
scores = {"pi": [3, 2, 3, 3], "sibling": [3, 3, 2, 2]}  # => frozen score table
# => Totals decide; ties defer to the cheaper tool.
totals = {t: sum(v) for t, v in scores.items()}  # => add axes
# => The winner is the highest total, named plainly.
winner = max(totals, key=totals.get)  # => top scorer
print("task:", task)  # => Output states the job
print("criteria:", criteria)  # => Output lists the axes
print("totals:", totals)  # => Output totals the table
print("winner:", winner)  # => Output names the winner
