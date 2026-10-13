// Example 36: Parameterized queries neutralize injection.
//
// The "?" PLACEHOLDER -- not an f-string, not fmt.Sprintf -- is what makes
// the search safe: SQLite binds the fragment as DATA, never as part of the
// SQL grammar itself, so it is structurally impossible for the fragment to
// inject a second statement. The Python track proves it by sending
// "'; DROP TABLE tasks; --" as ordinary data and counting the table intact
// afterwards; this example keeps the same search_by_title shape, the same
// LIKE-around-the-value pattern, and the same countTasks proof helper, with
// database/sql's "?" doing exactly what sqlite3's "?" did.
//
// Try:
// curl -s '127.0.0.1:8000/tasks/search?title=milk'
// => [{"id":1,"title":"Buy milk"}]
// curl -s "127.0.0.1:8000/tasks/search?title=';%20DROP%20TABLE%20tasks;%20--"
// => [] and the table still holds 2 rows -- the payload was never SQL
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Query, QueryRow -- no driver of its own
	"encoding/json" // => the success array and the 500 envelope encode run through here
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the row shape the search returns -- JSON-tagged, one struct per row
type taskRow struct {
	ID    int    `json:"id"`    // => the AUTOINCREMENT primary key SQLite assigned
	Title string `json:"title"` // => the searched column
} // => the struct closes

// => the stable envelope internal failures wear -- the search has no domain
// => errors (zero matches is a 200 with []), so failures are 500s only
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
// handler below calls these functions and never writes SQL itself.
// ---------------------------------------------------------------------------

// => db is the shared pool: safe for concurrent use, so ONE handle serves
// => every request -- nothing here opens a connection per call
var db *sql.DB // => assigned once in initDB, read by every repository call after

// => initDB recreates the schema and seeds two starter rows, ONCE at startup.
// => One row contains "milk", the other does not, so a normal substring
// => search provably matches exactly one of them.
func initDB() { // => one-shot setup: file, table, seed rows, in that order
	_ = os.Remove("tasks.db") // => delete any stale file first -- every run starts clean
	// => Remove ignores its error: a missing file is the normal first-run case

	var err error                                 // => the single error slot every setup step shares
	db, err = sql.Open("sqlite", "file:tasks.db") // => "sqlite" is the name the blank import registered
	if err != nil {                               // => Open validates the name, not the file itself
		log.Fatalf("open db: %v", err) // => fail FAST at startup, not on the first real request
	} // => the open-failure branch ends
	db.SetMaxOpenConns(1) // => one writer-friendly connection: SQLite files dislike concurrent writers

	if err := db.Ping(); err != nil { // => Ping actually dials the file -- Open alone never touches it
		log.Fatalf("ping db: %v", err) // => fail FAST before ListenAndServe
	} // => the ping-failure branch ends

	_, err = db.Exec("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)") // => the exact DDL
	if err != nil {                                                                                    // => AUTOINCREMENT: ids only ever go up
		log.Fatalf("create table: %v", err) // => without this table nothing below can run
	} // => the DDL branch ends

	_, err = db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Buy milk", "Walk dog") // => one "?" per value, bound positionally
	if err != nil {                                                                       // => "milk" appears in exactly one row
		log.Fatalf("seed tasks: %v", err) // => without seed rows the search below matches nothing
	} // => the seed branch ends
} // => initDB ends

// => searchByTitle runs a substring search over "title". The "?" PLACEHOLDER,
// => not string concatenation, is the entire safety property: the fragment --
// => even "'; DROP TABLE tasks; --" -- arrives as DATA, never as grammar.
// => Wildcards are built around the BOUND value, not around SQL text.
func searchByTitle(fragment string) ([]taskRow, error) { // => zero or more matches, never a raised SQL error
	rows, err := db.Query("SELECT id, title FROM tasks WHERE title LIKE ? ORDER BY id", "%"+fragment+"%") // => the one "?" placeholder; LIKE with wildcards around the value
	if err != nil {                                                                                       // => the query itself failed to start
		return nil, err // => propagate: the handler decides the wire shape (a 500)
	} // => the query-failure branch ends
	defer rows.Close() // => releases the query's connection back to the pool when done

	var out []taskRow // => nil until the first Append; encodes as null -- normalized below
	for rows.Next() { // => one pass per matching row, oldest id first
		var t taskRow                                      // => the typed target each row scans into
		if err := rows.Scan(&t.ID, &t.Title); err != nil { // => column order matches the SELECT list above
			return nil, err // => propagate: a corrupt row is a 500, not a skip
		} // => the scan-failure branch ends
		out = append(out, t) // => grow the typed slice one row at a time
	} // => the row loop ends
	if err := rows.Err(); err != nil { // => surfaces an error the loop itself swallowed mid-iteration
		return nil, err // => propagate, same 500 path as above
	} // => the iteration-error branch ends
	if out == nil { // => normalize nil to [] so the wire shape is always an ARRAY, never null
		out = []taskRow{} // => zero matches is a 200 with [], not a 404 and not null
	} // => the empty-result branch ends
	return out, nil // => success: possibly empty, never an error for attacker input
} // => searchByTitle ends: no f-string, no Sprintf, one bound parameter

// => countTasks is used only to PROVE the table survived an injection attempt
// => intact: it counts every row with no WHERE clause, like the Python helper
func countTasks() (int, error) { // => a single integer out, for the operator -- not exposed over HTTP here
	var n int                                                                  // => COUNT(*) always returns exactly one row with one column
	if err := db.QueryRow("SELECT COUNT(*) FROM tasks").Scan(&n); err != nil { // => QueryRow: the one-row shortcut, no Close needed
		return 0, err // => propagate: a broken table is a 500 upstream
	} // => the count-failure branch ends
	return n, nil // => 2 after any injection attempt -- the table is untouched (co-20)
} // => countTasks ends

// ---------------------------------------------------------------------------
// HTTP layer -- the handler calls the repository above; no query string
// appears in any handler function below this line.
// ---------------------------------------------------------------------------

// => writeError is the internal-failure path: attacker input never causes it,
// => only a genuinely broken database does
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

// => searchHandler is intentionally THIN: read the query param, delegate the
// => SELECT, echo the array. The "?" placeholder inside the repository does
// => the escaping -- this function does none, because none is needed.
func searchHandler(w http.ResponseWriter, r *http.Request) { // => co-12: a typed query parameter
	fragment := r.URL.Query().Get("title") // => "title" is really a SEARCH FRAGMENT, possibly attacker text
	// => Get returns "" when absent: an empty fragment matches every row via %%,
	// => which is a defined (if broad) answer, not an error -- same as Python's LIKE "%%"

	tasks, err := searchByTitle(fragment) // => co-14: the "?" placeholder does the escaping, inside the repository
	if err != nil {                       // => the pool, the query, or a scan failed
		writeError(w, http.StatusInternalServerError, "internal_error", "could not search tasks") // => 500: no driver text leaks to the client
		return                                                                                    // => early return: the echo below only runs for a good read
	} // => the failure branch ends
	writeJSON(w, http.StatusOK, tasks) // => zero matches is 200 with [] -- the payload was never SQL (co-14)
} // => searchHandler ends: no SQL error is possible for ANY fragment value

// => the routing table: one route, method-prefixed so only GET matches
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                          // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /tasks/search", searchHandler) // => co-12: ?title= is the search fragment
	return mux                                         // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, deterministic tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
