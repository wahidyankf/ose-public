# Worked Example 44: Sensitivity to the Discount Rate
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The van's NPV at 8, 10, and 12 percent shows how rate risk bites.
# => Distant cash moves most, which is why long projects fear rate rises.
from decimal import Decimal

# => The van project's cost and five yearly inflows.
cost = Decimal("240000")  # => the upfront outflow
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three years
flows += [Decimal("90000"), Decimal("70000")]  # => the last two years
# => One NPV per rate on the sensitivity ladder.
for rate in [Decimal("0.08"), Decimal("0.10"), Decimal("0.12")]:  # => low to high
    # => Discount every inflow at this rung and subtract the cost.
    total = Decimal("0")  # => running present value
    for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
        total += cash / ((Decimal("1") + rate) ** year)  # => one discounted slice
    # => Each rung prints its own verdict number.
    print("rate:", rate, "npv:", (total - cost).quantize(Decimal("0.01")))  # => Output
