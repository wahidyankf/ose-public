# Worked Example 1: Present Value of a Single Future Sum
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A customer promises 10,000 in five years; what is it worth today?
# => Present value discounts the future back at the required return.
from decimal import Decimal

# => The promised future receipt, in whole currency units.
future = Decimal("10000")  # => what arrives in year five
# => The annual discount rate: time plus risk in one number.
rate = Decimal("0.08")  # => 8 percent demanded return
# => Years until the cash arrives.
years = 5  # => the waiting time
# => Discount factor: one plus the rate, raised to the wait.
factor = (Decimal("1") + rate) ** years  # => 1.08 to the fifth
# => Present value: future cash divided by the factor.
present = future / factor  # => worth less today than at arrival
# => Money prints with two decimals, never float dust.
print("future:", future)  # => Output repeats the promise
print("factor:", factor)  # => Output shows the discount factor
print("present:", present.quantize(Decimal("0.01")))  # => Output is the value today
