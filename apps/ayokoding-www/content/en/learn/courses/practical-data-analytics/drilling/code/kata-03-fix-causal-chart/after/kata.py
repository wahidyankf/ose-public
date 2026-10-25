# Kata 03 solution: the number stays, the causal leap goes.
# => Sinar Abadi and its promo weeks are fictional; every cell is fixed.
# => Correlation kept, confounder named, prescription refused.
import statistics

# => Six weeks of discount percent, fixed for the kata.
discount = [0, 5, 10, 15, 20, 25]  # => the suspected lever
# => Six weeks of basket size, fixed for the kata.
basket = [2, 3, 4, 5, 6, 8]  # => the hoped-for response
# => The correlation measures co-movement and nothing more.
print(
    "correlation:", round(statistics.correlation(discount, basket), 4)
)  # => Output reads high
# => Payday weeks lift both series, so the number cannot prescribe.
print(
    "caveat: payday calendar confounds both; no causal claim."
)  # => Output refuses the leap
