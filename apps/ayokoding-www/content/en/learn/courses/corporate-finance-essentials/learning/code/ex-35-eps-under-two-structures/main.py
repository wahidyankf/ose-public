# Worked Example 35: Earnings per Share Under Two Structures
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Borrowing lifts EPS while times are good by splitting profit fewer ways.
# => Structure B repays 200,000 of debt by issuing 20,000 new shares.
from decimal import Decimal

# => Shared operating result and tax rate.
ebit = Decimal("180000")  # => identical assets, identical EBIT
after_tax = Decimal("1") - Decimal("0.25")  # => the keep-rate after tax
# => Structure A: 380,000 debt costing 24,000 interest, 50,000 shares.
net_a = (ebit - Decimal("24000")) * after_tax  # => profit after lenders and tax
eps_a = net_a / Decimal("50000")  # => profit per existing share
# => Structure B: 180,000 debt costing 12,000 interest, 70,000 shares.
net_b = (ebit - Decimal("12000")) * after_tax  # => higher profit, more shares
eps_b = net_b / Decimal("70000")  # => profit per diluted share
# => Leverage wins EPS in good years and loses it in bad ones.
print("eps-a:", eps_a.quantize(Decimal("0.01")))  # => Output levered EPS
print("eps-b:", eps_b.quantize(Decimal("0.01")))  # => Output diluted EPS
