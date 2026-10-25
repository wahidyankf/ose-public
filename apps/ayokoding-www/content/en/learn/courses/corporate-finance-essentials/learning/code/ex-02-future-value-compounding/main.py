# Worked Example 2: Future Value Under Compounding
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Cash set aside today grows because each year's interest earns too.
# => Future value compounds the present forward at the earned rate.
from decimal import Decimal

# => Cash set aside today, in whole currency units.
present = Decimal("5000")  # => the deposit made now
# => The annual rate the deposit earns.
rate = Decimal("0.06")  # => 6 percent earned per year
# => Years the deposit stays invested.
years = 10  # => the compounding horizon
# => Growth factor: one plus the rate, raised to the horizon.
factor = (Decimal("1") + rate) ** years  # => 1.06 to the tenth
# => Future value: present cash multiplied by the factor.
future = present * factor  # => worth more later than now
# => Money prints with two decimals, never float dust.
print("present:", present)  # => Output repeats the deposit
print("factor:", factor)  # => Output shows the growth factor
print("future:", future.quantize(Decimal("0.01")))  # => Output is the grown sum
