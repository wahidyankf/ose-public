# Capstone: Merpati expansion decision, end to end.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A second warehouse costs 400,000 and unlocks five yearly inflows.
# => Pro-forma flows are discounted, then judged under two fundings.
from decimal import Decimal

# => The expansion outlay and its pro-forma operating inflows.
cost = Decimal("400000")  # => the second warehouse price
flows = [Decimal("90000"), Decimal("110000"), Decimal("130000")]  # => ramp years
flows += [Decimal("140000"), Decimal("140000")]  # => steady years
# => Structure A keeps the current blend: WACC 8.82 percent.
wacc_a = Decimal("0.0882")  # => two-thirds equity funding
# => Structure B adds debt: WACC 8.56 percent, coverage still above 3.00.
wacc_b = Decimal("0.0856")  # => fifty-fifty funding


# => NPV of the expansion at one funding's hurdle rate.
def npv(trial):  # => net value at one WACC
    # => Discount every pro-forma inflow at the trial rate.
    total = Decimal("0")  # => running present value
    for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
        total += cash / ((Decimal("1") + trial) ** year)  # => one discounted slice
    return total - cost  # => net value at the trial WACC


# => Bisection finds the expansion's IRR between zero and fifty percent.
low = Decimal("0")  # => value here is positive
high = Decimal("0.50")  # => value here is negative
for _ in range(40):  # => forty halvings pin four decimals
    mid = (low + high) / Decimal("2")  # => the next trial
    if npv(mid) > Decimal("0"):  # => zero sits above
        low = mid  # => raise the floor
    else:  # => zero sits below
        high = mid  # => lower the ceiling
irr = (low + high) / Decimal("2")  # => converged internal rate
# => Both fundings clear zero; cheaper funding clears by more.
npv_a = npv(wacc_a)  # => value under current funding
npv_b = npv(wacc_b)  # => value under heavier-debt funding
# => The one-page recommendation, printed as the record.
print("npv-a:", npv_a.quantize(Decimal("0.01")))  # => Output current-funding value
print("npv-b:", npv_b.quantize(Decimal("0.01")))  # => Output proposed-funding value
print("irr:", (irr * 100).quantize(Decimal("0.01")))  # => Output internal rate
print("recommend: expand under structure B within covenant")  # => Output the page
