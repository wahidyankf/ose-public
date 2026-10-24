// Example 66: Comment the Why, Not the What.
//
// Restating code adds noise; recording the DECISION adds value. Both discount
// functions below compute identically; only one explains its odd constant.
package main

import "fmt" // => prints both discounts: equal answers, unequal comments

// DiscountPlain computes correctly and comments nothing: the reader guesses.
// => correct math, zero context: 0.85 is a magic number with no provenance
// => the function WORKS: the complaint is maintainability, not behavior
func DiscountPlain(total int) int { // => undocumented constant, valid output
	// => 0.85 unexplained: policy? bug? nobody reading this can tell
	return int(float64(total) * 0.85) // => same math as below, mute about why
}

// Discount explains its constant: policy 7/2026 grants members 15 percent off.
// => the comment records the DECISION (board policy) behind the number
// => future readers update policy in one place instead of reverse-engineering
func Discount(total int) int { // => documented constant, identical output
	// => member policy 7/2026: 15 percent off, reviewed yearly each January
	return int(float64(total) * 0.85) // => 0.85 IS the policy: change both together
}

func main() {
	// => equal outputs prove the difference is documentation, not behavior
	fmt.Println(DiscountPlain(1000), Discount(1000)) // => Output: 850 850
	// => the lesson: when the constant changes, only Discount says where
	fmt.Println("documented:", Discount(2000)) // => Output: documented: 1700
}
