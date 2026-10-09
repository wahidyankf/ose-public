package main

import (
	"encoding/json"
	"fmt"
)

type Release struct { // => The tag omits empty Name during encoding.
	Name string `json:"name,omitempty"` // => Empty Name is absent from the JSON object.
}

func main() { // => Encodes the zero-valued struct.
	bytes, err := json.Marshal(Release{}) // => Name has its empty-string zero value.
	if err != nil {                       // => Check Marshal before using bytes.
		fmt.Println("encode failed:", err) // => Report the encoder's error.
		return                             // => Do not treat failed output as JSON.
	}
	fmt.Println(string(bytes)) // => Output: {}.
}
