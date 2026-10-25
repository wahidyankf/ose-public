// Example 48: Type Inference Keeps Calls Clean.
//
// Explicit type arguments are usually noise: the compiler infers them from
// ordinary arguments. Map and Filter below name no types at their call sites.
package main

import "fmt" // => prints the mapped and filtered slices, types inferred

// Map transforms every element, returning a fresh slice of results.
// => [T any, U any]: input and output types vary independently of each other
// => fresh slice: inputs stay untouched, the map rule against aliasing holds
func Map[T any, U any](in []T, f func(T) U) []U { // => f maps one element
	// => preallocate exact length: one allocation, no regrowth, no waste
	out := make([]U, len(in)) // => len known up front: Grow-style hint, exact
	// => index loop: position preserved, so order survives the transform
	for i, v := range in { // => v is a copy: f receives values, never aliases
		out[i] = f(v) // => transform and place: each output lands in order
	}
	return out // => same order in, same order out: mapping preserves sequence
}

// Filter keeps elements passing the predicate, dropping the rest in order.
// => append-to-nil: result length unknown, so grow from nothing, amortized
func Filter[T any](in []T, keep func(T) bool) []T { // => predicate decides
	// => nil start: empty result stays nil, a meaningful "nothing matched"
	var out []T // => append grows it only for survivors: pay for keeps only
	// => range values: keep() reads each copy, survivors append by value
	for _, v := range in { // => copy per pass: predicate never sees aliases
		// => predicate gates: true appends, false drops, order preserved
		if keep(v) { // => the single decision point of the whole function
			out = append(out, v) // => survivors only: dropped values vanish
		}
	}
	return out // => survivors in original order: filtering never reorders
}

func main() {
	// => T=int, U=int inferred from args: no [int, int] written anywhere
	doubled := Map([]int{1, 2, 3}, func(n int) int { // => n inferred int
		// => double each element: the transform, stated in one expression
		return n * 2 // => 1->2, 2->4, 3->6: order preserved by Map
	})
	fmt.Println(doubled) // => Output: [2 4 6]
	// => T=int inferred for Filter: predicate keeps evens, drops odds
	evens := Filter([]int{1, 2, 3, 4}, func(n int) bool { // => keep iff even
		// => modulo decides: remainder 0 survives, 1 vanishes, order kept
		return n%2 == 0 // => 2 and 4 survive: [2 4], positions preserved
	})
	fmt.Println(evens) // => Output: [2 4]
}
