# Worked Example 37: Firm Value Under Two Capital Structures
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A simple perpetuity values steady profit at each structure's WACC.
# => The cheaper-blend structure values the same profit more highly.
from decimal import Decimal

# => Steady after-tax operating profit, the valued stream.
nopat = Decimal("180000") * (Decimal("1") - Decimal("0.25"))  # => 135,000 forever
# => The two WACC blends from Examples 31 and 32.
wacc_now = Decimal("0.0882")  # => current two-thirds-equity blend
wacc_proposed = Decimal("0.0856")  # => proposed fifty-fifty blend
# => Perpetuity value: steady profit divided by its discount rate.
value_now = nopat / wacc_now  # => value at the current mix
value_proposed = nopat / wacc_proposed  # => value at the proposed mix
# => Same profit, higher value: cheaper capital is worth real money.
print("value-now:", value_now.quantize(Decimal("0.01")))  # => Output current value
print("value-proposed:", value_proposed.quantize(Decimal("0.01")))  # => Output new
print("gain:", (value_proposed - value_now).quantize(Decimal("0.01")))  # => Output gain
