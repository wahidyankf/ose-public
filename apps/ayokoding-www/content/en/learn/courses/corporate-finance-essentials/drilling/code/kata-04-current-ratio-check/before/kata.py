# Kata 04 starter: a healthy current ratio can hide slow shelves.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Compute both ratios, then flag when inventory carries the cover.
from decimal import Decimal

# => Near-term resources, the inventory inside them, and near bills.
current_assets = Decimal("450000")  # => cash, receivables, inventory
inventory = Decimal("210000")  # => the slowest piece to convert
current_liabilities = Decimal("200000")  # => due within one year
# => TODO: current ratio covers bills with all near-term resources.
current_ratio = Decimal("0")  # => TODO: replace with the ratio
# => TODO: quick ratio drops inventory first, then covers.
quick_ratio = Decimal("0")  # => TODO: replace with the strict ratio
# => Flag hides-weakness when current looks fine but quick limps.
print("current:", current_ratio)  # => Output grades the starter
print("quick:", quick_ratio)  # => Output grades the starter
