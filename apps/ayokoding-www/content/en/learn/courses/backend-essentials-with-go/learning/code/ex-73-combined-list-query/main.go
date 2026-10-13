// Example 73: Combined List Query -- pagination + filter + sort together.
//
// Ex-65..72 built pagination, filtering, and sorting SEPARATELY; this is
// the proof all three compose in ONE endpoint without one feature silently
// breaking another (total reflects the FILTER, next is computed against the
// filtered total, and the page is sliced AFTER sorting). Every param is
// independently optional, exactly matching its standalone example.
//
// This composition needs REAL SQL (that is the whole point -- one
// statement applying WHERE, then ORDER BY, then LIMIT/OFFSET in the fixed
// order SQLite evaluates them), so it uses database/sql plus
// modernc.org/sqlite -- a pure-Go driver, no CGO -- pinned in go.mod.
//
// Run it:
//
//	go run .
//
// Then in another terminal:
//
//	curl "http://127.0.0.1:8000/tasks?status=done&limit=50" # total 8 -- the FILTERED count, not 25
//	curl "http://127.0.0.1:8000/tasks?status=done&limit=3&offset=0&sort=-created_at" # ids 23,20,17; next 3
//	curl "http://127.0.0.1:8000/tasks?status=done&limit=3&offset=3&sort=-created_at" # ids 14,11,8
package main

import (
	"database/sql"  // => the stdlib query surface -- the driver itself comes from modernc below
	"encoding/json" // => encodes the page envelope -- items plus metadata in one body
	"fmt"           // => Sprintf builds the zero-padded seed day below
	"log"           // => Fatal turns startup failures into a non-zero exit, like uvicorn would
	"net/http"      // => the whole server: mux, handlers, status codes
	"os"            // => Remove resets the demo file so every run starts deterministic
	"strconv"       // => query values arrive as strings; Atoi turns them into ints

	_ "modernc.org/sqlite" // => pure-Go SQLite driver, no CGO -- the ONLY non-stdlib import in this batch
)

// maxLimit is the ceiling ?limit= enforces -- the same bound as ex-68,
// reused here so the composed endpoint stays safely bounded too.
const maxLimit = 50 // => FastAPI's le=50, spelled as a named Go constant instead

// dbPath is the one on-disk SQLite file for this example directory --
// never shared with any other example, keeping each self-contained. It is
// created at RUNTIME when the server starts (like the Python twin's
// tasks.db); nothing is committed to the content tree.
const dbPath = "tasks.db" // => relative to the working directory: run from this example's dir

// schema backs every list query in this example: id, title, two filterable
// fields, and one sortable field -- the same five columns as ex-65.
const schema = `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    created_at TEXT NOT NULL
);` // => AUTOINCREMENT ids run 1..25, matching the in-memory examples' ids

// task is the one row shape every page's items carry.
type task struct { // => the Go twin of the Python TaskRow dict -- one struct, five columns
	ID        int    `json:"id"`         // => matches the INTEGER PRIMARY KEY column
	Title     string `json:"title"`      // => "task <i>", the human-readable display text
	Status    string `json:"status"`     // => the filterable column this composed query supports
	Priority  string `json:"priority"`   // => seeded for parity, unfiltered by THIS endpoint
	CreatedAt string `json:"created_at"` // => the sortable column -- rises WITH id by construction
}

// page is the ENVELOPE shape -- the same items/total/next trio as ex-67,
// now built from a query that filtered, sorted, AND paginated at once.
type page struct { // => the Go twin of the Python Page dict -- items plus paging metadata
	Items []task `json:"items"` // => this page's rows, after filter AND sort AND slice
	Total int    `json:"total"` // => the FILTERED count -- not the whole 25-row table
	Next  *int   `json:"next"`  // => nil encodes as null: computed against the FILTERED total
}

// orderBySort maps the PUBLIC sort value to a real column plus direction --
// this map is the ONLY thing standing between user input and ORDER BY.
// SQL has no ? syntax for column names or ASC/DESC, so a fixed lookup (not
// interpolation) is what keeps the clause safe, exactly like ex-72.
var orderBySort = map[string]string{ // => the closed sort set -- two keys, nothing else
	"created_at":  "created_at ASC",  // => oldest-first, matching the seed's insertion order
	"-created_at": "created_at DESC", // => a leading "-" is the REST convention for "descending"
}

// apiError is the one failure shape this file returns -- code plus message.
type apiError struct { // => {"code":...,"message":...}: machine-readable plus human-readable
	Code    string `json:"code"`    // => e.g. "validation_error" -- stable across examples
	Message string `json:"message"` // => names the offending field, like FastAPI's detail array
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

// initDB recreates the demo file from scratch, then seeds the SAME
// deterministic 25-row dataset the in-memory examples share.
func initDB(db *sql.DB) error {
	if _, err := db.Exec(schema); err != nil { // => creates the table every query below depends on
		return err // => without the table nothing else in this file can run -- fail loudly
	}
	statuses := []string{"todo", "in_progress", "done"} // => rotates every 3 rows: index i % 3
	priorities := []string{"low", "normal", "high"}     // => rotates every 2 via (i/2) % 3: decorrelated
	for i := 1; i <= 25; i++ {                          // => ids 1..25 -- done={2,5,8,11,14,17,20,23}
		_, err := db.Exec( // => a single-row INSERT, parameterized like every write in this topic
			"INSERT INTO tasks (title, status, priority, created_at) VALUES (?, ?, ?, ?)", // => ? placeholders
			fmt.Sprintf("task %d", i),               // => "task 1" .. "task 25"
			statuses[i%3],                           // => done exactly where i % 3 == 2
			priorities[(i/2)%3],                     // => integer divide first, then mod 3
			fmt.Sprintf("2026-07-%02dT00:00:00", i), // => zero-padded day, rising with id
		)
		if err != nil { // => a failed seed row means the dataset is NOT the promised 25 -- stop
			return err // => propagate with context added by the caller in main
		}
	}
	return nil // => schema plus 25 rows committed -- every curl below sees the same dataset
}

// listQuery holds the four independently-optional list params AFTER
// validation -- one value object so the repository takes a single argument.
type listQuery struct { // => mirrors the handler's four query params, already bounds-checked
	status string // => "" means unfiltered -- every status qualifies
	limit  int    // => how many rows this page holds, at most (1..maxLimit)
	offset int    // => how many filtered-and-sorted rows to skip first (>= 0)
	sort   string // => "created_at" or "-created_at" -- a KEY of orderBySort, never raw SQL
}

// listPage is the repository function where ALL THREE features compose --
// the order matters: the filter narrows the ROWS, the sort orders them,
// THEN limit/offset slices. SQL applies WHERE, then ORDER BY, then
// LIMIT/OFFSET in that fixed evaluation order, so one statement is enough.
func listPage(db *sql.DB, q listQuery) (page, error) {
	where := ""         // => empty when unfiltered -- reproduces the fully unfiltered query
	args := []any{}     // => kept in lockstep with the WHERE clause -- one entry per ? placeholder
	if q.status != "" { // => opt-in, exactly like the standalone filter example
		where = " WHERE status = ?"   // => the one filterable column this composed query supports
		args = append(args, q.status) // => the bound value, positionally matched to the ? above
	}
	var total int                                                                                 // => the FILTERED count -- proves filter+pagination interact correctly
	if err := db.QueryRow("SELECT COUNT(*) FROM tasks"+where, args...).Scan(&total); err != nil { // => SAME where and args as below, so the two numbers stay consistent
		return page{}, err // => the count itself failed -- not the caller's fault, propagate as 500
	}
	orderClause := orderBySort[q.sort] // => looked up from the FIXED map -- never raw user input
	rows, err := db.Query(             // => filter, sort, AND paginate in a single statement
		"SELECT id, title, status, priority, created_at FROM tasks"+where+" ORDER BY "+orderClause+" LIMIT ? OFFSET ?", // => WHERE, then ORDER BY, then LIMIT/OFFSET -- SQLite's fixed order
		append(args, q.limit, q.offset)..., // => filter params FIRST, then limit/offset -- position must match ? order
	)
	if err != nil { // => the main query failed -- propagate the same way as the count above
		return page{}, err // => the handler turns any repository error into a generic 500
	}
	defer rows.Close() // => released on every return path -- never leak a cursor on success OR failure
	items := []task{}  // => non-nil empty: encodes as [] (not null) on an exhausted page
	for rows.Next() {  // => one iteration per row in this filtered, sorted, sliced window
		var t task                                                                               // => the zero-value target each row scans into
		if err := rows.Scan(&t.ID, &t.Title, &t.Status, &t.Priority, &t.CreatedAt); err != nil { // => column order matches the SELECT
			return page{}, err // => a scan failure mid-stream invalidates the whole page -- fail loudly
		}
		items = append(items, t) // => keep every row the composed query qualified
	}
	if err := rows.Err(); err != nil { // => surfaces an iteration error the loop itself swallowed, if any
		return page{}, err // => same 500 contract as every other repository failure here
	}
	nextOffset := q.offset + q.limit // => the offset a client would use for the FOLLOWING page
	var next *int                    // => nil means "filtered set exhausted" -- encodes as JSON null
	if nextOffset < total {          // => whether another filtered-and-sorted page exists past this one
		next = &nextOffset // => 8 filtered rows with limit 3: page one reports next 3, page two is the tail
	}
	return page{Items: items, Total: total, Next: next}, nil // => the SAME envelope shape as ex-67
}

// parseListQuery validates the four query params -- each rule matches its
// standalone example (ex-68's bounds, ex-72's closed sort set), so the
// composed endpoint rejects exactly what the separate ones rejected.
func parseListQuery(r *http.Request) (listQuery, string) {
	query := r.URL.Query()                        // => parsed once, read four times -- each param independently optional
	q := listQuery{limit: 10, sort: "created_at"} // => the defaults: 10-row page, ascending -- ex-66 + ex-72
	q.status = query.Get("status")                // => "" when absent: that dimension simply does not narrow
	if raw := query.Get("limit"); raw != "" {     // => an explicit value beats the default -- ex-66's override
		n, err := strconv.Atoi(raw)              // => "3" -> 3; "abc" -> an error, never a silent zero
		if err != nil || n < 1 || n > maxLimit { // => ge=1 AND le=50 -- ex-68's ceiling, reused verbatim
			return listQuery{}, fmt.Sprintf("limit must be an integer between 1 and %d", maxLimit) // => 422, names the field
		}
		q.limit = n // => valid: this page holds at most n rows
	}
	if raw := query.Get("offset"); raw != "" { // => same opt-in pattern for the skip count
		n, err := strconv.Atoi(raw) // => Atoi again: no floats, no blanks, no coercion
		if err != nil || n < 0 {    // => ge=0 -- ex-65's floor, unchanged
			return listQuery{}, "offset must be an integer >= 0" // => names the field, like FastAPI's detail
		}
		q.offset = n // => valid: skip the first n filtered-and-sorted rows
	}
	if raw := query.Get("sort"); raw != "" { // => an explicit direction beats ascending -- ex-72's override
		if _, ok := orderBySort[raw]; !ok { // => the CLOSED set: map membership IS the validation
			return listQuery{}, `sort must be "created_at" or "-created_at"` // => 422, quotes the legal values
		}
		q.sort = raw // => a genuine map key -- safe to look up again in the repository
	}
	return q, "" // => an empty message IS success -- the caller checks this, not a bool
}

// getTasks serves GET /tasks -- four independently-optional params, one
// delegated call, zero SQL in the handler itself.
func getTasks(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q, errMsg := parseListQuery(r) // => all four validations own this one helper
		if errMsg != "" {              // => rejected before any DB access -- validation precedes querying
			writeError(w, http.StatusUnprocessableEntity, "validation_error", errMsg) // => 422, names the field
			return
		}
		result, err := listPage(db, q) // => the single composed repository call -- no SQL in this handler
		if err != nil {                // => the DB itself failed -- not the caller's fault
			writeError(w, http.StatusInternalServerError, "internal_error", "could not list tasks") // => 500, generic
			return
		}
		writeJSON(w, http.StatusOK, result) // => the envelope: filtered total, sorted slice, next link
	}
}

func main() {
	if err := os.Remove(dbPath); err != nil && !os.IsNotExist(err) { // => start deterministic; missing file is fine
		log.Fatal(err) // => a real removal failure (permissions) means the seed below would lie -- stop
	}
	db, err := sql.Open("sqlite", dbPath) // => the modernc driver name -- pure Go, no CGO involved
	if err != nil {                       // => Open validates the driver name, not the file -- rarely fails
		log.Fatal(err) // => without a handle nothing else in this file can run
	}
	defer db.Close()                   // => released when the server finally exits -- the process's one handle
	if err := initDB(db); err != nil { // => fresh schema plus the 25-row seed, every single run
		log.Fatal(err) // => a half-seeded table would silently break every worked example id -- stop
	}
	mux := http.NewServeMux()                             // => one explicit router for this example's single route
	mux.HandleFunc("GET /tasks", getTasks(db))            // => all three features, one call, zero SQL in the handler
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", mux)) // => block forever on localhost:8000
}
