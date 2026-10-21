# Kata 01 starter: value a five-year 2,000 annuity at 8 percent.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Fill the annuity factor, then multiply it by the payment.
from decimal import Decimal

# => The equal yearly payment and the discount rate.
payment = Decimal("2000")  # => five identical receipts
rate = Decimal("0.08")  # => 8 percent demanded return
years = 5  # => the stream length
# => TODO: the annuity factor is (1 - 1 / (1 + rate) ** years) / rate.
factor = Decimal("0")  # => TODO: replace zero with the factor
# => The stream value is the payment times the factor.
value = payment * factor  # => one number for five payments
# => Print the value with two decimals.
print("value:", value.quantize(Decimal("0.01")))  # => Output grades the starter
