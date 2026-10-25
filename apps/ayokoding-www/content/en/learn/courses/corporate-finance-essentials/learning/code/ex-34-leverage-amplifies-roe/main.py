# Worked Example 34: Leverage Amplifies Returns on Equity
# => Merpati Trading Co. is fictional; every number here is fixed.
# => The same assets earn the same EBIT under either funding.
# => Debt shrinks the equity base, so the same profit looks larger on it.
from decimal import Decimal

# => Shared operating result and tax rate under both fundings.
ebit = Decimal("180000")  # => identical assets, identical EBIT
tax_rate = Decimal("0.25")  # => fictional flat rate
# => Levered funding: 380,000 of debt at 24,000 interest, 500,000 equity.
net_levered = (ebit - Decimal("24000")) * (Decimal("1") - tax_rate)  # => owners keep
roe_levered = net_levered / Decimal("500000") * 100  # => profit on a small base
# => Unlevered funding: no debt, so EBIT is taxed whole on 1,000,000 equity.
net_unlevered = ebit * (Decimal("1") - tax_rate)  # => larger profit, larger base
roe_unlevered = net_unlevered / Decimal("1000000") * 100  # => profit on a full base
# => Same business, double the ROE: leverage did the amplifying.
print("roe-levered:", roe_levered.quantize(Decimal("0.01")))  # => Output amplified
print("roe-unlevered:", roe_unlevered.quantize(Decimal("0.01")))  # => Output plain
