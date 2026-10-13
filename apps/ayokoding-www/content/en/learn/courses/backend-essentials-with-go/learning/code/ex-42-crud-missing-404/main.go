// Example 42: CRUD -- a missing id returns the 404 envelope.
//
// This example combines the DB-backed UPDATE/DELETE from ex-40/41 with the
// shared envelope pattern from ex-33/34: rowcount == 0 now maps to the SAME
// {"error": {code, message}} document from BOTH routes, instead of the plain
// default 404s ex-38/40/41 answered. Only ONE row is seeded, so most ids the
// app is asked about are genuinely missing -- and both sources of truth (the
// rowcount check and the envelope writer) finally agree.
//
// Try:
// curl -i -X PUT 127.0.0.1:8000/tasks/999 -H 'Content-Type: application/json' -d '{"title":"Nothing"}'
// => 404 {"error":{"code":"task_not_found","message":"task 999 does not exist"}}
// curl -i -X DELETE 127.0.0.1:8000/tasks/999
// => 404, the IDENTICAL status and body shape -- one envelope, both methods
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Exec -- no driver of its own
	"encoding/json" // => request decode, success echo, and envelope encode run through here
	"errors"        // => errors.As: tests the domain error without touching HTTP vocabulary
	"fmt"           // => builds domain error text and wraps decode failures via %w
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean
	"strconv"       // => the path segment is text until this converts it to an int
	"strings"       // => TrimSpace, so a whitespace-only replacement counts as missing too

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the request shape for the PUT half: the replacement value, checked by hand
type taskUpdate struct {
	Title string `json:"title"` // => co-10: validated before the handler ever delegates the UPDATE
} // => the struct closes after one field

// => the updated-resource shape the PUT half echoes on success
type taskRow struct {
	ID    int    `json:"id"`    // => echoed back exactly as addressed in the path
	Title string `json:"title"` // => echoed back exactly as just written to the row
} // => the struct closes: this IS the PUT 200 body

// => the stable envelope BOTH missing-id paths wear -- the ex-33/34 shape,
// => now driven by a database rowcount of zero instead of a map lookup
type errorDetail struct {
	Code    string `json:"code"`    // => stable, machine-matchable: "task_not_found"
	Message string `json:"message"` // => human-readable summary naming the missing id
} // => the inner object closes: code for machines, message for humans

// => errorEnvelope is the outer document: {"error": {...}}
type errorEnvelope struct {
	Error errorDetail `json:"error"` // => the ONE top-level key, matching ex-33/ex-34
} // => the envelope closes: every failure below serializes through this type

// => taskNotFoundError is the same envelope-shaped domain error as ex-33: it
// => carries the missing id and knows NOTHING about HTTP -- the mapping to
// => 404 happens in exactly one place, mapDomainError below
type taskNotFoundError struct {
	ID int // => the id the caller asked for and did not get
} // => the domain error closes

// => Error satisfies the error interface so repository results can carry it
func (e taskNotFoundError) Error() string { // => the method that makes this type an error
	return fmt.Sprintf("task %d does not exist", e.ID) // => the same human sentence the envelope will carry
} // => Error ends

// ---------------------------------------------------------------------------
// Repository layer -- the SAME update/delete shape as ex-40/41, seeded with
// only ONE row this time so most queried ids are genuinely missing. Handlers
// below call these functions and never write SQL themselves.
// ---------------------------------------------------------------------------

// => db is the shared pool: safe for concurrent use, ONE handle per process
var db *sql.DB // => assigned once in initDB, read by every repository call after

// => initDB recreates the schema and seeds exactly ONE starter row -- every
// => id besides 1 is missing, which is the entire point of this example
func initDB() { // => one-shot setup: file, table, one row, in that order
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

	_, err = db.Exec("INSERT INTO tasks (title) VALUES (?)", "Buy milk") // => one seed row, id 1 -- every other id queried is missing
	if err != nil {                                                      // => runs exactly once, unlike an executemany seed
		log.Fatalf("seed tasks: %v", err) // => without this row even id 1 would 404
	} // => the seed branch ends
} // => initDB ends

// => updateTask is the identical shape to ex-40: UPDATE, then RowsAffected
// => decides changed-vs-missing -- the handler turns "missing" into the
// => SHARED domain error below instead of a bare status
func updateTask(id int, title string) (bool, error) { // => (changed, error): changed is false when no row matched
	res, err := db.Exec("UPDATE tasks SET title = ? WHERE id = ?", title, id) // => two "?" placeholders, bound positionally in order
	if err != nil {                                                           // => co-14: parameterized -- never string-formatted
		return false, err // => propagate: the handler decides the wire shape (a 500)
	} // => the exec-failure branch ends
	n, err := res.RowsAffected() // => how many rows this statement touched -- drives the domain error below
	if err != nil {              // => the driver could not report the count
		return false, err // => propagate, same 500 path as above
	} // => the count-failure branch ends
	return n > 0, nil // => true when the id matched, false when task_id matched nothing
} // => updateTask ends

// => deleteTask is the identical shape to ex-41: DELETE, then RowsAffected
// => decides removed-vs-missing -- driving the SAME domain error as update
func deleteTask(id int) (bool, error) { // => (removed, error): removed is false when nothing matched
	res, err := db.Exec("DELETE FROM tasks WHERE id = ?", id) // => "?" binds the id as DATA, never as literal SQL text
	if err != nil {                                           // => co-14: parameterized -- never string-formatted
		return false, err // => propagate: the handler decides the wire shape (a 500)
	} // => the exec-failure branch ends
	n, err := res.RowsAffected() // => how many rows this statement touched -- drives the SAME domain error
	if err != nil {              // => the driver could not report the count
		return false, err // => propagate, same 500 path as above
	} // => the count-failure branch ends
	return n > 0, nil // => true when the id existed, false when it never did
} // => deleteTask ends

// ---------------------------------------------------------------------------
// HTTP layer -- handlers call the repository above; no query string appears
// in any handler function below this line.
// ---------------------------------------------------------------------------

// => writeError is THE centralized failure path: ONE helper for BOTH routes
// => below -- identical status for every caller, identical body shape
func writeError(w http.ResponseWriter, status int, code, message string) { // => one function every failure travels through
	w.Header().Set("Content-Type", "application/json")                                       // => declares the body encoding to the client
	w.WriteHeader(status)                                                                    // => sends the status line and freezes the header map
	body, _ := json.Marshal(errorEnvelope{Error: errorDetail{Code: code, Message: message}}) // => built by hand ONCE, for every caller
	_, _ = w.Write(body)                                                                     // => one JSON document, written straight onto the wire
} // => writeError ends

// => mapDomainError performs the ONE mapping the whole program needs: domain
// => error in, wire response out -- co-11, shared by the PUT and DELETE below
func mapDomainError(w http.ResponseWriter, err error) { // => the single translation point for domain failures
	var notFound taskNotFoundError // => the target errors.As fills when the cause matches
	if errors.As(err, &notFound) { // => co-11: ONE handler-shape for BOTH routes below
		writeError(w, http.StatusNotFound, "task_not_found", notFound.Error()) // => 404, identical for PUT and DELETE callers
		return                                                                 // => mapped -- nothing else to decide
	} // => the mapped-404 branch ends
	writeError(w, http.StatusInternalServerError, "internal_error", "unexpected error") // => any unmapped failure is a 500
} // => mapDomainError ends

// => writeJSON stays for the PUT happy path only -- failures never touch it
func writeJSON(w http.ResponseWriter, status int, payload any) { // => the success-path serializer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => row shapes here cannot fail to encode; a real service would check
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends

// => decodeTaskUpdate parses the PUT body AND enforces the title's presence
func decodeTaskUpdate(r *http.Request) (taskUpdate, error) { // => parse+check, one place, like ex-29
	var body taskUpdate                                           // => the zero-value target: empty title, ready to be filled or rejected
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => streaming decode: reads only as far as the body goes
		return taskUpdate{}, fmt.Errorf("invalid JSON body: %w", err) // => %w wraps, so callers can errors.Is/As the cause
	} // => the invalid-shape branch ends
	if strings.TrimSpace(body.Title) == "" { // => co-10: validated before the handler ever delegates the UPDATE
		return taskUpdate{}, fmt.Errorf("title is required") // => a domain error, deliberately free of HTTP vocabulary
	} // => the missing-title branch ends
	return body, nil // => success: nil error, fully populated value
} // => decodeTaskUpdate ends

// => parseTaskID factors the one path-typing step both handlers share: text
// => in, int-or-envelope out
func parseTaskID(w http.ResponseWriter, r *http.Request) (int, bool) { // => (id, ok): ok is false once an error is written
	id, err := strconv.Atoi(r.PathValue("task_id")) // => hand-typed conversion: text -> int, as in ex-14 (co-12)
	if err != nil {                                 // => "/tasks/abc" fails HERE, inside your own code
		writeError(w, http.StatusBadRequest, "validation_error", "task_id must be an integer") // => YOUR branch writes it; the stdlib never will
		return 0, false                                                                        // => false means "an error is already on the wire, stop"
	} // => the unparseable-id branch ends
	return id, true // => success: the typed id, ready to update or delete
} // => parseTaskID ends

// => updateTaskHandler is the PUT half: type, validate, UPDATE, then map a
// => zero rowcount to the SHARED domain error instead of a bare status
func updateTaskHandler(w http.ResponseWriter, r *http.Request) { // => co-02: PUT against a real, repository-backed store now
	id, ok := parseTaskID(w, r) // => shared typing step; writes its own 400 on failure
	if !ok {                    // => an error is already on the wire
		return // => stop: nothing below runs on an unparseable id
	} // => the parse-failure branch ends

	body, err := decodeTaskUpdate(r) // => path param PLUS validated body -- both must check out
	if err != nil {                  // => missing title or malformed JSON -- no UPDATE runs
		writeError(w, http.StatusUnprocessableEntity, "validation_error", err.Error()) // => 422 through the SAME envelope helper
		return                                                                         // => early return: the UPDATE below only runs for valid bodies
	} // => the invalid-body branch ends

	changed, err := updateTask(id, body.Title) // => co-14: delegates the UPDATE
	if err != nil {                            // => the pool or the write failed
		writeError(w, http.StatusInternalServerError, "internal_error", "could not update task") // => 500: no driver text leaks
		return                                                                                   // => early return: nothing to echo
	} // => the write-failure branch ends
	if !changed { // => the ONLY domain branch: rowcount was 0
		mapDomainError(w, taskNotFoundError{ID: id}) // => same envelope, now driven by rowcount == 0
		return                                       // => mapped -- the echo below only runs for a real update
	} // => the missing-id branch ends
	writeJSON(w, http.StatusOK, taskRow{ID: id, Title: body.Title}) // => echoes the id + the value that was just written
} // => updateTaskHandler ends

// => deleteTaskHandler is the DELETE half: type, DELETE, then map a zero
// => rowcount to the SAME error class as the PUT branch above
func deleteTaskHandler(w http.ResponseWriter, r *http.Request) { // => co-03: 204 -- success, no body
	id, ok := parseTaskID(w, r) // => the SAME typing step PUT uses above
	if !ok {                    // => an error is already on the wire
		return // => stop: nothing below runs on an unparseable id
	} // => the parse-failure branch ends

	removed, err := deleteTask(id) // => co-14: delegates the DELETE
	if err != nil {                // => the pool or the write failed
		writeError(w, http.StatusInternalServerError, "internal_error", "could not delete task") // => 500: no driver text leaks
		return                                                                                   // => early return: nothing was provably removed
	} // => the write-failure branch ends
	if !removed { // => the ONLY domain branch: rowcount was 0
		mapDomainError(w, taskNotFoundError{ID: id}) // => the SAME error class as the PUT branch above
		return                                       // => mapped -- the 204 below only runs for a real removal
	} // => the missing-id branch ends
	w.WriteHeader(http.StatusNoContent) // => 204: no-content success -- deliberately NO body
} // => deleteTaskHandler ends: 204 carries no body, 404 carries the shared envelope

// => the routing table: two routes, one shared writer, one shared mapping
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                                    // => the routing table: exactly two routes in this example
	mux.HandleFunc("PUT /tasks/{task_id}", updateTaskHandler)    // => co-02: PUT replaces the addressed resource
	mux.HandleFunc("DELETE /tasks/{task_id}", deleteTaskHandler) // => co-03: DELETE removes; same 404 envelope as PUT
	return mux                                                   // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: setup, then serve
	initDB()                                                       // => fresh, one-row tasks.db for every run
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
