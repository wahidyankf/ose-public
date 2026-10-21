# Kata 04 solution: a healthy current ratio can hide slow shelves.
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The gap between the ratios names the inventory dependence.
from decimal import Decimal

# => Near-term resources, the inventory inside them, and near bills.
current_assets = Decimal("450000")  # => cash, receivables, inventory
inventory = Decimal("210000")  # => the slowest piece to convert
current_liabilities = Decimal("200000")  # => due within one year
# => Current ratio covers bills with all near-term resources.
current_ratio = current_assets / current_liabilities  # => the headline cover
# => Quick ratio drops inventory first, then covers.
quick_ratio = (current_assets - inventory) / current_liabilities  # => strict cover
# => 2.25 looks safe, 1.20 tells the truth: shelves carry the cover.
print("current:", current_ratio.quantize(Decimal("0.01")))  # => Output headline
print("quick:", quick_ratio.quantize(Decimal("0.01")))  # => Output strict cover
print(
    "inventory-carries:", current_ratio - quick_ratio > Decimal("1")
)  # => Output flag
