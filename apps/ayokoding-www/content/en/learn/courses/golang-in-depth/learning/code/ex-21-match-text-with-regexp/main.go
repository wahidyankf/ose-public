// Example 21: Match Text with regexp.
//
// Compile patterns once with MustCompile and reuse them; submatches return
// positional or named groups for extraction, not just yes-or-no answers.
package main

import (
	"fmt"    // => prints the validation verdict and the extracted parts
	"regexp" // => MustCompile once, then MatchString and FindStringSubmatch
)

// codePattern matches order codes like ORD-2026-041 and names their parts.
// => MustCompile at package level: invalid patterns panic at startup, loudly
// => named groups (?P<year>...): extraction by name survives pattern edits
var codePattern = regexp.MustCompile(`^ORD-(?P<year>\d{4})-(?P<seq>\d{3})$`)

// parseCode validates a code and splits it into year and sequence numbers.
// => (string, string, bool): the parts plus a validity flag, no error needed
// => validity is a bool here: callers branch, and only valid codes have parts
func parseCode(code string) (year, seq string, ok bool) { // => named results
	// => FindStringSubmatch returns the full match plus one entry per group
	m := codePattern.FindStringSubmatch(code) // => nil when nothing matches
	// => nil means "no match": validity and extraction share one call
	if m == nil { // => pattern rejected: no parts exist to return
		return "", "", false // => zero parts plus false: nothing to misread
	}
	// => SubexpIndex turns group NAMES into positions: edit-proof extraction
	return m[codePattern.SubexpIndex("year")], m[codePattern.SubexpIndex("seq")], true
}

func main() {
	// => valid code: matches, and both named parts extract correctly
	year, seq, ok := parseCode("ORD-2026-041") // => year 2026, seq 041
	// => ok gates the parts: read them only when the pattern accepted
	if ok { // => true: the code fit the pattern exactly
		fmt.Println(year, seq) // => Output: 2026 041
	}
	// => invalid code: lowercase prefix breaks the anchored pattern
	if _, _, ok := parseCode("ord-2026-041"); !ok { // => anchors reject it
		fmt.Println("rejected") // => Output: rejected
	}
}
