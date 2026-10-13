// Example 44: An additive ALTER TABLE + backfill migration.
//
// Two calls at startup, in order: FIRST seed the OLD schema and a row, THEN
// migrate -- proving the migration works against data that predates it. The
// migration itself is ADDITIVE only: ALTER TABLE ADD COLUMN never touches an
// existing column or row, and an explicit backfill UPDATE gives every
// pre-existing row a real value instead of leaving NULL. The GET handler then
// reads the POST-migration shape, including the backfilled column.
//
// Try:
// curl -s 127.0.0.1:8000/tasks/1
// => {"id":1,"title":"Buy milk","priority":3} -- inserted BEFORE the column existed
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Exec, Query, QueryRow -- no driver of its own
	"encoding/json" // => the migrated-row body encodes through here
	"errors"        // => errors.Is: tests for sql.ErrNoRows without touching its text
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove: delete any stale db file so every run starts clean
	"strconv"       // => the path segment is text until this converts it to an int

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the POST-migration row shape: the handler reads (and returns) the
// => backfilled "priority" column the v1 schema never had
type taskRow struct {
	ID       int    `json:"id"`       // => untouched by the migration -- same value as at insert time
	Title    string `json:"title"`    // => untouched by the migration -- same text as at insert time
	Priority int    `json:"priority"` // => BACKFILLED by the migration: 3 for the pre-existing row
} // => the struct closes: the wire shape proves the migration ran

// ---------------------------------------------------------------------------
// Repository + migration layer -- createV1Schema seeds the OLD shape,
// migrateAddPriorityColumn adds the column AND backfills. Handlers below call
// getTask and never write DDL themselves.
// ---------------------------------------------------------------------------

// => db is the shared pool: safe for concurrent use, ONE handle per process
var db *sql.DB // => assigned once during setup, read by every repository call after

// => openDB dials the file and verifies it -- shared by both setup steps so
// => neither repeats the open/ping boilerplate
func openDB() { // => one connection setup for the whole program
	_ = os.Remove("tasks.db") // => start every run from a clean, deterministic file -- runs once, before v1
	// => Remove ignores its error: a missing file is the normal first-run case

	var err error                                 // => the single error slot every setup step shares
	db, err = sql.Open("sqlite", "file:tasks.db") // => "sqlite" is the name the blank import registered
	if err != nil {                               // => Open validates the name, not the file itself
		log.Fatalf("open db: %v", err) // => fail FAST at startup, not on the first real request
	} // => the open-failure branch ends
	db.SetMaxOpenConns(1) // => one writer-friendly connection: SQLite files dislike concurrent writers

	if err := db.Ping(); err != nil { // => Ping actually dials the file -- Open alone never touches it
		log.Fatalf("ping db: %v", err) // => fail FAST before ListenAndServe
	} // => the ping-failure branch ends
} // => openDB ends

// => createV1Schema builds the ORIGINAL schema, before this example's
// => migration ever runs: only (id, title) -- no "priority" column exists yet
func createV1Schema() { // => co-15: the ORIGINAL shape, seeded with one pre-migration row
	if _, err := db.Exec("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"); err != nil { // => the exact v1 DDL -- deliberately narrower than the post-migration shape
		log.Fatalf("create v1 schema: %v", err) // => without this table the insert below has nowhere to go
	} // => the DDL branch ends

	if _, err := db.Exec("INSERT INTO tasks (title) VALUES (?)", "Buy milk"); err != nil { // => runs BEFORE migrateAddPriorityColumn below ever executes
		log.Fatalf("seed v1 row: %v", err) // => a row inserted BEFORE the "priority" column exists at all
	} // => the seed branch ends
} // => createV1Schema ends: one row, no "priority" column yet

// => migrateAddPriorityColumn runs the additive migration plus the explicit
// => backfill: ADD COLUMN first (existing rows get NULL), then UPDATE the
// => NULLs to a real value -- never dropping or renaming anything
func migrateAddPriorityColumn() { // => co-15: additive ALTER TABLE + backfill UPDATE
	if _, err := db.Exec("ALTER TABLE tasks ADD COLUMN priority INTEGER"); err != nil { // => co-15: ADD COLUMN never touches an existing column or row's data
		log.Fatalf("add column: %v", err) // => new column; every existing row reads NULL here until the backfill
	} // => the ALTER branch ends

	if _, err := db.Exec("UPDATE tasks SET priority = 3 WHERE priority IS NULL"); err != nil { // => co-15: the explicit BACKFILL step, run right after the ALTER
		log.Fatalf("backfill priority: %v", err) // => only touches the NULL rows -- gives pre-existing rows a real value
	} // => the backfill branch ends
} // => migrateAddPriorityColumn ends: additive only, existing data preserved

// => columnNames introspects the live schema -- used to PROVE the column was
// => absent, then present. PRAGMA table_info cannot take a "?" placeholder
// => (table names are grammar, not data), so this one query is unparameterized
func columnNames() (map[string]bool, error) { // => a set-shaped map, for a fast "in" check by callers
	rows, err := db.Query("PRAGMA table_info(tasks)") // => SQLite's own metadata pragma -- one row per column
	if err != nil {                                   // => the introspection itself failed
		return nil, err // => propagate: the caller decides the wire shape (a 500)
	} // => the query-failure branch ends
	defer rows.Close() // => releases the query's connection back to the pool when done

	names := map[string]bool{} // => the set under construction -- empty until rows arrive
	for rows.Next() {          // => one pass per column in the live table
		var cid int                                                                  // => the column's ordinal -- unused, but the pragma always returns it
		var name string                                                              // => the column's name -- the only field callers check
		var ctype string                                                             // => the declared type -- unused here
		var notNull int                                                              // => NOT NULL flag -- unused here
		var dflt sql.NullString                                                      // => the DEFAULT expression, possibly NULL -- unused here
		var pk int                                                                   // => primary-key position -- unused here
		if err := rows.Scan(&cid, &name, &ctype, &notNull, &dflt, &pk); err != nil { // => six pragma columns, scanned in order
			return nil, err // => propagate: a corrupt catalog row is a 500, not a skip
		} // => the scan-failure branch ends
		names[name] = true // => record this column's presence in the set
	} // => the column loop ends
	if err := rows.Err(); err != nil { // => surfaces an error the loop itself swallowed mid-iteration
		return nil, err // => propagate, same 500 path as above
	} // => the iteration-error branch ends
	return names, nil // => success: callers test names["priority"] directly
} // => columnNames ends

// => getTask reads the POST-migration shape, including the BACKFILLED
// => "priority" column -- used to PROVE the backfilled value over HTTP
func getTask(id int) (taskRow, error) { // => one row out, in its migrated shape
	var t taskRow                                                                                                 // => the typed target the row scans into
	var priority sql.NullInt64                                                                                    // => NULL-safe scan: pre-backfill rows would read Invalid here
	err := db.QueryRow("SELECT id, title, priority FROM tasks WHERE id = ?", id).Scan(&t.ID, &t.Title, &priority) // => one bound value
	if err != nil {                                                                                               // => either ErrNoRows (missing) or a genuine failure -- both propagate
		return taskRow{}, err // => the handler tests for ErrNoRows with errors.Is
	} // => the lookup-failure branch ends
	if priority.Valid { // => post-backfill rows always land here -- the migration gave every row a value
		t.Priority = int(priority.Int64) // => convert the stored integer to the struct's plain int
	} // => the valid-priority branch ends: Invalid would stay 0, but the backfill prevents that
	return t, nil // => success: the SAME row inserted before the column existed, now complete
} // => getTask ends

// ---------------------------------------------------------------------------
// HTTP layer -- the handler calls the repository above; no DDL appears in any
// handler function below this line.
// ---------------------------------------------------------------------------

// => getTaskHandler reads one migrated row: parse the path, delegate the
// => SELECT, echo the backfilled shape. Id 1 always exists in this example's
// => fixed seed data, so ErrNoRows is a defensive branch, not the lesson.
func getTaskHandler(w http.ResponseWriter, r *http.Request) { // => co-12: a typed integer path parameter
	id, err := strconv.Atoi(r.PathValue("task_id")) // => hand-typed conversion: text -> int, as in ex-14
	if err != nil {                                 // => "/tasks/abc" fails HERE, inside your own handler
		w.WriteHeader(http.StatusBadRequest) // => 400: a failed conversion gets YOUR status, never an automatic 422
		return                               // => early return: nothing below runs on an unparseable id
	} // => the unparseable-id branch ends

	row, err := getTask(id) // => co-14: delegates the SELECT in its migrated shape
	if err != nil {         // => missing row or broken database -- which one?
		if errors.Is(err, sql.ErrNoRows) { // => defensive here: id 1 always exists after the fixed seed
			w.WriteHeader(http.StatusNotFound) // => plain 404 -- this example's lesson is the migration, not the envelope
			return                             // => mapped -- the echo below only runs for the seeded row
		} // => the missing-row branch ends
		w.WriteHeader(http.StatusInternalServerError) // => a genuinely broken read is a 500, never a leak
		return                                        // => defensive: seeded reads cannot actually produce one
	} // => the error branch ends

	w.Header().Set("Content-Type", "application/json") // => response header first...
	body, _ := json.Marshal(row)                       // => includes the BACKFILLED "priority" column
	_, _ = w.Write(body)                               // => ...onto the wire with the default 200 status
} // => getTaskHandler ends

// => the routing table: one route with a typed-by-convention path placeholder
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                              // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /tasks/{task_id}", getTaskHandler) // => co-12: {task_id} arrives as text; the handler types it
	return mux                                             // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: old schema, migrate, then serve
	openDB()                                                       // => dial the file once -- both setup steps below share the pool
	createV1Schema()                                               // => v1: (id, title) only, seeded with one pre-migration row
	migrateAddPriorityColumn()                                     // => co-15: additive ALTER TABLE + backfill UPDATE, against that pre-existing data
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
