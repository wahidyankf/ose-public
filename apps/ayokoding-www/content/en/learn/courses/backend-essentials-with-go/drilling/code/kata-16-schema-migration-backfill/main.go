// Kata 16: Apply an additive schema migration with backfill.
//
// Seed the old shape, then ALTER TABLE ADD COLUMN plus an explicit
// backfill. Nothing is renamed or dropped, so old code keeps working.
// A real in-memory SQLite database proves every pre-existing row gains
// the new column with a safe default.
package main

import (
	"database/sql" // => the stdlib pool: Open, Exec, Query
	"fmt"          // => prints the migrated rows
	"log"          // => fail-fast on any self-check mismatch

	_ "modernc.org/sqlite" // => pure-Go driver: blank import registers the "sqlite" name (no cgo)
)

// TaskV2 is the post-migration row shape.
type TaskV2 struct { // => co-15: one new column, nothing removed
	ID       int    // => untouched by the migration
	Title    string // => untouched by the migration
	Archived bool   // => the new column: backfilled to false for old rows
}

func columnExists(db *sql.DB, column string) bool {
	rows, err := db.Query("PRAGMA table_info(tasks)") // => SQLite metadata: one row per column
	if err != nil {                                   // => introspection itself failed
		log.Fatalf("pragma: %v", err)
	}
	defer rows.Close() // => releases the query connection
	for rows.Next() {  // => one pass per live column
		var cid int                                                                  // => ordinal, unused but always returned
		var name string                                                              // => the column name callers check
		var ctype string                                                             // => declared type, unused here
		var notNull int                                                              // => NOT NULL flag, unused here
		var dflt sql.NullString                                                      // => default expression, possibly NULL
		var pk int                                                                   // => primary-key position, unused here
		if err := rows.Scan(&cid, &name, &ctype, &notNull, &dflt, &pk); err != nil { // => six pragma columns in order
			log.Fatalf("scan pragma: %v", err)
		}
		if name == column { // => found the migrated column
			return true
		}
	}
	if err := rows.Err(); err != nil { // => mid-iteration error surfaces here
		log.Fatalf("pragma rows: %v", err)
	}
	return false // => column absent in the live schema
}

func main() {
	db, err := sql.Open("sqlite", ":memory:") // => in-memory: zero files, zero setup
	if err != nil {                           // => Open validates the driver name
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()                  // => releases the pool when main returns
	db.SetMaxOpenConns(1)             // => one connection: memory DBs must share one handle
	if err := db.Ping(); err != nil { // => Ping actually dials the database
		log.Fatalf("ping db: %v", err)
	}

	if _, err := db.Exec("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)"); err != nil { // => co-15: the original shape, no archived column
		log.Fatalf("create v1: %v", err)
	}
	if _, err := db.Exec("INSERT INTO tasks (title) VALUES (?), (?)", "Write the report", "Ship the release"); err != nil { // => rows predating the migration
		log.Fatalf("seed v1: %v", err)
	}
	if columnExists(db, "archived") { // => the new column must be absent before migrating
		log.Fatalf("archived should not exist before migration")
	}

	if _, err := db.Exec("ALTER TABLE tasks ADD COLUMN archived INTEGER"); err != nil { // => co-15: additive only, never a rename or drop
		log.Fatalf("add column: %v", err)
	}
	if _, err := db.Exec("UPDATE tasks SET archived = 0 WHERE archived IS NULL"); err != nil { // => co-15: explicit backfill for pre-existing rows
		log.Fatalf("backfill: %v", err)
	}
	if !columnExists(db, "archived") { // => the new column must be present after migrating
		log.Fatalf("archived should exist after migration")
	}

	rows, err := db.Query("SELECT id, title, archived FROM tasks ORDER BY id") // => read the migrated shape
	if err != nil {                                                            // => the migrated read itself failed
		log.Fatalf("select migrated: %v", err)
	}
	defer rows.Close()    // => releases the query connection
	var migrated []TaskV2 // => every pre-existing row in its new shape
	for rows.Next() {     // => one pass per row, id order
		var t TaskV2                                                  // => typed target for this row
		var archived sql.NullInt64                                    // => NULL-safe scan: pre-backfill rows would read Invalid
		if err := rows.Scan(&t.ID, &t.Title, &archived); err != nil { // => three migrated columns in order
			log.Fatalf("scan row: %v", err)
		}
		t.Archived = archived.Valid && archived.Int64 != 0 // => backfilled 0 means false
		migrated = append(migrated, t)                     // => grow the result one row at a time
	}
	if err := rows.Err(); err != nil { // => mid-iteration error surfaces here
		log.Fatalf("migrated rows: %v", err)
	}
	fmt.Println(migrated) // => Output: [{1 Write the report false} {2 Ship the release false}]

	if len(migrated) != 2 { // => co-15: additive means no row is dropped or merged
		log.Fatalf("migrated len = %d, want 2", len(migrated))
	}
	if migrated[0].ID != 1 || migrated[1].ID != 2 { // => co-15: identity and order preserved
		log.Fatalf("ids = [%d %d], want [1 2]", migrated[0].ID, migrated[1].ID)
	}
	for _, t := range migrated { // => every pre-existing row gained a safe default
		if t.Archived { // => backfilled to false, nothing became invalid
			log.Fatalf("row %d archived should be false", t.ID)
		}
	}
	fmt.Println("kata-16 OK") // => the self-check line this track greps for
}
