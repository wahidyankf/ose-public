// Example 6: Range Gives Index and Copy.
//
// Range hands you the index plus a COPY of each element, so writing to the
// loop variable never touches the slice. Index back in to mutate it.
package main

import "fmt" // => prints the slice before and after each loop style

func main() {
	// => five scores; the loops below try two ways to add a bonus point
	scores := []int{70, 75, 80} // => shared input for both loop styles
	// => v is a fresh copy per pass: assigning it changes nothing stored
	for _, v := range scores { // => blank index: values only, still copies
		v++ // => increments the copy, then discards it: a silent no-op
	}
	// => the slice is untouched: the copy rule bit exactly as documented
	fmt.Println(scores) // => Output: [70 75 80]
	// => i is the position: writing through it reaches the backing array
	for i := range scores { // => index only: no copies made at all
		// => scores[i] names the stored element, not a throwaway copy
		scores[i]++ // => mutation lands where later reads can see it
	}
	// => every element grew by one: index writes are the mutation path
	fmt.Println(scores) // => Output: [71 76 81]
	// => range over a map visits keys in no promised order, by design
	seen := map[string]int{"a": 1, "b": 2} // => tiny map for the order demo
	// => count visits instead of printing order: order is not contractual
	n := 0                // => visit counter: proves both keys arrived, order aside
	for k := range seen { // => single variable ranges map keys
		_ = k // => used only to visit: the blank-free discard silences vet
		n++   // => one increment per visited key, whatever the order
	}
	fmt.Println("visited:", n) // => Output: visited: 2
}
