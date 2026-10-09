package main

import "fmt"

type Metadata struct{ Owner string } // => Owner belongs to Metadata.

type Release struct { // => Embedding promotes Metadata.Owner.
	Metadata        // => Embedding promotes Owner to Release.Owner.
	Name     string // => Name remains a field of Release.
}

func main() { // => Initializes the embedded struct before reading Owner.
	release := Release{Metadata: Metadata{Owner: "Ada"}, Name: "ship"} // => Initialize embedded value explicitly.
	fmt.Println(release.Owner)                                         // => Output: Ada via the promoted field.
}
