# Worked Example 5: One Cash Flow, Three Discount Rates
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The same 50,000 in year seven is worth less at higher risk.
# => The discount rate carries time and risk, so it moves every value.
from decimal import Decimal

# => The single future receipt, in whole currency units.
future = Decimal("50000")  # => what arrives in year seven
# => Years until the cash arrives.
years = 7  # => the waiting time
# => Three demanded returns: safe, normal, and risky.
rates = [Decimal("0.05"), Decimal("0.10"), Decimal("0.15")]  # => risk ladder
# => Discount each rate's factor and print the present worth.
for rate in rates:  # => one valuation per demanded return
    # => Discount factor for this rate and wait.
    factor = (Decimal("1") + rate) ** years  # => heavier wait at higher rates
    # => Present value falls as the demanded return rises.
    present = future / factor  # => the same cash, three prices
    # => Money prints with two decimals, never float dust.
    print(
        "rate:", rate, "present:", present.quantize(Decimal("0.01"))
    )  # => Output rows
