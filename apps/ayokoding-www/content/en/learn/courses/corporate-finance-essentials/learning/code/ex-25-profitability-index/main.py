# Worked Example 25: Profitability Index
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The index scales discounted inflows per unit of upfront cost.
# => Above one means the project earns its keep; rank by it when rationing.
from decimal import Decimal

# => The upfront outflow, hurdle rate, and five yearly inflows.
cost = Decimal("240000")  # => the van price paid today
rate = Decimal("0.10")  # => 10 percent hurdle
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three years
flows += [Decimal("90000"), Decimal("70000")]  # => the last two years
# => Discount each inflow by its year and accumulate the total.
discounted = Decimal("0")  # => running sum of present values
for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
    discounted += cash / ((Decimal("1") + rate) ** year)  # => one slice of value
# => Profitability index: value created per unit invested.
index = discounted / cost  # => the bang-per-buck multiple
# => 1.26: each invested unit returns one and a quarter in present value.
print("discounted-inflows:", discounted.quantize(Decimal("0.01")))  # => Output value in
print("index:", index.quantize(Decimal("0.01")))  # => Output is the multiple
