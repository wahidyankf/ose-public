// Example 22: Encode Structs to JSON.
//
// Struct tags map Go fields to JSON keys, omitempty drops what is unset, and
// decoding is strict only when you ask it to be. Both directions below.
package main

import (
	"encoding/json" // => Marshal encodes; Unmarshal decodes with tags honored
	"fmt"           // => prints the JSON text and the decoded struct back
)

// Product is the wire shape: tags decide the JSON keys, not field names.
// => exported fields only: encoding ignores unexported ones silently
// => omitempty on Stock: zero stock vanishes instead of shipping as 0
type Product struct { // => the single source of truth for both directions
	SKU   string `json:"sku"`             // => lowercase key, always present
	Price int    `json:"price_cents"`     // => key need not resemble the field
	Stock int    `json:"stock,omitempty"` // => absent when zero: smaller payloads
}

func main() {
	// => encode: struct to bytes, tags choosing every key in the output
	p := Product{SKU: "oat-1", Price: 1500} // => Stock 0: omitted below
	// => Marshal never fails on this shape: no channels or funcs inside
	data, err := json.Marshal(p) // => compact JSON, keys from tags
	// => check anyway: future field types could introduce failure modes
	if err != nil { // => unreachable today, structurally required
		fmt.Println("unexpected:", err) // => kept so the habit transfers
	}
	fmt.Println(string(data)) // => Output: {"sku":"oat-1","price_cents":1500}
	// => decode: bytes back to struct, unknown keys ignored by default
	var back Product // => zero Product: every field starts at its zero value
	// => Unmarshal matches keys to tags: sku fills SKU, price_cents fills Price
	if err := json.Unmarshal(data, &back); err != nil { // => pointer: fills in place
		fmt.Println("unexpected:", err) // => unreachable: we just encoded it
	}
	// => round-trip preserves every field the tags chose to carry over
	fmt.Println(back.SKU, back.Price, back.Stock) // => Output: oat-1 1500 0
}
