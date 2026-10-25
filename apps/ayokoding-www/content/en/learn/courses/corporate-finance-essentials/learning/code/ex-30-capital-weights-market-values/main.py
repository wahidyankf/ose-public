# Worked Example 30: Capital Weights From Market Values
# => Merpati Trading Co. is fictional; every number here is fixed.
# => WACC weights use market values, never accounting book values.
# => Markets price the claim investors actually hold today.
from decimal import Decimal

# => Fifty thousand shares at a fictional 15.20 market price.
shares = Decimal("50000")  # => shares outstanding
price = Decimal("15.20")  # => market price per share
# => Equity market value: what owners' claim trades for.
equity_value = shares * price  # => 760,000 of market equity
# => Debt market value, taken at par for this fictional loan.
debt_value = Decimal("380000")  # => the loan book at par
# => Total firm funding at market, the weighting base.
total = equity_value + debt_value  # => every funding unit
# => Each weight is its market slice of total funding.
equity_weight = equity_value / total  # => owners' share of funding
debt_weight = debt_value / total  # => lenders' share of funding
# => Two-thirds equity, one-third debt: the mix WACC will blend.
print("equity-value:", equity_value)  # => Output market equity
print("equity-weight:", equity_weight.quantize(Decimal("0.0001")))  # => Output share
print("debt-weight:", debt_weight.quantize(Decimal("0.0001")))  # => Output share
