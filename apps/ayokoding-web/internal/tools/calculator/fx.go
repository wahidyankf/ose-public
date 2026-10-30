package calculator

// Currency conversion and number formatting ported from the current
// TypeScript core. Every USD conversion routes through FxToUSD; no city
// stores its own rate.

import (
	"fmt"
	"math"
	"strings"
)

// FxToUSD returns the USD value of one unit of currency, erroring on an
// unknown currency instead of producing a non-finite figure. Errors carry
// no input values.
func FxToUSD(fx FxTable, currency string) (float64, error) {
	rate, ok := fx.RatesUSDPerUnit[currency]
	if !ok {
		return 0, fmt.Errorf("calculator: unknown currency")
	}
	return rate, nil
}

// USDToDisplay converts a USD amount to the chosen display currency:
// result = usd / fxToUsd(fx, displayCurrency).
func USDToDisplay(fx FxTable, usd float64, displayCurrency string) (float64, error) {
	rate, err := FxToUSD(fx, displayCurrency)
	if err != nil {
		return 0, err
	}
	return usd / rate, nil
}

// FmtNum formats a number with US thousands separators and no decimals,
// rounding half away from zero as the old runtime's maximumFractionDigits
// formatting does.
func FmtNum(n float64) string {
	rounded := math.Round(n)
	negative := rounded < 0
	digits := formatDigits(int64(math.Abs(rounded)))
	if negative {
		return "-" + digits
	}
	return digits
}

// formatDigits groups a non-negative integer with thousands separators.
func formatDigits(n int64) string {
	digits := fmt.Sprintf("%d", n)
	var out []byte
	for index := 0; index < len(digits); index++ {
		if index > 0 && (len(digits)-index)%3 == 0 {
			out = append(out, ',')
		}
		out = append(out, digits[index])
	}
	return string(out)
}

// FmtCurrency formats a number with an optional currency code prefix.
func FmtCurrency(n float64, currency string) string {
	formatted := FmtNum(n)
	if currency == "" {
		return formatted
	}
	return strings.TrimSpace(currency + " " + formatted)
}

// FmtDualCurrency renders the local and USD amounts side by side.
func FmtDualCurrency(localAmount float64, localCurrency string, usdAmount float64) string {
	return FmtCurrency(localAmount, localCurrency) + " / $" + FmtNum(usdAmount)
}

// FmtCurrencyTrailing renders a number with a trailing currency code.
func FmtCurrencyTrailing(n float64, code string) string {
	return strings.TrimSpace(FmtNum(n) + " " + code)
}
