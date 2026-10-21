// Example 78: Read a Whole Program Top Down.
//
// Idiomatic programs read top-down: types, pure logic, thin main wiring input
// to output. This finale settles fixed dues through a ledger in that order.
package main

import "fmt" // => prints the settlement report the ledger logic produces

// Due is one member's obligation: who owes, how much, settled or not.
// => plain data: no methods, no validation here: logic lives in settle below
type Due struct { // => the domain, stated once at the top where readers start
	Member string // => who owes: the identity key for the report line
	Amount int    // => how much: non-negative by the fixed input below
}

// settle marks paid members and totals the collected amount, purely.
// => (paid []string, total int): no printing, no globals: testable in isolation
// => paid set via map: membership checks stay O(1) however many members come
func settle(dues []Due, paid map[string]bool) ([]string, int) { // => pure logic
	// => cleared names in input order: deterministic report, no sorting needed
	cleared := []string{} // => empty: appends grow it per settled due
	// => total accumulates only settled amounts: unpaid dues never add
	total := 0 // => starts at zero: the additive identity, stated once
	// => single pass: membership check decides, accumulation follows
	for _, d := range dues { // => input order preserved: report reads naturally
		// => paid map decides: true settles, false skips, missing reads false
		if paid[d.Member] { // => map rule: absent members are simply unpaid
			cleared = append(cleared, d.Member) // => settled: name the member
			total += d.Amount                   // => settled: collect the amount
		}
	}
	return cleared, total // => both answers: who settled, how much collected
}

func main() {
	// => fixed dues: three members, fixed amounts, deterministic by construction
	dues := []Due{{"sari", 50}, {"budi", 75}, {"citra", 25}} // => the ledger
	// => fixed payments: sari and citra paid, budi did not: the scenario
	paid := map[string]bool{"sari": true, "citra": true} // => budi absent: unpaid
	// => thin main: call settle, print the report: no logic lives here at all
	cleared, total := settle(dues, paid) // => the single logic call, wired plainly
	// => report: settled names in input order plus the exact collected total
	fmt.Println(cleared, total) // => Output: [sari citra] 150
}
