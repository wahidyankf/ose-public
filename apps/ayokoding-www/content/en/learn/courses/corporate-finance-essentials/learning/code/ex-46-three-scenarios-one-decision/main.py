# Worked Example 46: Three Scenarios, One Decision
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Pessimistic, base, and optimistic inflows bracket the van's future.
# => A project that survives its pessimistic case earns its approval.
from decimal import Decimal

# => Shared cost and hurdle; only the inflows vary by scenario.
cost = Decimal("240000")  # => the upfront outflow
rate = Decimal("0.10")  # => 10 percent demanded return
scenarios = {"pessimistic": [Decimal("50000")] * 5}  # => weak demand years
scenarios["base"] = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => plan
scenarios["base"] += [Decimal("90000"), Decimal("70000")]  # => plan later years
scenarios["optimistic"] = [Decimal("90000")] * 5  # => strong demand years
# => One NPV per scenario, printed in fixed order.
for name in ["pessimistic", "base", "optimistic"]:  # => gloom to boom
    # => Discount this scenario's inflows and subtract the cost.
    total = Decimal("0")  # => running present value
    for year, cash in enumerate(scenarios[name], start=1):  # => year-indexed
        total += cash / ((Decimal("1") + rate) ** year)  # => one discounted slice
    # => Even the gloom case prints its number for the record.
    print(name, (total - cost).quantize(Decimal("0.01")))  # => Output per scenario
