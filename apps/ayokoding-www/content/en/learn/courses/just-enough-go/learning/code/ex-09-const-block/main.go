package main

import "fmt"

const ( // => Groups immutable application settings.
	AppName     = "ship" // => AppName is an untyped string constant.
	DefaultPort = 8080   // => DefaultPort is an untyped integer constant.
)

func main() { fmt.Println(AppName, DefaultPort) } // => Output: ship 8080.
