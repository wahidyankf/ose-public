// Kata 18: A tiny per-call dependency-injection factory.
//
// Mimics what a Depends-style provider does: resolve a connection,
// hand it to the handler, then close it. The handler never wires
// anything itself.
package main

import (
	"fmt" // => prints the handler result and the remaining pool size
	"log" // => fail-fast on any self-check mismatch
)

// Connection stands in for a real database connection object.
type Connection struct { // => the per-request resource being injected
	Name   string // => which pooled connection this is
	Closed bool   // => teardown marker the kata asserts on
}

// Close releases the connection back to (or out of) the pool.
func (c *Connection) Close() { // => the teardown step the factory owns
	c.Closed = true
}

// GetConnection pops one connection from the mocked pool.
func GetConnection(pool *[]*Connection) *Connection { // => co-23: a provider handing out one connection per call
	n := len(*pool) // => how many remain before this call
	if n == 0 {     // => empty pool is a kata bug, not a silent nil
		log.Fatalf("connection pool exhausted")
	}
	conn := (*pool)[n-1]  // => take the last entry, like a stack
	*pool = (*pool)[:n-1] // => shrink the pool by one
	return conn           // => the ready-to-use resource
}

// RunWithDependency resolves, injects, then tears down around the handler.
func RunWithDependency(provider func() *Connection, handler func(*Connection) string) string { // => co-23: mimics Depends per request
	conn := provider()   // => co-23: the factory resolves; the handler never calls the provider
	defer conn.Close()   // => co-23: teardown belongs to the factory too, even on handler panic
	return handler(conn) // => co-23: the handler just receives a ready resource
}

// ListTasksHandler is a thin handler with no wiring logic itself.
func ListTasksHandler(conn *Connection) string { // => co-08: no provider calls, no Close calls here
	return fmt.Sprintf("tasks from %s", conn.Name)
}

func main() {
	pool := []*Connection{{Name: "conn-a"}, {Name: "conn-b"}} // => co-23: a mocked connection pool
	provider := func() *Connection {                          // => bound once, reused per simulated request
		return GetConnection(&pool)
	}

	var used *Connection                                // => captured so teardown is assertable
	capturingHandler := func(conn *Connection) string { // => wraps the real handler to capture the injected conn
		used = conn                   // => remember which connection was injected
		return ListTasksHandler(conn) // => delegate to the thin handler
	}
	result := RunWithDependency(provider, capturingHandler) // => request 1: injected with conn-b (last popped)
	fmt.Println(result)                                     // => Output: tasks from conn-b
	fmt.Println(len(pool))                                  // => Output: 1

	if result != "tasks from conn-b" { // => the last-pooled connection served this request
		log.Fatalf("result = %q, want tasks from conn-b", result)
	}
	if len(pool) != 1 { // => co-23: exactly one connection was handed out
		log.Fatalf("pool len = %d, want 1", len(pool))
	}
	if used == nil || !used.Closed { // => the factory closed the injected connection after the handler returned
		log.Fatalf("injected connection must be closed after use")
	}
	fmt.Println("kata-18 OK") // => the self-check line this track greps for
}
