# Worked Example 11: Gross Margin
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Gross margin keeps the trading result per unit of sales.
# => It answers whether the core buying-and-selling works.
from decimal import Decimal

# => Sales and cost of goods sold for the year.
revenue = Decimal("1200000")  # => the top line
cogs = Decimal("720000")  # => what the sold goods cost
# => Gross profit: sales minus the cost of goods sold.
gross = revenue - cogs  # => the trading result
# => Gross margin: trading result per unit of sales.
margin = gross / revenue * Decimal("100")  # => percent kept from trading
# => Forty cents of trading profit per currency unit sold.
print("gross:", gross)  # => Output shows the trading result
print("gross-margin:", margin.quantize(Decimal("0.01")))  # => Output is the ratio
