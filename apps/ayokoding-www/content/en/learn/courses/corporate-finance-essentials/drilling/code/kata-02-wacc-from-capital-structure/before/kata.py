# Kata 02 starter: blend 10.60 percent equity and 5.25 percent debt.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Fill the two market weights, then blend the two costs.
from decimal import Decimal

# => Component costs from the capstone's funding mix.
equity_cost = Decimal("0.106")  # => CAPM cost of equity
debt_cost = Decimal("0.0525")  # => after-tax cost of debt
# => TODO: market values are 760,000 equity and 380,000 debt.
equity_weight = Decimal("0")  # => TODO: equity share of funding
debt_weight = Decimal("0")  # => TODO: debt share of funding
# => WACC is each cost scaled by its weight, summed.
wacc = equity_weight * equity_cost + debt_weight * debt_cost  # => the blend
# => Print the blend as a percentage with two decimals.
print("wacc:", (wacc * 100).quantize(Decimal("0.01")))  # => Output grades starter
