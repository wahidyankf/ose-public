// Ledger balances: the tiny domain the test helper below asserts on.
// => map-backed: missing accounts read as zero, the familiar map rule
// => two functions: credit mutates, balance reads, tests pin both together
package main

// Credit adds amount to the account, creating it on first use.
// => missing key starts at zero: the map rule does the initialization
func Credit(balances map[string]int, account string, amount int) { // => mutates
	balances[account] += amount // => the only write path: tests pin it here
}

// Balance reports the account total, zero for accounts never credited.
// => read-only: safe to call anywhere, including inside assertions
func Balance(balances map[string]int, account string) int { // => pure read
	return balances[account] // => missing key: zero, per the map rule
}
