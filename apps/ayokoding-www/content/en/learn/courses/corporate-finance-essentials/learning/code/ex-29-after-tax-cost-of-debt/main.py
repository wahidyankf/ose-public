# Worked Example 29: After-Tax Cost of Debt
# => Merpati Trading Co. is fictional; every number here is fixed.
# => Interest is tax-deductible, so debt costs less than its coupon.
# => The tax shield is the one genuine discount in corporate finance.
from decimal import Decimal

# => The bank's quoted rate and the fictional flat tax rate.
pre_tax = Decimal("0.07")  # => 7 percent coupon on the loan
tax_rate = Decimal("0.25")  # => one quarter of profit goes to tax
# => After-tax cost: the coupon minus the tax saved on it.
after_tax = pre_tax * (Decimal("1") - tax_rate)  # => what debt truly costs
# => 5.25 percent: cheaper than equity even before risk is counted.
print("pre-tax:", pre_tax)  # => Output repeats the coupon
print("after-tax:", (after_tax * 100).quantize(Decimal("0.01")))  # => Output true cost
