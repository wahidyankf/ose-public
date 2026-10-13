// Example 39: CRUD -- Read List.
//
// The "R" (plural) in CRUD: POST grows the list, GET returns the whole array,
// so a single curl session can prove the two compose. The table starts EMPTY
// -- every row arrives through createTask -- and listTasks reads every row
// back in insertion order, oldest id first. The empty list is a 200 with [],
// never a 404: "no rows yet" is a successful answer with zero elements.
//
// Try:
// curl -s 127.0.0.1:8000/tasks
// => [] (nothing created yet)
// curl -s -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Buy milk"}'
// curl -s -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Walk dog"}'
// curl -s 127.0.0.1:8000/tasks
// => [{"id":1,"title":"Buy milk"},{"id":2,"title":"Walk dog"}]
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Exec, Query -- no driver of its own
	"encoding/json" // => request decode plus every response encode runs through here
	"fmt"           // => wraps decode failures with context via %w
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean
	"strings"       // => TrimSpace, so a whitespace-only title counts as missing too

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the request shape for the POST half: exactly one field, checked by hand
type taskCreate struct {
	Title string `json:"title"` // => co-10: validated before either repository call below
} // => the struct closes after one field

// => the row shape BOTH halves share: the POST half echoes one, the GET half
// => returns an array of them
type taskRow struct {
	ID    int    `json:"id"`    // => the AUTOINCREMENT primary key SQLite assigned
	Title string `json:"title"` // => the one data column
} // => the struct closes

// ---------------------------------------------------------------------------
// Repository layer -- createTask grows the table, listTasks reads every row
// back, so this one section proves both halves compose. Handlers below call
// these functions and never write SQL themselves.
// ---------------------------------------------------------------------------

// => db is the shared pool: safe for concurrent use, ONE handle per process
var db *sql.DB // => assigned once in initDB, read by every repository call after

// => initDB recreates the schema starting EMPTY -- every row here arrives
// => through createTask below, never from seed data
func initDB() { // => one-shot setup: file plus table, nothing else
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

	_, err = db.Exec("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)") // => the exact DDL -- no seed rows this time
	if err != nil {                                                                                    // => starts EMPTY: curl grows it via POST below
		log.Fatalf("create table: %v", err) // => without this table nothing below can run
	} // => the DDL branch ends
} // => initDB ends

// => createTask runs the INSERT half: "?" binds the title as DATA, the same
// => property as every example -- reused here so curl can grow the list first
func createTask(title string) (int64, error) { // => the fresh id out, for the 201 body
	res, err := db.Exec("INSERT INTO tasks (title) VALUES (?)", title) // => one placeholder, one bound value
	if err != nil {                                                    // => the write itself failed
		return 0, err // => propagate: the handler decides the wire shape (a 500)
	} // => the exec-failure branch ends
	id, err := res.LastInsertId() // => the AUTOINCREMENT id SQLite just assigned, off the result
	if err != nil {               // => the driver could not report it back
		return 0, err // => propagate, same 500 path as above
	} // => the id-failure branch ends
	return id, nil // => success: the caller needs this for the 201 response body
} // => createTask ends

// => listTasks runs the READ half: every row, in insertion order -- the "R"
// => of CRUD. The handler converts nothing: []taskRow encodes directly.
func listTasks() ([]taskRow, error) { // => typed rows out, oldest id first
	rows, err := db.Query("SELECT id, title FROM tasks ORDER BY id") // => no WHERE clause -- returns every row
	if err != nil {                                                  // => the query itself failed to start
		return nil, err // => propagate: the handler decides the wire shape (a 500)
	} // => the query-failure branch ends
	defer rows.Close() // => releases the query's connection back to the pool when done

	out := []taskRow{} // => START as [] (not nil) so the empty list encodes as [], never null
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
	return out, nil // => success: possibly empty, always an array on the wire
} // => listTasks ends

// ---------------------------------------------------------------------------
// HTTP layer -- handlers call the repository above; no query string appears
// in any handler function below this line.
// ---------------------------------------------------------------------------

// => decodeTaskCreate parses the POST body AND enforces the title's presence
func decodeTaskCreate(r *http.Request) (taskCreate, error) { // => parse+check, one place, like ex-29
	var body taskCreate                                           // => the zero-value target: empty title, ready to be filled or rejected
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => streaming decode: reads only as far as the body goes
		return taskCreate{}, fmt.Errorf("invalid JSON body: %w", err) // => %w wraps, so callers can errors.Is/As the cause
	} // => the invalid-shape branch ends
	if strings.TrimSpace(body.Title) == "" { // => the presence check decoding will NEVER do for us
		return taskCreate{}, fmt.Errorf("title is required") // => a domain error, deliberately free of HTTP vocabulary
	} // => the missing-title branch ends
	return body, nil // => success: nil error, fully populated value
} // => decodeTaskCreate ends

// => writeJSON is the single serializer every path below uses: successes
// => carry rows, failures carry the flat pre-envelope {"error": ...} shape
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one shared response writer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => request, row, and error shapes here cannot fail to encode
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends

// => createTaskHandler grows the list: validate, INSERT, echo the fresh id
func createTaskHandler(w http.ResponseWriter, r *http.Request) { // => reused so curl can grow the list before listing it
	body, err := decodeTaskCreate(r) // => "body" only exists if validation passed
	if err != nil {                  // => missing title or malformed JSON -- no INSERT runs
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()}) // => 422: well-formed HTTP, semantically invalid body
		return                                                                                // => early return: the INSERT below only runs for valid bodies
	} // => the invalid-body branch ends

	id, err := createTask(body.Title) // => co-14: the handler delegates the INSERT
	if err != nil {                   // => the pool or the write failed
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not create task"}) // => 500: no driver text leaks to the client
		return                                                                                            // => early return: no id to echo
	} // => the write-failure branch ends
	writeJSON(w, http.StatusCreated, taskRow{ID: int(id), Title: body.Title}) // => echoes the id the DB actually assigned
} // => createTaskHandler ends

// => listTasksHandler reads the list: one repository call, one error branch,
// => one echo of the array -- co-14: the handler never writes SQL itself
func listTasksHandler(w http.ResponseWriter, r *http.Request) { // => co-14: returns a JSON ARRAY, one element per row
	tasks, err := listTasks() // => co-14: the handler never writes SQL itself
	if err != nil {           // => the pool, the query, or a scan failed
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not list tasks"}) // => 500: no driver text leaks
		return                                                                                           // => early return: the echo below only runs for a good read
	} // => the failure branch ends
	writeJSON(w, http.StatusOK, tasks) // => the array shape a client can iterate directly -- [] when empty, never null
} // => listTasksHandler ends

// => the routing table: two methods, one path, two handlers sharing one store
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                        // => the routing table: exactly two routes in this example
	mux.HandleFunc("POST /tasks", createTaskHandler) // => POST grows the list (201 with the fresh row)
	mux.HandleFunc("GET /tasks", listTasksHandler)   // => GET returns the whole array (200, [] when empty)
	return mux                                       // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, empty tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
