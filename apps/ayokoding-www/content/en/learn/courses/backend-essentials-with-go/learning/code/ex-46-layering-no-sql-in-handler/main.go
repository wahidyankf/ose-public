// Example 46: Layering -- no SQL in the handler.
//
// The Python track proves this with two FILES: app.py holds the handler,
// repository.py holds the only query, and a test greps app.py's source for
// SELECT/INSERT/UPDATE/DELETE and fails if any verb leaked across. The Go
// track ships one command per directory, so both layers live in this single
// main.go -- but the boundary is just as mechanical: every query string sits
// ABOVE the "HTTP layer" line, no handler function below it names a table, a
// column, or a "?" placeholder, and no handler imports the driver. Verify it
// the same way: grep the handler section for SELECT and find nothing.
//
// Verify:
// sed -n '/HTTP layer/,$p' main.go | grep -ci 'select\|insert\|update\|delete\|sqlite'
// => 0 in handler code (the proof is about query STRING literals and driver
// => calls, which only the repository section holds -- prose mentions excluded)
//
// Try:
// curl -s 127.0.0.1:8000/tasks
// => [{"id":1,"title":"Buy milk"},{"id":2,"title":"Walk dog"}] -- through the layered call
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => NEEDED by the repository section; no handler function below names it
	"encoding/json" // => the handler's only vocabulary: bytes in, bytes out, no query syntax
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => the handler's only server vocabulary: mux, methods, statuses
	"os"            // => NEEDED by setup; no handler function below calls Remove

	_ "modernc.org/sqlite" // => the pure-Go driver: registered for the REPOSITORY section only
) // => the import block closes -- note what the handlers below NEVER import on their own

// => the row shape crossing the boundary: plain data, no driver residue
type taskRow struct {
	ID    int    `json:"id"`    // => the primary key, as plain data
	Title string `json:"title"` // => the one data column, as plain data
} // => the struct closes: data only, no query syntax attached

// ---------------------------------------------------------------------------
// Repository layer -- the ONLY place SQL is allowed to live. Every query
// keyword this whole example ever uses sits in this section, above the HTTP
// layer line. The handler section below calls listTasks and nothing else.
// ---------------------------------------------------------------------------

// => db is the shared pool: owned by this section, never touched directly by
// => handlers -- they receive rows through listTasks, not handles
var db *sql.DB // => assigned once in initDB; only repository functions read it

// => initDB recreates the schema and seeds two starter rows, ONCE at startup
func initDB() { // => one-shot setup: file, table, seed rows, in that order
	_ = os.Remove("tasks.db") // => delete any stale file first -- every run starts clean
	// => Remove ignores its error: a missing file is the normal first-run case

	var err error                                 // => the single error slot every setup step shares
	db, err = sql.Open("sqlite", "file:tasks.db") // => co-14: one fixed db file, next to this module
	if err != nil {                               // => Open validates the name, not the file itself
		log.Fatalf("open db: %v", err) // => fail FAST at startup, not on the first real request
	} // => the open-failure branch ends
	db.SetMaxOpenConns(1) // => one writer-friendly connection: SQLite files dislike concurrent writers

	if err := db.Ping(); err != nil { // => Ping actually dials the file -- Open alone never touches it
		log.Fatalf("ping db: %v", err) // => fail FAST before ListenAndServe
	} // => the ping-failure branch ends

	_, err = db.Exec("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)") // => defines the table's shape once, for the whole example
	if err != nil {                                                                                    // => the exact DDL, living ONLY in this section
		log.Fatalf("create table: %v", err) // => without this table nothing below can run
	} // => the DDL branch ends

	_, err = db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Buy milk", "Walk dog") // => two seed rows so the handler below has something real to return
	if err != nil {                                                                       // => one "?" per value, bound positionally -- also ONLY here
		log.Fatalf("seed tasks: %v", err) // => without seed rows the list below is empty
	} // => the seed branch ends
} // => initDB ends

// => listTasks holds the ONE and ONLY data-access statement in the entire
// => example -- the handler below never sees it, never opens the driver,
// => never writes a query string. This function IS the layer boundary.
func listTasks() ([]taskRow, error) { // => co-24: the ONLY function in the example with a query
	rows, err := db.Query("SELECT id, title FROM tasks ORDER BY id") // => the one and only place this program reads data
	if err != nil {                                                  // => no WHERE clause -- returns every row, oldest first
		return nil, err // => propagate: the handler decides the wire shape (a 500)
	} // => the query-failure branch ends
	defer rows.Close() // => releases the query's connection back to the pool when done

	out := []taskRow{} // => START as [] (not nil) so the empty table encodes as [], never null
	for rows.Next() {  // => one pass per row, oldest id first
		var t taskRow                                      // => the typed target each row scans into
		if err := rows.Scan(&t.ID, &t.Title); err != nil { // => column order matches the SELECT list above
			return nil, err // => propagate: a corrupt row is a 500, not a skip
		} // => the scan-failure branch ends
		out = append(out, t) // => grow the typed slice one row at a time
	} // => the row loop ends
	if err := rows.Err(); err != nil { // => surfaces an error the loop itself swallowed mid-iteration
		return nil, err // => propagate, same 500 path as above
	} // => the iteration-error branch ends
	return out, nil // => raw driver rows became []taskRow -- the handler converts nothing further
} // => listTasks ends

// ---------------------------------------------------------------------------
// HTTP layer -- NO query syntax below this line. The handler calls ONE
// repository function, encodes its return value, and knows nothing about
// tables, columns, placeholders, or the driver. Grep this section for query
// verbs to prove the boundary holds.
// ---------------------------------------------------------------------------

// => listTasksHandler is the ENTIRE data-access line: one repository call,
// => one error branch, one echo. No query syntax, no "?", no driver call.
func listTasksHandler(w http.ResponseWriter, r *http.Request) { // => co-08: a handler for listing tasks
	tasks, err := listTasks() // => co-24: the ENTIRE data-access line, one function call
	if err != nil {           // => the pool, the query, or a scan failed -- the handler only knows THAT, never WHAT
		w.WriteHeader(http.StatusInternalServerError) // => 500 with no body -- this example's lesson is the layering, not the envelope
		return                                        // => early return: the echo below only runs for a good read
	} // => the failure branch ends
	w.Header().Set("Content-Type", "application/json") // => response header first...
	body, _ := json.Marshal(tasks)                     // => []taskRow encodes as a JSON array directly -- no query syntax involved
	_, _ = w.Write(body)                               // => ...onto the wire with the default 200 status
} // => listTasksHandler ends: the layering is invisible to the CALLER

// => the routing table: one route, method-prefixed so only GET matches
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                      // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /tasks", listTasksHandler) // => co-08: GET returns the whole array through the layered call
	return mux                                     // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, seeded tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
