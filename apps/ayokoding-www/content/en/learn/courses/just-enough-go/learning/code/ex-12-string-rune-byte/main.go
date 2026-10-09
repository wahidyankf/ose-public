package main

import "fmt"

func main() { // => The euro sign occupies three bytes in UTF-8.
	s := "€"                             // => One rune, stored as three UTF-8 bytes.
	fmt.Println(len(s), []rune(s), s[0]) // => Output: 3 [8364] 226.
}
