# Worked Example 27: Choosing Between Two Real Projects
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The van (Example 22) faces a warehouse refit costing the same.
# => Refit inflows arrive later, so discounting punishes it harder.
from decimal import Decimal

# => Shared hurdle and the two equal-cost rivals.
rate = Decimal("0.10")  # => 10 percent demanded return
cost = Decimal("240000")  # => both projects cost the same
van = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => van early years
van += [Decimal("90000"), Decimal("70000")]  # => van later years
refit = [Decimal("40000"), Decimal("60000"), Decimal("90000")]  # => refit early years
refit += [Decimal("110000"), Decimal("110000")]  # => refit later years


# => NPV of one schedule at the shared hurdle.
def npv(flows):  # => net value of one rival
    # => Discount every inflow and subtract the shared cost.
    total = Decimal("0")  # => running present value
    for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
        total += cash / ((Decimal("1") + rate) ** year)  # => one discounted slice
    return total - cost  # => net value at the hurdle


# => The van's earlier cash wins despite equal five-year totals.
npv_van = npv(van)  # => early cash survives discounting
npv_refit = npv(refit)  # => late cash shrinks under discounting
# => Timing decides: the refit totals more (410 vs 400) yet values less.
print("npv-van:", npv_van.quantize(Decimal("0.01")))  # => Output larger value
print("npv-refit:", npv_refit.quantize(Decimal("0.01")))  # => Output smaller value
print("choose-van:", npv_van > npv_refit)  # => Output states the decision
