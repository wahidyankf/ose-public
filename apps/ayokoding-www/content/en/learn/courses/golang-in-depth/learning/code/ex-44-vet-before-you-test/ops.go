// Invoice totals: vet-clean verbs, tested arithmetic, honest errors.
// => Sprintf with matched verbs: vet's printf check passes on this file
// => negative quantities rejected: domain rule, tested below, vetted above
package main

import "fmt" // => Sprintf formats the validated line items below

// LineItem is one invoice row: description plus a non-negative quantity.
// => exported fields: vet and tests read them directly, no accessors needed
type LineItem struct { // => the row shape: description, quantity, unit price
	Desc  string // => what was sold: rendered verbatim into the receipt
	Qty   int    // => how many: negative values are rejected, never totaled
	Price int    // => unit price in cents: ints keep money exact, no floats
}

// Total sums the extended prices, rejecting negative quantities outright.
// => (int, error): honest about the one input shape it cannot serve
func Total(items []LineItem) (int, error) { // => total cents plus possible refusal
	// => accumulator: grows by Qty*Price per row, exact integer math only
	sum := 0 // => starts at zero: empty invoice totals to zero, correctly
	// => index loop: the row number feeds the error context below
	for i, it := range items { // => i names the row for the rejection message
		// => negative quantity: the domain violation this function refuses
		if it.Qty < 0 { // => guard per row: one bad row fails the invoice
			// => %d for the row, %q for the desc: verbs match their values
			return 0, fmt.Errorf("row %d (%q): negative qty", i, it.Desc)
		}
		// => extended price: quantity times unit price, added to the sum
		sum += it.Qty * it.Price // => exact cents: no float rounding anywhere
	}
	return sum, nil // => every row valid: the exact total with a nil error
}
