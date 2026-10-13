// Example 43: Apply a schema.sql migration at startup.
//
// The schema's SOURCE OF TRUTH is the schema.sql FILE next to this module --
// not a Go string. applySchema reads the whole file and executes it as one
// script, BEFORE the app accepts a single request, and main asserts the
// "tasks" table exists before ListenAndServe -- failing FAST at boot, not on
// the first real request. A readiness-style GET /health re-verifies the same
// fact per request, the shape a load balancer could poll.
//
// Try:
// go run . &
// curl -s 127.0.0.1:8000/health
// => {"tasks_table_ready":true}
package main // => one directory, one command; one stdlib pool plus one pure-Go driver

import (
	"database/sql"  // => the stdlib pool: Open, Exec, QueryRow -- no driver of its own
	"encoding/json" // => the health body encodes through here
	"log"           // => fail-fast startup lines + fatal-on-listen
	"net/http"      // => server, mux, statuses
	"os"            // => Remove (clean start) + ReadFile (the schema's source of truth)

	_ "modernc.org/sqlite" // => the pure-Go driver itself: blank import REGISTERS the "sqlite" name (no cgo)
) // => the import block closes: net/http + database/sql are stdlib, sqlite is the one pinned dependency

// => the readiness shape: a tiny, machine-checkable signal a balancer polls
type healthResponse struct {
	TasksTableReady bool `json:"tasks_table_ready"` // => true once the migration below genuinely ran
} // => the struct closes: one boolean, JSON-tagged

// ---------------------------------------------------------------------------
// Repository layer -- the schema.sql migration plus its proof live in this
// section. The HTTP handler below only ever asks "did it succeed?"
// ---------------------------------------------------------------------------

// => db is the shared pool: safe for concurrent use, ONE handle per process
var db *sql.DB // => assigned once in applySchema, read by every call after

// => schemaPath names the migration's SOURCE OF TRUTH: the FILE, not a Go
// => string embedded in this module -- hand the same file to the sqlite3
// => shell and it applies identically
const schemaPath = "schema.sql" // => co-15: one file, next to this module, read at startup

// => applySchema reads and runs schema.sql, ONCE, at startup: open the .sql
// => file and execute it as a whole script, in file order
func applySchema() { // => co-15: the migration entry point -- called BEFORE serving
	_ = os.Remove("tasks.db") // => start every run from a clean, deterministic file
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

	script, err := os.ReadFile(schemaPath) // => reads the ENTIRE schema.sql file as one string
	if err != nil {                        // => a missing schema file is a boot failure, not a request failure
		log.Fatalf("read schema: %v", err) // => fail FAST: without the file there is no schema to apply
	} // => the read-failure branch ends

	if _, err := db.Exec(string(script)); err != nil { // => runs every statement in that file, in file order
		log.Fatalf("apply schema: %v", err) // => without this, the CREATE TABLE never reaches the file on disk
	} // => the apply-failure branch ends
} // => applySchema ends: the file, not a Go string, decided the schema

// => tableExists queries SQLite's own catalog table -- proof the migration
// => genuinely ran, not just that no error was returned
func tableExists(name string) bool { // => co-15: a plain boolean the startup assertion checks directly
	var found string                                                                                          // => the catalog row's name, when the table exists
	err := db.QueryRow("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", name).Scan(&found) // => co-14: parameterized -- "?" binds the name as DATA
	if err != nil {                                                                                           // => ErrNoRows means absent; any other error is treated as absent here too
		return false // => the startup check below turns this into a fatal boot error
	} // => the lookup-failure branch ends
	return found == name // => true only when the catalog genuinely holds this table
} // => tableExists ends

// ---------------------------------------------------------------------------
// HTTP layer -- the handler re-verifies per request what main asserted once
// at boot; no DDL appears in any handler function below this line.
// ---------------------------------------------------------------------------

// => healthHandler is a readiness-style check: it re-verifies per request
// => the same fact main asserted once at boot
func healthHandler(w http.ResponseWriter, r *http.Request) { // => co-08: a readiness-style check a load balancer could poll
	w.Header().Set("Content-Type", "application/json")                             // => response header first...
	body, _ := json.Marshal(healthResponse{TasksTableReady: tableExists("tasks")}) // => re-verified per request, from the live catalog
	_, _ = w.Write(body)                                                           // => ...onto the wire with the default 200 status
} // => healthHandler ends: a tiny, machine-checkable readiness signal

// => the routing table: one route, method-prefixed so only GET matches
func newHandler() http.Handler { // => wiring, extracted so a test could reuse it
	mux := http.NewServeMux()                    // => the routing table: exactly one route in this example
	mux.HandleFunc("GET /health", healthHandler) // => co-08: GET returns the readiness signal
	return mux                                   // => the mux IS an http.Handler, ready to serve or wrap
} // => newHandler ends; main hands this value straight to ListenAndServe

func main() { // => the executable entry point: migrate, verify, then serve
	applySchema()              // => co-15: runs BEFORE the app accepts a single request
	if !tableExists("tasks") { // => fails FAST, at boot time, not on the first real request
		log.Fatal("migration failed: tasks table missing") // => a crash here is far cheaper than a 500 on the first request
	} // => the verification branch ends: verified before ListenAndServe finishes booting
	defer db.Close()                                               // => releases the pool when the process exits
	log.Println("listening on 127.0.0.1:8000")                     // => the operator's green light
	log.Fatal(http.ListenAndServe("127.0.0.1:8000", newHandler())) // => serve until interrupted
} // => main ends
