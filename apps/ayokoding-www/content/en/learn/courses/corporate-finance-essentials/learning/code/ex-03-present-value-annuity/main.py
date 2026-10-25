# Worked Example 3: Present Value of an Annuity
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A supplier contract pays 2,000 at each year-end for five years.
# => An annuity is a stream of equal payments valued as one sum.
from decimal import Decimal

# => The equal payment arriving at each year-end.
payment = Decimal("2000")  # => five identical receipts
# => The annual discount rate applied to the whole stream.
rate = Decimal("0.08")  # => 8 percent demanded return
# => Number of equal payments in the stream.
years = 5  # => the stream length
# => One plus the rate, raised to the stream length.
growth = (Decimal("1") + rate) ** years  # => shared compounding base
# => Annuity factor: one minus the inverse growth, over the rate.
factor = (Decimal("1") - Decimal("1") / growth) / rate  # => 3.99 at 8 percent
# => Stream value: the payment multiplied by the factor.
value = payment * factor  # => one number for five payments
# => Money prints with two decimals, never float dust.
print("payment:", payment)  # => Output repeats the yearly receipt
print("factor:", factor.quantize(Decimal("0.0001")))  # => Output shows the factor
print("value:", value.quantize(Decimal("0.01")))  # => Output is the stream value
