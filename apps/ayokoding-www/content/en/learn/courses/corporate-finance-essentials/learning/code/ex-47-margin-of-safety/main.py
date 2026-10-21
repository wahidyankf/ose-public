# Worked Example 47: Margin of Safety
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Margin of safety is the discount to your own valuation.
# => It pays for every forecast error you cannot see coming.
from decimal import Decimal

# => The mini-DCF value recomputed, plus a seller's asking price.
base = Decimal("100000")  # => this year's free cash flow
growth = Decimal("0.03")  # => 3 percent yearly growth
rate = Decimal("0.10")  # => 10 percent discount rate
asking = Decimal("1300000")  # => the seller's price for the firm
# => Five growing flows discounted to today, as in Example 39.
enterprise = Decimal("0")  # => running firm value
flow = base  # => rolled forward one year at a time
for year in range(1, 6):  # => five forecast years
    flow = flow * (Decimal("1") + growth)  # => next year's cash
    enterprise += flow / ((Decimal("1") + rate) ** year)  # => add its present slice
# => Terminal value beyond the horizon, discounted back too.
terminal = flow * (Decimal("1") + growth) / (rate - growth)  # => year-six perpetuity
enterprise += terminal / ((Decimal("1") + rate) ** 5)  # => add discounted terminal
# => Safety is the share of your own value you refuse to pay for.
safety = (enterprise - asking) / enterprise * 100  # => the error budget
# => A double-digit cushion: the price survives a wrong forecast or two.
print("value:", enterprise.quantize(Decimal("0.01")))  # => Output own valuation
print("safety:", safety.quantize(Decimal("0.01")))  # => Output the cushion
