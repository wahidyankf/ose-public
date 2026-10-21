# Worked Example 41: Enterprise Value to EBITDA
# => Merpati Trading Co. is fictional; every number here is fixed.
# => EV counts the whole firm: equity plus debt minus cash.
# => EBITDA strips financing and non-cash charges from operating profit.
from decimal import Decimal

# => Market equity, interest-bearing debt, and cash on hand.
equity_value = Decimal("760000")  # => 50,000 shares at 15.20
debt = Decimal("380000")  # => loans at par
cash = Decimal("90000")  # => cash offsets debt in EV
# => Enterprise value: the takeover price of the whole firm.
enterprise = equity_value + debt - cash  # => what buying it all costs
# => EBITDA: EBIT plus the depreciation deducted to reach it.
ebitda = Decimal("180000") + Decimal("60000")  # => operating cash proxy
# => The multiple: firm prices per operating-cash unit.
multiple = enterprise / ebitda  # => leverage-neutral comparison
# => 4.38: cheap or troubled, the multiple alone cannot say.
print("enterprise:", enterprise)  # => Output the firm price
print("ebitda:", ebitda)  # => Output the operating proxy
print("ev-ebitda:", multiple.quantize(Decimal("0.01")))  # => Output the multiple
