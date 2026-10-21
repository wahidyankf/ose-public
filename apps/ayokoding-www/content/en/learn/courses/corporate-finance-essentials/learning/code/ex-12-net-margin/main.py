# Worked Example 12: Net Margin
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Net margin keeps the final profit per unit of sales.
# => It answers what owners keep after every cost family.
from decimal import Decimal

# => Sales and the bottom line for the year.
revenue = Decimal("1200000")  # => the top line
net = Decimal("117000")  # => profit after all costs and tax
# => Net margin: final profit per unit of sales.
margin = net / revenue * Decimal("100")  # => percent kept overall
# => Below ten percent: trading is fine, overhead is the story.
print("net:", net)  # => Output repeats the bottom line
print("net-margin:", margin.quantize(Decimal("0.01")))  # => Output is the ratio
