package main

import "fmt"

func main() { // => main demonstrates range on a slice and a map.
	for index, value := range []string{"go", "rust"} { // => Slice iteration yields indexes 0 and 1 with their values.
		fmt.Println(index, value) // => Output: 0 go, then 1 rust.
	}
	for key, value := range map[string]int{"ok": 1} { // => Map iteration yields a key and value; order is unspecified for multiple keys.
		fmt.Println(key, value) // => This one-entry map prints ok 1.
	}
}
