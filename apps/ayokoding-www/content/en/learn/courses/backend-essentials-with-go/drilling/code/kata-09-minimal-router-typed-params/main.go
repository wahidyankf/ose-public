// Kata 09: A minimal router with typed path params.
//
// http.ServeMux maps a method + path pattern to a handler. The {id}
// segment arrives as text; the handler converts it to an int by hand,
// rejecting non-numeric ids at the boundary. httptest drives it all.
package main

import (
	"fmt"               // => prints each routed outcome
	"log"               // => fail-fast on any self-check mismatch
	"net/http"          // => ServeMux, handlers, statuses
	"net/http/httptest" // => in-process requests: no socket, same stack
	"strconv"           // => the hand-written text-to-int conversion
	"strings"           // => trims the plain-text body for comparison
)

// getItem handles GET /items/{id}: typed conversion at the boundary.
func getItem(w http.ResponseWriter, r *http.Request) { // => co-07/co-12: matched handler for the pattern
	idText := r.PathValue("id")     // => the {id} segment, still a string
	id, err := strconv.Atoi(idText) // => hand-typed conversion: text -> int
	if err != nil {                 // => "/items/abc" fails here, before any store access
		w.Header().Set("Content-Type", "application/json")          // => error bodies are still JSON
		w.WriteHeader(422)                                          // => unprocessable: the shape is wrong, not the row
		_, _ = w.Write([]byte(`{"error":"id must be an integer"}`)) // => tiny envelope naming the fault
		return
	}
	_, _ = w.Write([]byte(fmt.Sprintf("item %d", id))) // => co-08: the handler echoes the typed value
}

// newHandler registers the single route table for this kata.
func newHandler() http.Handler { // => wiring extracted so httptest and (optionally) curl share it
	mux := http.NewServeMux()                  // => the routing table: one pattern
	mux.HandleFunc("GET /items/{id}", getItem) // => co-07: method + path pattern in one string
	return mux                                 // => the mux is an http.Handler, ready to serve or wrap
}

func doRequest(handler http.Handler, method, target string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, nil) // => synthetic request, parsed as if off the wire
	rec := httptest.NewRecorder()                   // => captures status + body in memory
	handler.ServeHTTP(rec, req)                     // => routing and validation run exactly as over a socket
	return rec                                      // => the caller asserts on Code and Body
}

func main() {
	handler := newHandler() // => one mux for all three probes below

	okRec := doRequest(handler, http.MethodGet, "/items/42")                                // => co-12: "42" binds to PathValue("id")
	fmt.Println(strings.TrimSpace(okRec.Body.String()))                                     // => Output: item 42
	if okRec.Code != http.StatusOK || strings.TrimSpace(okRec.Body.String()) != "item 42" { // => the typed echo
		log.Fatalf("GET /items/42 = (%d,%q), want (200,item 42)", okRec.Code, okRec.Body.String())
	}

	badRec := doRequest(handler, http.MethodGet, "/items/abc") // => non-numeric segment
	fmt.Println(badRec.Code)                                   // => Output: 422
	if badRec.Code != 422 {                                    // => rejected at the boundary, not deep in a store
		log.Fatalf("GET /items/abc = %d, want 422", badRec.Code)
	}

	missRec := doRequest(handler, http.MethodGet, "/items/42/extra") // => segment count mismatch
	fmt.Println(missRec.Code == http.StatusNotFound)                 // => Output: true
	if missRec.Code != http.StatusNotFound {                         // => no route matches, the mux 404s
		log.Fatalf("GET /items/42/extra = %d, want 404", missRec.Code)
	}
	fmt.Println("kata-09 OK") // => the self-check line this track greps for
}
