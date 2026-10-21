# Worked Example 42: Book Value Versus Market Value
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Book value records history; market value prices the future.
# => The gap between them is expected growth the books never show.
from decimal import Decimal

# => Accounting equity and the market's verdict on the same claim.
book = Decimal("500000")  # => paid-in capital plus retained earnings
market = Decimal("760000")  # => 50,000 shares at 15.20
# => Market-to-book: how many history units the future is worth.
ratio = market / book  # => the expectations premium
# => 1.52: the market pays half again over history for growth.
print("book:", book)  # => Output repeats accounting equity
print("market:", market)  # => Output repeats market equity
print("market-to-book:", ratio.quantize(Decimal("0.01")))  # => Output the premium
