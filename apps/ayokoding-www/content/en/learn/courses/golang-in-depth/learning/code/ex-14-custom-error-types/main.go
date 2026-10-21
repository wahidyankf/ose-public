// Example 14: Custom Error Types Carry Fields.
//
// A custom error type pairs a message with the values needed to fix the
// problem: which account, how much was asked, how much actually exists.
package main

import "fmt" // => prints the decline message plus the shortfall math

// Overdraft reports a withdrawal the balance cannot cover, with numbers.
// => value type (not pointer): small, copyable, comparable field by field
type Overdraft struct { // => the domain failure, fully self-describing
	Account string // => which account refused: the routing fact
	Want    int    // => how much was asked: the request fact
	Have    int    // => how much exists: the constraint fact
}

// Error renders the human sentence from the three machine-readable facts.
// => value receiver: both Overdraft and *Overdraft satisfy error this way
func (e Overdraft) Error() string { // => one method joins the error interface
	// => Sprintf keeps message formatting in exactly one place per type
	return fmt.Sprintf("account %s: want %d, have %d", e.Account, e.Want, e.Have)
}

// withdraw subtracts when the balance covers it, or declines with the facts.
// => returns the concrete type directly: callers CAN compare or extract it
func withdraw(balances map[string]int, account string, amount int) error {
	// => read the balance first: the decision needs the current number
	have := balances[account] // => zero when the account never existed
	// => the policy in one comparison: want more than have means decline
	if amount > have { // => breach: build the failure WITH its evidence
		// => struct literal carries all three facts: no text parsing later
		return Overdraft{Account: account, Want: amount, Have: have}
	}
	// => covered: mutate the ledger and report success with nil
	balances[account] = have - amount // => the only mutation lives here
	return nil                        // => nil error: the withdrawal landed
}

func main() {
	// => ledger with one funded account for the two attempts below
	balances := map[string]int{"sari": 100} // => 100 units, single account
	// => covered withdrawal: balance drops, error stays nil
	if err := withdraw(balances, "sari", 40); err != nil { // => 40 <= 100
		fmt.Println("unexpected:", err) // => unreachable on this input
	} else {
		fmt.Println("balance:", balances["sari"]) // => Output: balance: 60
	}
	// => overdraft: the failure carries account, want, and have together
	if err := withdraw(balances, "sari", 90); err != nil { // => 90 > 60
		fmt.Println(err) // => Output: account sari: want 90, have 60
	}
}
