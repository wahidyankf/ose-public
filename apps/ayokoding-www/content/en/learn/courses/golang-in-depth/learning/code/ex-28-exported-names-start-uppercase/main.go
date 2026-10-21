// Example 28: Exported Names Start Uppercase.
//
// Capitalization is the access modifier. main.go uses only the exported
// surface from shapes.go; the lowercase fields stay unreachable by design.
package main

import "fmt" // => prints areas computed through the exported API only

func main() {
	// => NewRect is uppercase: callable across the file boundary, by rule
	r := NewRect(3, -4) // => negative height mirrors to 4 inside
	// => Area is uppercase: behavior crosses, representation does not
	fmt.Println(r.Area()) // => Output: 12
	// => zero value still behaves: fields default to 0, Area to 0
	var z Rect            // => no constructor needed for the degenerate rectangle
	fmt.Println(z.Area()) // => Output: 0
}
