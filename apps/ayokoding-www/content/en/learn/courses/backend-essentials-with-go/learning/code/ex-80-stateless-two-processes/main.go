// Example 80: Stateless, Two Processes -- two instances sharing only a file.
//
// The culmination of every "in-process memory is invisible to the next
// worker" caveat scattered across this track: here TWO SEPARATE OS
// processes serve requests, and a caller genuinely cannot tell them apart,
// because neither process holds any state the OTHER does not also see. The
// ONLY shared thing is the store file both instances open per request --
// no in-process cache, no map, no memory of prior calls anywhere.
//
// The -port flag is what makes the side-by-side run possible: each process
// binds its own port while pointing at the SAME -store file. The process
// stamps its own port into each row's handled_by column -- purely so the
// demo can PROVE which worker wrote a row, by reading it back from the
// OTHER worker. A real client never needs to know which worker answered.
//
// Run the two-worker check (three terminals, or background the first two):
//
//	go run . -port 8003 -store /tmp/ex80_tasks.json  # worker A -- first OS process
//	go run . -port 8004 -store /tmp/ex80_tasks.json  # worker B -- SECOND OS process, same file
//
//	curl http://127.0.0.1:8003/whoami # {"port":"8003"} -- proves WHO answered
//	curl http://127.0.0.1:8004/whoami # {"port":"8004"} -- a DIFFERENT process answered
//	curl -X POST -H "Content-Type: application/json" -d '{"title":"created on A"}' http://127.0.0.1:8003/tasks # write via A...
//	curl http://127.0.0.1:8004/tasks/1 # ...read via B: same row -- the FILE is the source of truth
//
// Writes replace the file atomically (temp file plus rename), so a reader
// never observes a half-written store; concurrent writers serialize on the
// OS rename. Production would use a real database (SQLite with WAL, like
// the capstone) instead of hand-rolled JSON -- the statelessness contract
// is identical either way: shared storage, forgetful processes.
package main

import (
	"encoding/json" // => the store file IS JSON: one array of rows, human-inspectable in /tmp
	"flag"          // => -port and -store: the two knobs the side-by-side demo turns
	"log"           // => Fatal turns startup failures into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, path values, status codes
	"os"            // => ReadFile/WriteFile/Rename: the entire "database" is three syscalls
	"path/filepath" // => Dir joins the temp file to the store's own directory -- same filesystem, atomic rename
	"strconv"       // => the {id} path value arrives as a string; Atoi turns it into an int
	"strings"       // => TrimSpace rejects whitespace-only titles, like the validation examples
)

// task is the stored row -- plus handled_by, which exists PURELY so this
// demo can prove which process wrote each row by reading it from the other.
type task struct { // => identical regardless of which of the two processes assembled it
	ID        int    `json:"id"`         // => server-assigned, monotonically increasing across BOTH workers
	Title     string `json:"title"`      // => client-chosen -- the only field the caller controls
	HandledBy string `json:"handled_by"` // => the WRITING worker's port -- this example's whole proof point
}

// createBody is POST's expected shape -- identical regardless of which of
// the two processes happens to receive this specific request.
type createBody struct { // => one field: handled_by is NEVER client-settable, only server-stamped
	Title string `json:"title"` // => required -- an empty title is a 422, not a silent default
}

// apiError is the one failure shape this file returns -- code plus message.
type apiError struct { // => {"code":...,"message":...}: machine-readable plus human-readable
	Code    string `json:"code"`    // => e.g. "not_found" -- stable across examples
	Message string `json:"message"` // => human text -- "no such task", "title is required", ...
}

// errorEnvelope wraps apiError at the fixed "error" key clients parse.
type errorEnvelope struct { // => the outer key stays constant even as statuses vary
	Error apiError `json:"error"` // => every error body below nests exactly here
}

// writeJSON writes body as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")      // => the stdlib never sets this for you
	w.WriteHeader(status)                                   // => the status line goes out before the body
	if err := json.NewEncoder(w).Encode(body); err != nil { // => streams the encoding straight to the wire
		log.Printf("encode response: %v", err) // => headers already sent: only loggable now
	}
}

// writeError writes the consistent {"error":{...}} envelope with a status.
func writeError(w http.ResponseWriter, status int, code, message string) { // => shape plus status, one call
	writeJSON(w, status, errorEnvelope{Error: apiError{Code: code, Message: message}})
}

// store is the shared file both workers open -- it holds NO cache and NO
// memory: every method below hits the filesystem fresh, so two processes
// (or twenty) always see the same truth. The zero value is unusable;
// main builds exactly one via newStore with the -store flag.
type store struct { // => the ONLY state the process keeps: two strings -- path and port
	path string // => the ONE file both processes share -- e.g. /tmp/ex80_tasks.json
	port string // => THIS process's own port -- stamped into handled_by on every write
}

// newStore binds a file path and an identity together -- nothing is read
// yet: reads happen per request, which is precisely what stateless means.
func newStore(path, port string) *store {
	return &store{path: path, port: port} // => two strings in, zero bytes read -- laziness is the feature
}

// load reads the CURRENT file contents -- called at the START of every
// request, so this process never serves a stale in-memory copy. A missing
// file is an EMPTY table (first run), never an error.
func (s *store) load() ([]task, error) {
	raw, err := os.ReadFile(s.path) // => the whole store, fresh off disk -- every single time
	if err != nil {                 // => only "missing file" is benign -- anything else is real
		if os.IsNotExist(err) { // => no worker has written yet: the table is simply empty
			return []task{}, nil // => non-nil empty: encodes as [] (not null) downstream
		}
		return nil, err // => permissions, a directory at the path -- fail loudly, never guess
	}
	if len(raw) == 0 { // => a zero-byte file (fresh probe, crashed writer) holds no rows either
		return []task{}, nil // => same empty-table contract as the missing-file branch above
	}
	var tasks []task                                    // => the decoded rows -- ascending by id, as save wrote them
	if err := json.Unmarshal(raw, &tasks); err != nil { // => a corrupt file is operator-visible breakage
		return nil, err // => propagate: the route turns this into a 500, never a silent []
	}
	if tasks == nil { // => "null" on disk decodes to nil -- normalize so callers always see []
		tasks = []task{} // => callers append freely: no nil-map-style surprises on a nil slice either
	}
	return tasks, nil // => the file's CURRENT truth -- possibly written milliseconds ago by the OTHER worker
}

// save replaces the file ATOMICALLY: write temp, then rename over the
// original. Readers either see the old file or the new file -- never a
// half-written mix -- which is the entire concurrency story for this demo.
func (s *store) save(tasks []task) error {
	raw, err := json.Marshal(tasks) // => encode FIRST, in memory: a failure here touches no file
	if err != nil {                 // => tasks are plain structs -- this fails only on programmer error
		return err // => propagate before any temp file exists -- nothing to clean up
	}
	tmp, err := os.CreateTemp(filepath.Dir(s.path), "tasks-*.json") // => SAME directory: rename stays on one filesystem
	if err != nil {                                                 // => unwritable directory -- fail loudly
		return err // => no temp file, no rename, no partial state -- the old file is untouched
	}
	tmpName := tmp.Name()                     // => the random temp path -- renamed below, removed on failure
	if _, err := tmp.Write(raw); err != nil { // => the full new contents land in the temp file first
		tmp.Close()        // => close before removing -- Windows-grade hygiene, harmless elsewhere
		os.Remove(tmpName) // => a failed write leaves NO debris -- the old file is still current
		return err         // => propagate: the route turns this into a 500
	}
	if err := tmp.Close(); err != nil { // => flush to the OS before the rename -- durability first
		os.Remove(tmpName) // => same cleanup: failed close, no rename, old file current
		return err         // => propagate alike -- every failure mode funnels to the same 500
	}
	return os.Rename(tmpName, s.path) // => THE atomic step: readers flip from old to new instantaneously
}

// create appends one row stamped with THIS worker's port -- whichever
// worker RECEIVES the request stamps its OWN identity, but the row is
// immediately visible to the OTHER worker too, via the shared file.
func (s *store) create(title string) (task, error) {
	tasks, err := s.load() // => read the CURRENT file -- it may hold rows the OTHER worker wrote
	if err != nil {        // => missing file is fine (empty table); anything else already errored in load
		return task{}, err // => propagate: the route turns this into a 500, never a silent drop
	}
	nextID := 1               // => ids derive from the file's max -- shared across BOTH workers
	for _, t := range tasks { // => one scan: the file is small, correctness beats cleverness here
		if t.ID >= nextID { // => track the maximum id seen -- the next row takes max+1
			nextID = t.ID + 1 // => monotonically increasing -- deleted ids are never recycled
		}
	}
	created := task{ID: nextID, Title: title, HandledBy: s.port} // => the stamp: THIS process's own -port value
	if err := s.save(append(tasks, created)); err != nil {       // => atomic replace -- visible to both workers at once
		return task{}, err // => the write failed: report 500, the row is NOT stored
	}
	return created, nil // => the fresh row -- readable from EITHER worker from this instant on
}

// get reads one row by id from the CURRENT file -- whichever process runs
// THIS request needs no memory of the request that created the row.
func (s *store) get(id int) (task, bool, error) {
	tasks, err := s.load() // => the CURRENT file -- the only source of truth, shared identically
	if err != nil {        // => load already classified missing-file vs real failure -- propagate as-is
		return task{}, false, err // => a real load error becomes a 500, never a phantom 404
	}
	for _, t := range tasks { // => a linear scan -- the file-scale twin of WHERE id = ?
		if t.ID == id { // => found: return the ORIGINAL handled_by, even if the OTHER worker wrote it
			return t, true, nil // => identical response whichever process answers -- statelessness proven
		}
	}
	return task{}, false, nil // => no row at this id, in EITHER process's view of the shared file
}

// postTask serves POST /tasks -- whichever worker RECEIVES it stamps its
// OWN port into handled_by. This handler holds NO in-process cache or map
// at all: everything it produces lands in the shared file immediately.
func postTask(s *store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body createBody                                           // => the zero-value target: empty title, ready to reject
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil { // => wrong types fail HERE
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "invalid JSON body: "+err.Error()) // => 422
			return
		}
		if strings.TrimSpace(body.Title) == "" { // => empty titles are rejected -- never silently defaulted
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "title is required") // => 422
			return
		}
		created, err := s.create(body.Title) // => stamped with THIS worker's port, visible to BOTH instantly
		if err != nil {                      // => the shared file itself failed -- not the caller's fault
			writeError(w, http.StatusInternalServerError, "internal_error", "could not store task") // => 500, generic
			return
		}
		writeJSON(w, http.StatusCreated, created) // => 201: the new row, id and handled_by assigned
	}
}

// readTask serves GET /tasks/{id} -- a DIFFERENT process may answer than
// the one that stored the row, and the response is identical either way.
func readTask(s *store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id")) // => "abc" is not an id -- path validation first
		if err != nil {                            // => the SHAPE is wrong -- 422, like FastAPI's int param
			writeError(w, http.StatusUnprocessableEntity, "validation_error", "task id must be an integer") // => 422
			return
		}
		found, ok, err := s.get(id) // => reads the CURRENT file -- no memory of the creating request needed
		if err != nil {             // => the shared file itself failed -- not a missing row
			writeError(w, http.StatusInternalServerError, "internal_error", "could not read task") // => 500, generic
			return
		}
		if !ok { // => no row exists at this id, in EITHER worker's view of the shared file
			writeError(w, http.StatusNotFound, "not_found", "no such task") // => identical from both workers
			return
		}
		writeJSON(w, http.StatusOK, found) // => the ORIGINAL handled_by -- stamped by whoever wrote it
	}
}

// whoami serves GET /whoami -- reports which worker port answered. Used
// ONLY to prove two processes are involved; a real client never needs it.
func whoami(port string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"port": port}) // => DIFFERS by process -- unlike every other field
	}
}

func main() {
	port := flag.String("port", "8000", "port THIS process serves -- give each worker its own")                   // => the side-by-side knob: 8003 vs 8004
	storePath := flag.String("store", "tasks.json", "the ONE file all workers share -- same value every process") // => the shared truth: identical on every command line
	flag.Parse()                                                                                                  // => parses os.Args -- flags must be read before the store or mux below uses them
	s := newStore(*storePath, *port)                                                                              // => path shared, port unique: that pair IS the worker's identity
	mux := http.NewServeMux()                                                                                     // => one explicit router -- a fresh mux PER process, sharing nothing
	mux.HandleFunc("POST /tasks", postTask(s))                                                                    // => writes stamp THIS worker's port, visible to BOTH
	mux.HandleFunc("GET /tasks/{id}", readTask(s))                                                                // => reads hit the CURRENT file -- process-agnostic
	mux.HandleFunc("GET /whoami", whoami(*port))                                                                  // => identity oracle -- proves TWO processes serve
	log.Fatal(http.ListenAndServe("127.0.0.1:"+*port, mux))                                                       // => THIS process binds its OWN port, same file as its twin
}
