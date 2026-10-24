# Worked Example 28: Cost of Equity With CAPM
# => Merpati Trading Co. is fictional; every number here is fixed.
# => CAPM prices equity as time plus risk scaled by beta.
# => Riskier-than-market shares demand more than the market return.
from decimal import Decimal

# => The three CAPM inputs, all fictional but plausible.
risk_free = Decimal("0.04")  # => government yield, the price of time
market_premium = Decimal("0.055")  # => extra return the market demands
beta = Decimal("1.2")  # => the shares swing harder than the market
# => Cost of equity: time plus beta-scaled market risk.
equity_cost = risk_free + beta * market_premium  # => the owners' required return
# => 10.60 percent: equity is the dearest funding in the firm.
print("risk-free:", risk_free)  # => Output repeats the time price
print("beta:", beta)  # => Output repeats the risk scaler
print(
    "cost-of-equity:", (equity_cost * 100).quantize(Decimal("0.01"))
)  # => Output rate
