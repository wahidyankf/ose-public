// Example 30: Validation -- a wrong type also fails.
//
// Go coerces nothing. In FastAPI the numeric string "3" became the int 3
// automatically; encoding/json refuses ANY string for an int field, so the
// decode itself fails with one typed error that names the field and the type.
package main // => one directory, one command; every import below is standard library

import (
	"encoding/json" // => the decode step: where a type mismatch surfaces as an error value
	"errors"        // => builds the presence error so the two failure kinds stay separate
	"fmt"           // => context wrapping via %w
	"log"           // => startup line + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"strings"       // => title trim, unchanged from ex-29
) // => the import block closes: zero third-party dependencies

// => the request shape: TWO fields this time -- the type story is about priority
type taskCreate struct {
	Title    string `json:"title"`    // => presence-checked by hand, exactly like ex-29
	Priority int    `json:"priority"` // => MUST decode as an int -- no string ever becomes one
} // => the struct closes: json tags keep both wire keys stable

// => the decoder is the FIRST line of defense: a type mismatch fails here,
//
//	before any field-level check runs, and carries its own error message
func decodeTaskCreate(r *http.Request) (taskCreate, error) { // => parse AND check, one place, like ex-29
	var body taskCreate                          // => zero-value target: Priority starts as 0
	err := json.NewDecoder(r.Body).Decode(&body) // => one decode pass fills every field it can type-check
	if err != nil {                              // => a string where an int belongs lands here, with Go's own message
		return taskCreate{}, fmt.Errorf("invalid JSON body: %w", err) // => the wrapped text names field AND type, ready to be returned
	} // => the decode-failure branch ends: nothing below runs on a bad body

	if strings.TrimSpace(body.Title) == "" { // => priority passed its type check; now the presence rule
		return taskCreate{}, errors.New("title is required") // => unchanged from ex-29 -- validation composes, one check at a time
	} // => the presence branch ends

	return body, nil // => success: both fields present AND correctly typed
} // => decodeTaskCreate ends: the type contract is enforced before any handler logic

// => writeJSON: same serialization path every example in this batch reuses
func writeJSON(w http.ResponseWriter, status int, payload any) { // => one shared response writer
	w.Header().Set("Content-Type", "application/json") // => response header first...
	w.WriteHeader(status)                              // => ...then the status line...
	body, _ := json.Marshal(payload)                   // => ...then the encoded payload
	_, _ = w.Write(body)                               // => ...onto the wire
} // => writeJSON ends, unchanged from ex-29 so its shape stays familiar

// => the handler: identical shape to ex-29; only the error text is new
func createTask(w http.ResponseWriter, r *http.Request) { // => the net/http handler signature -- w writes, r reads
	if r.Method != http.MethodPost { // => POST-only route, same guard as before
		w.WriteHeader(http.StatusMethodNotAllowed) // => bare 405
		return
	} // => the method guard closes: below here, r is always a POST

	task, err := decodeTaskCreate(r) // => decode-and-validate in one call, exactly as ex-29 did
	if err != nil {
		writeJSON(w, http.StatusUnprocessableEntity, // => 422: the request was shaped right, the data was not
			map[string]string{"error": err.Error()}) // => Go's decode error text IS the client-facing payload
		return
	} // => the invalid-body branch closes

	writeJSON(w, http.StatusCreated, // => the happy path: 201 with both fields echoed
		map[string]any{"title": task.Title, "priority": task.Priority}) // => priority is a real int now, not a coerced string
} // => createTask ends: three writes, one per branch outcome

// => the routing table: one route, exact match on "/tasks"
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()            // => ServeMux again, plain patterns only
	mux.HandleFunc("/tasks", createTask) // => same route name, richer struct behind it
	return mux                           // => the mux itself already satisfies http.Handler
} // => newHandler ends

func main() { // => the executable entry point: two lines, both deliberate
	log.Println("listening on :8000")                     // => startup line
	log.Fatal(http.ListenAndServe(":8000", newHandler())) // => serve until interrupted
} // => main ends
