package main

import "fmt"

type Release struct { // => Only Name is set in the literal below.
	Name   string // => Set explicitly by the literal.
	Number int    // => Omitted field defaults to zero.
}

func main() { release := Release{Name: "ship"}; fmt.Println(release.Name, release.Number) } // => Output: ship 0.
