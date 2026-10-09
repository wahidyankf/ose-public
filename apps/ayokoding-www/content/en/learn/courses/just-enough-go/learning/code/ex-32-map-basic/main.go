package main

import "fmt"

func main() { // => Starts with one map entry and inserts another.
	counts := map[string]int{"ok": 1} // => The key "ok" starts at 1.
	counts["warn"] = 2                // => Assignment inserts a second key.
	fmt.Println(counts)               // => Both entries appear; map order is unspecified.
}
