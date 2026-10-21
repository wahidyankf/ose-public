# Worked Example 40: Price to Earnings Multiple
# => Merpati Trading Co. is fictional; every number here is fixed.
# => P/E prices each unit of yearly earnings at the market's rate.
# => It compares firms fast and explains nothing about why they differ.
from decimal import Decimal

# => Market price per share and earnings per share.
price = Decimal("15.20")  # => what the market charges per share
eps = Decimal("2.34")  # => levered EPS from Example 35
# => The multiple: years of earnings the price contains.
multiple = price / eps  # => the market's price per earnings unit
# => 6.50: the market pays six and a half earnings for the share.
print("price:", price)  # => Output repeats the market price
print("eps:", eps)  # => Output repeats earnings per share
print("pe:", multiple.quantize(Decimal("0.01")))  # => Output is the multiple
