// Example 5: Maps Return Two Values.
//
// A map lookup returns the value plus a presence flag, separating a stored
// zero from a missing key. The flag, not the value, decides the branch.
package main

import "fmt" // => prints stock answers for present and missing keys alike

func main() {
	// => literal construction: keys and starting stock in one expression
	stock := map[string]int{"rice": 40, "oat": 0} // => oat is present but empty
	// => the comma-ok idiom: value first, presence flag second, always
	qty, ok := stock["oat"] // => qty 0, ok true: present with zero stock
	// => branch on ok, never on qty: zero is a legitimate stored value
	if ok { // => the key exists, so the count is trustworthy
		// => Println takes mixed args: label the number for the reader
		fmt.Println("oat stock:", qty) // => Output: oat stock: 0
	}
	// => same lookup shape for a key nobody ever stored under
	qty, ok = stock["tea"] // => qty 0, ok false: absent, zero means nothing
	// => without ok, tea's zero would look exactly like oat's zero
	if !ok { // => absence is its own answer, distinct from "none left"
		fmt.Println("tea unknown") // => Output: tea unknown
	}
	// => assignment through the key inserts or replaces unconditionally
	stock["tea"] = 12 // => now tea exists: a later lookup reports ok true
	// => delete removes a key; looking it up afterwards reports ok false
	delete(stock, "rice")   // => rice is gone: presence flag flips to false
	fmt.Println(len(stock)) // => Output: 2
}
