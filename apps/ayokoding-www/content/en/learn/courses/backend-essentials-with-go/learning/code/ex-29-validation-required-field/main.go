// Example 29: Validation -- a missing required field fails.
//
// encoding/json has no per-field validation: it parses the body into the
// struct it is given and stops there. This example layers an explicit,
// hand-written check on top so a present-but-empty title is treated exactly
// like an absent one. In FastAPI the framework validated before the handler
// ever ran; in stdlib Go the handler runs its own first line of defense.
package main // => the executable package shape: one directory, one command

import ( // => six stdlib packages, zero third-party dependencies
	"encoding/json" // => the only JSON vocabulary the standard library offers -- no validator attached
	"errors"        // => builds the plain domain error the handler checks for
	"fmt"           // => wraps the decode error with context via %w
	"log"           // => the startup line and the fatal-on-list-failure path
	"net/http"      // => the entire server: mux, handlers, statuses
	"strings"       // => TrimSpace, so a whitespace-only title counts as missing too
) // => the import block closes: everything above is standard library

// => the single shape a valid POST /tasks body may take -- one struct, named here
// => json tags wire the client's key ("title") to the Go field, not the other way around
type taskCreate struct { // => the request shape: exactly one field, presence-checked by hand
	Title string `json:"title"` // => an empty string still fails the check below: Go zero values get no free pass
} // => the struct closes after one field -- the whole validation surface fits in one line below

// => the struct closes after one field -- the whole validation surface of ex-29 fits in one line below

// => decodeTaskCreate parses the body AND enforces the field's presence rule
// => returning (value, error) mirrors Go's value-plus-error convention
func decodeTaskCreate(r *http.Request) (taskCreate, error) { // => one function: parse+check, the whole validation pipeline
	var body taskCreate                          // => the zero-value target: empty title, ready to be filled or rejected
	err := json.NewDecoder(r.Body).Decode(&body) // => streaming decode: reads only as far as the body goes
	if err != nil {                              // => a decode failure means the body was not valid JSON at all
		return taskCreate{}, fmt.Errorf("invalid JSON body: %w", err) // => %w wraps, so callers can errors.Is/As the cause
	} // => the invalid-shape branch ends; a valid body continues below

	if strings.TrimSpace(body.Title) == "" { // => the presence check decoding will NEVER do for us
		return taskCreate{}, errors.New("title is required") // => a domain error, deliberately free of HTTP vocabulary
	}

	return body, nil // => success: nil error, fully populated value
} // => decodeTaskCreate ends; the handler never re-checks what this function already rejected

// => writeJSON centralizes every response this example sends -- one serialization path
// => headers BEFORE WriteHeader: setting them afterwards is silently dropped
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one function every response travels through
	w.Header().Set("Content-Type", "application/json") // => declares the body encoding to the client
	w.WriteHeader(status)                              // => sends the status line and freezes the header map
	body, _ := json.Marshal(payload)                   // => map payloads here cannot fail to encode; a real service would check
	_, _ = w.Write(body)                               // => one JSON document, written straight onto the wire
} // => writeJSON ends: status, headers, and body all decided in four lines

// => the handler stays thin: decode, then either error or echo
// => all validation vocabulary lives above this function, not inside it
func createTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature -- w writes, r reads
	if r.Method != http.MethodPost { // => this route only speaks POST; anything else is a routing misuse
		w.WriteHeader(http.StatusMethodNotAllowed) // => 405: bare, because method misuse is not a JSON-body problem
		return                                     // => example 405-shape; the batch's envelope arrives in ex-32
	} // => the method guard ends: everything below is the POST path

	task, err := decodeTaskCreate(r) // => one call replaces a framework's automatic binding step
	if err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, // => 422: well-formed HTTP, semantically invalid body
			map[string]string{"error": err.Error()}) // => the error text IS the client-facing payload here
		return // => early return: the happy path below only runs for valid bodies
	} // => the invalid-body branch ends

	writeJSON(w, http.StatusCreated, // => 201: a new resource representation is being returned
		map[string]string{"title": task.Title}) // => task.Title only exists because validation passed
} // => createTask ends: at most three branches, each answered by one write

// => newHandler assembles the routing table, separate from main so tests could reuse it
// => "/tasks" with no trailing slash is an exact match -- any other path falls through to 404
func newHandler() http.Handler {
	mux := http.NewServeMux()            // => the routing table: exactly one route in this example
	mux.HandleFunc("/tasks", createTask) // => co-08: a handler for creating a task
	return mux                           // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() {
	log.Println("listening on :8000")                     // => the one startup line uvicorn printed, Go's turn
	log.Fatal(http.ListenAndServe(":8000", newHandler())) // => blocks forever; log.Fatal turns a listen error into exit code 1
} // => main ends: start the server, then let the kernel keep it alive
