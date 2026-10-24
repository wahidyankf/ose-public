# Worked Example 26: When NPV and IRR Disagree
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A small fast project can outrank a large slow one on IRR only.
# => NPV measures absolute wealth, so NPV wins the argument.
from decimal import Decimal

# => Hurdle rate and the two rival projects.
rate = Decimal("0.10")  # => 10 percent demanded return
cost_s = Decimal("100000")  # => small project outlay
flows_s = [Decimal("70000"), Decimal("70000")]  # => small project inflows
cost_l = Decimal("200000")  # => large project outlay
flows_l = [Decimal("70000")] * 4  # => large project inflows


# => NPV of one schedule at one rate, reused for every verdict.
def value(cost, flows, trial):  # => net value at a trial rate
    # => Discount every inflow at the trial rate and sum.
    total = Decimal("0")  # => running present value
    for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
        total += cash / ((Decimal("1") + trial) ** year)  # => one discounted slice
    return total - cost  # => net value at the trial rate


# => Bisection finds the rate where one schedule nets zero.
def irr(cost, flows):  # => internal rate of one schedule
    # => Bracket the answer between zero and fifty percent.
    low = Decimal("0")  # => value here is positive
    high = Decimal("0.50")  # => value here is negative
    for _ in range(40):  # => forty halvings pin four decimals
        mid = (low + high) / Decimal("2")  # => the next trial
        if value(cost, flows, mid) > Decimal("0"):  # => zero sits above
            low = mid  # => raise the floor
        else:  # => zero sits below
            high = mid  # => lower the ceiling
    return (low + high) / Decimal("2")  # => converged estimate


# => Same hurdle, opposite rankings: NPV crowns L, IRR crowns S.
npv_s = value(cost_s, flows_s, rate)  # => small project wealth gain
npv_l = value(cost_l, flows_l, rate)  # => large project wealth gain
irr_s = irr(cost_s, flows_s) * 100  # => small project rate
irr_l = irr(cost_l, flows_l) * 100  # => large project rate
# => Wealth and rate disagree; follow the wealth.
print("npv-s:", npv_s.quantize(Decimal("0.01")))  # => Output smaller gain
print("npv-l:", npv_l.quantize(Decimal("0.01")))  # => Output larger gain
print("irr-s:", irr_s.quantize(Decimal("0.01")))  # => Output faster rate
print("irr-l:", irr_l.quantize(Decimal("0.01")))  # => Output slower rate
