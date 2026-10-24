# Worked Example 36: The Coverage Constraint on Borrowing
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The bank demands coverage of at least 3.00 before lending more.
# => That covenant caps interest, which caps the debt itself.
from decimal import Decimal

# => Operating profit, the covenant floor, and the new-loan coupon.
ebit = Decimal("180000")  # => profit available for interest
floor = Decimal("3.00")  # => minimum coverage the bank accepts
coupon = Decimal("0.07")  # => rate on any additional borrowing
# => Maximum interest the covenant tolerates.
max_interest = ebit / floor  # => profit divided by required cover
# => Maximum extra debt that interest buys at the coupon.
max_debt = max_interest / coupon  # => interest capacity priced into debt
# => Headroom above the existing 380,000 of interest-bearing debt.
headroom = max_debt - Decimal("380000")  # => room before the covenant binds
# => About 477,143 of headroom: real room exists, but it is finite.
print("max-interest:", max_interest.quantize(Decimal("0.01")))  # => Output cap
print("max-debt:", max_debt.quantize(Decimal("0.01")))  # => Output debt ceiling
print("headroom:", headroom.quantize(Decimal("0.01")))  # => Output free room
