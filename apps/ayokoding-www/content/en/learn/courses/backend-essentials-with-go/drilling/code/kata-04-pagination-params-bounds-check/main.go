// Kata 04: Parse and bounds-check limit/offset query params.
//
// List endpoints page with limit/offset. The limit gets a default and a
// ceiling; the offset defaults to zero. Negatives are rejected outright.
package main

import (
	"fmt"     // => prints each parsed page window
	"log"     // => fail-fast on any self-check mismatch
	"strconv" // => query values arrive as strings; Atoi types them
)

const (
	DefaultLimit = 10  // => co-19: the page size when ?limit= is absent
	MaxLimit     = 100 // => co-19: the ceiling; callers cannot demand the whole table
)

// ParsePagination returns (limit, offset) from query-param-like input.
func ParsePagination(params map[string]string) (int, int, error) { // => returns the window into the list
	limit := DefaultLimit               // => fall back when the caller sends no ?limit=
	offset := 0                         // => a page always starts at 0 by default
	if raw, ok := params["limit"]; ok { // => the caller said something about limit
		n, err := strconv.Atoi(raw) // => "25" -> 25; "abc" -> an error, never a silent zero
		if err != nil {             // => unparseable text is rejected
			return 0, 0, fmt.Errorf("invalid limit %q", raw) // => caller-facing, not a panic
		}
		limit = n // => tentatively accept, bounds-checked below
	}
	if raw, ok := params["offset"]; ok { // => same opt-in pattern for the skip count
		n, err := strconv.Atoi(raw) // => Atoi again: no floats, no blanks
		if err != nil {             // => unparseable text is rejected
			return 0, 0, fmt.Errorf("invalid offset %q", raw) // => caller-facing
		}
		offset = n // => tentatively accept, negativity-checked below
	}
	if limit < 0 || offset < 0 { // => negative windows make no sense
		return 0, 0, fmt.Errorf("limit and offset must be non-negative") // => rejected outright
	}
	if limit > MaxLimit { // => co-19: clamp an over-large request instead of scanning everything
		limit = MaxLimit // => never trusted as-is
	}
	return limit, offset, nil // => the validated window
}

func mustParse(params map[string]string) (int, int) {
	limit, offset, err := ParsePagination(params) // => happy-path helper for the kata
	if err != nil {                               // => these inputs are all meant to succeed
		log.Fatalf("parse %v: %v", params, err)
	}
	return limit, offset // => the window the prints below show
}

func main() {
	defLimit, defOffset := mustParse(map[string]string{}) // => neither param supplied
	expLimit, expOffset := mustParse(map[string]string{"limit": "25", "offset": "50"})
	clampLimit, clampOffset := mustParse(map[string]string{"limit": "9999", "offset": "0"})

	fmt.Println(defLimit, defOffset)     // => Output: 10 0
	fmt.Println(expLimit, expOffset)     // => Output: 25 50
	fmt.Println(clampLimit, clampOffset) // => Output: 100 0 (clamped to MaxLimit)

	if defLimit != 10 || defOffset != 0 { // => defaults hold
		log.Fatalf("defaults = (%d,%d), want (10,0)", defLimit, defOffset)
	}
	if expLimit != 25 || expOffset != 50 { // => explicit values pass through
		log.Fatalf("explicit = (%d,%d), want (25,50)", expLimit, expOffset)
	}
	if clampLimit != 100 || clampOffset != 0 { // => abusive limit clamped, never trusted
		log.Fatalf("clamped = (%d,%d), want (100,0)", clampLimit, clampOffset)
	}

	_, _, err := ParsePagination(map[string]string{"limit": "-5"}) // => a negative limit is rejected
	raised := err != nil                                           // => rejection, not a silent window
	fmt.Println(raised)                                            // => Output: true
	if !raised {                                                   // => negatives must never become windows
		log.Fatalf("negative limit must be rejected")
	}
	fmt.Println("kata-04 OK") // => the self-check line this track greps for
}
