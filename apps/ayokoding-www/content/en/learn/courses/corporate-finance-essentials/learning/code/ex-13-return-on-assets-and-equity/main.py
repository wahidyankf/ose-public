# Worked Example 13: Return on Assets and Equity
# => Merpati Trading Co. is fictional; every number here is fixed.
# => ROA measures the whole asset base; ROE measures the owners' slice.
# => Debt makes ROE exceed ROA, which Theme G explores fully.
from decimal import Decimal

# => The bottom line, the asset base, and owner funding.
net = Decimal("117000")  # => profit belonging to owners
assets = Decimal("1000000")  # => everything the firm owns
equity = Decimal("500000")  # => the owners' slice of funding
# => Return on assets: profit per unit of everything owned.
roa = net / assets * Decimal("100")  # => whole-firm efficiency
# => Return on equity: profit per unit of owner funding.
roe = net / equity * Decimal("100")  # => owner-level return
# => ROE doubles ROA here because half the assets run on debt.
print("roa:", roa.quantize(Decimal("0.01")))  # => Output is the firm return
print("roe:", roe.quantize(Decimal("0.01")))  # => Output is the owner return
