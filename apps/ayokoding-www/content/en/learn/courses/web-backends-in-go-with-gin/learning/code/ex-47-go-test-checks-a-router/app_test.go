// => Example 47: Go Test Checks a Router (tests).
// => Three subtests serve three requests through NewRouter in-process and
// => log the contract each proves. Run with go test -v: the timing the tool
// => prints is normalized away before the golden comparison.
package main

import (
	"net/http/httptest" // => in-process request and recorder (co-09)
	"testing"           // => the test toolchain: Run, Logf, Errorf
)

// => TestGreeting serves the contract table through one shared router.
// => subtests isolate cases: each logs its own proof line (co-09)
func TestGreeting(t *testing.T) { // => the single test with three cases
	// => construction is not under test: build once, serve thrice
	router := NewRouter() // => built once: construction is not under test
	cases := []struct {   // => the table: path in, status and body out
		name string // => the subtest name, shown in verbose output
		path string // => the request path under test
		code int    // => the expected status
		body string // => the expected body, exact
	}{ // => three rows: two greetings and one absence
		{"sari is greeted", "/hello/Sari", 200, `{"message":"hello, Sari"}`}, // => the basic contract
		{"budi is greeted", "/hello/Budi", 200, `{"message":"hello, Budi"}`}, // => the name travels through
		{"unknown is 404", "/goodbye", 404, "404 page not found"},            // => absences are defined too
	}
	for _, tc := range cases { // => one subtest per row, in table order
		// => parallel subtests would share tc: capture keeps each case separate
		tc := tc // => capture the loop variable: subtests keep their own
		// => the name shows in -v output: failures point at their row
		t.Run(tc.name, func(t *testing.T) { // => the subtest: named, isolated
			req := httptest.NewRequest("GET", tc.path, nil) // => server-side request, no socket
			w := httptest.NewRecorder()                     // => the assertion surface
			router.ServeHTTP(w, req)                        // => full pipeline, minus the network
			if w.Code != tc.code {                          // => the status must match first
				t.Errorf("status = %d, want %d", w.Code, tc.code) // => both sides on failure
			}
			if w.Body.String() != tc.body { // => then the exact body
				t.Errorf("body = %s, want %s", w.Body.String(), tc.body) // => both sides on failure
			}
			// => the proof line names path, code, and body: the whole contract
			t.Logf("contract holds: %s -> %d %s", tc.path, tc.code, tc.body) // => the proof line per case
		})
	}
}
