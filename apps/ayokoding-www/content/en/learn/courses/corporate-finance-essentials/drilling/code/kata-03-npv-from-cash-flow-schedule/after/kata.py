# Kata 03 solution: NPV a 240,000 van against five yearly inflows.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Year indexes start at one: year one discounts exactly once.
from decimal import Decimal

# => The outlay, the hurdle, and the five inflows.
cost = Decimal("240000")  # => paid today
rate = Decimal("0.10")  # => 10 percent demanded return
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three
flows += [Decimal("90000"), Decimal("70000")]  # => last two
# => Discount each inflow by its year and accumulate the total.
discounted = Decimal("0")  # => running sum of present values
for year, cash in enumerate(flows, start=1):  # => year-indexed discounting
    discounted += cash / ((Decimal("1") + rate) ** year)  # => one slice of value
# => Net present value is discounted inflows minus the outlay.
npv = discounted - cost  # => positive accepts the van
# => About 62,300: the van creates value above the hurdle.
print("npv:", npv.quantize(Decimal("0.01")))  # => Output is the verdict number
