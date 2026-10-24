// Example 47: Generic Containers Hold Anything.
//
// A generic Stack stores any element type with identical push/pop logic. The
// container owns the empty-pop answer, so callers never guess at zero values.
package main

import "fmt" // => prints string pops, then int pops, then the empty verdict

// Stack is a last-in first-out container for any element type T.
// => [T any]: no operations needed on elements, so the loosest constraint
// => slice-backed: Push appends, Pop reslices, storage grows amortized
type Stack[T any] struct { // => T fixed at declaration: one type per stack
	items []T // => hidden slice: behavior crosses, representation rests
}

// Push adds an element on top in amortized constant time.
// => pointer receiver: the slice header update must stick to the stack
func (s *Stack[T]) Push(v T) { // => T matches the stack's own element type
	s.items = append(s.items, v) // => append grows: the amortized trick again
}

// Pop removes the top element, reporting presence like a map lookup.
// => (T, bool): the value plus ok, so empty stacks answer honestly
func (s *Stack[T]) Pop() (T, bool) { // => zero T plus false when empty
	// => empty: return the zero value of T plus false: no panic path exists
	if len(s.items) == 0 { // => length check before indexing, always
		var zero T         // => zero of whatever T is: "" for strings, 0 for ints
		return zero, false // => honest absence: callers branch on the flag
	}
	// => top lives at the end: last index holds the most recent push
	top := s.items[len(s.items)-1]     // => copy out before reslicing away
	s.items = s.items[:len(s.items)-1] // => reslice drops it: no copy, O(1)
	return top, true                   // => the value plus true: a real pop
}

func main() {
	// => string stack: words push in order, pop in reverse, LIFO proven
	var words Stack[string] // => T is string for this whole stack
	words.Push("satu")      // => bottom: leaves last
	words.Push("dua")       // => top: leaves first
	// => pop returns ("dua", true): LIFO order, presence confirmed
	fmt.Println(words.Pop()) // => Output: dua true
	// => int stack: same logic, different T, zero confusion between them
	var nums Stack[int] // => T is int: a separate instantiation entirely
	// => empty pop: (0, false), never a panic, never a guessed zero
	fmt.Println(nums.Pop()) // => Output: 0 false
}
