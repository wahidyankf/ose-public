# Worked Example 16: Debt to Equity
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Debt to equity compares lender funding with owner funding.
# => It is the simplest summary of how the firm is financed.
from decimal import Decimal

# => Interest-bearing loans, short slice plus long slice.
debt = Decimal("380000")  # => 80,000 short plus 300,000 long
# => Owner funding from the balance sheet snapshot.
equity = Decimal("500000")  # => the residual claim
# => Debt to equity: lender units per owner unit.
ratio = debt / equity  # => the financing mix in one number
# => 0.76: seventy-six cents of debt back each unit of equity.
print("debt:", debt)  # => Output repeats lender funding
print("equity:", equity)  # => Output repeats owner funding
print("debt-to-equity:", ratio.quantize(Decimal("0.01")))  # => Output is the mix
