// Example 20: Format Output with fmt Verbs.
//
// The fmt verbs render values for humans (%v), debuggers (%#v), and positional
// templates (%[1]d). Picking the right verb for the audience is the skill.
package main

import "fmt" // => Sprintf builds strings; Printf writes them directly

// Order is the single value this example renders three different ways.
// => struct with two fields: enough shape to show every verb below
type Order struct { // => plain data: verbs do all the rendering work
	ID    int // => numeric field: %d renders it in decimal, %v too
	Total int // => second number: positional verbs will reuse the first
}

func main() {
	// => one order, three audiences: human, debugger, and template
	o := Order{ID: 7, Total: 1500} // => the value every verb below renders
	// => %v: default human rendering, structs as {field values}
	fmt.Printf("human: %v\n", o) // => Output: human: {7 1500}
	// => %#v: Go-syntax rendering, pasteable back into source as a literal
	fmt.Printf("debug: %#v\n", o) // => Output: debug: main.Order{ID:7, Total:1500}
	// => %[1]d reuses argument 1 explicitly: repeat a value without repeating it
	fmt.Printf("repeat: %[1]d twice %[1]d\n", o.ID) // => Output: repeat: 7 twice 7
	// => Sprintf returns the string instead of printing: build, then decide
	s := fmt.Sprintf("order-%d", o.ID) // => zero-padded IDs would use %04d
	fmt.Println(s)                     // => Output: order-7
}
