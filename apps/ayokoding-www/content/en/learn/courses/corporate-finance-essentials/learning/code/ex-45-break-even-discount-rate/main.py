# Worked Example 45: Break-Even Discount Rate
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The break-even rate is the IRR wearing a decision-maker's hat.
# => Any demanded return below it keeps the van's NPV positive.
from decimal import Decimal

# => The van project's cost and five yearly inflows.
cost = Decimal("240000")  # => the upfront outflow
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three years
flows += [Decimal("90000"), Decimal("70000")]  # => the last two years


# => NPV of the van at one trial rate.
def value(trial):  # => net value at a trial rate
    # => Discount every inflow at the trial rate and sum.
    total = Decimal("0")  # => running present value
    for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
        total += cash / ((Decimal("1") + trial) ** year)  # => one discounted slice
    return total - cost  # => net value at the trial rate


# => Bisect between zero and fifty percent for forty halvings.
low = Decimal("0")  # => value here is positive
high = Decimal("0.50")  # => value here is negative
for _ in range(40):  # => forty halvings pin four decimals
    mid = (low + high) / Decimal("2")  # => the next trial
    if value(mid) > Decimal("0"):  # => zero sits above
        low = mid  # => raise the floor
    else:  # => zero sits below
        high = mid  # => lower the ceiling
# => The converged rate is where the decision flips.
breakeven = (low + high) / Decimal("2")  # => the flip point
# => Near nineteen percent: a wide cushion above the ten percent hurdle.
print("breakeven:", (breakeven * 100).quantize(Decimal("0.01")))  # => Output the flip
print(
    "cushion:", ((breakeven - Decimal("0.10")) * 100).quantize(Decimal("0.01"))
)  # => gap
