// Example 34: A consistent 404 envelope across methods.
//
// The same domain error, the same writeError helper, and the same shared
// requireTask check serve BOTH a GET route and a DELETE route below --
// consistency by construction. The Python track registers ONE exception
// handler for two routes; Go calls ONE helper from two handlers, which is the
// same idea without a registry: neither route names a status or shapes JSON
// by hand, so the two missing-id responses cannot drift apart.
//
// Try:
// curl -i 127.0.0.1:8000/tasks/404
// => 404 {"error":{"code":"task_not_found","message":"task 404 does not exist"}}
// curl -i -X DELETE 127.0.0.1:8000/tasks/404
// => 404, the IDENTICAL status and body shape -- one envelope, every method
// curl -i -X DELETE 127.0.0.1:8000/tasks/1
// => 204 with no body -- the one success path that carries nothing
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => both the GET body and the envelope encode run through here
	"errors"        // => errors.As: tests the domain error without touching HTTP vocabulary
	"fmt"           // => builds the domain error text
	"log"           // => startup line + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"strconv"       // => the path segment is text until this converts it to an int
) // => the import block closes: zero third-party dependencies

// => the stable envelope every failure in this batch wears -- unchanged from ex-32
type errorDetail struct {
	Code    string `json:"code"`    // => stable, machine-matchable: "task_not_found" below
	Message string `json:"message"` // => human-readable summary naming the missing id
} // => the inner object closes: code for machines, message for humans

// => errorEnvelope is the outer document: {"error": {...}}
type errorEnvelope struct {
	Error errorDetail `json:"error"` // => the ONE top-level key, matching ex-33's shape
} // => the envelope closes: every failure below serializes through this type

// => writeError is THE centralized failure path: ONE helper, reused by every
// => route below. Identical status for every caller, identical body shape.
func writeError(w http.ResponseWriter, status int, code, message string) { // => one function every failure travels through
	w.Header().Set("Content-Type", "application/json")                                       // => declares the body encoding to the client
	w.WriteHeader(status)                                                                    // => sends the status line and freezes the header map
	body, _ := json.Marshal(errorEnvelope{Error: errorDetail{Code: code, Message: message}}) // => built by hand ONCE, for every caller
	_, _ = w.Write(body)                                                                     // => one JSON document, written straight onto the wire
} // => writeError ends

// => taskNotFoundError is the same envelope-shaped domain error as ex-33:
// => data only, no HTTP vocabulary -- the handler maps it exactly once
type taskNotFoundError struct {
	ID int // => the id the caller asked for and did not get
} // => the domain error closes

// => Error satisfies the error interface so requireTask can return it as error
func (e taskNotFoundError) Error() string { // => the method that makes this type an error
	return fmt.Sprintf("task %d does not exist", e.ID) // => the same human sentence the envelope will carry
} // => Error ends

// => a tiny in-memory store for this example -- one row, so almost every id
// => the app is asked about is genuinely missing, like the Python seeding
var tasks = map[int]string{1: "Buy milk"} // => id 1 exists; every other id exercises the 404 path

// => requireTask is the small shared helper BOTH routes call: the SAME check,
// => the SAME error, regardless of which HTTP method called it
func requireTask(id int) (string, error) { // => (value, error): found titles or the domain error
	title, ok := tasks[id] // => the single existence check in the whole program
	if !ok {               // => the SAME check, regardless of which route called it
		return "", taskNotFoundError{ID: id} // => the SAME error, regardless of HTTP method
	} // => the missing branch ends
	return title, nil // => the found-case value
} // => requireTask ends: no status, no JSON, just data-or-error

// => mapDomainError performs the ONE mapping the whole program needs: domain
// => error in, wire response out. Both handlers call it, so neither repeats
// => the errors.As branch -- the mapping truly lives in one place.
func mapDomainError(w http.ResponseWriter, err error) { // => the single translation point for domain failures
	var notFound taskNotFoundError // => the target errors.As fills when the cause matches
	if errors.As(err, &notFound) { // => co-11: ONE mapping, reused by every route below
		writeError(w, http.StatusNotFound, "task_not_found", notFound.Error()) // => 404, identical for GET and DELETE callers
		return                                                                 // => mapped -- nothing else to decide
	} // => the mapped-404 branch ends
	writeError(w, http.StatusInternalServerError, "internal_error", "unexpected error") // => any unmapped failure is a 500
} // => mapDomainError ends

// => writeJSON stays for the GET happy path only -- failures never touch it
func writeJSON(w http.ResponseWriter, status int, payload any) { // => the success-path serializer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => map payloads here cannot fail to encode; a real service would check
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends

// => parseTaskID factors the one path-typing step both handlers share: text
// => in, int-or-envelope out. A failed conversion is itself answered through
// => writeError, so handlers stay free of bare WriteHeader calls entirely.
func parseTaskID(w http.ResponseWriter, r *http.Request) (int, bool) { // => (id, ok): ok is false once an error is written
	id, err := strconv.Atoi(r.PathValue("task_id")) // => hand-typed conversion: text -> int, as in ex-14 (co-12)
	if err != nil {                                 // => "/tasks/abc" fails HERE, inside your own code
		writeError(w, http.StatusBadRequest, "validation_error", "task_id must be an integer") // => YOUR branch writes it; the stdlib never will
		return 0, false                                                                        // => false means "an error is already on the wire, stop"
	} // => the unparseable-id branch ends
	return id, true // => success: the typed id, ready to look up
} // => parseTaskID ends

// => getTask handles GET reads: parse, require, then echo the stored title
func getTask(w http.ResponseWriter, r *http.Request) { // => co-12: GET reads one resource by its typed id
	id, ok := parseTaskID(w, r) // => shared typing step; writes its own 400 on failure
	if !ok {                    // => an error is already on the wire
		return // => stop: nothing below runs on an unparseable id
	} // => the parse-failure branch ends
	title, err := requireTask(id) // => delegates the existence check to the shared helper
	if err != nil {               // => missing id -- the ONLY domain branch this handler makes
		mapDomainError(w, err) // => raises the SAME envelope a DELETE would for this id
		return                 // => mapped -- the echo below only runs for found rows
	} // => the missing branch ends
	writeJSON(w, http.StatusOK, map[string]string{"title": title}) // => the found case: 200 with the stored title
} // => getTask ends

// => deleteTask handles DELETE removes: parse, require, then delete -- 204
// => means "no body", so success writes a bare status while failures still
// => wear the shared envelope
func deleteTask(w http.ResponseWriter, r *http.Request) { // => co-02: DELETE removes the addressed resource
	id, ok := parseTaskID(w, r) // => the SAME typing step GET uses above
	if !ok {                    // => an error is already on the wire
		return // => stop: nothing below runs on an unparseable id
	} // => the parse-failure branch ends
	if _, err := requireTask(id); err != nil { // => raises the SAME error for a missing id as GET does
		mapDomainError(w, err) // => identical status AND identical body shape to the GET case (co-11)
		return                 // => mapped -- the delete below only runs for existing rows
	} // => the missing branch ends
	delete(tasks, id)                   // => only reached once the id is confirmed to exist
	w.WriteHeader(http.StatusNoContent) // => 204: no-content success -- deliberately NO body
} // => deleteTask ends: 204 carries no body, 404 carries the shared envelope

// => the routing table: two routes, one shared helper, one shared writer
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                             // => the routing table: exactly two routes in this example
	mux.HandleFunc("GET /tasks/{task_id}", getTask)       // => co-12: GET reads
	mux.HandleFunc("DELETE /tasks/{task_id}", deleteTask) // => co-02: DELETE removes; same 404 shape as GET
	return mux                                            // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: two lines, both deliberate
	log.Println("listening on 127.0.0.1:8000")                     // => the one startup line uvicorn printed, Go's turn
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends: start the server, then let the kernel keep it alive
