package speccoverage

import (
	"regexp"
	"strings"
)

// cucumberParamRe matches any Cucumber expression parameter like {string}, {int}, etc.
var cucumberParamRe = regexp.MustCompile(`\{[^}]+\}`)

// pythonParsersParamRe matches Python pytest-bdd parsers.parse format like {name:d}, {name:g}, {name:w}, {name}
var pythonParsersParamRe = regexp.MustCompile(`\{(\w+)(?::([dgw]))?\}`)

// cucumberExprToRegex converts a Cucumber expression string to a regex pattern string.
// Each Cucumber parameter type is replaced by its regex equivalent, and all other
// literal text is regexp.QuoteMeta-escaped.
func cucumberExprToRegex(text string) string {
	var sb strings.Builder
	remaining := text
	for {
		loc := cucumberParamRe.FindStringIndex(remaining)
		if loc == nil {
			sb.WriteString(regexp.QuoteMeta(remaining))
			break
		}
		// Escape the literal part before the parameter
		sb.WriteString(regexp.QuoteMeta(remaining[:loc[0]]))
		param := remaining[loc[0]:loc[1]]
		// param includes braces, e.g. "{string}"
		inner := param[1 : len(param)-1]
		sb.WriteString(cucumberParamToRegex(inner))
		remaining = remaining[loc[1]:]
	}
	return sb.String()
}

// cucumberParamToRegex converts the inner part of a Cucumber expression parameter
// (without braces) to its regex equivalent.
func cucumberParamToRegex(paramName string) string {
	switch paramName {
	case "string":
		return `"[^"]*"`
	case "int", "byte", "short", "long":
		return `-?\d+`
	case "float", "double", "bigdecimal":
		return `-?\d+\.?\d*`
	case "word":
		return `\S+`
	default:
		// Unknown parameter type — match anything non-greedy
		return `.+`
	}
}

// hasCucumberExpressions returns true if the text contains Cucumber expression parameters.
func hasCucumberExpressions(text string) bool {
	return cucumberParamRe.MatchString(text)
}

// convertPythonParsersExpr converts a Python parsers.parse format string to a regex pattern string.
// Handles {name:d} (digit), {name:g} (float), {name:w} (word), {name} (any).
func convertPythonParsersExpr(text string) string {
	var sb strings.Builder
	remaining := text
	for {
		loc := pythonParsersParamRe.FindStringIndex(remaining)
		if loc == nil {
			sb.WriteString(regexp.QuoteMeta(remaining))
			break
		}
		sb.WriteString(regexp.QuoteMeta(remaining[:loc[0]]))
		m := pythonParsersParamRe.FindStringSubmatch(remaining[loc[0]:loc[1]])
		formatSpec := ""
		if len(m) > 2 {
			formatSpec = m[2]
		}
		switch formatSpec {
		case "d":
			sb.WriteString(`-?\d+`)
		case "g":
			sb.WriteString(`-?\d+\.?\d*`)
		case "w":
			sb.WriteString(`\S+`)
		default:
			sb.WriteString(`.+`)
		}
		remaining = remaining[loc[1]:]
	}
	return sb.String()
}

// isPythonParsersExpr returns true if the text looks like a Python parsers.parse format string
// (contains {name} or {name:d} style placeholders).
func isPythonParsersExpr(text string) bool {
	return pythonParsersParamRe.MatchString(text)
}

// addStepToMatcher adds a step text to the stepMatcher using the most appropriate mode:
//   - If text starts with ^ (traditional regex), compile as regex and add to sm.patterns.
//   - If text contains Cucumber expressions ({string}, {int}, etc.), convert and add to sm.patterns.
//   - If text contains regex capture groups (...) but no Cucumber expressions, compile as regex and add to sm.patterns.
//   - Otherwise, add to sm.exact as a literal match.
//
// normalizeWS is applied to text before processing.
func addStepToMatcher(sm *stepMatcher, text string) {
	text = normalizeWS(text)
	if text == "" {
		return
	}

	// Traditional regex pattern (anchored with ^)
	if strings.HasPrefix(text, "^") {
		re, err := regexp.Compile(text)
		if err == nil {
			sm.patterns = append(sm.patterns, re)
		}
		return
	}

	// Cucumber expression parameters
	if hasCucumberExpressions(text) {
		pattern := "^" + cucumberExprToRegex(text) + "$"
		re, err := regexp.Compile(pattern)
		if err == nil {
			sm.patterns = append(sm.patterns, re)
		}
		return
	}

	// Plain literal text — parentheses like (1280x800) are treated as literal
	sm.exact[text] = true
}

// addPythonStepToMatcher adds a Python step text to the stepMatcher.
// Handles both plain strings and parsers.parse format strings.
func addPythonStepToMatcher(sm *stepMatcher, text string) {
	text = normalizeWS(text)
	if text == "" {
		return
	}

	// Traditional regex pattern (anchored with ^)
	if strings.HasPrefix(text, "^") {
		re, err := regexp.Compile(text)
		if err == nil {
			sm.patterns = append(sm.patterns, re)
		}
		return
	}

	// Python parsers.parse format ({name:d}, {name:g}, {name:w}, {name})
	if isPythonParsersExpr(text) {
		pattern := "^" + convertPythonParsersExpr(text) + "$"
		re, err := regexp.Compile(pattern)
		if err == nil {
			sm.patterns = append(sm.patterns, re)
		}
		return
	}

	// Cucumber expression parameters
	if hasCucumberExpressions(text) {
		pattern := "^" + cucumberExprToRegex(text) + "$"
		re, err := regexp.Compile(pattern)
		if err == nil {
			sm.patterns = append(sm.patterns, re)
		}
		return
	}

	// Plain literal text — parentheses like (1280x800) are treated as literal
	sm.exact[text] = true
}
