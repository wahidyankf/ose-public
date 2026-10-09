package main

import "fmt"

func Contains[T comparable](values []T, wanted T) bool { // => T must support ==.
	for _, value := range values { // => Inspect each candidate.
		if value == wanted { // => Compare same-type values.
			return true // => First match ends the search.
		}
	}
	return false // => No element matched wanted.
}

func main() { fmt.Println(Contains([]string{"go", "rust"}, "go")) } // => Output: true.
