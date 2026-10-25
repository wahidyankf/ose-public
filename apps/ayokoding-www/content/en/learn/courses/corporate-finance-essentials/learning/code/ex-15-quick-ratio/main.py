# Worked Example 15: Quick Ratio
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The quick ratio drops inventory, the slowest current asset.
# => It asks whether the firm pays bills without a fire sale.
from decimal import Decimal

# => Near-term resources, bills, and the inventory inside them.
current_assets = Decimal("450000")  # => cash, receivables, inventory
inventory = Decimal("210000")  # => the slowest piece to convert
current_liabilities = Decimal("200000")  # => bills due within one year
# => Quick assets: everything near-term except inventory.
quick_assets = current_assets - inventory  # => cash plus receivables
# => Quick ratio: fast resources per unit of near-term bills.
ratio = quick_assets / current_liabilities  # => the strict coverage
# => 1.20 times covered: healthy even if the shelves stop moving.
print("quick-assets:", quick_assets)  # => Output shows fast resources
print("quick-ratio:", ratio.quantize(Decimal("0.01")))  # => Output is the cover
