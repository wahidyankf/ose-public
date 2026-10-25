# Worked Example 32: WACC When the Mix Changes
# => Merpati Trading Co. is fictional; every number here is fixed.
# => More debt means cheaper funding but riskier equity, both at once.
# => Recompute the whole blend; never move one input and freeze the rest.
from decimal import Decimal

# => Fifty-fifty market mix: the proposed heavier-debt funding.
equity_weight = Decimal("0.50")  # => owners fund half
debt_weight = Decimal("0.50")  # => lenders fund half
# => Equity holders demand more once leverage rises.
equity_cost = Decimal("0.115")  # => beta up, 11.50 percent
# => The bank charges more too, still shielded by tax.
debt_cost = Decimal("0.075") * (Decimal("1") - Decimal("0.25"))  # => 5.625 percent
# => The new blend under the proposed mix.
wacc = equity_weight * equity_cost + debt_weight * debt_cost  # => recomputed fully
# => 8.56 percent: cheaper debt outweighs dearer equity this time.
print("wacc-new:", (wacc * 100).quantize(Decimal("0.01")))  # => Output proposed blend
print("below-old-882:", wacc < Decimal("0.0882"))  # => Output compares with Example 31
