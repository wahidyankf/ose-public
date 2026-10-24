// Failing-first test for Slug: red on the naive code, green on the fix.
// => RED rehearsal: return title unchanged and this test fails loudly
// => GREEN proof: the committed Slug passes every assertion below
package main

import ( // => two imports: testing for the runner, strings for the property
	"strings" // => Contains checks the no-spaces property on any input
	"testing" // => Run nests the two transformations as named subtests
)

// TestSlug pins the two transformations: lowercase AND dash separation.
// => two subtests: each names the transformation it would catch missing
func TestSlug(t *testing.T) { // => t threads through both subtests below
	// => subtest one: lowercase is not optional, URLs are case-sensitive
	t.Run("lowercases", func(t *testing.T) { // => fails on RED: case untouched
		// => mixed-case input: the exact shape RED implementations keep
		if got := Slug("Hello World"); got != "hello-world" { // => want both fixes
			t.Errorf("Slug = %q, want %q", got, "hello-world") // => names the gap
		}
	})
	// => subtest two: separators must be dashes, never raw spaces
	t.Run("no spaces remain", func(t *testing.T) { // => fails on RED: spaces kept
		// => spaces.Contains check: the property, not just one example
		if got := Slug("a b c"); strings.Contains(got, " ") { // => spaces banned
			t.Errorf("Slug %q still contains spaces", got) // => quotes the offender
		}
	})
}
