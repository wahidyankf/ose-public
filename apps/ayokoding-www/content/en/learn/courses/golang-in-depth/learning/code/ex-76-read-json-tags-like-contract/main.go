// Example 76: Read JSON Tags Like a Contract.
//
// Struct tags are the wire contract: keys and omissions live beside the fields
// they govern. Fixed payload below shows exactly which keys land where.
package main

import (
	"encoding/json" // => Unmarshal maps keys to fields through the tags
	"fmt"           // => prints the decoded fields and the ignored unknown
)

// Member is the API's subscriber shape: tags decide the JSON keys, all of them.
// => `json:"handle"`: wire key differs from field name: contract, not habit
// => omitempty on bio: absent when empty, present when written: smaller payloads
type Member struct { // => the contract, readable field by field with its tags
	Handle string `json:"handle"`        // => required key: always present upstream
	Since  int    `json:"member_since"`  // => snake_case wire, CamelCase field
	Bio    string `json:"bio,omitempty"` // => omitted when empty: optional field
}

func main() {
	// => fixed payload: known keys plus one unknown the decoder must ignore
	payload := `{"handle":"sari","member_since":2024,"nickname":"x"}` // => nickname unknown
	// => decode into the contract: known keys fill fields, unknown keys drop
	var m Member // => zero Member: every field starts at its zero value
	// => Unmarshal matches keys to TAGS: handle->Handle, member_since->Since
	if err := json.Unmarshal([]byte(payload), &m); err != nil { // => pointer fills
		fmt.Println("unexpected:", err) // => unreachable: payload is valid JSON
		return                          // => nothing trustworthy decoded on failure
	}
	// => Bio absent upstream AND omitempty: zero value, correctly empty
	fmt.Println(m.Handle, m.Since, m.Bio == "") // => Output: sari 2024 true
}
