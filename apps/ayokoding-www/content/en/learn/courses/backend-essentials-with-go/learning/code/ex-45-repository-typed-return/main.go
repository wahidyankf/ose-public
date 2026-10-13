// Example 45: A repository that returns typed rows.
//
// The Python track defines TaskRow = TypedDict(id: int, title: str) so
// pyright checks the SAME contract on both sides of the repository boundary:
// the repository returns TaskRow (never a bare dict or raw sqlite3.Row), and
// the handler's own signature names TaskRow too. Go gets this contract from
// the compiler for free: the struct below IS the shape -- listTasks returns
// []taskRow, the handler names []taskRow in its own locals, and a trivial
// computation over row.Title only compiles if the field really exists with a
// string type. The ONE conversion point is the Scan call: raw columns become
// the typed struct there, and nowhere else.
//
// Try:
// curl -s 127.0.0.1:8000/tasks
// => [{"id":1,"title":"Buy milk"},{"id":2,"title":"Walk dog"}]
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Exec, Query -- no driver of its own
	"encoding/json" // => the typed array encodes through here -- structs serialize like dicts
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => TaskRow is the precise, compiler-checked shape -- the Go spelling of the
// => Python TypedDict: a missing or mistyped field fails at BUILD time here,
// => at edit time there. Both sides of the boundary name exactly this type.
type TaskRow struct {
	ID    int    `json:"id"`    // => the compiler flags a missing or mistyped "id" at build time
	Title string `json:"title"` // => the compiler flags row.MissingKey the moment it is written
} // => the struct closes: co-24, the typed contract both sides share

// ---------------------------------------------------------------------------
// Repository layer -- every function below returns TaskRow, never a bare map
// or a raw driver row. The handler trusts that type inward.
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
	if err != nil {                                                                                    // => defines the table's shape once, for the whole example
		log.Fatalf("create table: %v", err) // => without this table nothing below can run
	} // => the DDL branch ends

	_, err = db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Buy milk", "Walk dog") // => two seed rows so listTasks below has something real to return
	if err != nil {                                                                       // => one "?" per value, bound positionally
		log.Fatalf("seed tasks: %v", err) // => without seed rows the typed list below is empty
	} // => the seed branch ends
} // => initDB ends

// => toTaskRow is the ONE conversion point in this module: raw columns in,
// => typed TaskRow out -- every caller below receives TaskRow, never driver
// => values. Explicit field construction keeps the compiler checking it.
func toTaskRow(id int, title string) TaskRow { // => co-14: the ONE place raw data becomes the typed shape
	return TaskRow{ID: id, Title: title} // => explicit construction, compiler-checked field by field
} // => toTaskRow ends: Scan fills locals, this function types them

// => listTasks returns the typed shape -- co-24: the return type IS
// => []TaskRow, not driver rows and not maps. Callers get the contract the
// => compiler enforces.
func listTasks() ([]TaskRow, error) { // => co-24: []TaskRow out -- the boundary the handler trusts
	rows, err := db.Query("SELECT id, title FROM tasks ORDER BY id") // => reads every row, oldest id first, as raw columns
	if err != nil {                                                  // => the query itself failed to start
		return nil, err // => propagate: the handler decides the wire shape (a 500)
	} // => the query-failure branch ends
	defer rows.Close() // => releases the query's connection back to the pool when done
	// => deferred Close runs even on the scan-error return below

	out := []TaskRow{} // => START as [] (not nil) so the empty table encodes as [], never null
	for rows.Next() {  // => one pass per row, oldest id first
		var id int                                     // => raw scan locals first -- the driver knows columns, not structs
		var title string                               // => raw scan locals first -- typing happens in toTaskRow next
		if err := rows.Scan(&id, &title); err != nil { // => column order matches the SELECT list above
			return nil, err // => propagate: a corrupt row is a 500, not a skip
		} // => the scan-failure branch ends
		out = append(out, toTaskRow(id, title)) // => every caller gets TaskRow, never driver rows
	} // => the row loop ends
	if err := rows.Err(); err != nil { // => surfaces an error the loop itself swallowed mid-iteration
		return nil, err // => propagate, same 500 path as above
	} // => the iteration-error branch ends
	return out, nil // => success: typed, compiler-checked, JSON-ready
} // => listTasks ends: connection lifetime is the pool's business, not shared state

// ---------------------------------------------------------------------------
// HTTP layer -- the handler's own locals name TaskRow, so the compiler checks
// the SAME contract on both sides of the repository boundary, not just one.
// ---------------------------------------------------------------------------

// => listTasksHandler names the typed shape in its own signature-adjacent
// => locals: tasks IS []TaskRow, so the computation below only compiles when
// => the contract holds -- co-24 on the handler side of the boundary
func listTasksHandler(w http.ResponseWriter, r *http.Request) { // => co-08: a handler for listing tasks
	tasks, err := listTasks() // => co-24: tasks IS []TaskRow -- the compiler checks this assignment for real
	if err != nil {           // => the pool, the query, or a scan failed
		w.WriteHeader(http.StatusInternalServerError) // => 500 with no body -- this example's lesson is the typing, not the envelope
		return                                        // => early return: the computation below only runs for a good read
	} // => the failure branch ends

	totalTitleChars := 0         // => a trivial computation that only WORKS if "title" really exists as a string
	for _, task := range tasks { // => typed access -- the compiler knows Title is a string
		totalTitleChars += len(task.Title) // => typed access: task.MissingKey would fail the BUILD right here
	} // => the loop ends
	log.Printf("total title characters: %d", totalTitleChars) // => proves the typed data is genuinely usable -- server-side evidence

	w.Header().Set("Content-Type", "application/json") // => response header first...
	body, _ := json.Marshal(tasks)                     // => TaskRow serializes to JSON exactly like a plain dict
	_, _ = w.Write(body)                               // => ...onto the wire with the default 200 status
} // => listTasksHandler ends: returns the typed rows as JSON, like TypedDict over the wire

// => the routing table: one route, method-prefixed so only GET matches
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                      // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /tasks", listTasksHandler) // => co-08: GET returns the typed array
	return mux                                     // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, seeded tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
