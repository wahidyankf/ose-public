package calculator

// JavaScript number-parsing semantics for query decoding. The old codec
// relies on parseInt and parseFloat, which parse a leading numeric prefix
// and ignore trailing garbage; a faithful port must not replace that with
// stricter or looser numeric parsing.

import (
	"math"
	"strconv"
	"strings"
	"unicode"
	"unicode/utf8"
)

// tsParseFloat parses with JavaScript parseFloat semantics: leading
// whitespace, an optional sign, an optional Infinity literal, then the
// longest valid decimal prefix. Reports false when no digits precede the
// longest valid prefix.
func tsParseFloat(s string) (float64, bool) {
	index := skipJSWhiteSpace(s, 0)
	negative := false
	if index < len(s) && (s[index] == '+' || s[index] == '-') {
		negative = s[index] == '-'
		index++
	}
	if strings.HasPrefix(s[index:], "Infinity") {
		if negative {
			return math.Inf(-1), true
		}
		return math.Inf(1), true
	}
	start := index
	for index < len(s) && isASCIIDigit(s[index]) {
		index++
	}
	hasInt := index > start
	if index < len(s) && s[index] == '.' {
		index++
		fracStart := index
		for index < len(s) && isASCIIDigit(s[index]) {
			index++
		}
		if !hasInt && index == fracStart {
			return 0, false
		}
	} else if !hasInt {
		return 0, false
	}
	if index < len(s) && (s[index] == 'e' || s[index] == 'E') {
		save := index
		index++
		if index < len(s) && (s[index] == '+' || s[index] == '-') {
			index++
		}
		expStart := index
		for index < len(s) && isASCIIDigit(s[index]) {
			index++
		}
		if index == expStart {
			index = save
		}
	}
	value, err := strconv.ParseFloat(s[start:index], 64)
	if err != nil {
		return 0, false
	}
	if negative {
		value = -value
	}
	return value, true
}

// tsParseInt parses with JavaScript parseInt semantics at radix 10:
// leading whitespace, an optional sign, then the longest digit run.
// Reports false when no digit follows.
func tsParseInt(s string) (float64, bool) {
	index := skipJSWhiteSpace(s, 0)
	negative := false
	if index < len(s) && (s[index] == '+' || s[index] == '-') {
		negative = s[index] == '-'
		index++
	}
	start := index
	for index < len(s) && isASCIIDigit(s[index]) {
		index++
	}
	if index == start {
		return 0, false
	}
	var value float64
	for _, digit := range s[start:index] {
		value = value*10 + float64(digit-'0')
	}
	if negative {
		value = -value
	}
	return value, true
}

// skipJSWhiteSpace consumes a JavaScript StrWhiteSpace prefix.
func skipJSWhiteSpace(s string, index int) int {
	for index < len(s) {
		char, width := utf8.DecodeRuneInString(s[index:])
		if char == 0xFEFF || char == 0x200B || unicode.IsSpace(char) {
			index += width
			continue
		}
		return index
	}
	return index
}

// isASCIIDigit reports whether c is 0-9.
func isASCIIDigit(c byte) bool {
	return c >= '0' && c <= '9'
}
