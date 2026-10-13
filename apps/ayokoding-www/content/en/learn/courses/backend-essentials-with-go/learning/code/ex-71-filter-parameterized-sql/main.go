// Example 71: Filter with parameterized SQL -- an injection attempt is neutralized.
//
// Every pagination/filter example in this topic ALREADY parameterizes its
// SQL; this is the one that proves WHY, by showing the vulnerable
// alternative. GET /tasks?status= (required) runs ONLY the SAFE,
// parameterized query: a classic tautology payload like
// `done' OR '1'='1` is bound as DATA and matches no row, so the route
// answers []. The VULNERABLE twin below exists purely as a teaching
// contrast -- it is reachable from Go code, never from any HTTP route.
//
// This example needs REAL SQL (that is the whole point), so it uses
// database/sql plus modernc.org/sqlite -- a pure-Go driver, no CGO --
// pinned in go.mod. The other dirs in this batch stay dependency-free.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/tasks?status=done" # 8 rows -- a legitimate value still filters
//	curl --get --data-urlencode "status=done' OR '1'='1" http://127.0.0.1:8000/tasks # [] -- SAFE
package main

import (
	"database/sql"  // => the stdlib query surface -- the driver itself comes from modernc below
	"encoding/json" // => encodes the filtered array and the 422 envelope below
	"fmt"           // => Sprintf builds the zero-padded seed day AND the vulnerable query
	"log"           // => Fatal turns startup failures into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, handlers, status codes
	"os"            // => Remove resets the demo file so every run starts deterministic

	_ "modernc.org/sqlite" // => pure-Go SQLite driver, no CGO -- the ONLY non-stdlib import in this batch
)

// dbPath is the one on-disk SQLite file for this example directory --
// never shared with any other example, keeping each self-contained. It is
// created at RUNTIME when the server starts (like the Python twin's
// tasks.db); nothing is committed to the content tree.
const dbPath = "tasks.db" // => relative to the working directory: run from this example's dir

// schema backs every list query in this example: id, title, two filterable
// fields, and one sortable field -- the same five columns as ex-65.
const schema = `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    created_at TEXT NOT NULL
);` // => AUTOINCREMENT ids run 1..25, matching the in-memory examples' ids

// task is the one row shape every list response in this file returns.
type task struct { // => the Go twin of the Python TaskRow dict -- one struct, five columns
	ID        int    `json:"id"`         // => matches the INTEGER PRIMARY KEY column
	Title     string `json:"title"`      // => "task <i>", the human-readable display text
	Status    string `json:"status"`     // => THIS example's filter field -- rotates every 3 rows
	Priority  string `json:"priority"`   // => rotates low/normal/high -- decorrelated on purpose
	CreatedAt string `json:"created_at"` // => "2026-07-<i>T00:00:00" -- sorted on in ex-72/73
}

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

// initDB recreates the demo file from scratch, then seeds the SAME
// deterministic 25-row dataset the in-memory examples share.
func initDB(db *sql.DB) error {
	if _, err := db.Exec(schema); err != nil { // => creates the table every query below depends on
		return err // => without the table nothing else in this file can run -- fail loudly
	}
	statuses := []string{"todo", "in_progress", "done"} // => rotates every 3 rows: index i % 3
	priorities := []string{"low", "normal", "high"}     // => rotates every 2 via (i/2) % 3: decorrelated
	for i := 1; i <= 25; i++ {                          // => ids 1..25 -- done at {2,5,8,11,14,17,20,23}
		_, err := db.Exec( // => a single-row INSERT, parameterized like every write in this topic
			"INSERT INTO tasks (title, status, priority, created_at) VALUES (?, ?, ?, ?)", // => ? placeholders
			fmt.Sprintf("task %d", i),               // => "task 1" .. "task 25"
			statuses[i%3],                           // => done exactly where i % 3 == 2
			priorities[(i/2)%3],                     // => integer divide first, then mod 3
			fmt.Sprintf("2026-07-%02dT00:00:00", i), // => zero-padded day, rising with id
		)
		if err != nil { // => a failed seed row means the dataset is NOT the promised 25 -- stop
			return err // => propagate with context added by the caller in main
		}
	}
	return nil // => schema plus 25 rows committed -- every curl below sees the same dataset
}

// scanTasks drains rows into the shared []task shape -- one helper so the
// safe and unsafe paths below cannot drift apart in what they return.
func scanTasks(rows *sql.Rows) ([]task, error) {
	matched := []task{} // => non-nil empty: encodes as [] (not null) when nothing matches
	for rows.Next() {   // => one iteration per returned row -- zero iterations is a valid empty page
		var t task                                                                               // => the zero-value target each row scans into
		if err := rows.Scan(&t.ID, &t.Title, &t.Status, &t.Priority, &t.CreatedAt); err != nil { // => column order matches the SELECT
			return nil, err // => a scan failure mid-stream invalidates the whole page -- fail loudly
		}
		matched = append(matched, t) // => keep every row the query qualified
	}
	return matched, rows.Err() // => rows.Err reports an error the loop itself swallowed, if any
}

// listTasksSafe is the SAFE, parameterized version -- the ONLY function the
// route below calls. The value is bound as a PARAMETER, never concatenated
// into the SQL text: SQLite receives it as DATA, never as grammar.
func listTasksSafe(db *sql.DB, status string) ([]task, error) {
	rows, err := db.Query( // => the ? placeholder keeps the value OUT of the SQL grammar entirely
		"SELECT id, title, status, priority, created_at FROM tasks WHERE status = ? ORDER BY id",
		status, // => an injection payload here is one opaque STRING being compared -- inert by construction
	)
	if err != nil { // => a query failure (not an empty result) -- the caller turns this into a 500
		return nil, err // => propagate: the handler, not the repository, decides the HTTP status
	}
	defer rows.Close()     // => released on every return path -- never leak a cursor on success OR failure
	return scanTasks(rows) // => drained into []task -- [] when no row's status equals the payload
}

// listTasksUnsafeForDemoOnly is the VULNERABLE version -- it exists ONLY as
// a teaching contrast, is NEVER called by any route, and must never be
// copied into real code. It string-BUILDS the SQL text itself, so SQLite
// parses whatever the caller embedded as live grammar.
func listTasksUnsafeForDemoOnly(db *sql.DB, status string) ([]task, error) {
	query := fmt.Sprintf( // => DELIBERATELY interpolated -- shown ONLY to prove what ? prevents
		"SELECT id, title, status, priority, created_at FROM tasks WHERE status = '%s' ORDER BY id",
		status, // => a payload closing the quote early REWRITES the query -- the exact bug
	)
	rows, err := db.Query(query) // => SQLite parses the EMBEDDED text as SQL -- too late to be data
	if err != nil {              // => even the vulnerable path can fail to run -- propagate alike
		return nil, err // => same error contract as the safe twin, so the contrast is only about ROWS
	}
	defer rows.Close()     // => same cleanup discipline -- the lesson is the query text, not the plumbing
	return scanTasks(rows) // => ALL 25 rows for `done' OR '1'='1` -- the tautology genuinely leaks everything
}

// getTasks serves GET /tasks -- ?status= is required (no default), and it
// ALWAYS travels the SAFE path: the unsafe twin is unreachable from HTTP.
func getTasks(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		status := r.URL.Query().Get("status") // => "" when absent -- but absent is a 422 here, not "all"
		if status == "" {                     // => required, no default: omitting ?status= is a client error
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "status is required") // => 422, FastAPI Query(...) parity
			return
		}
		found, err := listTasksSafe(db, status) // => the SAFE call -- the ONLY repository call on this path
		if err != nil {                         // => the DB itself failed -- not the caller's fault
			writeError(w, http.StatusInternalServerError, "internal_error", "could not list tasks") // => 500, generic
			return
		}
		writeJSON(w, http.StatusOK, found) // => [] for the injection string -- neutralized, still 200
	}
}

func main() {
	if err := os.Remove(dbPath); err != nil && !os.IsNotExist(err) { // => start deterministic; missing file is fine
		log.Fatal(err) // => a real removal failure (permissions) means the seed below would lie -- stop
	}
	db, err := sql.Open("sqlite", dbPath) // => the modernc driver name -- pure Go, no CGO involved
	if err != nil {                       // => Open validates the driver name, not the file -- rarely fails
		log.Fatal(err) // => without a handle nothing else in this file can run
	}
	defer db.Close()                   // => released when the server finally exits -- the process's one handle
	if err := initDB(db); err != nil { // => fresh schema plus the 25-row seed, every single run
		log.Fatal(err) // => a half-seeded table would silently break every worked example id -- stop
	}
	mux := http.NewServeMux()                             // => one explicit router for this example's single route
	mux.HandleFunc("GET /tasks", getTasks(db))            // => the ONLY route uses the SAFE function -- by construction
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
