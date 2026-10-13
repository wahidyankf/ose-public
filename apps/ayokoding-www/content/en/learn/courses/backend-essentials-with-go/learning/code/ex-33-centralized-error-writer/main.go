// Example 33: A centralized error writer (no exceptions in Go).
//
// The Python track raises a DOMAIN exception -- TaskNotFoundError knows
// NOTHING about HTTP -- and a registered @app.exception_handler maps it to a
// 404 envelope in exactly one place. Go has no exceptions and no handler
// registry, so the same separation is built from two pieces: a domain error
// type that still knows nothing about HTTP, plus ONE writeError helper that
// performs the single mapping to status-plus-envelope. Handlers never call
// WriteHeader for failures directly; they ask the lookup for data, test the
// returned error with errors.As, and let writeError decide the wire shape.
//
// Try:
// curl -i 127.0.0.1:8000/tasks/1
// => 200 {"title":"Buy milk"} (id 1 exists in the in-memory store)
// curl -i 127.0.0.1:8000/tasks/99
// => 404 {"error":{"code":"task_not_found","message":"task 99 does not exist"}}
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => both the success body and the envelope encode run through here
	"errors"        // => errors.As: tests the domain error without touching HTTP vocabulary
	"fmt"           // => builds the domain error text and wraps conversions via %w
	"log"           // => startup line + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"strconv"       // => the path segment is text until this converts it to an int
) // => the import block closes: zero third-party dependencies

// => the stable envelope every failure in this batch wears -- unchanged from ex-32
type errorDetail struct {
	Code    string `json:"code"`    // => stable, machine-matchable: "task_not_found" below
	Message string `json:"message"` // => human-readable summary: "task 99 does not exist"
} // => the inner object closes: code for machines, message for humans

// => errorEnvelope is the outer document: {"error": {...}}
type errorEnvelope struct {
	Error errorDetail `json:"error"` // => the ONE top-level key, matching ex-32's shape
} // => the envelope closes: every failure below serializes through this type

// => writeError is THE centralized failure path for the whole program: one
// => helper, every route, every status. The HTTP decision (which status, which
// => code) happens HERE at the call site -- never inside the domain error.
func writeError(w http.ResponseWriter, status int, code, message string) { // => one function every failure travels through
	w.Header().Set("Content-Type", "application/json")                                       // => declares the body encoding to the client
	w.WriteHeader(status)                                                                    // => sends the status line and freezes the header map
	body, _ := json.Marshal(errorEnvelope{Error: errorDetail{Code: code, Message: message}}) // => the envelope, built by hand once for every caller
	_, _ = w.Write(body)                                                                     // => one JSON document, written straight onto the wire
} // => writeError ends: status, headers, and body all decided in four lines

// => taskNotFoundError is a DOMAIN error: it carries the missing id and knows
// => NOTHING about HTTP -- no status code, no JSON. The translation to 404
// => happens in exactly one place, the handler's errors.As branch below.
type taskNotFoundError struct {
	ID int // => the id the caller asked for and did not get
} // => the domain error closes: data only, no transport vocabulary

// => Error satisfies the error interface so lookupTask can return it as error
func (e taskNotFoundError) Error() string { // => the method that makes this type an error
	return fmt.Sprintf("task %d does not exist", e.ID) // => the same human sentence the envelope will carry
} // => Error ends: the text IS the message writeError will send

// => a tiny in-memory store for this example -- process memory, gone on restart
var tasks = map[int]string{1: "Buy milk", 2: "Walk dog"} // => two seeded rows: id 1 and id 2 exist, nothing else does

// => lookupTask is the ONLY reader of the store: found titles come back as
// => values, missing ids come back as the DOMAIN error above -- never a 404
func lookupTask(id int) (string, error) { // => (value, error): Go's value-plus-error convention
	title, ok := tasks[id] // => the single existence check in the whole program
	if !ok {               // => the id was never seeded
		return "", taskNotFoundError{ID: id} // => raise the DOMAIN error; something above maps it
	} // => the missing branch ends
	return title, nil // => success: nil error, the stored title
} // => lookupTask ends: no HTTP vocabulary anywhere in this function

// => writeJSON stays for the happy path only -- failures never touch it now
func writeJSON(w http.ResponseWriter, status int, payload any) { // => the success-path serializer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => map payloads here cannot fail to encode; a real service would check
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends

// => the handler stays free of any HTTP-status knowledge about the domain:
// => it parses the path, asks the lookup, and maps the domain error once
func getTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature -- w writes, r reads
	id, err := strconv.Atoi(r.PathValue("task_id")) // => hand-typed conversion: text -> int, as in ex-14 (co-12)
	if err != nil {                                 // => "/tasks/abc" fails HERE, inside your own handler
		writeError(w, http.StatusBadRequest, "validation_error", "task_id must be an integer") // => the stdlib has no automatic 422: YOUR branch writes it
		return                                                                                 // => early return: nothing below runs on an unparseable id
	} // => the unparseable-id branch ends

	title, err := lookupTask(id) // => the handler delegates the existence check entirely
	if err != nil {              // => something went wrong in the domain -- which thing?
		var notFound taskNotFoundError // => the target errors.As fills when the cause matches
		if errors.As(err, &notFound) { // => co-11: maps the domain error to its HTTP shape, in ONE place
			writeError(w, http.StatusNotFound, "task_not_found", notFound.Error()) // => 404: not-found status decided HERE, not in the lookup
			return                                                                 // => mapped -- no further branches run
		} // => the mapped-404 branch ends
		writeError(w, http.StatusInternalServerError, "internal_error", "unexpected error") // => any unmapped failure is a 500, never a leak
		return                                                                              // => defensive: this store cannot actually produce one today
	} // => the error branch ends

	writeJSON(w, http.StatusOK, map[string]string{"title": title}) // => the found case: 200 with the stored title
} // => getTask ends: at most three writes, each through exactly one helper

// => the routing table: one route with a typed-by-convention path placeholder
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                       // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /tasks/{task_id}", getTask) // => co-12: {task_id} arrives as text; the handler types it
	return mux                                      // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: two lines, both deliberate
	log.Println("listening on 127.0.0.1:8000")                     // => the one startup line uvicorn printed, Go's turn
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends: start the server, then let the kernel keep it alive
