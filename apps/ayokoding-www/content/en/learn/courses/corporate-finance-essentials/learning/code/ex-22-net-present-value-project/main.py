# Worked Example 22: Net Present Value of a Project
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A delivery van costs 240,000 and earns five yearly cash flows.
# => NPV discounts each inflow, sums them, and subtracts the cost.
from decimal import Decimal

# => The upfront outflow, in whole currency units.
cost = Decimal("240000")  # => the van price paid today
# => Demanded return for a project of this risk.
rate = Decimal("0.10")  # => 10 percent hurdle
# => Year-end operating cash inflows from the van.
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three years
flows += [Decimal("90000"), Decimal("70000")]  # => the last two years
# => Discount each inflow by its year and accumulate the total.
discounted = Decimal("0")  # => running sum of present values
for year, cash in enumerate(flows, start=1):  # => year one is undiscounted once
    # => Present value of this year's inflow at the hurdle rate.
    discounted += cash / ((Decimal("1") + rate) ** year)  # => one slice of value
# => Net present value: discounted inflows minus the upfront cost.
npv = discounted - cost  # => positive means the project creates value
# => Money prints with two decimals, never float dust.
print("discounted-inflows:", discounted.quantize(Decimal("0.01")))  # => Output value in
print("npv:", npv.quantize(Decimal("0.01")))  # => Output is the verdict number
print("accept:", npv > Decimal("0"))  # => Output states the rule
