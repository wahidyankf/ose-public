// Example 72: Sort Param -- ?sort=created_at (or -created_at) orders the list.
//
// Reordering the SAME underlying rows -- never changing WHICH rows come
// back, only the SEQUENCE they arrive in. ?sort= is a CLOSED set of two
// values (anything else is a 422); a leading "-" is the REST convention
// for "descending". The sort key is looked up from a FIXED map -- user
// input is never interpolated into an ORDER BY, because SQL has no ?
// placeholder syntax for column names or ASC/DESC at all. Same in-memory
// 25-row table as ex-65 -- stdlib only, zero setup.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/tasks?sort=created_at"  # oldest first: id 1 .. 25
//	curl "http://127.0.0.1:8000/tasks?sort=-created_at" # newest first: id 25 .. 1
//	curl "http://127.0.0.1:8000/tasks?sort=title"        # 422 -- outside the closed set
package main

import (
	"cmp"           // => compares created_at strings -- ISO-8601 sorts lexicographically too
	"encoding/json" // => encodes the ordered array -- one codec, every response
	"fmt"           // => Sprintf builds the zero-padded created_at day below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, handlers, status codes
	"slices"        // => SortedFunc returns the ordered copy -- the caller's slice stays pristine
	"strconv"       // => Itoa builds the "task <i>" titles below
)

// task is the one row shape every list response in this file returns.
type task struct { // => the Go twin of the Python TaskRow dict -- one struct, five columns
	ID        int    `json:"id"`         // => the stable, 1-based position
	Title     string `json:"title"`      // => "task <i>", the human-readable display text
	Status    string `json:"status"`     // => rotates todo/in_progress/done -- filtered in ex-69/70
	Priority  string `json:"priority"`   // => rotates low/normal/high -- decorrelated on purpose
	CreatedAt string `json:"created_at"` // => THIS example's sort key -- rises WITH id by construction
}

// seedTasks builds the SAME deterministic 25-row dataset the Python sort
// example shares -- created_at already rises with id, so ascending looks
// like a no-op and the curl above deliberately checks descending too.
func seedTasks() []task {
	statuses := []string{"todo", "in_progress", "done"} // => rotates every 3 rows: index i % 3
	priorities := []string{"low", "normal", "high"}     // => rotates every 2 via (i/2) % 3: decorrelated
	tasks := make([]task, 0, 25)                        // => pre-sized: exactly 25 rows, no regrowth
	for i := 1; i <= 25; i++ {                          // => ids 1..25 -- the sort's whole universe
		tasks = append(tasks, task{ // => one row per pass, fields in schema order
			ID:        i,                                       // => 1-based, matching SQLite AUTOINCREMENT
			Title:     "task " + strconv.Itoa(i),               // => "task 1" .. "task 25"
			Status:    statuses[i%3],                           // => done exactly where i % 3 == 2
			Priority:  priorities[(i/2)%3],                     // => integer divide first, then mod 3
			CreatedAt: fmt.Sprintf("2026-07-%02dT00:00:00", i), // => zero-padded day, rising with id
		})
	}
	return tasks // => stored ASCENDING -- descending below must genuinely reverse it
}

// tasks is the full table this example sorts -- in memory, read-only after
// startup. Handlers sort a COPY, never this slice: reordering shared state
// per request would race under concurrent curl calls.
var tasks = seedTasks() // => seeded once at process start, like Python's import-time init_db

// apiError is the one failure shape this file returns -- code plus message.
type apiError struct { // => {"code":...,"message":...}: machine-readable plus human-readable
	Code    string `json:"code"`    // => e.g. "validation_error" -- stable across examples
	Message string `json:"message"` // => names the offending value, like FastAPI's detail array
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

// sortTasks is the repository function: it returns the rows ordered per
// sort, which can ONLY be one of the two map keys below -- the handler
// rejects anything else before this ever runs, so no default branch hides
// a third case. The input slice is never mutated: callers share it.
func sortTasks(rows []task, sort string) []task {
	ascending := sort == "created_at"          // => the only other legal value is "-created_at" -- checked by the caller
	out := slices.Clone(rows)                  // => a fresh COPY first: the shared input slice is never mutated
	slices.SortFunc(out, func(a, b task) int { // => sorts the copy in place -- input order untouched
		if ascending { // => oldest-first, matching the seed's natural insertion order
			return cmp.Compare(a.CreatedAt, b.CreatedAt) // => ISO-8601 strings compare chronologically
		}
		return cmp.Compare(b.CreatedAt, a.CreatedAt) // => a leading "-" flips the comparison -- newest first
	})
	return out // => the ordered copy -- same 25 rows, caller-chosen sequence
}

// listTasks serves GET /tasks -- the closed sort set, defaulting to
// ascending. sort never FILTERS: both directions return all 25 rows.
func listTasks(w http.ResponseWriter, r *http.Request) {
	sort := r.URL.Query().Get("sort") // => "" when absent -- degraded to the default just below
	if sort == "" {                   // => absent means ascending -- the seed's own insertion order
		sort = "created_at" // => the default direction, matching the Python Query(default=...)
	}
	if sort != "created_at" && sort != "-created_at" { // => the CLOSED set: two values, nothing else
		writeError(w, http.StatusUnprocessableEntity, "validation_error", // => 422, the Literal-type parity
			`sort must be "created_at" or "-created_at"`) // => quotes the legal values -- actionable text
		return
	}
	writeJSON(w, http.StatusOK, sortTasks(tasks, sort)) // => same 25 rows, only the ORDER changed
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router for this example's single route
	mux.HandleFunc("GET /tasks", listTasks)               // => a method pattern: other verbs 405 here too (see ex-75)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
