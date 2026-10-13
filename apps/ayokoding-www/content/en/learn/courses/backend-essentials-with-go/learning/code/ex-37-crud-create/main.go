// Example 37: CRUD -- Create.
//
// The "C" in CRUD: one POST endpoint backed by createTask(), the start of the
// growing task-management service this topic builds. The table starts EMPTY
// -- every row here arrives through the create path -- and the handler echoes
// the id the database actually assigned, read off the INSERT result. A flat
// {"error": ...} answers bad bodies (the pre-envelope shape from ex-29);
// the 201 body carries the fresh id, exactly like the Python version.
//
// Try:
// curl -i -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Buy milk"}'
// => 201 {"id":1,"title":"Buy milk"} -- the first row gets id 1
// curl -i -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{}'
// => 422, the title is required before any INSERT runs
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Exec, QueryRow -- no driver of its own
	"encoding/json" // => request decode plus every response encode runs through here
	"fmt"           // => wraps decode failures with context via %w
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean
	"strings"       // => TrimSpace, so a whitespace-only title counts as missing too

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the request shape: exactly one field, presence-checked by hand
type taskCreate struct {
	Title string `json:"title"` // => co-10: validated before the handler ever delegates the INSERT
} // => the struct closes after one field

// => the created-resource shape: the id the DB assigned plus the stored title
type taskCreated struct {
	ID    int64  `json:"id"`    // => the AUTOINCREMENT id from the INSERT result
	Title string `json:"title"` // => echoed back exactly as it was stored
} // => the struct closes: this IS the 201 body

// ---------------------------------------------------------------------------
// Repository layer -- every database detail lives in this section. The HTTP
// handler below calls these functions and never writes SQL itself.
// ---------------------------------------------------------------------------

// => db is the shared pool: safe for concurrent use, ONE handle per process
var db *sql.DB // => assigned once in initDB, read by every repository call after

// => initDB recreates the schema starting EMPTY -- no seed rows this time,
// => because this example is entirely about the create path
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
	if err != nil {                                                                                    // => starts EMPTY: rows arrive only via createTask below
		log.Fatalf("create table: %v", err) // => without this table nothing below can run
	} // => the DDL branch ends
} // => initDB ends

// => createTask is the ONLY function that runs an INSERT -- "?" binds the
// => title as DATA, the same safety property ex-36 proved
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
} // => createTask ends: without Exec's commit the row would never reach the file

// => getTask is used only to PROVE persistence: it reads one row back by its
// => primary key, returning sql.ErrNoRows (as a typed nil-row signal) when the
// => id does not exist -- the handler for THIS example never calls it
func getTask(id int64) (taskCreated, error) { // => one row out, by its primary key
	var t taskCreated                                                                        // => the typed target the row scans into
	err := db.QueryRow("SELECT id, title FROM tasks WHERE id = ?", id).Scan(&t.ID, &t.Title) // => one placeholder, one bound value
	if err != nil {                                                                          // => either ErrNoRows (missing) or a genuine failure -- both propagate
		return taskCreated{}, err // => callers test for sql.ErrNoRows when "missing" is a defined answer
	} // => the lookup-failure branch ends
	return t, nil // => success: the row SQLite actually stored
} // => getTask ends

// ---------------------------------------------------------------------------
// HTTP layer -- handlers call the repository above; no query string appears
// in any handler function below this line.
// ---------------------------------------------------------------------------

// => decodeTaskCreate parses the body AND enforces the title's presence rule
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

// => writeJSON is the single serializer BOTH paths use here: the flat
// => {"error": ...} failure shape is the pre-envelope vocabulary from ex-29,
// => matching the Python track's default (non-envelope) validation error
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one shared response writer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => request and response shapes here cannot fail to encode
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends

// => createTaskHandler is the "C" endpoint: validate, delegate the INSERT,
// => echo the assigned id with 201 (co-03: 201 signals a new resource)
func createTaskHandler(w http.ResponseWriter, r *http.Request) { // => co-08: a handler for creating a task
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
	writeJSON(w, http.StatusCreated, taskCreated{ID: id, Title: body.Title}) // => echoes the id the DB actually assigned
} // => createTaskHandler ends

// => the routing table: one route, method-prefixed so only POST matches
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                        // => the routing table: exactly one route in this example
	mux.HandleFunc("POST /tasks", createTaskHandler) // => co-03: POST creates, 201 answers
	return mux                                       // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, empty tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
