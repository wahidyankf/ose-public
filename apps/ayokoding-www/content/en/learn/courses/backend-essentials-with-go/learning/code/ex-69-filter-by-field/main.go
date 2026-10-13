// Example 69: Filter by Field -- ?status=done narrows the list.
//
// Ex-65's endpoint only paged; this one adds a NARROWING dimension: a
// caller controls WHICH rows qualify, not just how many come back. Absent
// ?status= means "no filter" (all 25 rows); status=done matches exactly the
// 8 seeded rows at ids {2,5,8,11,14,17,20,23}; an unknown value matches
// nothing and degrades to [] -- never an error. Same in-memory 25-row table
// as ex-65 -- stdlib only, zero setup.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/tasks"              # all 25 -- the unfiltered baseline
//	curl "http://127.0.0.1:8000/tasks?status=done" # 8 rows, ids 2,5,8,11,14,17,20,23
//	curl "http://127.0.0.1:8000/tasks?status=archived" # [] -- matches nothing, still 200
package main

import (
	"encoding/json" // => encodes the filtered array -- one codec, every response
	"fmt"           // => Sprintf builds the zero-padded created_at day below
	"log"           // => Fatal turns a bind failure into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, handlers, status codes
	"strconv"       // => Itoa builds the "task <i>" titles below
)

// task is the one row shape every list response in this file returns.
type task struct { // => the Go twin of the Python TaskRow dict -- one struct, five columns
	ID        int    `json:"id"`         // => the stable, 1-based position -- ORDER BY id in Python
	Title     string `json:"title"`      // => "task <i>", the human-readable display text
	Status    string `json:"status"`     // => THIS example's filter field -- rotates every 3 rows
	Priority  string `json:"priority"`   // => rotates low/normal/high -- decorrelated on purpose
	CreatedAt string `json:"created_at"` // => "2026-07-<i>T00:00:00" -- sorted on from ex-72
}

// seedTasks builds the SAME deterministic 25-row dataset the Python
// filter examples share -- status=done matches ids {2,5,8,11,14,17,20,23}
// (8 of 25: count i % 3 == 2 for i in 1..25, since "done" sits at index 2).
func seedTasks() []task {
	statuses := []string{"todo", "in_progress", "done"} // => rotates every 3 rows: index i % 3
	priorities := []string{"low", "normal", "high"}     // => rotates every 2 via (i/2) % 3: decorrelated
	tasks := make([]task, 0, 25)                        // => pre-sized: exactly 25 rows, no regrowth
	for i := 1; i <= 25; i++ {                          // => ids 1..25 -- the filter's whole universe
		tasks = append(tasks, task{ // => one row per pass, fields in schema order
			ID:        i,                                       // => 1-based, matching SQLite AUTOINCREMENT
			Title:     "task " + strconv.Itoa(i),               // => "task 1" .. "task 25"
			Status:    statuses[i%3],                           // => THIS field's rotation is what makes counts checkable
			Priority:  priorities[(i/2)%3],                     // => integer divide first, then mod 3
			CreatedAt: fmt.Sprintf("2026-07-%02dT00:00:00", i), // => zero-padded day, rising with id
		})
	}
	return tasks // => already in id order -- the Go twin of ORDER BY id
}

// tasks is the full table this example filters -- in memory, read-only
// after startup, so handlers need no lock: nothing ever mutates it.
var tasks = seedTasks() // => seeded once at process start, like Python's import-time init_db

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")      // => the stdlib never sets this for you
	w.WriteHeader(status)                                   // => the status line goes out before the body
	if err := json.NewEncoder(w).Encode(body); err != nil { // => streams the encoding straight to the wire
		log.Printf("encode response: %v", err) // => headers already sent: only loggable now
	}
}

// filterTasks is the repository function: it owns 100% of the narrowing
// logic -- the handler below holds none. An empty status means "no filter
// at all"; any other value means "narrow to exactly this".
func filterTasks(status string) []task {
	if status == "" { // => no filter -- the FULL 25-row table, like ex-65's unfiltered query
		return tasks // => shared backing array is fine: callers only ever read it
	}
	matched := []task{}       // => non-nil empty: encodes as [] (not null) when nothing matches
	for _, t := range tasks { // => a linear scan -- the in-memory twin of WHERE status = ?
		if t.Status == status { // => exact match: a crafted value is just a string that matches nothing
			matched = append(matched, t) // => keep only the rows that genuinely qualify
		}
	}
	return matched // => 8 rows for "done", [] for a value no row holds
}

// listTasks serves GET /tasks -- one optional filter query param.
func listTasks(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")            // => "" when absent: NO validation, any string is accepted
	writeJSON(w, http.StatusOK, filterTasks(status)) // => the handler holds no logic -- it delegates
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router for this example's single route
	mux.HandleFunc("GET /tasks", listTasks)               // => a method pattern: other verbs 405 here too (see ex-75)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
