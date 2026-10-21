# Worked Example 33: Judging Whether a WACC Input Is Reasonable
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A WACC is only as honest as its three inputs.
# => Three checks catch the classic mistakes before they compound.
from decimal import Decimal

# => The inputs feeding the Example 31 blend.
equity_cost = Decimal("0.106")  # => CAPM equity cost
debt_pre_tax = Decimal("0.07")  # => bank coupon before shield
debt_cost = Decimal("0.0525")  # => after-tax debt cost
risk_free = Decimal("0.04")  # => government yield floor
# => Check one: equity must cost more than debt, or risk is mispriced.
equity_above_debt = equity_cost > debt_cost  # => risk demands reward
# => Check two: the tax shield must actually shrink the coupon.
shield_applied = debt_cost < debt_pre_tax  # => shield present
# => Check three: equity must clear the risk-free floor.
above_floor = equity_cost > risk_free  # => time plus risk beats time alone
# => All three hold: the blend earns trust, not just arithmetic.
print("equity-above-debt:", equity_above_debt)  # => Output first check
print("shield-applied:", shield_applied)  # => Output second check
print("above-floor:", above_floor)  # => Output third check
