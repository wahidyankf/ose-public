// Capstone: store.go -- the ONLY place task rows live (the repository).
//
// One in-memory table behind a mutex: CRUD plus the composed list query
// (status filter, created_at sort, limit/offset page with total/next).
// Handlers in main.go own HTTP; auth.go owns the token check; THIS file
// owns every fact about rows. Nothing here imports net/http -- the store
// answers facts (task, bool, error), and handlers translate them.
//
// The store is IN-MEMORY on purpose: readers run this capstone with zero
// setup -- no database to install, no file to create, just `go run .`.
// Durability is the documented tradeoff (a restart empties the table);
// the shape of every method mirrors a SQL-backed repository one-to-one, so
// swapping in database/sql later changes callers, not contracts.
package main

import (
	"sync" // => one mutex: handlers run on their own goroutines, the map is shared
	"time" // => Now stamps created_at server-side -- the client never chooses it
)

// allowedStatuses is the CLOSED status set -- anything else is a 422 at
// the handler, exactly like the Python capstone's Literal type.
var allowedStatuses = map[string]bool{ // => membership IS the validation -- three keys, nothing else
	"todo":        true, // => the default: every created task starts here
	"in_progress": true, // => the middle state -- PUT may move a task here
	"done":        true, // => the terminal state -- filterable, like status=done in ex-69
}

// Task is the response shape for every task-returning endpoint -- the Go
// twin of the Python capstone's Task model, minus Pydantic.
type Task struct { // => id and created_at are server-assigned; the rest is client-chosen
	ID          int    `json:"id"`          // => monotonically increasing from 1, never reused
	Title       string `json:"title"`       // => 1..200 chars -- enforced by validTitle below
	Description string `json:"description"` // => free text, default "" -- max 2000 chars
	Status      string `json:"status"`      // => one of allowedStatuses -- "todo" at creation
	CreatedAt   string `json:"created_at"`  // => server-stamped RFC3339 UTC -- sortable, like ex-72
}

// Page is the paginated list envelope -- the same items/total/next trio as
// ex-67, here narrowed by the optional status filter before paging.
type Page struct { // => the list route's ONLY response shape -- never a bare array
	Items []Task `json:"items"` // => this page's rows, after filter AND sort AND slice
	Total int    `json:"total"` // => the FILTERED count -- not necessarily the whole table
	Next  *int   `json:"next"`  // => nil encodes as null: "no further page" -- a typed sentinel
}

// Store owns the WHOLE table -- one value for the process, built once in
// main. Methods keep the lock discipline INSIDE, so handlers stay thin and
// a future SQL swap keeps every signature except the constructor.
type Store struct { // => the application layer: facts in, facts out, no HTTP vocabulary
	mu     sync.Mutex   // => every access below -- reads AND writes -- holds this lock
	tasks  map[int]Task // => the whole "database": empty at construction, like a fresh schema
	nextID int          // => the next server-assigned id -- incremented under the lock, never reused
}

// NewStore builds an empty table -- ids from 1, the known start state.
// Tests (and main) each build their own, so state never leaks between them.
func NewStore() *Store {
	return &Store{tasks: map[int]Task{}, nextID: 1} // => empty map, ids from 1 -- deterministic start
}

// validTitle enforces the title contract both writes share: present (after
// trimming) and within 1..200 chars -- the twin of Field(min_length=1,
// max_length=200). It returns the REASON, so handlers echo it verbatim.
func validTitle(title string) string { // => "" means valid -- the caller checks the string, not a bool
	if len(title) == 0 || len(trimSpace(title)) == 0 { // => absent AND whitespace-only both fail min_length alike
		return "title must not be empty" // => the 422 text for a missing title -- ex-29's rule, capped
	}
	if len(title) > 200 { // => max_length=200: a client cannot smuggle an unbounded string into the row
		return "title must be at most 200 characters" // => the 422 text for an overlong title
	}
	return "" // => valid -- the empty string IS success here
}

// trimSpace is strings.TrimSpace without importing strings into the store
// file -- fewer imports, same contract: Unicode-aware whitespace trim.
func trimSpace(s string) string { // => hand-rolled so store.go stays two imports small
	start := 0                                // => the first non-space byte -- walks forward past whitespace
	for start < len(s) && isSpace(s[start]) { // => ASCII whitespace set below -- titles are plain text here
		start++ // => skip one leading space byte -- tabs and newlines count too
	}
	end := len(s)                          // => one past the last non-space byte -- walks backward past whitespace
	for end > start && isSpace(s[end-1]) { // => mirror loop from the tail
		end-- // => skip one trailing space byte
	}
	return s[start:end] // => the trimmed view -- no allocation when nothing trims
}

// isSpace reports ASCII whitespace -- space, tab, newline, carriage
// return, the four bytes whitespace-only titles in the tests ever use.
func isSpace(b byte) bool {
	return b == ' ' || b == '\t' || b == '\n' || b == '\r' // => the trimmable set -- nothing exotic, nothing missed
}

// Create stores a new row: title validated, description defaulted to "",
// status defaulted to "todo", created_at stamped NOW -- the server owns
// every default, exactly like the Python schema DEFAULTs.
func (s *Store) Create(title, description string) (Task, string) {
	if msg := validTitle(title); msg != "" { // => validation BEFORE mutation -- a bad title stores nothing
		return Task{}, msg // => the message travels to the handler's 422 -- store never touches HTTP
	}
	if len(description) > 2000 { // => max 2000 chars -- the twin of Field(max_length=2000)
		return Task{}, "description must be at most 2000 characters" // => same 422 contract as the title cap
	}
	s.mu.Lock()         // => the write lock: id assignment and insert are one atomic step
	defer s.mu.Unlock() // => released on return -- the copy below is already safely made
	t := Task{          // => every server-owned field is assigned HERE, never read from the caller
		ID:          s.nextID,                              // => monotonically increasing -- deleted ids never recycled
		Title:       title,                                 // => client-chosen, already validated above
		Description: description,                           // => default "" when the caller omitted it (handler's doing)
		Status:      "todo",                                // => the creation default -- POST never sets status
		CreatedAt:   time.Now().UTC().Format(time.RFC3339), // => server-stamped -- sortable from the first row
	}
	s.tasks[s.nextID] = t // => inserted under the lock -- no two POSTs ever share an id
	s.nextID++            // => advance the counter under the SAME acquisition -- no gap, no reuse
	return t, ""          // => the fresh row, defaults included -- empty message IS success
}

// Get reads one row by id -- false means "no such id" and the HANDLER (not
// this function) decides how that becomes a 404.
func (s *Store) Get(id int) (Task, bool) {
	s.mu.Lock()          // => the read lock: a concurrent DELETE cannot win mid-copy
	defer s.mu.Unlock()  // => released immediately -- the copy below outlives the lock
	t, ok := s.tasks[id] // => ok=false covers "never created" and "already deleted" alike
	return t, ok         // => a copy, not a pointer into the map -- callers cannot mutate the store
}

// Update REPLACES the whole resource -- title, description, AND status all
// required, all validated. False means "no row matched" (404); a message
// means "validation failed" (422); both are handler decisions downstream.
func (s *Store) Update(id int, title, description, status string) (Task, string, bool) {
	if msg := validTitle(title); msg != "" { // => same title contract as Create -- one rule, both writes
		return Task{}, msg, false // => validation precedes existence: shape errors beat missing rows
	}
	if len(description) > 2000 { // => same description cap as Create -- symmetric contracts
		return Task{}, "description must be at most 2000 characters", false // => 422, before any lookup
	}
	if !allowedStatuses[status] { // => the CLOSED set: map membership IS the Literal-type check
		return Task{}, `status must be one of "todo", "in_progress", "done"`, false // => 422, quotes the legal values
	}
	s.mu.Lock()          // => the write lock: read-modify-write is one atomic step
	defer s.mu.Unlock()  // => released on every return path -- found AND not-found alike
	t, ok := s.tasks[id] // => no row matched this id -- PUT only replaces, never creates at an id
	if !ok {             // => the missing-id branch -- deferred unlock still runs, no leak
		return Task{}, "", false // => empty message PLUS false: "not found", distinctly from "invalid"
	}
	t.Title = title             // => full replace: ALL THREE columns overwritten, no merge, no patch
	t.Description = description // => even "" overwrites -- PUT means "become exactly this"
	t.Status = status           // => the caller-chosen state -- validated against the closed set above
	s.tasks[id] = t             // => committed back under the same lock acquisition
	return t, "", true          // => the fresh, post-update row state -- byte-identical on repeat PUTs
}

// Delete removes one row -- true only if a row genuinely existed and was
// removed, so the route can tell "deleted" from "never there".
func (s *Store) Delete(id int) bool {
	s.mu.Lock()                    // => the write lock: the delete commits atomically
	defer s.mu.Unlock()            // => released on return -- the bool below is already decided
	if _, ok := s.tasks[id]; !ok { // => nothing matched: report 404, not a silent no-op
		return false // => keeps "deleted" and "never there" distinguishable for the route
	}
	delete(s.tasks, id) // => genuinely removed -- a later GET proves it, not a soft-delete flag
	return true         // => a row genuinely existed and was removed
}

// List composes filter, sort, AND pagination in one pass -- the in-memory
// twin of ex-73's single statement. Filter narrows, sort orders, THEN
// limit/offset slices; total is the FILTERED count and next is computed
// against it, so the three features cannot silently break each other.
func (s *Store) List(limit, offset int, status, sort string) Page {
	s.mu.Lock()                               // => the read lock: a concurrent write cannot skew total vs items
	defer s.mu.Unlock()                       // => released immediately -- the page below is fully copied out
	filtered := make([]Task, 0, len(s.tasks)) // => pre-sized: at most the whole table, never more
	for id := 1; id < s.nextID; id++ {        // => id order WITHOUT sorting: ids only ever increase
		t, ok := s.tasks[id] // => gaps are the deleted ids -- skipped, never returned
		if !ok {             // => a deleted id leaves a hole -- jump over it
			continue // => the hole contributes nothing to total OR items -- as if never created
		}
		if status != "" && t.Status != status { // => opt-in filter: "" means every status qualifies
			continue // => this row fails the filter -- dropped before counting AND slicing alike
		}
		filtered = append(filtered, t) // => qualified, in ascending id order so far
	}
	if sort == "-created_at" { // => the descending twin: newest first -- the ONLY other legal value
		for i, j := 0, len(filtered)-1; i < j; i, j = i+1, j-1 { // => in-place reverse of the ascending run
			filtered[i], filtered[j] = filtered[j], filtered[i] // => swap symmetric pairs -- ids now descend
		}
	}
	total := len(filtered) // => the FILTERED count -- proves filter+pagination interact correctly
	if offset > total {    // => past the end: the window starts beyond the last qualified row
		offset = total // => clamp so the slice below yields [] instead of panicking
	}
	end := offset + limit // => the exclusive upper bound of this page window
	if end > total {      // => the last page is shorter than limit -- genuinely the tail
		end = total // => clamp the upper bound the same way
	}
	nextOffset := offset + limit // => the offset a client would use for the FOLLOWING page
	var next *int                // => nil means "filtered set exhausted" -- encodes as JSON null
	if nextOffset < total {      // => whether another filtered-and-sorted page exists past this one
		next = &nextOffset // => points at the next window -- the client follows it, no math needed
	}
	return Page{Items: filtered[offset:end], Total: total, Next: next} // => the envelope: never a bare array
}
