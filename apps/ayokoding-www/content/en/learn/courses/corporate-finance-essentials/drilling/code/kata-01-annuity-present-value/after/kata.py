# Kata 01 solution: value a five-year 2,000 annuity at 8 percent.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The factor converts the stream into one present sum.
from decimal import Decimal

# => The equal yearly payment and the discount rate.
payment = Decimal("2000")  # => five identical receipts
rate = Decimal("0.08")  # => 8 percent demanded return
years = 5  # => the stream length
# => One plus the rate, raised to the stream length.
growth = (Decimal("1") + rate) ** years  # => shared compounding base
# => Annuity factor: one minus the inverse growth, over the rate.
factor = (Decimal("1") - Decimal("1") / growth) / rate  # => 3.99 at 8 percent
# => The stream value is the payment times the factor.
value = payment * factor  # => one number for five payments
# => About 7,985.42: the whole stream priced as one sum.
print("value:", value.quantize(Decimal("0.01")))  # => Output is the stream value
