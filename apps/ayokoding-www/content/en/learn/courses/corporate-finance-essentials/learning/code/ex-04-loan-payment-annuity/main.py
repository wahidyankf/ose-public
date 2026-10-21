# Worked Example 4: Loan Payment From the Annuity Formula
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A 120,000 van loan at 9 percent repays in four equal instalments.
# => A loan is an annuity in reverse: the bank buys a payment stream.
from decimal import Decimal

# => The amount borrowed today, in whole currency units.
principal = Decimal("120000")  # => the van price financed
# => The annual interest rate charged on the loan.
rate = Decimal("0.09")  # => 9 percent per year
# => Number of equal yearly instalments.
years = 4  # => the repayment horizon
# => One plus the rate, raised to the horizon.
growth = (Decimal("1") + rate) ** years  # => shared compounding base
# => Annuity factor at the loan rate and horizon.
factor = (Decimal("1") - Decimal("1") / growth) / rate  # => converts sum to stream
# => Yearly instalment: principal divided by the factor.
payment = principal / factor  # => what the firm pays each year
# => Total repaid is the instalment times the horizon.
total = payment * years  # => principal plus all interest
# => Money prints with two decimals, never float dust.
print("principal:", principal)  # => Output repeats the amount borrowed
print("payment:", payment.quantize(Decimal("0.01")))  # => Output is the instalment
print("total:", total.quantize(Decimal("0.01")))  # => Output is the full repayment
