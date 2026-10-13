// Example 40: CRUD -- Update.
//
// The "U" in CRUD: one PUT endpoint backed by updateTask(), which reports
// back whether a row actually changed via the exec result's RowsAffected --
// the Go spelling of Python's cursor.rowcount. A zero count means the id
// matched nothing, and the handler answers the deliberately PLAIN default 404
// (no envelope -- ex-42 later upgrades this same case to the shared
// envelope). Two rows are seeded so id 1 provably rewrites.
//
// Try:
// curl -i -X PUT 127.0.0.1:8000/tasks/1 -H 'Content-Type: application/json' -d '{"title":"Buy oat milk"}'
// => 200 {"id":1,"title":"Buy oat milk"}
// curl -i -X PUT 127.0.0.1:8000/tasks/999 -H 'Content-Type: application/json' -d '{"title":"Nothing"}'
// => 404, plain default shape -- the id matched no row
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Exec, QueryRow -- no driver of its own
	"encoding/json" // => request decode plus every response encode runs through here
	"fmt"           // => wraps decode failures with context via %w
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean
	"strconv"       // => the path segment is text until this converts it to an int
	"strings"       // => TrimSpace, so a whitespace-only replacement counts as missing too

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the request shape: the replacement value, validated like any other body
type taskUpdate struct {
	Title string `json:"title"` // => co-10: the replacement value, presence-checked by hand
} // => the struct closes after one field

// => the updated-resource shape: the addressed id plus the value just written
type taskRow struct {
	ID    int    `json:"id"`    // => echoed back exactly as addressed in the path
	Title string `json:"title"` // => echoed back exactly as just written to the row
} // => the struct closes: this IS the 200 body

// ---------------------------------------------------------------------------
// Repository layer -- every database detail lives in this section. The HTTP
// handler below calls updateTask and never writes SQL itself.
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

	_, err = db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Buy milk", "Walk dog") // => two seed rows: id 1 and id 2, both about to be updated
	if err != nil {                                                                       // => one "?" per value, bound positionally
		log.Fatalf("seed tasks: %v", err) // => without seed rows the update below 404s
	} // => the seed branch ends
} // => initDB ends

// => updateTask runs an UPDATE in place (not DELETE+INSERT) and reports back
// => via RowsAffected whether a row actually changed -- 0 means the id
// => matched nothing, the Go spelling of Python's cursor.rowcount == 0
func updateTask(id int, title string) (bool, error) { // => (changed, error): changed is false when no row matched
	res, err := db.Exec("UPDATE tasks SET title = ? WHERE id = ?", title, id) // => two "?" placeholders, bound positionally in order
	if err != nil {                                                           // => co-14: parameterized -- never string-formatted
		return false, err // => propagate: the handler decides the wire shape (a 500)
	} // => the exec-failure branch ends
	n, err := res.RowsAffected() // => how many rows this statement touched -- the whole changed signal
	if err != nil {              // => the driver could not report the count
		return false, err // => propagate, same 500 path as above
	} // => the count-failure branch ends
	return n > 0, nil // => true when the id matched a row, false when task_id matched nothing
} // => updateTask ends: without Exec's commit the change would never reach the file

// => getTask is used only to PROVE the update landed on disk: it reads one
// => row back by its primary key -- the handler for THIS example never calls
// => it, a test or a second curl does
func getTask(id int) (taskRow, error) { // => one row out, by its primary key
	var t taskRow                                                                            // => the typed target the row scans into
	err := db.QueryRow("SELECT id, title FROM tasks WHERE id = ?", id).Scan(&t.ID, &t.Title) // => co-14: same parameterized pattern throughout
	if err != nil {                                                                          // => either ErrNoRows (missing) or a genuine failure -- both propagate
		return taskRow{}, err // => callers test for sql.ErrNoRows when "missing" is a defined answer
	} // => the lookup-failure branch ends
	return t, nil // => success: the value the UPDATE just wrote
} // => getTask ends

// ---------------------------------------------------------------------------
// HTTP layer -- handlers call the repository above; no query string appears
// in any handler function below this line.
// ---------------------------------------------------------------------------

// => decodeTaskUpdate parses the PUT body AND enforces the title's presence
func decodeTaskUpdate(r *http.Request) (taskUpdate, error) { // => parse+check, one place, like ex-29
	var body taskUpdate                                           // => the zero-value target: empty title, ready to be filled or rejected
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => streaming decode: reads only as far as the body goes
		return taskUpdate{}, fmt.Errorf("invalid JSON body: %w", err) // => %w wraps, so callers can errors.Is/As the cause
	} // => the invalid-shape branch ends
	if strings.TrimSpace(body.Title) == "" { // => the presence check decoding will NEVER do for us
		return taskUpdate{}, fmt.Errorf("title is required") // => a domain error, deliberately free of HTTP vocabulary
	} // => the missing-title branch ends
	return body, nil // => success: nil error, fully populated value
} // => decodeTaskUpdate ends

// => writeJSON is the single serializer every path below uses: the flat
// => {"error": ...} and bare-status failures are the pre-envelope vocabulary,
// => matching the Python track's default (non-envelope) shapes here
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one shared response writer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => request, row, and error shapes here cannot fail to encode
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends

// => updateTaskHandler is the "U" endpoint: type the path, validate the body,
// => delegate the UPDATE, then echo the id plus the value just written
func updateTaskHandler(w http.ResponseWriter, r *http.Request) { // => co-02: PUT replaces the addressed resource
	id, err := strconv.Atoi(r.PathValue("task_id")) // => hand-typed conversion: text -> int, as in ex-14 (co-12)
	if err != nil {                                 // => "/tasks/abc" fails HERE, inside your own handler
		w.WriteHeader(http.StatusBadRequest) // => 400: a failed conversion gets YOUR status, never an automatic 422
		return                               // => early return: nothing below runs on an unparseable id
	} // => the unparseable-id branch ends

	body, err := decodeTaskUpdate(r) // => path param PLUS validated body -- both must check out
	if err != nil {                  // => missing title or malformed JSON -- no UPDATE runs
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()}) // => 422: well-formed HTTP, semantically invalid body
		return                                                                                // => early return: the UPDATE below only runs for valid bodies
	} // => the invalid-body branch ends

	changed, err := updateTask(id, body.Title) // => co-14: delegates the UPDATE
	if err != nil {                            // => the pool or the write failed
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not update task"}) // => 500: no driver text leaks to the client
		return                                                                                            // => early return: nothing to echo
	} // => the write-failure branch ends
	if !changed { // => the ONLY domain branch: rowcount was 0, nothing matched
		w.WriteHeader(http.StatusNotFound) // => the PLAIN default 404 shape -- deliberately no envelope yet (ex-42 adds it)
		return                             // => mapped -- the echo below only runs for a real update
	} // => the missing-id branch ends
	writeJSON(w, http.StatusOK, taskRow{ID: id, Title: body.Title}) // => echoes the id + the value that was just written
} // => updateTaskHandler ends

// => the routing table: one route with a typed-by-convention path placeholder
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                                 // => the routing table: exactly one route in this example
	mux.HandleFunc("PUT /tasks/{task_id}", updateTaskHandler) // => co-02: PUT against the addressed id
	return mux                                                // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, seeded tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
