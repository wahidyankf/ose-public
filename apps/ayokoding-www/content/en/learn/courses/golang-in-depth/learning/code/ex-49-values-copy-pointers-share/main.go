// Example 49: Values Copy, Pointers Share.
//
// Assignment copies the value; only pointers share the original. The wallet
// below is spent twice: once through a copy, once through the real thing.
package main

import "fmt" // => prints the balance after the copy-spend and the share-spend

// Wallet holds funds; methods choose copy or share semantics by receiver.
// => value receiver COPIES: mutations inside vanish when the call returns
// => pointer receiver SHARES: mutations land on the caller's original
type Wallet struct { // => tiny struct: copying it is cheap, sharing explicit
	funds int // => the balance: copied or shared depending on the receiver
}

// SpendCopy deducts from a COPY: the caller's wallet never notices.
// => value receiver: the method runs on a snapshot, then discards it
func (w Wallet) SpendCopy(amount int) { // => w is a copy: writes die here
	w.funds -= amount // => deducts from the snapshot only: invisible outside
}

// Spend deducts from the SHARED wallet through a pointer receiver.
// => pointer receiver: the method reaches the caller's original storage
func (w *Wallet) Spend(amount int) { // => w points home: writes survive
	w.funds -= amount // => deducts from the original: the caller sees it
}

func main() {
	// => one wallet, two spends: copy first (no effect), pointer second
	w := Wallet{funds: 100} // => the original: 100 units, owned by main
	// => copy-spend: method runs on a snapshot; the original keeps 100
	w.SpendCopy(40) // => 40 deducted from a copy: discarded on return
	// => balance untouched: copies isolate, exactly as value semantics promise
	fmt.Println("after copy-spend:", w.funds) // => Output: after copy-spend: 100
	// => pointer-spend: method reaches the original; 40 really leaves
	w.Spend(40) // => Go auto-takes &w here: sharing without ceremony
	// => balance moved: sharing is explicit in the receiver, visible here
	fmt.Println("after pointer-spend:", w.funds) // => Output: after pointer-spend: 60
}
