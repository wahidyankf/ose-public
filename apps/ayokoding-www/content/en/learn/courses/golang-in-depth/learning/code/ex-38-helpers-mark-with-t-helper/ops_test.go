// Helper-marked assertions for the ledger: failures point at cases.
// => mustCheck helper: one assertion shape reused by every balance case
// => t.Helper inside: failure lines name the CALLER, never this helper
package main

import "testing" // => Helper lives on *testing.T: mark before asserting

// mustCheck asserts one balance and names the case on failure.
// => t.Helper() FIRST: marks this frame as infrastructure, not the failure
// => shape: ledger, account, want: the three facts every balance case needs
func mustCheck(t *testing.T, balances map[string]int, account string, want int) {
	t.Helper() // => failure lines skip this frame: they name the caller instead
	// => single assertion: got versus want, with the account in the message
	if got := Balance(balances, account); got != want { // => the only check
		// => Errorf (not Fatalf): sibling cases still run after one fails
		t.Errorf("Balance(%q) = %d, want %d", account, got, want) // => names all
	}
}

// TestLedgerBalances runs three cases through the one marked helper.
// => setup once: a credited sari plus a stranger budi nobody ever credited
func TestLedgerBalances(t *testing.T) { // => three asserts, one helper, zero dup
	// => shared fixture: credit sari once, then assert three separate facts
	balances := map[string]int{}  // => empty ledger: Credit builds it up
	Credit(balances, "sari", 100) // => the single mutation under test here
	// => case one: credited account reads back exactly what was credited
	mustCheck(t, balances, "sari", 100) // => failure line: THIS line, not helper
	// => case two: strangers read zero: the map rule, pinned as a promise
	mustCheck(t, balances, "budi", 0) // => absence is a checked behavior too
	// => case three: credit accumulates: second credit adds, never replaces
	Credit(balances, "sari", 25)        // => second mutation on the same account
	mustCheck(t, balances, "sari", 125) // => 100 + 25: accumulation, not overwrite
}
