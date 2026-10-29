package benchmark

// Presentation formatting ported from the old benchmark shell. Symbols
// are formatting, never data: values arrive from the dataset and core.
// Indexes render with one decimal, USD with two to three decimals so
// sub-cent rates stay exact, ratios with one decimal below 10 and whole
// numbers above, and unrated cells use the old em-dash placeholder.

import (
	"math"
	"strconv"
)

// NoRating marks an unrated cell exactly as the old table does.
const NoRating = "—"

// localeSeparators returns the grouping and decimal separators for the two
// supported locales.
func localeSeparators(locale string) (group, decimal string) {
	if locale == "id" {
		return ".", ","
	}
	return ",", "."
}

// formatGrouped renders a number with grouped thousands, exactly
// fraction digits, and the locale's separators.
func formatGrouped(value float64, fraction int, locale string) string {
	negative := math.Signbit(value) && value != 0
	magnitude := math.Abs(value)
	rounded := math.Round(magnitude * math.Pow(10, float64(fraction)))
	integer := int64(rounded / math.Pow(10, float64(fraction)))
	fractional := int64(rounded - float64(integer)*math.Pow(10, float64(fraction)))
	group, decimal := localeSeparators(locale)
	text := groupDigits(integer, group)
	if fraction > 0 {
		padded := strconv.FormatInt(fractional, 10)
		for len(padded) < fraction {
			padded = "0" + padded
		}
		text += decimal + padded
	}
	if negative {
		return "-" + text
	}
	return text
}

// groupDigits groups a non-negative integer with the given separator.
func groupDigits(n int64, separator string) string {
	digits := strconv.FormatInt(n, 10)
	var out []byte
	for index := 0; index < len(digits); index++ {
		if index > 0 && (len(digits)-index)%3 == 0 {
			out = append(out, separator...)
		}
		out = append(out, digits[index])
	}
	return string(out)
}

// FormatIndex renders a composite index with one decimal.
func FormatIndex(value float64, locale string) string {
	return formatGrouped(value, 1, locale)
}

// FormatPercent renders a 0-100 score with one decimal and a literal
// percent sign, without double-scaling.
func FormatPercent(value float64, locale string) string {
	return FormatIndex(value, locale) + "%"
}

// FormatUSD renders USD with two to three decimals so sub-cent rates stay
// exact: two decimals normally, a third only when it carries value.
func FormatUSD(value float64, locale string) string {
	thousandths := math.Round(value * 1000)
	fraction := 2
	if math.Mod(math.Abs(thousandths), 10) != 0 {
		fraction = 3
	}
	return "$" + formatGrouped(value, fraction, locale)
}

// FormatRatio renders a price multiple: one decimal below 10, whole
// numbers at 10 and above.
func FormatRatio(value float64, locale string) string {
	fraction := 1
	if value >= 10 {
		fraction = 0
	}
	return formatGrouped(value, fraction, locale)
}
