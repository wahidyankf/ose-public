// Example 38: CRUD -- Read One.
//
// The "R" (singular) in CRUD: one GET endpoint backed by getTask(),
// returning a plain 404 when the id does not exist. The 404 here is
// deliberately PLAIN -- a bare status with no envelope -- matching the Python
// track's default HTTPException shape; ex-42 later upgrades the same missing
// case to the shared {"error": {code, message}} envelope, so the contrast is
// the lesson. Two rows are seeded so id 2 provably reads back.
//
// Try:
// curl -s 127.0.0.1:8000/tasks/2
// => {"id":2,"title":"Walk dog"} (seeded second)
// curl -i 127.0.0.1:8000/tasks/999
// => 404 with an empty body -- never seeded, plain default shape
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Exec, QueryRow -- no driver of its own
	"encoding/json" // => the found-row body encodes through here; the 404 carries no body
	"errors"        // => errors.Is: tests for sql.ErrNoRows without touching its text
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean
	"strconv"       // => the path segment is text until this converts it to an int

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the row shape the repository returns and the handler serializes as-is
type taskRow struct {
	ID    int    `json:"id"`    // => the AUTOINCREMENT primary key SQLite assigned
	Title string `json:"title"` // => the one data column
} // => the struct closes

// ---------------------------------------------------------------------------
// Repository layer -- every database detail lives in this section. The HTTP
// handler below calls getTask and never writes SQL itself.
// ---------------------------------------------------------------------------

// => db is the shared pool: safe for concurrent use, ONE handle per process
var db *sql.DB // => assigned once in initDB, read by every repository call after

// => initDB recreates the schema and seeds two starter rows, ONCE at startup
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
	if err != nil {                                                                                    // => AUTOINCREMENT: ids only ever go up, never reused
		log.Fatalf("create table: %v", err) // => without this table nothing below can run
	} // => the DDL branch ends

	_, err = db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Buy milk", "Walk dog") // => two seed rows: id 1 and id 2, in insertion order
	if err != nil {                                                                       // => one "?" per value, bound positionally
		log.Fatalf("seed tasks: %v", err) // => without seed rows the reads below 404
	} // => the seed branch ends
} // => initDB ends

// => getTask is the whole "R" (singular): one row by its path parameter, or
// => sql.ErrNoRows when nothing matches -- the handler decides what that
// => absence means (a plain 404 here; an envelope in ex-42)
func getTask(id int) (taskRow, error) { // => (row, error): the found row or the reason it is missing
	var t taskRow                                                                            // => the typed target the row scans into
	err := db.QueryRow("SELECT id, title FROM tasks WHERE id = ?", id).Scan(&t.ID, &t.Title) // => one placeholder, one bound value
	if err != nil {                                                                          // => either ErrNoRows (missing) or a genuine failure -- both propagate untouched
		return taskRow{}, err // => the handler tests for ErrNoRows with errors.Is
	} // => the lookup-failure branch ends
	return t, nil // => success: the row SQLite actually stored
} // => getTask ends: no HTTP vocabulary anywhere in this function

// ---------------------------------------------------------------------------
// HTTP layer -- the handler calls the repository above; no query string
// appears in any handler function below this line.
// ---------------------------------------------------------------------------

// => getTaskHandler is the "R" endpoint: parse the path, delegate the
// => SELECT, then make the ONLY branch this handler owns -- everything else
// => lives in the repository
func getTaskHandler(w http.ResponseWriter, r *http.Request) { // => co-12: a typed integer path parameter
	id, err := strconv.Atoi(r.PathValue("task_id")) // => hand-typed conversion: text -> int, as in ex-14
	if err != nil {                                 // => "/tasks/abc" fails HERE, inside your own handler
		w.WriteHeader(http.StatusBadRequest) // => 400: a failed conversion gets YOUR status, never an automatic 422
		return                               // => early return: nothing below runs on an unparseable id
	} // => the unparseable-id branch ends

	row, err := getTask(id) // => co-14: the handler delegates the SELECT
	if err != nil {         // => missing row or broken database -- which one?
		if errors.Is(err, sql.ErrNoRows) { // => the ONLY domain branch: the id simply does not exist
			w.WriteHeader(http.StatusNotFound) // => the PLAIN default 404 shape -- deliberately no envelope yet (ex-42 adds it)
			return                             // => mapped -- the echo below only runs for found rows
		} // => the missing-row branch ends
		w.WriteHeader(http.StatusInternalServerError) // => a genuinely broken read is a 500, never a leak
		return                                        // => defensive: seeded reads cannot actually produce one
	} // => the error branch ends

	w.Header().Set("Content-Type", "application/json") // => response header first...
	body, _ := json.Marshal(row)                       // => taskRow encodes as {"id":..,"title":..} directly
	_, _ = w.Write(body)                               // => ...onto the wire with the default 200 status
} // => getTaskHandler ends

// => the routing table: one route with a typed-by-convention path placeholder
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                              // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /tasks/{task_id}", getTaskHandler) // => co-12: {task_id} arrives as text; the handler types it
	return mux                                             // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, seeded tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
