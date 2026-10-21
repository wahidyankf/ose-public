// Example 53: Maps Are References Too.
//
// Maps are reference types: assignment shares the same buckets, so writing
// through a parameter mutates the caller's map. No pointer needed, ever.
package main

import "fmt" // => prints the census after the sharing function runs

// tally counts word occurrences INTO the map it receives: sharing by design.
// => no pointer in the signature: maps (like slices) already share storage
// => mutating through parameters is the documented contract, stated here
func tally(counts map[string]int, words []string) { // => writes land in caller map
	// => range the words: each occurrence increments its bucket by one
	for _, w := range words { // => w copies the word: keys copy freely, safe
		counts[w]++ // => missing key starts at 0: the map rule initializes
	}
}

func main() {
	// => the caller's map: tally will fill it through the shared reference
	counts := map[string]int{} // => empty: every bucket starts nonexistent
	// => pass the map AND an alias: both names reach the same buckets
	alias := counts // => alias shares: no copy, no new buckets, one map
	// => tally writes through its parameter: caller sees every increment
	tally(counts, []string{"pagi", "sore", "pagi"}) // => pagi x2, sore x1
	// => alias reads the same buckets: pagi 2 proves the sharing, not a copy
	fmt.Println(alias["pagi"], alias["sore"]) // => Output: 2 1
	// => len counts keys: two distinct words became two buckets, exactly
	fmt.Println("keys:", len(counts)) // => Output: keys: 2
}
