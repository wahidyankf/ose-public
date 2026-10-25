# Kata 02 solution: blend 10.60 percent equity and 5.25 percent debt.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Market weights, not book weights, carry the blend.
from decimal import Decimal

# => Component costs from the capstone's funding mix.
equity_cost = Decimal("0.106")  # => CAPM cost of equity
debt_cost = Decimal("0.0525")  # => after-tax cost of debt
# => Total market funding is the weighting base.
total = Decimal("760000") + Decimal("380000")  # => every funding unit
# => Each weight is its market slice of total funding.
equity_weight = Decimal("760000") / total  # => two-thirds equity
debt_weight = Decimal("1") - equity_weight  # => exact complement debt
# => WACC is each cost scaled by its weight, summed.
wacc = equity_weight * equity_cost + debt_weight * debt_cost  # => the blend
# => 8.82 percent: the hurdle the whole firm must clear.
print("wacc:", (wacc * 100).quantize(Decimal("0.01")))  # => Output is the hurdle
