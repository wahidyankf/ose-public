# Worked Example 43: Writing Down the Assumptions
# => Merpati Trading Co. is fictional; every number here is fixed.
# => A valuation without stated assumptions is a price without a receipt.
# => Five named inputs let anyone reprice the firm when one changes.
from decimal import Decimal

# => The five inputs every valuation in Themes E to H quietly used.
assumptions = {"growth": Decimal("0.03"), "discount": Decimal("0.10")}  # => DCF pair
assumptions["margin"] = Decimal("0.0975")  # => net margin from Example 12
assumptions["pe"] = Decimal("6.50")  # => market multiple from Example 40
assumptions["tax"] = Decimal("0.25")  # => fictional flat tax rate
# => Print each assumption so the receipt is complete and checkable.
for name in ["growth", "discount", "margin", "pe", "tax"]:  # => fixed receipt order
    # => One line per input: name on the left, value on the right.
    print(name, assumptions[name])  # => Output is the assumption receipt
