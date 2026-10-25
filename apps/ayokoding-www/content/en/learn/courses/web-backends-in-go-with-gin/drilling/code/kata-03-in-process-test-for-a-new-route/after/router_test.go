// => Kata 3 solution tests: two subtests prove the doubling route.
// => One doubling case plus one unknown path, served in-process through
// => httptest. Run with go test -v: timing is normalized away before the
// => golden comparison.
package main

import (
	"net/http/httptest" // => in-process request and recorder
	"testing"           // => the test toolchain: Run, Logf, Errorf
)

// => TestDouble serves the contract table through one shared router.
// => one doubling proof plus one absence proof, both logged
func TestDouble(t *testing.T) { // => the single test with two cases
	router := NewRouter() // => built once: construction is not under test
	cases := []struct {   // => the table: path in, status and body out
		name string // => the subtest name, shown in verbose output
		path string // => the request path under test
		code int    // => the expected status
		body string // => the expected body, exact
	}{ // => two rows: the double and the defined absence
		{"seven doubles to fourteen", "/double/7", 200, `{"doubled":14}`}, // => the doubling contract
		{"unknown is 404", "/halve/7", 404, "404 page not found"},         // => absences are defined too
	}
	for _, tc := range cases { // => one subtest per row, in table order
		tc := tc // => capture the loop variable: subtests keep their own
		// => the name shows in -v output: failures point at their row
		t.Run(tc.name, func(t *testing.T) { // => the subtest: named, isolated
			req := httptest.NewRequest("GET", tc.path, nil) // => server-side request, no socket
			w := httptest.NewRecorder()                     // => the assertion surface
			router.ServeHTTP(w, req)                        // => full pipeline, minus the network
			if w.Code != tc.code {                          // => the status must match first
				// => codes disagree loudly: got versus want, both printed
				t.Errorf("status = %d, want %d", w.Code, tc.code) // => both sides on failure
			}
			if w.Body.String() != tc.body { // => then the exact body
				t.Errorf("body = %s, want %s", w.Body.String(), tc.body) // => both sides on failure
			}
			// => the proof names path, code, and body: the whole contract
			t.Logf("holds: %s -> %d %s", tc.path, tc.code, tc.body) // => the proof line per case
		})
	}
}
