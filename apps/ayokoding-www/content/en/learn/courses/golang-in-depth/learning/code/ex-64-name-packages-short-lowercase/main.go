// Example 64: Name Packages Short and Lowercase.
//
// Package names are lowercase single words, no underscores; identifiers earn
// length from scope. This tiny grader applies the rule and prints verdicts.
package main

import (
	"fmt"     // => prints one verdict per candidate name below
	"strings" // => HasPrefix and ToLower: the rule checks, stdlib-powered
	"unicode" // => IsUpper spots the export marker: uppercase first rune
)

// gradeName judges an identifier against the Go naming rules in one pass.
// => returns a verdict string: the rule broken, or "ok" when none breaks
// => short scope earns short names: single letters only live in tiny scopes
func gradeName(name string) string { // => the naming rule, executable
	// => empty names are never legal: reject before any rune inspection
	if name == "" { // => degenerate: no identifier can be empty, ever
		return "empty" // => verdict: rejected at the first check
	}
	// => underscores signal a stuttering package or a C habit: banned here
	if strings.Contains(name, "_") { // => snake_case has no home in Go names
		return "no underscores" // => verdict: rewrite in camelCase instead
	}
	// => UPPERCASE wholes shout: acronyms stay upper, but whole words do not
	first := []rune(name)[0] // => first rune decides export, checked below
	// => exported (uppercase first) is FINE: the rule governs style, not case role
	if unicode.IsUpper(first) && name == strings.ToUpper(name) { // => ALL CAPS
		return "no shouting" // => verdict: SCREAMING_CASE is not Go style
	}
	// => lowercase start: unexported, the common case, always acceptable here
	if unicode.IsLower(first) { // => unexported: package-private by rule
		return "ok" // => verdict: lowercase start passes unconditionally
	}
	// => uppercase start, mixed rest: exported name, style-clean by shape
	return "ok exported" // => verdict: ExportedLikeThis is exactly right
}

func main() {
	// => five candidates: two clean, three each breaking one distinct rule
	for _, name := range []string{"ledger", "Ledger", "MAX", "bad_name", ""} {
		// => verdict per name: the rule earned its keep five times in a row
		fmt.Println(name + ": " + gradeName(name)) // => Output per rule below
	}
}
