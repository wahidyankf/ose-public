# Worked Example 7: A Fictional Balance Sheet Snapshot
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The balance sheet balances: assets equal liabilities plus equity.
# => What the firm owns is funded by lenders, suppliers, and owners.
from decimal import Decimal

# => Cash in the till and the bank, in whole currency units.
cash = Decimal("90000")  # => immediately spendable
# => Amounts resellers owe the firm from credit sales.
receivables = Decimal("150000")  # => collected within weeks
# => Office supplies on the warehouse shelves, at cost.
inventory = Decimal("210000")  # => sold over the next quarter
# => Vans, racks, and fittings net of depreciation.
ppe = Decimal("550000")  # => long-lived operating assets
# => Total assets: everything the firm owns.
assets = cash + receivables + inventory + ppe  # => must equal funding
# => Amounts owed to suppliers, due within weeks.
payables = Decimal("120000")  # => short-term supplier credit
# => Bank loan portion due within one year.
short_debt = Decimal("80000")  # => current debt slice
# => Loans due after one year: warehouse and van financing.
long_debt = Decimal("300000")  # => long-term lender funding
# => Owner funding: paid-in capital plus retained earnings.
equity = Decimal("500000")  # => the residual claim
# => Total funding: every lender, supplier, and owner claim.
funding = payables + short_debt + long_debt + equity  # => must equal assets
# => The balance check proves the snapshot is consistent.
print("assets:", assets)  # => Output totals what the firm owns
print("funding:", funding)  # => Output totals who funded it
print("balances:", assets == funding)  # => Output confirms the identity
