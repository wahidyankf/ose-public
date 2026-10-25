# Worked Example 43: Redesigning a Misleading Chart
# => Sinar Abadi and its vendor slide are fictional; every cell is fixed.
# => Six weeks, truncated axis, causal arrow: the full vendor toolkit.
# => Redraw from zero, drop the arrow, print what changed and why.
import statistics

# => Six weeks of promo spend in millions, fixed for the lesson.
spend = [10, 12, 11, 13, 12, 14]  # => the vendor's x-axis
# => Six weeks of revenue in millions, fixed for the lesson.
revenue = [30, 33, 32, 35, 34, 38]  # => the vendor's y-axis
# => Honest heights from a zero baseline: calm, comparable bars.
print(
    "honest_ratio:", round(max(revenue) / min(revenue), 2)
)  # => Output reads about 1.27
# => The correlation the arrow pretends to explain.
print(
    "correlation:", round(statistics.correlation(spend, revenue), 4)
)  # => Output reads high
# => The redesign verdict: what was kept, what was removed, and why.
print(
    "verdict: kept the six weeks; removed the truncated axis and"
)  # => Output states the fix
print(
    "the causal arrow: co-movement is not a purchase receipt."
)  # => Output refuses the claim
