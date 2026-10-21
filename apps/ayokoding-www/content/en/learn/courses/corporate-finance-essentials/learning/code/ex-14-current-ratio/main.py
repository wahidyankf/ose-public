# Worked Example 14: Current Ratio
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The current ratio covers near-term bills with near-term resources.
# => Above one means short-term assets exceed short-term claims.
from decimal import Decimal

# => Resources convertible to cash within one year.
current_assets = Decimal("450000")  # => cash, receivables, inventory
# => Bills falling due within one year.
current_liabilities = Decimal("200000")  # => payables plus short debt
# => Current ratio: near-term resources per unit of near-term bills.
ratio = current_assets / current_liabilities  # => the coverage multiple
# => 2.25 times covered: comfortable, before asking what sits inside.
print("current-assets:", current_assets)  # => Output repeats resources
print("current-liabilities:", current_liabilities)  # => Output repeats bills
print("current-ratio:", ratio.quantize(Decimal("0.01")))  # => Output is the cover
