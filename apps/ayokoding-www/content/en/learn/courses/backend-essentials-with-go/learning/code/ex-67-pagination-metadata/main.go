// Example 67: Pagination Metadata -- the response carries total and next.
//
// Ex-65 proved limit/offset SLICE the list; this example proves a client
// can also discover how many rows exist and where the next page starts,
// without a separate count request: the response becomes an ENVELOPE with
// items, total, and next (null once the end is reached). Same in-memory
// 25-row table as ex-65 -- stdlib only, zero setup.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/tasks?limit=10&offset=0"  # total 25, next 10
//	curl "http://127.0.0.1:8000/tasks?limit=10&offset=20" # 5 items left, next null
package main

import (
	"encoding/json" // => encodes the envelope below -- items plus metadata in one body
	"fmt"           // => Sprintf builds the zero-padded created_at day below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, handlers, status codes
	"strconv"       // => query values arrive as strings; Atoi turns them into ints
)

// task is the one row shape every page's items carry.
type task struct { // => the Go twin of the Python TaskRow dict -- one struct, five columns
	ID        int    `json:"id"`         // => the stable, 1-based position -- ORDER BY id in Python
	Title     string `json:"title"`      // => "task <i>", the human-readable display text
	Status    string `json:"status"`     // => rotates todo/in_progress/done -- filtered from ex-69 on
	Priority  string `json:"priority"`   // => rotates low/normal/high -- decorrelated on purpose
	CreatedAt string `json:"created_at"` // => "2026-07-<i>T00:00:00" -- sorted on from ex-72
}

// page is the ENVELOPE shape -- not a bare array anymore: every list
// endpoint from THIS example onward wraps its rows with total/next.
type page struct { // => the Go twin of the Python Page dict -- items plus paging metadata
	Items []task `json:"items"` // => this page's rows -- exactly what ex-65 returned on its own
	Total int    `json:"total"` // => the FULL table's row count, independent of this page's size
	Next  *int   `json:"next"`  // => nil encodes as null: "no further page" -- a typed sentinel
}

// seedTasks builds the SAME deterministic 25-row dataset the Python
// pagination/filter/sort examples share -- 25 rows, so a 10-row page
// genuinely HAS a next page to point at.
func seedTasks() []task {
	statuses := []string{"todo", "in_progress", "done"} // => rotates every 3 rows: index i % 3
	priorities := []string{"low", "normal", "high"}     // => rotates every 2 via (i/2) % 3: decorrelated
	tasks := make([]task, 0, 25)                        // => pre-sized: exactly 25 rows, no regrowth
	for i := 1; i <= 25; i++ {                          // => ids 1..25 -- big enough for a real next link
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
// with the same ge=1 / ge=0 bounds FastAPI enforced in Python.
func parseLimitOffset(r *http.Request) (limit, offset int, errMsg string) {
	limit = 10                                        // => the default when ?limit= is absent entirely -- unchanged from ex-65
	offset = 0                                        // => the default start: the very first row
	if raw := r.URL.Query().Get("limit"); raw != "" { // => the caller said SOMETHING -- honour it
		n, err := strconv.Atoi(raw) // => "10" -> 10; "abc" -> an error, never a silent zero
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

// listTasks serves GET /tasks -- the page slice PLUS the metadata that
// lets a client walk the whole table without a second count request.
func listTasks(w http.ResponseWriter, r *http.Request) {
	limit, offset, errMsg := parseLimitOffset(r) // => one helper owns every validation rule
	if errMsg != "" {                            // => a bad ?limit=/?offset= never reaches the slice below
		writeError(w, http.StatusUnprocessableEntity, "validation_error", errMsg) // => 422, FastAPI parity
		return
	}
	total := len(tasks) // => the WHOLE table's size -- computed apart from the LIMIT, like COUNT(*)
	if offset > total { // => past the end: the window starts beyond the last row
		offset = total // => clamp so the slice below yields [] instead of panicking
	}
	end := offset + limit // => the exclusive upper bound of this page window
	if end > total {      // => the last page is shorter than limit -- genuinely the tail
		end = total // => clamp the upper bound the same way
	}
	nextOffset := offset + limit // => the offset a client would use for the FOLLOWING page
	var next *int                // => nil means "nothing more to fetch" -- encodes as JSON null
	if nextOffset < total {      // => a following page would return something only when under total
		next = &nextOffset // => an offset landing ON or past total leaves next as nil
	}
	writeJSON(w, http.StatusOK, page{ // => the envelope: same rows as ex-65, plus total/next
		Items: tasks[offset:end], // => this page's slice of rows
		Total: total,             // => the FULL count, letting a client compute "page 3 of N"
		Next:  next,              // => nil once the result set is exhausted -- check with != nil
	})
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router for this example's single route
	mux.HandleFunc("GET /tasks", listTasks)               // => a method pattern: other verbs 405 here too (see ex-75)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
