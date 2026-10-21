# Worked Example 31: Weighted Average Cost of Capital
# => Merpati Trading Co. is fictional; every number here is fixed.
# => WACC blends each funding cost by its market weight.
# => It becomes the hurdle rate for the whole firm's projects.
from decimal import Decimal

# => Component costs from Examples 28 and 29.
equity_cost = Decimal("0.106")  # => CAPM cost of equity
debt_cost = Decimal("0.0525")  # => after-tax cost of debt
# => Market weights from Example 30.
equity_weight = Decimal("760000") / Decimal("1140000")  # => two-thirds equity
debt_weight = Decimal("1") - equity_weight  # => one-third debt, exact complement
# => WACC: each cost scaled by its funding share, then summed.
wacc = equity_weight * equity_cost + debt_weight * debt_cost  # => the blend
# => 8.82 percent: between debt and equity, nearer the dearer equity.
print("wacc:", (wacc * 100).quantize(Decimal("0.01")))  # => Output is the hurdle
print(
    "weights-sum-one:", equity_weight + debt_weight == Decimal("1")
)  # => Output check
