# Worked Example 48: The One-Page Recommendation
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A recommendation is three gates: value, return, and survival.
# => The van passes all three, so the memo says yes with conditions.
from decimal import Decimal

# => Gate inputs gathered from Examples 22, 23, and 18.
memo = Decimal("62300")  # => memo rounded to hundreds, checked loosely below
rate = Decimal("0.10")  # => 10 percent demanded return
cost = Decimal("240000")  # => the upfront outflow
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three years
flows += [Decimal("90000"), Decimal("70000")]  # => the last two years
# => Recompute NPV at the hurdle instead of trusting the memo above.
total = Decimal("0")  # => running present value
for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
    total += cash / ((Decimal("1") + rate) ** year)  # => one discounted slice
checked = total - cost  # => independently verified verdict number
# => Bisect the van's IRR here so gate two tests a computed rate.
low = Decimal("0")  # => value here is positive
high = Decimal("0.50")  # => value here is negative
for _ in range(40):  # => forty halvings pin four decimals
    mid = (low + high) / Decimal("2")  # => the next trial
    trial = Decimal("0")  # => trial present value
    for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
        trial += cash / ((Decimal("1") + mid) ** year)  # => one discounted slice
    if trial - cost > Decimal("0"):  # => zero sits above
        low = mid  # => raise the floor
    else:  # => zero sits below
        high = mid  # => lower the ceiling
irr = (low + high) / Decimal("2")  # => converged internal rate
# => Gate one: verified NPV must clear zero.
gate_value = checked > Decimal("0")  # => the wealth test
# => Gate two: the computed IRR must clear the hurdle with room.
gate_return = irr > rate  # => nineteen percent beats ten
# => Gate three: Example 18 coverage of 7.50 must survive the new loan.
gate_survival = Decimal("7.50") > Decimal("3.00")  # => the distress test
# => Three green gates: approve, with fuel-price monitoring attached.
print("npv-checked:", checked.quantize(Decimal("0.01")))  # => Output verified value
print("matches-memo:", abs(checked - memo) < Decimal("1000"))  # => Output receipt
print("approve:", gate_value and gate_return and gate_survival)  # => Output decision
