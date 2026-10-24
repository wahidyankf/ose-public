# Worked Example 23: Internal Rate of Return by Bisection
# => Merpati Trading Co. is fictional; every number here is fixed.
# => IRR is the discount rate where NPV equals exactly zero.
# => Bisection traps it: NPV is positive below IRR, negative above.
from decimal import Decimal

# => The same van project: cost plus five yearly inflows.
cost = Decimal("240000")  # => the upfront outflow
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three years
flows += [Decimal("90000"), Decimal("70000")]  # => the last two years
# => NPV at any trial rate, the helper bisection calls.
# => Positive trial NPV means the true IRR sits higher.
# => Negative trial NPV means the true IRR sits lower.


def npv_at(rate):  # => value of the project at one rate
    # => Discount every inflow at the trial rate and sum.
    total = Decimal("0")  # => running present value
    for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
        total += cash / ((Decimal("1") + rate) ** year)  # => one discounted slice
    return total - cost  # => net value at the trial rate


# => Bracket the answer: NPV is positive at zero, negative at fifty percent.
low = Decimal("0")  # => NPV here is clearly positive
high = Decimal("0.50")  # => NPV here is clearly negative
# => Halve the bracket forty times; Decimal keeps every cut exact.
for _ in range(40):  # => forty halvings pin four decimals
    # => The midpoint rate splits the current bracket.
    mid = (low + high) / Decimal("2")  # => the next trial
    # => Keep the half whose ends still straddle zero.
    if npv_at(mid) > Decimal("0"):  # => zero sits above the midpoint
        low = mid  # => raise the floor
    else:  # => zero sits below the midpoint
        high = mid  # => lower the ceiling
# => The bracket center is the internal rate of return.
irr = (low + high) / Decimal("2")  # => converged estimate
# => About nineteen percent: far above the ten percent hurdle.
print("irr:", (irr * 100).quantize(Decimal("0.01")))  # => Output is the rate
print("npv-at-irr:", npv_at(irr).quantize(Decimal("0.01")))  # => Output near zero
