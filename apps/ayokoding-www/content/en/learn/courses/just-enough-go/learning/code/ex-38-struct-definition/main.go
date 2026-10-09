package main

import "fmt"

type Release struct { // => Defines two fields with distinct types.
	Name   string // => Text field accessed below.
	Number int    // => Independent integer field; zero if omitted.
}

func main() { release := Release{Name: "ship", Number: 1}; fmt.Println(release.Name) } // => Prints ship from Name.
