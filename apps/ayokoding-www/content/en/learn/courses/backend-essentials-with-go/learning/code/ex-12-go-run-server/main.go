// Example 12: Run via go run.
//
// `go run .` is the command that actually starts serving: it compiles the
// main package in the current directory and runs its main function, which
// blocks inside ListenAndServe -- the Go analogue of `uvicorn app:app`,
// with the built binary itself playing the role uvicorn played.
package main

import (
	"encoding/json" // => the one JSON route this dev-loop example serves
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-22)
)

// rootHandler is the minimal route the dev loop needs something to hit.
func rootHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")                  // => hand-set, as every JSON route does (co-09)
	json.NewEncoder(w).Encode(map[string]string{"served_by": "go run"}) // => confirms which process answered
}

func main() {
	mux := http.NewServeMux()            // => the router this example serves (co-07)
	mux.HandleFunc("GET /", rootHandler) // => one route is enough for the loop
	// => ListenAndServe BLOCKS like Python's serve_forever: the process
	// => stays alive, accepting connections, until Ctrl-C stops it (co-22)
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
