package main

import "fmt"

func main() { // => Deletes one entry before iteration.
	counts := map[string]int{"ok": 1, "warn": 2} // => Two initial entries.
	delete(counts, "warn")                       // => Only "ok" remains.
	// => The single remaining key makes this output deterministic.
	for key, value := range counts { // => Only the ok entry can be visited.
		fmt.Println(key, value) // => Output: ok 1.
	}
}
