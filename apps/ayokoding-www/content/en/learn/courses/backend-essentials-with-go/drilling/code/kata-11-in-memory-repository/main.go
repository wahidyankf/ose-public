// Kata 11: An in-memory repository keeping a handler free of SQL.
//
// The repository owns every persistence detail; the handler only calls
// it and shapes a response. The store here is a map standing in for a
// real database table.
package main

import (
	"fmt" // => prints the created row and both handler responses
	"log" // => fail-fast on any self-check mismatch
)

// Task is the typed row shape the repository returns.
type Task struct { // => co-14: a typed shape, not a loose map
	ID    int    `json:"id"`    // => assigned by the repo, like AUTOINCREMENT
	Title string `json:"title"` // => the client-supplied field
	Done  bool   `json:"done"`  // => flipped by UpdateDone
}

// TaskRepository is the only place that touches the store.
type TaskRepository struct { // => co-14/co-24: handlers never see these fields
	rows   map[int]Task // => stands in for a real DB table for this pure kata
	nextID int          // => stands in for an auto-increment primary key
}

// NewTaskRepository starts empty, ids from 1.
func NewTaskRepository() *TaskRepository { // => one constructor, fresh store per kata run
	return &TaskRepository{rows: map[int]Task{}, nextID: 1}
}

// Create inserts one title and returns the assigned row.
func (r *TaskRepository) Create(title string) Task { // => INSERT-equivalent
	task := Task{ID: r.nextID, Title: title, Done: false} // => the repo assigns the id, not the handler
	r.rows[r.nextID] = task                               // => store the row under its id
	r.nextID++                                            // => advance so ids are never reused
	return task                                           // => the stored value, echoed to the caller
}

// Get fetches one row by id, or false when absent.
func (r *TaskRepository) Get(id int) (Task, bool) { // => SELECT-by-id-equivalent
	task, ok := r.rows[id] // => nil-map-safe read; absent means "no such row"
	return task, ok        // => the caller maps !ok to a 404
}

// UpdateDone flips Done, or false when the id never existed.
func (r *TaskRepository) UpdateDone(id int, done bool) (Task, bool) { // => UPDATE-equivalent
	task, ok := r.rows[id] // => look up first: nothing to update means absence
	if !ok {               // => signal absence, do not raise a generic error
		return Task{}, false
	}
	task.Done = done  // => in a real repo this would be UPDATE ... WHERE id = ? with a bound id
	r.rows[id] = task // => persist the flipped value back into the store
	return task, true // => the updated row
}

// Delete removes one row, reporting whether one existed.
func (r *TaskRepository) Delete(id int) bool { // => DELETE-equivalent
	if _, ok := r.rows[id]; !ok { // => nothing stored under this id
		return false
	}
	delete(r.rows, id) // => remove the row
	return true        // => true only if a row actually existed
}

// HandlerResponse is the tiny status + body shape handlers return here.
type HandlerResponse struct { // => status travels with the body, like an HTTP reply
	Status int // => 200 on success, 404 when the repo reports absence
	Body   any // => the task on success, an error map on 404
}

// CompleteTaskHandler marks a task done without touching persistence itself.
func CompleteTaskHandler(repo *TaskRepository, id int) HandlerResponse { // => co-24: zero persistence logic here
	task, ok := repo.UpdateDone(id, true) // => all storage detail lives in the repo
	if !ok {                              // => the repo reported absence
		return HandlerResponse{Status: 404, Body: map[string]string{"error": "task not found"}} // => structured 404
	}
	return HandlerResponse{Status: 200, Body: task} // => the updated row as the body
}

func main() {
	repo := NewTaskRepository()                                                 // => fresh store, ids from 1
	created := repo.Create("Write the report")                                  // => co-14: id 1 assigned by the repo
	fmt.Println(created)                                                        // => Output: {1 Write the report false}
	if created.ID != 1 || created.Title != "Write the report" || created.Done { // => the seeded row
		log.Fatalf("created = %+v", created)
	}

	response := CompleteTaskHandler(repo, created.ID)         // => the handler never sees persistence internals
	missingResponse := CompleteTaskHandler(repo, 999)         // => an id that was never created
	fmt.Println(response.Status, response.Body)               // => Output: 200 {1 Write the report true}
	fmt.Println(missingResponse.Status, missingResponse.Body) // => Output: 404 map[error:task not found]

	if response.Status != 200 { // => the existing row completes
		log.Fatalf("complete status = %d, want 200", response.Status)
	}
	doneTask, ok := response.Body.(Task) // => the body carries the updated typed row
	if !ok || !doneTask.Done {           // => the repo update actually persisted
		log.Fatalf("complete body = %+v, want done=true", response.Body)
	}
	if missingResponse.Status != 404 { // => clean 404, not a missing-key panic
		log.Fatalf("missing status = %d, want 404", missingResponse.Status)
	}
	fmt.Println("kata-11 OK") // => the self-check line this track greps for
}
