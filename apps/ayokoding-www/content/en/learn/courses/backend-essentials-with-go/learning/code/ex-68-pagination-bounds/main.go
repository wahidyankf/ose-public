// Example 68: Pagination Bounds -- a limit over the maximum is a 422.
//
// Ex-65's ge=1 stopped a limit too SMALL; this example adds a ceiling that
// stops one too LARGE: together they turn an unbounded page size into a
// safely bounded one. In Python the guard is declarative (Query(le=...));
// in stdlib Go the handler checks the bound by hand and answers 422 itself.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/tasks?limit=1000" # 422 -- rejected before any slicing
//	curl "http://127.0.0.1:8000/tasks?limit=50"   # 200 -- the boundary itself is fine (25 rows)
//	curl "http://127.0.0.1:8000/tasks?limit=0"    # 422 -- below ge=1, also rejected
package main

import (
	"encoding/json" // => encodes the page array and the 422 envelope below
	"fmt"           // => Sprintf builds the bound message AND the zero-padded day below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, handlers, status codes
	"strconv"       // => query values arrive as strings; Atoi turns them into ints
)

// maxLimit is the ceiling this example enforces -- it stops an accidental
// "select everything" call from a caller passing an enormous ?limit= on a
// huge table. The table here holds 25 rows, fewer than the max, so a
// request AT the max still succeeds and proves the boundary is inclusive.
const maxLimit = 50 // => FastAPI's le=50, spelled as a named Go constant instead

// task is the one row shape every list response in this file returns.
type task struct { // => the Go twin of the Python TaskRow dict -- one struct, five columns
	ID        int    `json:"id"`         // => the stable, 1-based position -- ORDER BY id in Python
	Title     string `json:"title"`      // => "task <i>", the human-readable display text
	Status    string `json:"status"`     // => rotates todo/in_progress/done -- filtered from ex-69 on
	Priority  string `json:"priority"`   // => rotates low/normal/high -- decorrelated on purpose
	CreatedAt string `json:"created_at"` // => "2026-07-<i>T00:00:00" -- sorted on from ex-72
}

// seedTasks builds the SAME deterministic 25-row dataset the Python
// pagination/filter/sort examples share -- fewer than maxLimit, so the
// boundary request below succeeds on its bound while proving the cap.
func seedTasks() []task {
	statuses := []string{"todo", "in_progress", "done"} // => rotates every 3 rows: index i % 3
	priorities := []string{"low", "normal", "high"}     // => rotates every 2 via (i/2) % 3: decorrelated
	tasks := make([]task, 0, 25)                        // => pre-sized: exactly 25 rows, no regrowth
	for i := 1; i <= 25; i++ {                          // => ids 1..25 -- under the 50-row ceiling
		tasks = append(tasks, task{ // => one row per pass, fields in schema order
			ID:        i,                                       // => 1-based, matching SQLite AUTOINCREMENT
			Title:     "task " + strconv.Itoa(i),               // => "task 1" .. "task 25"
			Status:    statuses[i%3],                           // => done exactly where i % 3 == 2
			Priority:  priorities[(i/2)%3],                     // => integer divide first, then mod 3
			CreatedAt: fmt.Sprintf("2026-07-%02dT00:00:00", i), // => zero-padded day, rising with id
		})
	}
	return tasks // => already in id order -- the Go twin of ORDER BY id
}

// tasks is the full table this example pages over -- in memory, read-only
// after startup, so handlers need no lock: nothing ever mutates it.
var tasks = seedTasks() // => seeded once at process start, like Python's import-time init_db

// apiError is the one failure shape this file returns -- code plus message.
type apiError struct { // => {"code":...,"message":...}: machine-readable plus human-readable
	Code    string `json:"code"`    // => e.g. "validation_error" -- stable across examples
	Message string `json:"message"` // => names the offending field, like FastAPI's detail array
}

// errorEnvelope wraps apiError at the fixed "error" key clients parse.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"` // => every error body below nests exactly here
}

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")      // => the stdlib never sets this for you
	w.WriteHeader(status)                                   // => the status line goes out before the body
	if err := json.NewEncoder(w).Encode(body); err != nil { // => streams the encoding straight to the wire
		log.Printf("encode response: %v", err) // => headers already sent: only loggable now
	}
}

// writeError writes the consistent {"error":{...}} envelope with a status.
func writeError(w http.ResponseWriter, status int, code, message string) { // => shape plus status, one call
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: message}})
}

// parseLimitOffset reads ?limit= (default 10, bounded 1..maxLimit) and
// ?offset= (default 0, must be >= 0). The repository below TRUSTS limit is
// already within bounds -- the check lives HERE, at the edge, exactly like
// FastAPI validating BEFORE the handler body ever ran.
func parseLimitOffset(r *http.Request) (limit, offset int, errMsg string) {
	limit = 10                                        // => the default when ?limit= is absent entirely -- unchanged from ex-65
	offset = 0                                        // => the default start: the very first row
	if raw := r.URL.Query().Get("limit"); raw != "" { // => the caller said SOMETHING -- honour it
		n, err := strconv.Atoi(raw)              // => "1000" -> 1000; "abc" -> an error, never a silent zero
		if err != nil || n < 1 || n > maxLimit { // => ge=1 AND le=50: both sides bounded alike
			return 0, 0, fmt.Sprintf("limit must be an integer between 1 and %d", maxLimit) // => 422, names the field
		}
		limit = n // => valid: this page holds at most n rows -- this line never runs out of bounds
	}
	if raw := r.URL.Query().Get("offset"); raw != "" { // => same opt-in pattern for the skip count
		n, err := strconv.Atoi(raw) // => Atoi again: no floats, no blanks, no coercion
		if err != nil || n < 0 {    // => ge=0: negatives are rejected, zero is the default anyway
			return 0, 0, "offset must be an integer >= 0" // => names the field, like FastAPI's detail
		}
		offset = n // => valid: skip the first n rows before slicing
	}
	return limit, offset, "" // => an empty message IS success -- the caller checks this, not a bool
}

// listTasks serves GET /tasks -- one page, with the limit ceiling enforced
// before any slicing happens: an out-of-bounds limit never touches data.
func listTasks(w http.ResponseWriter, r *http.Request) {
	limit, offset, errMsg := parseLimitOffset(r) // => the guard runs BEFORE the slice, like Query(le=...)
	if errMsg != "" {                            // => rejected before any data access -- co-10 parity
		writeError(w, http.StatusUnprocessableEntity, "validation_error", errMsg) // => 422, names limit
		return
	}
	if offset > len(tasks) { // => past the end: the window starts beyond the last row
		offset = len(tasks) // => clamp so the slice below yields [] instead of panicking
	}
	end := offset + limit // => the exclusive upper bound of this page window
	if end > len(tasks) { // => limit AT max still lands here: SQL LIMIT means "at most" anyway
		end = len(tasks) // => clamp the upper bound the same way
	}
	writeJSON(w, http.StatusOK, tasks[offset:end]) // => the page itself -- a bare JSON array, like Python
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router for this example's single route
	mux.HandleFunc("GET /tasks", listTasks)               // => a method pattern: other verbs 405 here too (see ex-75)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
