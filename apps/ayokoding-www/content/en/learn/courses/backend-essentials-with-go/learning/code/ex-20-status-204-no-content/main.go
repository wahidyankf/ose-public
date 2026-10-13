// Example 20: Status 204 No Content.
//
// w.WriteHeader(http.StatusNoContent) and NOTHING else: 204 means
// "succeeded, and there is nothing more to say", and RFC 9110 requires
// that a 204 response carry no body at all -- so this handler never
// writes one.
package main

import (
	"log"      // => Fatal() for the ListenAndServe startup error
	"net/http" // => the stdlib server and its status constants (co-03)
)

// deleteItem answers the DELETE with a body-less 204 and nothing else.
func deleteItem(w http.ResponseWriter, r *http.Request) {
	// => item_id would be looked up and deleted by a real handler (co-02);
	// => this example exists to nail ONE thing: the 204 status line
	// => r.PathValue("item_id") is available but deliberately unused here
	w.WriteHeader(http.StatusNoContent) // => ONLY this call -- no body may follow (co-03)
	// => RFC 9110: a 204 response carries NO body, ever; some clients
	// => treat body bytes on a 204 as a protocol violation, so writing
	// => even "{}" after this line would be a real bug, not a style issue
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("DELETE /items/{item_id}", deleteItem) // => DELETE scoped to one path pattern (co-02)
	// => the mux's method-scoped pattern also auto-405s GET /items/5,
	// => which is the correct behavior for a delete-only route
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
