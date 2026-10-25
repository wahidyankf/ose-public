# Worked Example 24: Payback Period
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Payback counts years until cumulative inflows cover the cost.
# => It measures speed, not value: discounting is ignored on purpose.
from decimal import Decimal

# => The upfront outflow and the five yearly inflows.
cost = Decimal("240000")  # => the van price paid today
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three years
flows += [Decimal("90000"), Decimal("70000")]  # => the last two years
# => Walk the years, accumulating recovered cash.
recovered = Decimal("0")  # => cash paid back so far
payback = 0  # => the answer, filled when cost is covered
for year, cash in enumerate(flows, start=1):  # => year by year
    # => Add this year's inflow to the recovered total.
    recovered += cash  # => undiscounted, by payback's own rule
    # => The first year that reaches cost is the payback year.
    if recovered >= cost and payback == 0:  # => cover reached
        payback = year  # => record it once
# => Exactly three years: 70 plus 80 plus 90 equals the cost.
print("recovered:", recovered)  # => Output totals five-year inflows
print("payback-years:", payback)  # => Output is the speed answer
