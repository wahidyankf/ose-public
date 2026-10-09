package main

import (
	"encoding/json"
	"fmt"
)

type Release struct { // => Tags govern JSON field names and exclusion.
	Name   string `json:"name"` // => Encodes under the lower-case JSON key.
	Secret string `json:"-"`    // => Excluded from JSON even though exported.
}

func main() { // => Marshals a value containing one public and one hidden field.
	bytes, err := json.Marshal(Release{Name: "ship", Secret: "hidden"}) // => Only Name enters JSON.
	if err != nil {                                                     // => Marshal may fail for unsupported field values.
		fmt.Println("encode failed:", err) // => Report the actual encoding error.
		return                             // => Do not print unusable bytes.
	}
	fmt.Println(string(bytes)) // => Output: {"name":"ship"}
}
