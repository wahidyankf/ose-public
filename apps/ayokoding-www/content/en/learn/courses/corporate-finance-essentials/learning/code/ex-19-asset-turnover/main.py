# Worked Example 19: Asset Turnover
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Asset turnover counts sales units per asset unit.
# => It measures how hard the asset base works, not how profitable sales are.
from decimal import Decimal

# => Yearly sales and everything owned to produce them.
revenue = Decimal("1200000")  # => the year's sales
assets = Decimal("1000000")  # => the asset base behind them
# => Turnover: sales per unit of assets.
turnover = revenue / assets  # => the workload multiple
# => 1.20: each asset unit supports one and a fifth sales units.
print("revenue:", revenue)  # => Output repeats sales
print("turnover:", turnover.quantize(Decimal("0.01")))  # => Output is the workload
