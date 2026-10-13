// Example 32: A custom error envelope.
//
// FastAPI's DEFAULT 422 body is {"detail": [...]} -- fine for debugging,
// awkward for a client that expects one stable {"error": {code, message}}
// shape on every failure. The Python track overrides the framework's handler
// to RESHAPE that default; stdlib Go has no default to override -- every
// error body here is built by hand -- so this example introduces the one
// writeError helper the rest of the batch reuses, and routes the single
// validation failure through it. The status stays 422; only the BODY shape
// changes, exactly like the Python override.
//
// Try:
// curl -i -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{}'
// => 422 {"error":{"code":"validation_error","message":"title: field required"}}
// curl -i -X POST 127.0.0.1:8000/tasks -H 'Content-Type: application/json' -d '{"title":"Buy milk"}'
// => 201, the happy path is untouched by the envelope
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => both the request decode and the envelope encode run through here
	"fmt"           // => wraps the decode failure with context via %w
	"log"           // => startup line + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"strings"       // => TrimSpace, so a whitespace-only title counts as missing too
) // => the import block closes: zero third-party dependencies

// => the request shape: one required field, presence-checked by hand
type taskCreate struct {
	Title string `json:"title"` // => an empty string fails below: Go zero values get no free pass
} // => the struct closes after one field -- the whole validation surface fits in one check

// => the stable envelope every failure in this batch wears: one top-level
// => "error" key holding a machine-matchable code plus a human summary.
// => Typed structs (not maps) keep the key names compiler-checked.
type errorDetail struct {
	Code    string `json:"code"`    // => stable, machine-matchable: "validation_error"
	Message string `json:"message"` // => human-readable summary: "title: field required"
} // => the inner object closes: code for machines, message for humans

// => errorEnvelope is the outer document: {"error": {...}}
type errorEnvelope struct {
	Error errorDetail `json:"error"` // => the ONE top-level key, unlike a bare {"detail": [...]} array
} // => the envelope closes: every failure below serializes through this type

// => writeError is THE centralized failure path: status, code, and message
// => in, one JSON document out. Headers go BEFORE WriteHeader -- setting them
// => afterwards is silently dropped -- so the helper orders them for you.
func writeError(w http.ResponseWriter, status int, code, message string) { // => one function every failure travels through
	w.Header().Set("Content-Type", "application/json")                                       // => declares the body encoding to the client
	w.WriteHeader(status)                                                                    // => sends the status line and freezes the header map
	body, _ := json.Marshal(errorEnvelope{Error: errorDetail{Code: code, Message: message}}) // => the bespoke envelope, built by hand -- no automatic reshaping exists
	_, _ = w.Write(body)                                                                     // => one JSON document, written straight onto the wire
} // => writeError ends: status, headers, and body all decided in four lines

// => writeJSON stays for the happy path only -- failures never touch it now
func writeJSON(w http.ResponseWriter, status int, payload any) { // => the success-path serializer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => map payloads here cannot fail to encode; a real service would check
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends: successes and failures now travel visibly different paths

// => decodeTaskCreate parses the body AND enforces the field's presence rule,
// => returning (value, error) so the handler can wrap any failure in the
// => envelope above -- the error itself stays free of HTTP vocabulary
func decodeTaskCreate(r *http.Request) (taskCreate, error) { // => one function: parse+check, the whole validation pipeline
	var body taskCreate                                           // => the zero-value target: empty title, ready to be filled or rejected
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => streaming decode: reads only as far as the body goes
		return taskCreate{}, fmt.Errorf("invalid JSON body: %w", err) // => %w wraps, so the message names what went wrong
	} // => the invalid-shape branch ends; a valid body continues below

	if strings.TrimSpace(body.Title) == "" { // => the presence check decoding will NEVER do for us
		return taskCreate{}, fmt.Errorf("title: field required") // => the "field: reason" shape mirrors first_error below
	} // => the missing-title branch ends

	return body, nil // => success: nil error, fully populated value
} // => decodeTaskCreate ends; the handler never re-checks what this function already rejected

// => the handler stays thin: decode, then either envelope or echo
func createTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature -- w writes, r reads
	task, err := decodeTaskCreate(r) // => one call replaces a framework's automatic binding step
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_error", err.Error()) // => 422: status unchanged, BODY now the custom envelope (co-11)
		return                                                                         // => early return: the happy path below only runs for valid bodies
	} // => the invalid-body branch ends

	writeJSON(w, http.StatusCreated, // => 201: the override only touches the FAILURE path
		map[string]string{"title": task.Title}) // => task.Title only exists because validation passed
} // => createTask ends: the happy path is untouched by the envelope override

// => the routing table: one route, method-prefixed so only POST matches
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                 // => the routing table: exactly one route in this example
	mux.HandleFunc("POST /tasks", createTask) // => co-08: a handler for creating a task
	return mux                                // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: two lines, both deliberate
	log.Println("listening on 127.0.0.1:8000")                     // => the one startup line uvicorn printed, Go's turn
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends: start the server, then let the kernel keep it alive
