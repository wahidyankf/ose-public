package main

import "fmt"

type Stringer interface{ String() string } // => Requires exactly this method signature.

type Release struct{ Name string } // => Concrete type has no implements declaration.

func (release Release) String() string { return release.Name } // => Makes Release satisfy Stringer.

func printValue(value Stringer) { fmt.Println(value.String()) } // => Calls through the interface.

func main() { printValue(Release{Name: "ship"}) } // => Output: ship.
