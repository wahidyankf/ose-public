# Kata 03 starter: NPV a 240,000 van against five yearly inflows.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Discount each inflow by its year, sum, subtract the cost.
from decimal import Decimal

# => The outlay, the hurdle, and the five inflows.
cost = Decimal("240000")  # => paid today
rate = Decimal("0.10")  # => 10 percent demanded return
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three
flows += [Decimal("90000"), Decimal("70000")]  # => last two
# => TODO: accumulate each inflow discounted by its year index.
discounted = Decimal("0")  # => TODO: replace with the discounted sum
# => Net present value is discounted inflows minus the outlay.
npv = discounted - cost  # => positive accepts the van
# => Print the verdict number with two decimals.
print("npv:", npv.quantize(Decimal("0.01")))  # => Output grades the starter
