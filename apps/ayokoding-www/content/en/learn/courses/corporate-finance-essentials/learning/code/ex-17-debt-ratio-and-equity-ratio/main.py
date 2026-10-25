# Worked Example 17: Debt Ratio and Equity Ratio
# => Merpati Trading Co. is fictional; every number here is fixed.
# => These two ratios split every asset unit by who funded it.
# => They always sum to one, which checks the arithmetic.
from decimal import Decimal

# => All claims on the firm and everything they funded.
liabilities = Decimal("500000")  # => suppliers plus lenders
equity = Decimal("500000")  # => the owners' slice
assets = Decimal("1000000")  # => the funded whole
# => Debt ratio: the creditor-funded share of every asset unit.
debt_ratio = liabilities / assets  # => lender share
# => Equity ratio: the owner-funded share of every asset unit.
equity_ratio = equity / assets  # => owner share
# => The two shares sum to one by construction.
print("debt-ratio:", debt_ratio.quantize(Decimal("0.01")))  # => Output lender share
print("equity-ratio:", equity_ratio.quantize(Decimal("0.01")))  # => Output owner share
print("sums-to-one:", debt_ratio + equity_ratio == Decimal("1"))  # => Output checks
