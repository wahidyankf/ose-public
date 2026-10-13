// Kata 05: Detect a string-concatenated SQL injection vs a parameterized query.
//
// One query builds SQL by concatenating user input (unsafe); the other
// binds it as a parameter (safe). A real in-memory SQLite database proves
// the malicious payload hijacks the unsafe query but stays inert data in
// the safe one.
package main

import (
	"database/sql" // => the stdlib pool: Open, Exec, Query -- no driver of its own
	"fmt"          // => prints both SQL shapes and both row counts
	"log"          // => fail-fast on any self-check mismatch
	"strings"      // => the crude injection detector below scans for tokens

	_ "modernc.org/sqlite" // => pure-Go driver: blank import registers the "sqlite" name (no cgo)
)

// BuildUnsafeQuery concatenates input directly into SQL text: never do this.
func BuildUnsafeQuery(status string) string { // => co-14/co-20: the injection-unsafe way
	return fmt.Sprintf("SELECT * FROM tasks WHERE status = '%s'", status) // => user input lands directly in SQL text
}

// BuildSafeQuery keeps the shape fixed and binds input as data.
func BuildSafeQuery(status string) (string, []any) { // => co-14: parameterized, the safe way
	return "SELECT * FROM tasks WHERE status = ?", []any{status} // => the driver binds params, never concatenates
}

// IsInjectionAttempt is a crude mocked detector for this kata.
func IsInjectionAttempt(input string) bool { // => flags classic breakout tokens
	suspicious := []string{"'", "--", ";", " OR ", " or "} // => single-quote breakout, comment, stacking
	for _, token := range suspicious {                     // => one substring check per token
		if strings.Contains(input, token) { // => any hit means suspicious
			return true
		}
	}
	return false // => a plain value carries none of these tokens
}

func countRows(db *sql.DB, query string, args ...any) int {
	rows, err := db.Query(query, args...) // => args empty for unsafe, one bound value for safe
	if err != nil {                       // => the query itself failed to start
		log.Fatalf("query %q: %v", query, err)
	}
	defer rows.Close() // => releases the query connection back to the pool
	n := 0             // => rows observed so far
	for rows.Next() {  // => one pass per returned row
		var id int                                      // => the primary key column, scanned then ignored
		var status string                               // => the status column, scanned then ignored
		if err := rows.Scan(&id, &status); err != nil { // => column order matches SELECT *
			log.Fatalf("scan: %v", err)
		}
		n++ // => one more row matched this query shape
	}
	if err := rows.Err(); err != nil { // => surfaces a mid-iteration error
		log.Fatalf("rows: %v", err)
	}
	return n // => how many rows this query shape matched
}

func main() {
	db, err := sql.Open("sqlite", ":memory:") // => in-memory database: zero files, zero setup
	if err != nil {                           // => Open validates the driver name
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()                  // => releases the pool when main returns
	db.SetMaxOpenConns(1)             // => one connection: SQLite memory DBs dislike concurrent writers
	if err := db.Ping(); err != nil { // => Ping actually dials the database
		log.Fatalf("ping db: %v", err)
	}

	if _, err := db.Exec("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT NOT NULL)"); err != nil { // => the kata table
		log.Fatalf("create table: %v", err)
	}
	if _, err := db.Exec("INSERT INTO tasks (status) VALUES (?), (?), (?)", "done", "open", "done"); err != nil { // => two done, one open
		log.Fatalf("seed: %v", err)
	}

	malicious := "done' OR '1'='1" // => classic injection payload targeting the status filter

	unsafeSQL := BuildUnsafeQuery(malicious)       // => the payload becomes part of SQL text itself
	safeSQL, safeArgs := BuildSafeQuery(malicious) // => the payload stays data, never syntax
	fmt.Println(unsafeSQL)                         // => Output: SELECT * FROM tasks WHERE status = 'done' OR '1'='1'
	fmt.Println(safeSQL, safeArgs)                 // => Output: SELECT * FROM tasks WHERE status = ? [done' OR '1'='1]

	unsafeCount := countRows(db, unsafeSQL)          // => the hijacked shape matches every row
	safeCount := countRows(db, safeSQL, safeArgs...) // => the fixed shape matches no literal status
	fmt.Println(unsafeCount, safeCount)              // => Output: 3 0

	if !strings.Contains(unsafeSQL, "OR '1'='1'") { // => the payload escaped the string literal boundary
		log.Fatalf("unsafe SQL should contain the injected OR, got %q", unsafeSQL)
	}
	if safeSQL != "SELECT * FROM tasks WHERE status = ?" { // => structurally identical regardless of input
		log.Fatalf("safe SQL changed shape: %q", safeSQL)
	}
	if unsafeCount != 3 { // => the injection widened the match to the whole table
		log.Fatalf("unsafe count = %d, want 3", unsafeCount)
	}
	if safeCount != 0 { // => the payload as bound data matches no real status
		log.Fatalf("safe count = %d, want 0", safeCount)
	}
	if !IsInjectionAttempt(malicious) { // => flags the suspicious payload
		log.Fatalf("malicious input should be flagged")
	}
	if IsInjectionAttempt("done") { // => a benign filter value passes clean
		log.Fatalf("benign input should not be flagged")
	}
	fmt.Println("kata-05 OK") // => the self-check line this track greps for
}
