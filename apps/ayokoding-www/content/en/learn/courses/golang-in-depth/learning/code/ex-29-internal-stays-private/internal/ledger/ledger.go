// Package ledger is the private balance book of this module.
// => internal/ path: importable only from inside golangindepth/ex29shop
// => the compiler rejects outside imports: privacy is structural, not social
package ledger

// Book tracks balances importers can read but only this package can change.
// => exported type with hidden map: reads cross, writes stay inside
type Book struct { // => the private ledger, publicly readable
	balances map[string]int // => lowercase: mutation needs a method below
}

// New starts an empty book: the map is made here so callers never see nil.
// => constructor initializes the map: zero Book would panic on first write
func New() *Book { // => pointer: methods mutate shared state, not copies
	return &Book{balances: map[string]int{}} // => ready map, zero balances
}

// Credit adds funds to an account, creating it on first use.
// => exported method: the single sanctioned mutation path for outsiders
func (b *Book) Credit(account string, amount int) { // => pointer: writes stick
	b.balances[account] += amount // => missing key starts at 0, then adds
}

// Balance reports the current funds, zero for accounts never credited.
// => read-only method: safe on any Book, including one never credited
func (b *Book) Balance(account string) int { // => value result, no error needed
	return b.balances[account] // => missing key reads as 0: the map rule
}
