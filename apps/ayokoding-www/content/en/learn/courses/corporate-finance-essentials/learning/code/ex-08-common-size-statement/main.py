# Worked Example 8: Common-Size Income Statement
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Common-size restates every line as a share of revenue.
# => Percentages let a small firm compare itself with a giant.
from decimal import Decimal

# => Sales for the year, the common denominator.
revenue = Decimal("1200000")  # => one hundred percent by definition
# => The cost families from the income statement walk.
lines = {"cogs": Decimal("720000"), "opex": Decimal("300000")}  # => two cost blocks
lines["interest"] = Decimal("24000")  # => financing cost joins the map
lines["tax"] = Decimal("39000")  # => tax joins the map
lines["net"] = Decimal("117000")  # => the bottom line joins too
# => Each line divided by revenue, scaled to a percentage.
for name, amount in lines.items():  # => one share per line
    # => Percent with two decimals keeps comparisons honest.
    share = amount / revenue * Decimal("100")  # => the common-size value
    # => Output names the line and its share of every sales unit.
    print(name, share.quantize(Decimal("0.01")))  # => Output is the sized statement
