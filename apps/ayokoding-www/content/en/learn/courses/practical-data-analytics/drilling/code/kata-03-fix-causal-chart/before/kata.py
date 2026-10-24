# Kata 03 starter: a chart that claims too much.
# => Sinar Abadi and its promo weeks are fictional; every cell is fixed.
# => TODO: keep the number, remove the causal leap, name the confounder.
import statistics

# => Six weeks of discount percent, fixed for the kata.
discount = [0, 5, 10, 15, 20, 25]  # => the suspected lever
# => Six weeks of basket size, fixed for the kata.
basket = [2, 3, 4, 5, 6, 8]  # => the hoped-for response
# => The correlation is real; the sentence below it is not earned.
print(
    "correlation:", round(statistics.correlation(discount, basket), 4)
)  # => prints high
print(
    "claim: discounts grow baskets, roll out 25pct storewide."
)  # => TODO: replace with caveat
