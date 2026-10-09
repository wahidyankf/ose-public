package main

import "fmt"

type Release struct{ Name string } // => Exported type and field use capital initials.

func newRelease(name string) Release { return Release{Name: name} } // => Unexported helper uses lower-case initial.

func main() { fmt.Println(newRelease("ship").Name) } // => Output: ship.
