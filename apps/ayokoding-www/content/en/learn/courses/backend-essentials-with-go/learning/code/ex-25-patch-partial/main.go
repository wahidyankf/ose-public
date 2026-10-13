// Example 25: PATCH Updates Only What It Is Sent.
//
// PATCH partially updates a resource: only the fields present in the
// request body change. The Go mechanism for "present vs absent" is a
// POINTER field -- nil means the client never sent it, so "title" below
// survives untouched while "done" flips.
package main

import (
	"encoding/json" // => decode the patch, encode the stored task (co-13)
	"log"           // => Fatal() for the ListenAndServe startup error
	"net/http"      // => the stdlib server (co-02)
	"strconv"       // => the path segment is text until this converts it
)

// task is one stored task -- the PATCH target.
type task struct {
	Title string `json:"title"` // => deliberately NOT patchable in this example
	Done  bool   `json:"done"`  // => the field the PATCH will actually change
}

// taskPatch uses a POINTER field so "absent" and "false" stay distinct:
// decoding leaves the pointer nil unless the client sent the field --
// the Go analogue of Python's `done: bool | None = None` sentinel.
type taskPatch struct {
	Done *bool `json:"done"` // => nil = the field was never sent (co-13)
}

// tasks seeds one record for the partial update to land against.
var tasks = map[int]*task{ // => values are POINTERS so mutations write back to the store
	1: {Title: "draft", Done: false},
}

// updateTask applies only the fields the client actually sent.
func updateTask(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	id, err := strconv.Atoi(r.PathValue("task_id"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"task_id must be an integer"}`))
		return
	}
	stored, ok := tasks[id] // => the comma-ok idiom: missing id != zero value (co-02)
	if !ok {
		w.WriteHeader(http.StatusNotFound) // => no task with that id: 404, not 400
		w.Write([]byte(`{"error":"no task with that id"}`))
		return
	}
	var patch taskPatch
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil { // => the partial body (co-13)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"invalid json body"}`))
		return
	}
	if patch.Done != nil { // => "is not None" in Python; a nil-pointer check in Go
		stored.Done = *patch.Done // => ONLY this field ever changes (co-02)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stored) // => "title" survives unchanged from before the PATCH
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("PATCH /tasks/{task_id}", updateTask) // => PATCH means "partially update" (co-02)
	// => contrast Example 24's PUT: there the body was the WHOLE new
	// => state; here the patch struct makes every field optional
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux))
}
