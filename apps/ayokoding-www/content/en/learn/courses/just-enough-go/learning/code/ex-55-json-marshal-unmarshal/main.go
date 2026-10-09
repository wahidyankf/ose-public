package main

import (
	"encoding/json"
	"fmt"
)

type Release struct { // => The tag maps Go Name to JSON name.
	Name string `json:"name"` // => JSON uses lower-case name as the key.
}

func main() { // => Round-trips one Release value through JSON.
	original := Release{Name: "ship"}    // => Value before crossing the JSON boundary.
	bytes, err := json.Marshal(original) // => Encode Name as {"name":"ship"}.
	if err != nil {                      // => Guard against failed encoding.
		fmt.Println("encode failed:", err) // => Surface the encoder's error.
		return                             // => There is no valid JSON to decode.
	}
	var decoded Release                                     // => Zero-valued destination for Unmarshal.
	if err := json.Unmarshal(bytes, &decoded); err != nil { // => Populate decoded through its address.
		fmt.Println("decode failed:", err) // => Surface malformed JSON or type mismatch.
		return                             // => Avoid comparing a partially decoded value.
	}
	fmt.Println(decoded == original) // => Output: true.
}
