package main

import "fmt"

type Release struct{ Name string } // => The field both methods use.

func (release Release) Label() string { return release.Name } // => Reading a copy does not mutate Release.

func (release *Release) Rename(name string) { release.Name = name } // => Pointer receiver changes the original Name.

func main() { release := Release{Name: "ship"}; release.Rename("dock"); fmt.Println(release.Label()) } // => Output: dock.
