// Example 65: Pagination with limit and offset.
//
// GET /tasks?limit=&offset= returns one page (slice) of the task list:
// limit caps how many rows come back, offset skips that many rows first.
// The Python twin serves the same 25-row table from SQLite; this Go port
// keeps the identical 25 rows in memory -- stdlib only, zero setup -- so
// the HTTP behaviour curl sees (the exact page windows) is the same.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/tasks"                    # default page: ids 1..10
//	curl "http://127.0.0.1:8000/tasks?limit=5&offset=10"  # a different window: ids 11..15
//	curl "http://127.0.0.1:8000/tasks?limit=10&offset=100" # past the end: []
package main

import (
	"encoding/json" // => encodes every list response below -- the only codec this file needs
	"fmt"           // => Sprintf builds the zero-padded created_at day below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, handlers, status codes
	"strconv"       // => query values arrive as strings; Atoi turns them into ints
)

// task is the one row shape every list response in this file returns.
type task struct { // => the Go twin of the Python TaskRow dict -- one struct, five columns
	ID        int    `json:"id"`         // => the stable, 1-based position -- ORDER BY id in Python
	Title     string `json:"title"`      // => "task <i>", the human-readable display text
	Status    string `json:"status"`     // => rotates todo/in_progress/done -- filtered from ex-69 on
	Priority  string `json:"priority"`   // => rotates low/normal/high -- decorrelated on purpose
	CreatedAt string `json:"created_at"` // => "2026-07-<i>T00:00:00" -- sorted on from ex-72
}

// seedTasks builds the SAME deterministic 25-row dataset the Python
// pagination/filter/sort examples share, so worked-out ids (done at
// {2,5,8,...}) stay correct across both tracks.
func seedTasks() []task {
	statuses := []string{"todo", "in_progress", "done"} // => rotates every 3 rows: index i % 3
	priorities := []string{"low", "normal", "high"}     // => rotates every 2 via (i/2) % 3: decorrelated
	tasks := make([]task, 0, 25)                        // => pre-sized: exactly 25 rows, no regrowth
	for i := 1; i <= 25; i++ {                          // => ids 1..25 -- more than one default page
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

// parseLimitOffset reads ?limit= (default 10) and ?offset= (default 0),
// enforcing the same bounds FastAPI's Query(ge=...) enforced in Python:
// limit must be >= 1, offset must be >= 0, anything else is a 422.
func parseLimitOffset(r *http.Request) (limit, offset int, errMsg string) {
	limit = 10                                        // => the default when ?limit= is absent entirely -- ex-66 proves this bound
	offset = 0                                        // => the default start: the very first row
	if raw := r.URL.Query().Get("limit"); raw != "" { // => the caller said SOMETHING -- honour it
		n, err := strconv.Atoi(raw) // => "5" -> 5; "abc" -> an error, never a silent zero
		if err != nil || n < 1 {    // => non-numeric AND zero/negative both fail ge=1 alike
			return 0, 0, "limit must be an integer >= 1" // => 422 text, naming the offending field
		}
		limit = n // => valid: this page holds at most n rows
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

// listTasks serves GET /tasks -- one page, sliced by limit and offset.
func listTasks(w http.ResponseWriter, r *http.Request) {
	limit, offset, errMsg := parseLimitOffset(r) // => one helper owns every validation rule
	if errMsg != "" {                            // => a bad ?limit=/?offset= never reaches the slice below
		writeError(w, http.StatusUnprocessableEntity, "validation_error", errMsg) // => 422, FastAPI parity
		return
	}
	if offset > len(tasks) { // => past the end: the window starts beyond the last row
		offset = len(tasks) // => clamp so the slice below yields [] instead of panicking
	}
	end := offset + limit // => the exclusive upper bound of this page window
	if end > len(tasks) { // => the last page is shorter than limit -- genuinely the tail
		end = len(tasks) // => clamp the upper bound the same way
	}
	writeJSON(w, http.StatusOK, tasks[offset:end]) // => the page itself -- a bare JSON array, like Python
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router for this example's single route
	mux.HandleFunc("GET /tasks", listTasks)               // => a method pattern: other verbs 405 here too (see ex-75)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
