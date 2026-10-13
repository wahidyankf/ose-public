// Example 41: CRUD -- Delete.
//
// The "D" in CRUD: one DELETE endpoint backed by deleteTask(), which reports
// back whether a row actually existed via the exec result's RowsAffected --
// the same gated-on-rowcount shape as updateTask in ex-40. Success is 204
// with NO body (co-03); a missing id is the deliberately PLAIN default 404,
// matching the Python track's HTTPException shape -- ex-42 later upgrades
// this same case to the shared envelope. Two rows are seeded so id 2
// provably disappears.
//
// Try:
// curl -i -X DELETE 127.0.0.1:8000/tasks/1
// => 204 with no body -- the row existed and is now gone
// curl -i 127.0.0.1:8000/tasks/1
// => 404 afterwards only if a GET route existed; here DELETE itself proves it:
// curl -i -X DELETE 127.0.0.1:8000/tasks/999
// => 404, plain default shape -- never existed in the first place
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql" // => the stdlib pool: Open, Exec, QueryRow -- no driver of its own
	"log"          // => fail-fast startup lines + fatal-on-listen
	"net/http"     // => server, mux, statuses -- the 204 path writes a bare status, no JSON
	"os"           // => Remove: delete any stale db file so every run starts clean
	"strconv"      // => the path segment is text until this converts it to an int

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// ---------------------------------------------------------------------------
// Repository layer -- every database detail lives in this section. The HTTP
// handler below calls deleteTask and never writes SQL itself.
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

	_, err = db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Buy milk", "Walk dog") // => two seed rows: id 1 and id 2, both about to be deleted
	if err != nil {                                                                       // => one "?" per value, bound positionally
		log.Fatalf("seed tasks: %v", err) // => without seed rows the delete below 404s
	} // => the seed branch ends
} // => initDB ends

// => deleteTask runs one DELETE and reports back via RowsAffected whether a
// => row actually existed -- gated on rowcount, the same shape as updateTask
func deleteTask(id int) (bool, error) { // => (removed, error): removed is false when nothing matched
	res, err := db.Exec("DELETE FROM tasks WHERE id = ?", id) // => "?" binds the id as DATA, never as literal SQL text
	if err != nil {                                           // => co-14: parameterized -- never string-formatted
		return false, err // => propagate: the handler decides the wire shape (a 500)
	} // => the exec-failure branch ends
	n, err := res.RowsAffected() // => how many rows this statement touched -- the whole removed signal
	if err != nil {              // => the driver could not report the count
		return false, err // => propagate, same 500 path as above
	} // => the count-failure branch ends
	return n > 0, nil // => true when the id existed, false when it never did
} // => deleteTask ends: without Exec's commit the deletion would never reach the file

// => getTaskCount is used only to PROVE the row is genuinely gone: it counts
// => rows with the given id -- 0 means deleted, 1 means still present
func getTaskCount(id int) (int, error) { // => a single integer out, for the operator
	var n int                                                                  // => COUNT(*) always returns exactly one row with one column
	err := db.QueryRow("SELECT COUNT(*) FROM tasks WHERE id = ?", id).Scan(&n) // => co-14: same parameterized pattern throughout
	if err != nil {                                                            // => a genuinely broken read -- both propagate
		return 0, err // => the handler turns this into a 500
	} // => the count-failure branch ends
	return n, nil // => 0 once the row is deleted, 1 while it exists
} // => getTaskCount ends

// ---------------------------------------------------------------------------
// HTTP layer -- the handler calls the repository above; no query string
// appears in any handler function below this line.
// ---------------------------------------------------------------------------

// => deleteTaskHandler is the "D" endpoint: type the path, delegate the
// => DELETE, then answer the ONLY branch this handler owns -- everything else
// => lives in the repository
func deleteTaskHandler(w http.ResponseWriter, r *http.Request) { // => task_id arrives already parsed as text, typed below
	id, err := strconv.Atoi(r.PathValue("task_id")) // => hand-typed conversion: text -> int, as in ex-14 (co-12)
	if err != nil {                                 // => "/tasks/abc" fails HERE, inside your own handler
		w.WriteHeader(http.StatusBadRequest) // => 400: a failed conversion gets YOUR status, never an automatic 422
		return                               // => early return: nothing below runs on an unparseable id
	} // => the unparseable-id branch ends

	removed, err := deleteTask(id) // => co-14: delegates the DELETE
	if err != nil {                // => the pool or the write failed
		w.WriteHeader(http.StatusInternalServerError) // => 500 with no body -- the delete path carries no JSON at all
		return                                        // => early return: nothing was provably removed
	} // => the write-failure branch ends
	if !removed { // => the ONLY domain branch: rowcount was 0, nothing matched
		w.WriteHeader(http.StatusNotFound) // => the PLAIN default 404 shape -- distinguishes "gone" from "never existed" only by status (ex-42 adds the envelope)
		return                             // => mapped -- the 204 below only runs for a real removal
	} // => the missing-id branch ends
	w.WriteHeader(http.StatusNoContent) // => co-03: 204 -- success, no body
} // => deleteTaskHandler ends: 204 carries no body, 404 carries no envelope yet

// => the routing table: one route with a typed-by-convention path placeholder
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                                    // => the routing table: exactly one route in this example
	mux.HandleFunc("DELETE /tasks/{task_id}", deleteTaskHandler) // => co-03: DELETE removes, 204 answers
	return mux                                                   // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, seeded tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
