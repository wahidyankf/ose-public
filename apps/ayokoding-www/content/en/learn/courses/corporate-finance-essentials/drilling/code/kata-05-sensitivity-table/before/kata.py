# Kata 05 starter: print the van's NPV at 8, 10, and 12 percent.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Loop the three rungs, discounting each inflow by its year.
from decimal import Decimal

# => The outlay and the five inflows.
cost = Decimal("240000")  # => paid today
flows = [Decimal("70000"), Decimal("80000"), Decimal("90000")]  # => first three
flows += [Decimal("90000"), Decimal("70000")]  # => last two
# => TODO: loop rates 0.08, 0.10, 0.12 and print each NPV.
rates = [Decimal("0.08"), Decimal("0.10"), Decimal("0.12")]  # => sensitivity ladder
# => TODO: fill the loop body with discounting and printing.
print("todo: loop the rates")  # => TODO: replace with the table
