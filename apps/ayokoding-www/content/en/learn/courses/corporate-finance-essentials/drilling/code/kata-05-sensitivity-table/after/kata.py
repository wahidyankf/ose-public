# Kata 05 solution: print the van's NPV at 8, 10, and 12 percent.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The table shows value falling as the demanded return rises.
from decimal import Decimal

# => The outlay and the five inflows.
cost = Decimal("240000")  # => paid today
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three
flows += [Decimal("90000"), Decimal("70000")]  # => last two
# => One NPV per rung on the sensitivity ladder.
rates = [Decimal("0.08"), Decimal("0.10"), Decimal("0.12")]  # => low to high
for rate in rates:  # => one valuation per demanded return
    # => Discount every inflow at this rung and subtract the cost.
    total = Decimal("0")  # => running present value
    for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
        total += cash / ((Decimal("1") + rate) ** year)  # => one discounted slice
    # => Each rung prints its own verdict number.
    print("rate:", rate, "npv:", (total - cost).quantize(Decimal("0.01")))  # => Output
