package main

import "fmt"

func dereference(pointer *int) (recovered any) { // => Named result captures the recovered panic.
	defer func() { recovered = recover() }() // => Runs during panic unwinding.
	_ = *pointer                             // => A nil pointer causes the panic being demonstrated.
	// => A non-nil pointer reaches this return without invoking recover.
	return nil // => A non-nil pointer reaches this line without recovery.
}

func main() { fmt.Println(dereference(nil) != nil) } // => Output: true; the panic was recovered.
