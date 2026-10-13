// Example 70: Filter Multiple -- ?status=done&priority=high combine with AND.
//
// Two INDEPENDENT optional filters, AND-combined when both are present.
// This is exactly WHY the seed decorrelates status from priority: the two
// filters only prove something new when their intersection (4 rows at ids
// {5,11,17,23}) is smaller than either alone (8 each). Same in-memory
// 25-row table as ex-65 -- stdlib only, zero setup.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/tasks?status=done"                  # 8 rows -- the ex-69 baseline
//	curl "http://127.0.0.1:8000/tasks?status=done&priority=high"    # 4 rows: ids 5,11,17,23
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
	Status    string `json:"status"`     // => first filterable field -- rotates every 3 rows
	Priority  string `json:"priority"`   // => SECOND filterable field -- rotates every 2 rows
	CreatedAt string `json:"created_at"` // => "2026-07-<i>T00:00:00" -- sorted on from ex-72
}

// seedTasks builds the SAME deterministic 25-row dataset the Python
// filter examples share -- done={2,5,8,11,14,17,20,23} and
// high={4,5,10,11,16,17,22,23}, intersecting at {5,11,17,23}.
func seedTasks() []task {
	statuses := []string{"todo", "in_progress", "done"} // => rotates every 3 rows: index i % 3
	priorities := []string{"low", "normal", "high"}     // => rotates every 2 via (i/2) % 3: decorrelated
	tasks := make([]task, 0, 25)                        // => pre-sized: exactly 25 rows, no regrowth
	for i := 1; i <= 25; i++ {                          // => ids 1..25 -- the filters' whole universe
		tasks = append(tasks, task{ // => one row per pass, fields in schema order
			ID:        i,                                       // => 1-based, matching SQLite AUTOINCREMENT
			Title:     "task " + strconv.Itoa(i),               // => "task 1" .. "task 25"
			Status:    statuses[i%3],                           // => done exactly where i % 3 == 2
			Priority:  priorities[(i/2)%3],                     // => DECORRELATED: the intersection stays smaller
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

// filterTasks is the repository function: TWO independent filters, each
// optional on its own, AND-combined when both are present. An empty value
// for either means "that dimension does not narrow at all".
func filterTasks(status, priority string) []task {
	matched := []task{}       // => non-nil empty: encodes as [] (not null) when nothing matches
	for _, t := range tasks { // => one pass over the table -- the in-memory twin of WHERE..AND..
		if status != "" && t.Status != status { // => opt-in: omitting ?status= skips this test fully
			continue // => this row fails the first dimension -- drop it, check the next row
		}
		if priority != "" && t.Priority != priority { // => independently opt-in -- stands alone or combines
			continue // => this row fails the second dimension -- drop it the same way
		}
		matched = append(matched, t) // => survived every ACTIVE filter -- genuinely in the intersection
	}
	return matched // => 4 rows for done+high -- strictly smaller than either filter alone
}

// listTasks serves GET /tasks -- two independently optional filters.
func listTasks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()                                     // => parsed once, read twice -- no validation on either
	status := query.Get("status")                              // => "" when absent: that dimension simply does not narrow
	priority := query.Get("priority")                          // => "" when absent: same opt-in rule, second dimension
	writeJSON(w, http.StatusOK, filterTasks(status, priority)) // => the handler holds no logic -- it delegates
}

func main() {
	mux := http.NewServeMux()                             // => one explicit router for this example's single route
	mux.HandleFunc("GET /tasks", listTasks)               // => a method pattern: other verbs 405 here too (see ex-75)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
