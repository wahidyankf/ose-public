// Example 35: A repository connected to SQLite.
//
// The Python track splits this in two files: repository.py owns EVERY
// database detail (connect, init_db, list_tasks) and app.py only ever calls
// it, never importing sqlite3 itself. The Go track ships one command per
// directory, so both layers live in this single main.go -- separated by the
// "repository layer" and "HTTP layer" sections below -- but the rule still
// holds: the HANDLER functions never write SQL themselves; every query string
// lives in the repository functions. database/sql is the stdlib pool plus a
// pure-Go driver (modernc.org/sqlite, no cgo); *sql.DB is safe to share,
// unlike Python's per-call sqlite3 connections.
//
// Try:
// go run . &
// / curl -s 127.0.0.1:8000/tasks
// => [{"id":1,"title":"Buy milk"},{"id":2,"title":"Walk dog"}]
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Query, Exec -- no driver of its own
	"encoding/json" // => the success body and the 500 envelope encode run through here
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the row shape every repository function below returns -- one struct,
// => JSON-tagged, instead of Python's sqlite3.Row-then-dict dance
type taskRow struct {
	ID    int    `json:"id"`    // => the AUTOINCREMENT primary key SQLite assigned
	Title string `json:"title"` // => the one data column this example's table carries
} // => the struct closes: the handler serializes exactly this shape

// => the stable envelope internal failures wear -- the list path has no
// => domain errors, so the only failure below is a 500 through this type
type errorDetail struct {
	Code    string `json:"code"`    // => stable, machine-matchable: "internal_error" below
	Message string `json:"message"` // => human-readable summary, never a raw driver string
} // => the inner object closes

// => errorEnvelope is the outer document: {"error": {...}}
type errorEnvelope struct {
	Error errorDetail `json:"error"` // => the ONE top-level key, matching ex-32's shape
} // => the envelope closes

// ---------------------------------------------------------------------------
// Repository layer -- every database detail lives in this section. The HTTP
// handlers below it call these functions and never write SQL themselves.
// ---------------------------------------------------------------------------

// => db is the shared pool: database/sql pools are safe for concurrent use,
// => so ONE handle serves every request -- the opposite of Python's per-call
// => sqlite3.connect(), and the reason nothing here opens per request
var db *sql.DB // => assigned once in initDB, read by every repository call after

// => initDB recreates the schema and seeds two starter rows, ONCE at startup
// => -- not per request. A stale file is deleted first, so every run is clean
// => and deterministic, exactly like the Python init_db.
func initDB() { // => one-shot setup: file, table, seed rows, in that order
	_ = os.Remove("tasks.db") // => delete any stale file first -- every run starts clean
	// => Remove ignores its error: a missing file is the normal first-run case

	var err error                                 // => the single error slot every setup step shares
	db, err = sql.Open("sqlite", "file:tasks.db") // => "sqlite" is the name the blank import registered; the DSN names the file
	if err != nil {                               // => Open validates the name, not the file itself
		log.Fatalf("open db: %v", err) // => fail FAST at startup, not on the first real request
	} // => the open-failure branch ends
	db.SetMaxOpenConns(1) // => one writer-friendly connection: SQLite files dislike concurrent writers
	// => the pool still serializes safely; this cap just skips busy-file retries

	if err := db.Ping(); err != nil { // => Ping actually dials the file -- Open alone never touches it
		log.Fatalf("ping db: %v", err) // => fail FAST: a bad path fails here, before ListenAndServe
	} // => the ping-failure branch ends

	_, err = db.Exec("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)") // => the exact DDL, once for the whole example
	if err != nil {                                                                                    // => AUTOINCREMENT: ids only ever go up, never reused
		log.Fatalf("create table: %v", err) // => without this table nothing below can run
	} // => the DDL branch ends

	_, err = db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Buy milk", "Walk dog") // => "?" binds each title as DATA, never as SQL syntax
	if err != nil {                                                                       // => two seed rows for listTasks to return
		log.Fatalf("seed tasks: %v", err) // => without this the list below is empty, not an error
	} // => the seed branch ends
} // => initDB ends: the file, the table, and two rows all exist now

// => listTasks is the ONLY function that runs a SELECT -- the handler below
// => never sees this query string, only the []taskRow it returns
func listTasks() ([]taskRow, error) { // => typed rows out, never raw driver values
	rows, err := db.Query("SELECT id, title FROM tasks ORDER BY id") // => no WHERE clause -- returns every row, oldest first
	if err != nil {                                                  // => the query itself failed to start
		return nil, err // => propagate: the handler decides the wire shape (a 500)
	} // => the query-failure branch ends
	defer rows.Close() // => releases the query's connection back to the pool when done
	// => deferred Close runs even on the scan-error return below

	var out []taskRow // => nil until the first Append -- encodes as null if unused, but rows exist here
	for rows.Next() { // => one pass per row, oldest id first
		var t taskRow                                      // => the typed target each row scans into
		if err := rows.Scan(&t.ID, &t.Title); err != nil { // => column order matches the SELECT list above
			return nil, err // => propagate: a corrupt row is a 500, not a skip
		} // => the scan-failure branch ends
		out = append(out, t) // => grow the typed slice one row at a time
	} // => the row loop ends
	if err := rows.Err(); err != nil { // => surfaces an error the loop itself swallowed mid-iteration
		return nil, err // => propagate, same 500 path as above
	} // => the iteration-error branch ends
	return out, nil // => success: every caller gets taskRow, never driver rows
} // => listTasks ends: connection lifetime is the pool's business, not shared state

// ---------------------------------------------------------------------------
// HTTP layer -- handlers call the repository above; no query string appears
// in any handler function below this line.
// ---------------------------------------------------------------------------

// => writeError is the internal-failure path: the list route has no domain
// => errors, so every failure below is a 500 through this one helper
func writeError(w http.ResponseWriter, status int, code, message string) { // => one function every failure travels through
	w.Header().Set("Content-Type", "application/json")                                       // => declares the body encoding to the client
	w.WriteHeader(status)                                                                    // => sends the status line and freezes the header map
	body, _ := json.Marshal(errorEnvelope{Error: errorDetail{Code: code, Message: message}}) // => the envelope, built by hand
	_, _ = w.Write(body)                                                                     // => one JSON document, written straight onto the wire
} // => writeError ends

// => writeJSON is the success path: status, headers, and body in four lines
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one shared success writer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => []taskRow encodes as a JSON array directly
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends

// => listTasksHandler is intentionally THIN: one repository call, one branch
// => for its error, one echo of its value -- every database detail stays
// => above the HTTP-layer line
func listTasksHandler(w http.ResponseWriter, r *http.Request) { // => co-08: a handler for listing tasks
	tasks, err := listTasks() // => co-14: the handler never writes SQL itself
	if err != nil {           // => the pool, the query, or a scan failed
		writeError(w, http.StatusInternalServerError, "internal_error", "could not list tasks") // => 500: no driver text leaks to the client
		return                                                                                  // => early return: the echo below only runs for a good read
	} // => the failure branch ends
	writeJSON(w, http.StatusOK, tasks) // => a JSON array of plain objects, one per row
} // => listTasksHandler ends

// => the routing table: one route, method-prefixed so only GET matches
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                      // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /tasks", listTasksHandler) // => co-08: GET returns the whole array
	return mux                                     // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => co-24: schema setup happens ONCE, before serving -- not per request
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
